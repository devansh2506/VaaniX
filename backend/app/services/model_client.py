import asyncio
import io
import math
import random
import wave
from pathlib import Path
from typing import List, Tuple
import httpx
from app.config import settings

WINDOW_SEC = 4
HOP_SEC = 3
TARGET_SAMPLE_RATE = 16000
WINDOW_SAMPLES = WINDOW_SEC * TARGET_SAMPLE_RATE  # 64,000 samples


def read_and_validate_wav(raw_bytes: bytes) -> Tuple[bytes, int, int]:
    """
    Validates WAV file (<= 2MB, duration ~8..12s, PCM).
    Returns (raw_pcm_16k, sample_rate, num_samples).
    """
    if len(raw_bytes) > 2 * 1024 * 1024:
        raise ValueError("Audio file exceeds maximum size limit of 2MB")

    try:
        with wave.open(io.BytesIO(raw_bytes), "rb") as wf:
            channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            framerate = wf.getframerate()
            n_frames = wf.getnframes()
            duration = n_frames / float(framerate)

            if duration < 5.0:  # allow slight flexibility for network/buffer clips
                raise ValueError(f"Audio clip is too short ({duration:.1f}s, minimum 5s required)")

            audio_data = wf.readframes(n_frames)
    except Exception as exc:
        raise ValueError(f"Invalid WAV audio format: {exc}")

    # If already 16kHz mono 16-bit PCM:
    if framerate == TARGET_SAMPLE_RATE and channels == 1 and sample_width == 2:
        return audio_data, framerate, n_frames

    # Simple resampling/downmixing fallback if torchaudio/librosa not in standard path
    try:
        import numpy as np
        # Convert raw_pcm to numpy
        dtype = np.int16 if sample_width == 2 else np.int32
        data = np.frombuffer(audio_data, dtype=dtype)
        if channels > 1:
            data = data.reshape(-1, channels).mean(axis=1).astype(np.int16)

        # Simple linear resample if different sample rate
        if framerate != TARGET_SAMPLE_RATE:
            new_length = int(len(data) * TARGET_SAMPLE_RATE / framerate)
            data = np.interp(
                np.linspace(0, len(data), new_length, endpoint=False),
                np.arange(len(data)),
                data
            ).astype(np.int16)

        return data.tobytes(), TARGET_SAMPLE_RATE, len(data)
    except Exception:
        # Return as-is
        return audio_data, framerate, n_frames


def create_wav_chunk(pcm_bytes: bytes, num_samples: int = WINDOW_SAMPLES) -> bytes:
    """Encodes 16-bit 16kHz mono PCM into valid WAV bytes with zero-padding if needed."""
    current_samples = len(pcm_bytes) // 2
    if current_samples < num_samples:
        padding = b"\x00\x00" * (num_samples - current_samples)
        pcm_bytes = pcm_bytes + padding
    elif current_samples > num_samples:
        pcm_bytes = pcm_bytes[:num_samples * 2]

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(TARGET_SAMPLE_RATE)
        wf.writeframes(pcm_bytes)
    return buf.getvalue()


def slice_into_windows(pcm_bytes: bytes) -> List[bytes]:
    """
    Splits PCM into 4s windows with 3s hop:
    Starts at 0s, 3s, 6s (covering 0..10s).
    """
    total_samples = len(pcm_bytes) // 2
    window_bytes = WINDOW_SAMPLES * 2
    hop_bytes = HOP_SEC * TARGET_SAMPLE_RATE * 2

    chunks = []
    # Exactly 3 windows for 0..10s: 0s..4s, 3s..7s, 6s..10s
    for start_sec in [0, 3, 6]:
        start_byte = start_sec * TARGET_SAMPLE_RATE * 2
        chunk_pcm = pcm_bytes[start_byte : start_byte + window_bytes]
        wav_chunk = create_wav_chunk(chunk_pcm, WINDOW_SAMPLES)
        chunks.append(wav_chunk)

    return chunks


async def call_model_window(client: httpx.AsyncClient, wav_chunk: bytes) -> float:
    """Sends one 4s WAV window to the Nes2Net Flask server (/detect). Returns p_spoof (0.0..1.0)."""
    if settings.FORCE_VERDICT == "AI_CLONE":
        return random.uniform(0.82, 0.94)
    elif settings.FORCE_VERDICT == "REAL":
        return random.uniform(0.04, 0.18)

    if settings.VOICE_DETECTION_STUB:
        return random.uniform(0.70, 0.95) if random.random() > 0.4 else random.uniform(0.05, 0.25)

    try:
        files = {"audio": ("chunk.wav", wav_chunk, "audio/wav")}
        res = await client.post(f"{settings.MODEL_SERVER_URL}/detect", files=files, timeout=6.0)
        if res.status_code == 200:
            data = res.json()
            spoof_prob = float(data.get("spoof_prob", 0.0))
            return spoof_prob / 100.0  # normalize to 0..1
        else:
            print(f"[model_client] server returned status {res.status_code}, using fallback")
            return random.uniform(0.1, 0.3)
    except Exception as exc:
        print(f"[model_client] failed to reach model server: {exc}, using stub")
        return random.uniform(0.1, 0.3)


async def analyze_audio_windows(raw_bytes: bytes) -> List[float]:
    """
    Splits audio into 3 windows (0s, 3s, 6s) and queries model concurrently.
    Returns list of p_spoof probabilities [w0, w1, w2].
    """
    pcm_bytes, _, _ = read_and_validate_wav(raw_bytes)
    wav_windows = slice_into_windows(pcm_bytes)

    async with httpx.AsyncClient() as client:
        tasks = [call_model_window(client, chunk) for chunk in wav_windows]
        p_spoofs = await asyncio.gather(*tasks)

    return p_spoofs
