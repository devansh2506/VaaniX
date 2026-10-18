from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Call
from app.db.session import get_db
from app.services.evidence import compute_sha256

router = APIRouter(prefix="/v1/evidence", tags=["Forensic Evidence"])


@router.get("/{call_id}")
async def get_evidence_meta(
    call_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Returns cryptographic forensic evidence metadata for an AI-flagged call."""
    call = await db.get(Call, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")

    size_bytes = 0
    if call.audio_path and Path(call.audio_path).exists():
        size_bytes = Path(call.audio_path).stat().st_size

    return {
        "call_id": call.id,
        "audio_sha256": call.audio_sha256,
        "created_at": call.created_at.isoformat(),
        "size_bytes": size_bytes,
        "has_audio_file": call.audio_path is not None and Path(call.audio_path).exists(),
        "download_url": f"/v1/evidence/{call.id}/download" if call.audio_path else None,
    }


@router.get("/{call_id}/download")
async def download_evidence_audio(
    call_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Downloads the raw captured WAV audio evidence."""
    call = await db.get(Call, call_id)
    if not call or not call.audio_path:
        raise HTTPException(status_code=404, detail="Audio evidence not found")

    path = Path(call.audio_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Audio file expired or deleted per retention policy")

    return FileResponse(
        path=str(path),
        filename=f"satyavoice_evidence_{call.id}.wav",
        media_type="audio/wav",
    )


@router.post("/verify")
async def verify_evidence(
    call_id: str = Form(...),
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Forensic Verification:
    Recomputes SHA-256 cryptographic digest of the provided audio file and
    verifies if it strictly matches the timestamped tamper-proof record.
    """
    call = await db.get(Call, call_id)
    if not call or not call.audio_sha256:
        raise HTTPException(status_code=404, detail="Call record or evidence hash not found")

    audio_bytes = await audio.read()
    computed_hash = compute_sha256(audio_bytes)
    is_match = computed_hash.lower() == call.audio_sha256.lower()

    return {
        "call_id": call_id,
        "expected_sha256": call.audio_sha256,
        "computed_sha256": computed_hash,
        "match": is_match,
        "timestamp": call.created_at.isoformat(),
    }
