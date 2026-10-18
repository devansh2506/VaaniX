import base64
import hashlib
import hmac
import json
import time
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db.models import User
from app.db.session import get_db
from app.services.telegram_bot import get_user_link_url

router = APIRouter(prefix="/v1", tags=["Authentication"])


class DevLoginRequest(BaseModel):
    phone: str
    display_name: Optional[str] = "Demo User"
    state_code: Optional[str] = "DL"
    bank_code: Optional[str] = "SBI"


def create_access_token(user_id: str, phone: str) -> str:
    """Creates a signed JWT-like bearer token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "phone": phone,
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400 * 30,  # 30 days
    }
    b64_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    b64_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signing_input = f"{b64_header}.{b64_payload}"
    signature = hmac.new(
        settings.JWT_SECRET.encode(), signing_input.encode(), hashlib.sha256
    ).digest()
    b64_sig = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{b64_header}.{b64_payload}.{b64_sig}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        b64_header, b64_payload, b64_sig = parts
        signing_input = f"{b64_header}.{b64_payload}"
        expected_sig = hmac.new(
            settings.JWT_SECRET.encode(), signing_input.encode(), hashlib.sha256
        ).digest()
        actual_sig = base64.urlsafe_b64decode(b64_sig + "=" * (-len(b64_sig) % 4))
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = base64.urlsafe_b64decode(b64_payload + "=" * (-len(b64_payload) % 4))
        payload = json.loads(payload_bytes.decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency for securing endpoints with JWT Bearer token or API key."""
    # Check Bearer token
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = await db.get(User, payload["sub"])
            if user:
                return user

    # Dev fallback: retrieve or create standard demo user if none passed in dev mode
    if settings.ENV == "dev":
        res = await db.execute(select(User).order_by(User.created_at.asc()))
        demo_user = res.scalars().first()
        if demo_user:
            return demo_user
        # Auto-create demo user
        demo_user = User(
            phone_e164="+919876543210",
            display_name="Devansh",
            state_code="DL",
            bank_code="SBI",
        )
        db.add(demo_user)
        await db.commit()
        await db.refresh(demo_user)
        return demo_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": {"code": "UNAUTHORIZED", "message": "Missing or invalid authentication credentials"}},
    )


@router.post("/auth/dev-login")
async def dev_login(req: DevLoginRequest, db: AsyncSession = Depends(get_db)):
    """Fast developer login endpoint: creates or logs in a user by phone number and returns JWT."""
    norm_phone = "".join([c for c in req.phone if c.isdigit() or c == "+"])
    if not norm_phone.startswith("+"):
        norm_phone = "+91" + norm_phone

    res = await db.execute(select(User).where(User.phone_e164 == norm_phone))
    user = res.scalar_one_or_none()
    if not user:
        user = User(
            phone_e164=norm_phone,
            display_name=req.display_name or "SatyaVoice User",
            state_code=req.state_code or "DL",
            bank_code=req.bank_code or "SBI",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(user.id, user.phone_e164)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone": user.phone_e164,
            "display_name": user.display_name,
            "state_code": user.state_code,
            "bank_code": user.bank_code,
            "telegram_linked": user.telegram_chat_id is not None,
        },
    }


@router.get("/me/telegram-link")
async def get_telegram_link(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns deep link to link user's personal Telegram account with SatyaVoice alerts."""
    url = get_user_link_url(user.telegram_link_token)
    return {
        "url": url,
        "linked": user.telegram_chat_id is not None,
        "telegram_chat_id": user.telegram_chat_id,
    }
