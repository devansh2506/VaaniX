from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Alert, AlertMessage, Call, FamilyGroup, Feedback, GroupMember, User
from app.db.session import get_db
from app.services.radar import add_radar_report
from app.services.telegram_bot import answer_callback_query, telegram_api_call, update_message_text

router = APIRouter(prefix="/v1/telegram", tags=["Telegram Webhook"])


@router.post("/webhook")
async def telegram_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handles incoming Telegram updates from Bot API."""
    data = await request.json()
    return await process_telegram_update(data, db)


async def process_telegram_update(data: Dict[str, Any], db: AsyncSession) -> Dict[str, Any]:
    """Processes a single Telegram update payload."""
    # 1. Handle incoming text messages (/start deep links)
    message = data.get("message")
    if message:
        chat_id = message.get("chat", {}).get("id")
        text = (message.get("text") or "").strip()

        if text.startswith("/start "):
            payload = text.split(" ", 1)[1].strip()

            # A. User Account Linking (/start u_<token>)
            if payload.startswith("u_"):
                token = payload[2:]
                user_res = await db.execute(select(User).where(User.telegram_link_token == token))
                user = user_res.scalar_one_or_none()
                if user:
                    user.telegram_chat_id = chat_id
                    await db.commit()
                    await telegram_api_call(
                        "sendMessage",
                        {
                            "chat_id": chat_id,
                            "text": (
                                "🛡️ *SatyaVoice Alerts Connected!*\n\n"
                                "Your account is now linked. You will receive immediate warnings "
                                "whenever an incoming call to your device is identified as an AI-generated voice."
                            ),
                            "parse_mode": "Markdown",
                        },
                    )

            # B. Family Member Join (/start m_<token>)
            elif payload.startswith("m_"):
                token = payload[2:]
                mem_res = await db.execute(select(GroupMember).where(GroupMember.member_join_token == token))
                member = mem_res.scalar_one_or_none()
                if member:
                    member.telegram_chat_id = chat_id
                    member.joined_at = datetime.now(timezone.utc)
                    await db.commit()

                    # Find group owner
                    group = await db.get(FamilyGroup, member.group_id)
                    owner_name = "your family member"
                    owner = None
                    if group:
                        owner = await db.get(User, group.owner_user_id)
                        if owner and owner.display_name:
                            owner_name = owner.display_name

                    await telegram_api_call(
                        "sendMessage",
                        {
                            "chat_id": chat_id,
                            "text": (
                                f"🛡️ *SatyaVoice Family Guard Active*\n\n"
                                f"You are now protecting *{owner_name}* as their *{member.relationship_type.capitalize()}*.\n\n"
                                "If an attacker ever attempts to use an AI-cloned copy of your voice to call them, "
                                "you will receive an urgent instant verification check right here."
                            ),
                            "parse_mode": "Markdown",
                        },
                    )

                    # Notify owner
                    if owner and owner.telegram_chat_id:
                        await telegram_api_call(
                            "sendMessage",
                            {
                                "chat_id": owner.telegram_chat_id,
                                "text": f"✅ *{member.name}* joined your SatyaVoice family protection group on Telegram.",
                                "parse_mode": "Markdown",
                            },
                        )

        return {"ok": True}

    # 2. Handle callback queries (button presses)
    cb = data.get("callback_query")
    if cb:
        cb_id = cb.get("id")
        cb_data = cb.get("data", "")
        chat_id = cb.get("message", {}).get("chat", {}).get("id")
        msg_id = cb.get("message", {}).get("message_id")

        if cb_data.startswith("genuine:"):
            alert_id = cb_data.split(":", 1)[1]
            alert = await db.get(Alert, alert_id)
            if alert:
                alert.status = "dismissed_genuine"
                db.add(Feedback(call_id=alert.call_id, user_id=alert.user_id, label="genuine"))
                await db.commit()

                await answer_callback_query(cb_id, "Marked as genuine call.")
                await update_message_text(
                    chat_id,
                    msg_id,
                    "✅ *Marked as genuine call.* Thank you for your feedback — this helps SatyaVoice learn.",
                )

        elif cb_data.startswith("imp_yes:"):
            alert_id = cb_data.split(":", 1)[1]
            alert = await db.get(Alert, alert_id)
            if alert:
                alert.impersonated_response = "yes_its_me"
                alert.status = "verified_genuine"
                await db.commit()

                await answer_callback_query(cb_id, "Identity verified.")
                await update_message_text(
                    chat_id,
                    msg_id,
                    "✅ *Identity Verified:* Thank you for confirming that it was genuinely you.",
                )

                # Inform user
                user = await db.get(User, alert.user_id)
                member = await db.get(GroupMember, alert.impersonated_member_id) if alert.impersonated_member_id else None
                m_name = member.name if member else "Family member"
                if user and user.telegram_chat_id:
                    await telegram_api_call(
                        "sendMessage",
                        {
                            "chat_id": user.telegram_chat_id,
                            "text": f"✅ *Identity Verified:* {m_name} confirmed it's really them on the call.",
                            "parse_mode": "Markdown",
                        },
                    )

        elif cb_data.startswith("imp_no:"):
            alert_id = cb_data.split(":", 1)[1]
            alert = await db.get(Alert, alert_id)
            if alert:
                alert.impersonated_response = "no_scam"
                alert.status = "confirmed_scam"

                call = await db.get(Call, alert.call_id)
                if call:
                    # Add highest priority signal to radar
                    await add_radar_report(
                        db=db,
                        number_e164=call.caller_e164,
                        reporter_user_id=alert.user_id,
                        source="impersonation_denied",
                        call_id=call.id,
                        scam_type=call.scam_type,
                    )

                await db.commit()

                await answer_callback_query(cb_id, "Confirmed voice clone scam!")
                await update_message_text(
                    chat_id,
                    msg_id,
                    "🚨 *CONFIRMED SCAM:* Thank you. We have alerted your family member immediately to terminate the call.",
                )

                # Inform victim user
                user = await db.get(User, alert.user_id)
                member = await db.get(GroupMember, alert.impersonated_member_id) if alert.impersonated_member_id else None
                m_name = member.name if member else "Family member"
                if user and user.telegram_chat_id:
                    await telegram_api_call(
                        "sendMessage",
                        {
                            "chat_id": user.telegram_chat_id,
                            "text": (
                                f"❌ *CONFIRMED SCAM ALERT!* ❌\n\n"
                                f"*{m_name} says it is NOT THEM on the call!*\n\n"
                                "👉 *Hang up immediately and do not transfer any funds or OTP.*"
                            ),
                            "parse_mode": "Markdown",
                        },
                    )

        return {"ok": True}

    return {"ok": True}
