import asyncio
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db.models import Alert, AlertMessage, Call, FamilyGroup, GroupMember, User
from app.db.session import get_db
from app.routers.auth import get_current_user
from app.services.claims import extract_claimed_identity
from app.services.evidence import compute_sha256, save_evidence_audio
from app.services.model_client import analyze_audio_windows
from app.services.radar import add_radar_report
from app.services.risk import calculate_verdict
from app.services.scam_words import extract_scam_words_and_type
from app.services.stt import transcribe_audio
from app.services.telegram_bot import send_impersonated_member_alert, send_user_alert

router = APIRouter(prefix="/v1", tags=["Analysis"])


@router.post("/analyze")
async def analyze_call(
    audio: UploadFile = File(...),
    meta: Optional[str] = Form(None),
    caller_number: Optional[str] = Form(None),
    direction: Optional[str] = Form("incoming"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Main call audio analysis pipeline (seconds 5..15).
    Evaluates acoustic synthetic-voice likelihood, speech-to-text transcript,
    claim extraction, and triggers Telegram alerts and Payment Guard triggers.
    """
    t0 = time.time()

    # Parse metadata if passed as JSON string
    meta_dict = {}
    if meta:
        try:
            meta_dict = json.loads(meta)
        except Exception:
            pass

    resolved_caller = (
        meta_dict.get("caller_number")
        or caller_number
        or "+919876543210"
    )
    resolved_direction = meta_dict.get("direction") or direction or "incoming"

    # Read audio bytes
    raw_audio_bytes = await audio.read()
    if not raw_audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "EMPTY_AUDIO", "message": "Uploaded audio file is empty"}},
        )

    # 1. Fetch user's family members to cross-reference claims
    groups_res = await db.execute(
        select(FamilyGroup).where(FamilyGroup.owner_user_id == user.id)
    )
    user_groups = groups_res.scalars().all()
    group_ids = [g.id for g in user_groups]

    family_members = []
    if group_ids:
        mem_res = await db.execute(
            select(GroupMember).where(GroupMember.group_id.in_(group_ids))
        )
        family_members = mem_res.scalars().all()

    # Save temp file for faster-whisper reading
    temp_wav_path = Path(settings.AUDIO_DIR) / f"temp_{int(t0*1000)}.wav"
    temp_wav_path.parent.mkdir(parents=True, exist_ok=True)
    temp_wav_path.write_bytes(raw_audio_bytes)

    # 2. Run Model and STT in parallel
    t_model_start = time.time()
    t_stt_start = time.time()

    model_task = asyncio.create_task(analyze_audio_windows(raw_audio_bytes))
    stt_task = asyncio.create_task(transcribe_audio(temp_wav_path))

    try:
        p_spoofs, (transcript_text, transcript_lang) = await asyncio.gather(
            model_task, stt_task
        )
    finally:
        temp_wav_path.unlink(missing_ok=True)

    t_model_ms = int((time.time() - t_model_start) * 1000)
    t_stt_ms = int((time.time() - t_stt_start) * 1000)

    # 3. Calculate Risk & Verdict
    risk_score, verdict, risk_band = calculate_verdict(p_spoofs, settings.FORCE_VERDICT)

    # 4. Extract Claimed Identity
    claim_info = extract_claimed_identity(
        transcript=transcript_text,
        caller_number=resolved_caller,
        family_members=family_members,
    )
    has_family_claim = claim_info["claimed_member_id"] is not None

    # 5. Extract Scam Words & Scam Type
    scam_words, scam_type, advice = extract_scam_words_and_type(
        transcript=transcript_text,
        has_family_claim=has_family_claim,
    )

    # 6. Evidence Handling
    audio_sha256 = None
    saved_audio_path = None
    if verdict == "AI_CLONE":
        audio_sha256 = compute_sha256(raw_audio_bytes)
        # Create call record first to obtain UUID
        new_call = Call(
            user_id=user.id,
            caller_e164=resolved_caller,
            direction=resolved_direction,
            started_at=datetime.now(timezone.utc),
            risk_score=risk_score,
            window_scores=p_spoofs,
            verdict=verdict,
            transcript=transcript_text,
            transcript_lang=transcript_lang,
            claimed_member_id=claim_info["claimed_member_id"],
            claim_source=claim_info["claim_source"],
            claimed_identity_text=claim_info["claimed_identity_text"],
            scam_words=scam_words,
            scam_type=scam_type,
            audio_sha256=audio_sha256,
        )
        db.add(new_call)
        await db.commit()
        await db.refresh(new_call)

        # Save audio file
        _, saved_audio_path = save_evidence_audio(new_call.id, raw_audio_bytes)
        new_call.audio_path = saved_audio_path
        await db.commit()
    else:
        # For non-AI calls, store call record without audio file (privacy requirement)
        new_call = Call(
            user_id=user.id,
            caller_e164=resolved_caller,
            direction=resolved_direction,
            started_at=datetime.now(timezone.utc),
            risk_score=risk_score,
            window_scores=p_spoofs,
            verdict=verdict,
            transcript=transcript_text,
            transcript_lang=transcript_lang,
            claimed_member_id=claim_info["claimed_member_id"],
            claim_source=claim_info["claim_source"],
            claimed_identity_text=claim_info["claimed_identity_text"],
            scam_words=scam_words,
            scam_type=scam_type,
            audio_sha256=None,
            audio_path=None,
        )
        db.add(new_call)
        await db.commit()
        await db.refresh(new_call)

    # 7. Alert & Telegram Notification
    alert_id = None
    notified_user = False
    notified_impersonated = False

    if verdict == "AI_CLONE":
        alert = Alert(
            call_id=new_call.id,
            user_id=user.id,
            status="open",
            impersonated_member_id=claim_info["claimed_member_id"],
        )
        db.add(alert)
        await db.commit()
        await db.refresh(alert)
        alert_id = alert.id

        # Insert radar report
        await add_radar_report(
            db=db,
            number_e164=resolved_caller,
            reporter_user_id=user.id,
            source="ai_flag",
            call_id=new_call.id,
            scam_type=scam_type,
        )

        # A. Notify User on Telegram
        if user.telegram_chat_id:
            msg_id = await send_user_alert(
                chat_id=user.telegram_chat_id,
                alert_id=alert.id,
                caller_number=resolved_caller,
                risk_score=risk_score,
                risk_band=risk_band,
                claimed_text=claim_info["claimed_identity_text"] or "Unknown Caller",
                scam_words=scam_words,
                advice=advice,
            )
            if msg_id:
                notified_user = True
                db.add(
                    AlertMessage(
                        alert_id=alert.id,
                        recipient_chat_id=user.telegram_chat_id,
                        role="user",
                        telegram_message_id=msg_id,
                    )
                )

        # B. Notify Impersonated Member on Telegram
        if claim_info["claimed_member_id"]:
            mem = await db.get(GroupMember, claim_info["claimed_member_id"])
            if mem and mem.telegram_chat_id:
                victim_name = user.display_name or "Family member"
                msg_id_imp = await send_impersonated_member_alert(
                    chat_id=mem.telegram_chat_id,
                    alert_id=alert.id,
                    caller_number=resolved_caller,
                    victim_name=victim_name,
                )
                if msg_id_imp:
                    notified_impersonated = True
                    db.add(
                        AlertMessage(
                            alert_id=alert.id,
                            recipient_chat_id=mem.telegram_chat_id,
                            role="impersonated",
                            telegram_message_id=msg_id_imp,
                        )
                    )

        await db.commit()

    total_time_ms = int((time.time() - t0) * 1000)

    return {
        "call_id": new_call.id,
        "alert_id": alert_id,
        "verdict": verdict,
        "risk_score": risk_score,
        "risk_band": risk_band,
        "window_scores": [round(s, 2) for s in p_spoofs],
        "transcript": transcript_text,
        "transcript_lang": transcript_lang,
        "claimed_identity": {
            "member_id": claim_info["claimed_member_id"],
            "text": claim_info["claimed_identity_text"],
            "source": claim_info["claim_source"],
            "candidates": claim_info["candidates"],
        },
        "scam_words": scam_words,
        "scam_type": scam_type,
        "advice": advice,
        "evidence_sha256": audio_sha256,
        "notified": {
            "user_telegram": notified_user,
            "impersonated_telegram": notified_impersonated,
        },
        "timings_ms": {
            "model": t_model_ms,
            "stt": t_stt_ms,
            "total": total_time_ms,
        },
    }
