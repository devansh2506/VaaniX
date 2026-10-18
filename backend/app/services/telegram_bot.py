import hashlib
import hmac
import json
import urllib.parse
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import httpx
from app.config import settings

API_BASE = "https://api.telegram.org/bot{token}/{method}"


def generate_redirect_signature(alert_id: str, action: str) -> str:
    """Generates HMAC-SHA256 signature for URL redirect buttons."""
    message = f"{alert_id}:{action}"
    return hmac.new(
        settings.REDIRECT_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_redirect_signature(alert_id: str, action: str, signature: str) -> bool:
    expected = generate_redirect_signature(alert_id, action)
    return hmac.compare_digest(expected, signature)


def get_user_link_url(token: str) -> str:
    return f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start=u_{token}"


def get_member_invite_url(token: str) -> str:
    return f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start=m_{token}"


async def telegram_api_call(method: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Makes an async call to Telegram Bot API."""
    token = settings.TELEGRAM_BOT_TOKEN
    if not token or token == "<YOUR_BOT_TOKEN_HERE>":
        print(f"[telegram] Bot token not configured; skipping call to {method}")
        return None

    url = API_BASE.format(token=token, method=method)
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload, timeout=10.0)
            data = res.json()
            if not data.get("ok"):
                print(f"[telegram] error calling {method}: {data.get('description')}")
                return None
            return data.get("result")
    except Exception as exc:
        print(f"[telegram] request exception during {method}: {exc}")
        return None


async def send_user_alert(
    chat_id: int,
    alert_id: str,
    caller_number: str,
    risk_score: int,
    risk_band: str,
    claimed_text: str,
    scam_words: List[str],
    advice: str,
) -> Optional[int]:
    """Dispatches the critical voice-clone warning message to the user on Telegram."""
    time_str = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")
    words_quoted = ", ".join([f'"{w}"' for w in scam_words]) if scam_words else '"unusual speech patterns"'

    text = (
        f"🚨 *AI-cloned voice detected*\n\n"
        f"📞 *Call from:* `{caller_number}`\n"
        f"⏰ *Time:* {time_str}\n"
        f"⚠️ *Risk:* {risk_score} / 100 ({risk_band.capitalize()})\n"
        f"👤 *Claimed to be:* {claimed_text}\n"
        f"🗣️ *Said:* {words_quoted}\n"
        f"💡 *Tip:* {advice}"
    )

    sig_cyber = generate_redirect_signature(alert_id, "cyber")
    sig_bank = generate_redirect_signature(alert_id, "bank")
    sig_call = generate_redirect_signature(alert_id, "call1930")

    base = settings.API_BASE_URL.rstrip("/")
    url_cyber = f"{base}/r/{alert_id}/cyber?sig={sig_cyber}"
    url_bank = f"{base}/r/{alert_id}/bank?sig={sig_bank}"
    url_call1930 = f"{base}/r/{alert_id}/call1930?sig={sig_call}"

    reply_markup = {
        "inline_keyboard": [
            [{"text": "🚨 Report to Cyber Crime", "url": url_cyber}],
            [{"text": "🏦 Report to Bank", "url": url_bank}],
            [{"text": "📞 Call 1930 Helpline", "url": url_call1930}],
            [{"text": "✅ This is genuine", "callback_data": f"genuine:{alert_id}"}],
        ]
    }

    result = await telegram_api_call(
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown",
            "reply_markup": reply_markup,
        },
    )
    return result.get("message_id") if result else None


async def send_impersonated_member_alert(
    chat_id: int,
    alert_id: str,
    caller_number: str,
    victim_name: str,
) -> Optional[int]:
    """Sends verification prompt to the family member being impersonated."""
    text = (
        f"⚠️ *URGENT VERIFICATION: Voice Impersonation Alert*\n\n"
        f"Someone is using *YOUR voice* to call {victim_name} right now!\n\n"
        f"📞 *Originating Number:* `{caller_number}`\n\n"
        f"👉 *Is it you on this call?*"
    )

    reply_markup = {
        "inline_keyboard": [
            [
                {"text": "✅ Yes, it's me", "callback_data": f"imp_yes:{alert_id}"},
                {"text": "❌ No, it's a scam!", "callback_data": f"imp_no:{alert_id}"},
            ]
        ]
    }

    result = await telegram_api_call(
        "sendMessage",
        {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "Markdown",
            "reply_markup": reply_markup,
        },
    )
    return result.get("message_id") if result else None


async def answer_callback_query(callback_query_id: str, text: str = ""):
    await telegram_api_call(
        "answerCallbackQuery",
        {"callback_query_id": callback_query_id, "text": text},
    )


async def update_message_text(chat_id: int, message_id: int, text: str):
    await telegram_api_call(
        "editMessageText",
        {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": "Markdown",
        },
    )
