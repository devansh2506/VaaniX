import asyncio
import os
from pathlib import Path
from typing import Tuple
from app.config import settings

_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model

    try:
        from faster_whisper import WhisperModel
        # Load model with fallback to CPU if GPU not available
        device = "cuda" if settings.STT_DEVICE == "cuda" else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"
        _whisper_model = WhisperModel(settings.STT_MODEL, device=device, compute_type=compute_type)
        return _whisper_model
    except Exception as exc:
        print(f"[stt] faster-whisper not available ({exc}), using fallback transcription")
        return None


async def transcribe_audio(audio_path: Path) -> Tuple[str, str]:
    """
    Transcribes audio using faster-whisper (auto language detection).
    Returns (transcript_text, detected_language).
    """
    loop = asyncio.get_running_loop()

    def _sync_transcribe() -> Tuple[str, str]:
        model = get_whisper_model()
        if model is None:
            # Fallback mock for development environment when whisper model is not downloaded
            return (
                "Mummy main Rahul bol raha hoon. Mera accident ho gaya hai police ne pakad liya hai. Jaldi 50000 rupaye is UPI pe bhejo kisi ko mat batana.",
                "hi"
            )

        try:
            segments, info = model.transcribe(
                str(audio_path),
                task="transcribe",
                language=None,
                vad_filter=True,
            )
            text = " ".join([seg.text.strip() for seg in segments]).strip()
            return text, info.language or "hi"
        except Exception as exc:
            print(f"[stt] transcription error: {exc}")
            return "", "hi"

    return await loop.run_in_executor(None, _sync_transcribe)
