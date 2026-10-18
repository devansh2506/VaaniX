import hashlib
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, Tuple
from app.config import settings


def ensure_audio_dir() -> Path:
    audio_path = Path(settings.AUDIO_DIR)
    audio_path.mkdir(parents=True, exist_ok=True)
    return audio_path


def compute_sha256(data: bytes) -> str:
    """Computes SHA-256 hexadecimal digest for raw audio bytes."""
    return hashlib.sha256(data).hexdigest()


def save_evidence_audio(call_id: str, audio_bytes: bytes) -> Tuple[str, str]:
    """
    Saves audio clip for flagged AI_CLONE call under AUDIO_DIR/{call_id}.wav.
    Returns (audio_sha256, file_path_str).
    """
    sha256_hash = compute_sha256(audio_bytes)
    audio_dir = ensure_audio_dir()
    destination = audio_dir / f"{call_id}.wav"
    destination.write_bytes(audio_bytes)
    return sha256_hash, str(destination)


def verify_audio_hash(audio_bytes: bytes, expected_hash: str) -> bool:
    """Verifies whether uploaded audio matches the forensic SHA-256 hash."""
    current_hash = compute_sha256(audio_bytes)
    return current_hash.lower() == expected_hash.lower()


def cleanup_expired_audio_files(retention_days: int = settings.AUDIO_RETENTION_DAYS) -> int:
    """
    Daily maintenance job: Deletes local WAV files older than AUDIO_RETENTION_DAYS.
    Forensic SHA-256 hashes are preserved permanently in the database.
    """
    audio_dir = Path(settings.AUDIO_DIR)
    if not audio_dir.exists():
        return 0

    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    deleted_count = 0

    for file_path in audio_dir.glob("*.wav"):
        try:
            mtime = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)
            if mtime < cutoff:
                file_path.unlink(missing_ok=True)
                deleted_count += 1
        except Exception as exc:
            print(f"[evidence] failed to inspect/delete {file_path}: {exc}")

    return deleted_count
