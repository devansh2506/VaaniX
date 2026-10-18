from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Alert, Call, Complaint, GroupMember, User
from app.db.session import get_db
from app.routers.auth import get_current_user
from app.services.radar import lookup_number_radar

router = APIRouter(prefix="/v1/complaint", tags=["Complaints & Police API"])


class CreateComplaintRequest(BaseModel):
    alert_id: Optional[str] = None
    target: Optional[str] = "api"
    payload: Optional[Dict[str, Any]] = None


@router.post("")
async def create_complaint(
    req: CreateComplaintRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generates an immutable, structured official police/bank fraud complaint report."""
    alert = None
    call = None
    impersonated_member = None

    if req.alert_id:
        alert = await db.get(Alert, req.alert_id)
        if alert:
            call = await db.get(Call, alert.call_id)
            if alert.impersonated_member_id:
                impersonated_member = await db.get(GroupMember, alert.impersonated_member_id)

    # Radar stats
    caller_num = call.caller_e164 if call else "+919876543210"
    radar_data = await lookup_number_radar(db, caller_num)

    structured_payload = {
        "type": "AI_VOICE_CLONE_FRAUD",
        "victim": {
            "name": user.display_name or "Anonymous",
            "phone": user.phone_e164,
            "state": user.state_code or "DL",
            "bank": user.bank_code or "SBI",
        },
        "incident": {
            "time": call.started_at.isoformat() if call else None,
            "caller_number": caller_num,
            "claimed_identity": call.claimed_identity_text if call else None,
            "scam_type": call.scam_type if call else "family_emergency",
            "risk_score": call.risk_score if call else 87,
            "scam_words": call.scam_words if call else [],
            "transcript": call.transcript if call else "",
            "family_confirmation": alert.impersonated_response if alert else None,
        },
        "evidence": {
            "audio_sha256": call.audio_sha256 if call else None,
            "evidence_url": f"/v1/evidence/{call.id}" if call else None,
        },
        "radar": {
            "distinct_reporters_24h": radar_data.get("distinct_reporters_24h", 0),
            "level": radar_data.get("level", "none"),
        },
    }

    if req.payload:
        structured_payload.update(req.payload)

    complaint = Complaint(
        alert_id=req.alert_id,
        user_id=user.id,
        target=req.target or "api",
        payload=structured_payload,
    )
    db.add(complaint)
    await db.commit()
    await db.refresh(complaint)

    return {
        "complaint_id": complaint.id,
        **structured_payload,
    }


@router.get("/{complaint_id}")
async def get_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
):
    complaint = await db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return {
        "complaint_id": complaint.id,
        **complaint.payload,
    }
