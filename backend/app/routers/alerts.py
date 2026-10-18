from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Alert, AlertMessage, Call, Feedback, GroupMember, User
from app.db.session import get_db
from app.routers.auth import get_current_user
from app.services.email_builder import build_complaint_email
from app.services.telegram_bot import send_impersonated_member_alert

router = APIRouter(prefix="/v1/alerts", tags=["Alerts"])


class ClaimMemberRequest(BaseModel):
    member_id: str


@router.get("/{alert_id}")
async def get_alert_detail(
    alert_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    call = await db.get(Call, alert.call_id)
    impersonated_member = None
    if alert.impersonated_member_id:
        impersonated_member = await db.get(GroupMember, alert.impersonated_member_id)

    return {
        "id": alert.id,
        "status": alert.status,
        "impersonated_response": alert.impersonated_response,
        "created_at": alert.created_at.isoformat(),
        "updated_at": alert.updated_at.isoformat() if alert.updated_at else None,
        "call": {
            "id": call.id if call else None,
            "caller_number": call.caller_e164 if call else None,
            "risk_score": call.risk_score if call else None,
            "verdict": call.verdict if call else None,
            "transcript": call.transcript if call else None,
            "claimed_identity_text": call.claimed_identity_text if call else None,
            "scam_words": call.scam_words if call else [],
            "scam_type": call.scam_type if call else None,
            "evidence_sha256": call.audio_sha256 if call else None,
        },
        "impersonated_member": {
            "id": impersonated_member.id,
            "name": impersonated_member.name,
            "relationship": impersonated_member.relationship_type,
        }
        if impersonated_member
        else None,
    }


@router.post("/{alert_id}/claim")
async def claim_member_for_alert(
    alert_id: str,
    req: ClaimMemberRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Associates an alert with a chosen family member and dispatches verification alert to them."""
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    member = await db.get(GroupMember, req.member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    alert.impersonated_member_id = member.id
    call = await db.get(Call, alert.call_id)
    if call:
        call.claimed_member_id = member.id
        call.claimed_identity_text = f"{member.name} ({member.relationship_type.capitalize()})"
        call.claim_source = "manual"

    await db.commit()

    # Re-send verification message if member has joined Telegram
    notified = False
    if member.telegram_chat_id and call:
        msg_id = await send_impersonated_member_alert(
            chat_id=member.telegram_chat_id,
            alert_id=alert.id,
            caller_number=call.caller_e164,
            victim_name=user.display_name or "Family member",
        )
        if msg_id:
            notified = True
            db.add(
                AlertMessage(
                    alert_id=alert.id,
                    recipient_chat_id=member.telegram_chat_id,
                    role="impersonated",
                    telegram_message_id=msg_id,
                )
            )
            await db.commit()

    return {
        "ok": True,
        "impersonated_member_id": member.id,
        "impersonated_notified": notified,
    }


@router.post("/{alert_id}/genuine")
async def mark_alert_genuine(
    alert_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """User false-positive feedback: marks call as genuine and excludes it from scam radar."""
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "dismissed_genuine"
    db.add(Feedback(call_id=alert.call_id, user_id=user.id, label="genuine"))
    await db.commit()

    return {"ok": True, "status": alert.status}


@router.get("/{alert_id}/email")
async def get_alert_email_template(
    alert_id: str,
    target: str = Query("cyber", description="'cyber' or 'bank'"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generates pre-filled complaint email template for state cyber cell or victim bank."""
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    call = await db.get(Call, alert.call_id)
    impersonated_member = None
    if alert.impersonated_member_id:
        impersonated_member = await db.get(GroupMember, alert.impersonated_member_id)

    email_data = build_complaint_email(
        target=target,
        alert=alert,
        call=call,
        user=user,
        impersonated_member=impersonated_member,
    )
    return email_data
