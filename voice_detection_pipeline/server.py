"""
Persistent HTTP server for the VaaniX voice analysis pipeline.
Provides acoustic deepfake inference and Whisper speech-to-text with scam NLP analysis.

Endpoints:
    GET  /health   -> {"status": "ok", "stub": <bool>}
    POST /detect   -> multipart form field "audio" (WAV) -> DetectionResult JSON (legacy)
    POST /analyze  -> multipart form fields "audio" & "members" (optional JSON) -> Combined Analysis JSON
"""

import json
import os
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Dict, List, Optional

from flask import Flask, jsonify, request

from model_runner import STUB_MODE, run_detection
from text_analyzer import analyze_text

app = Flask(__name__)

PORT = int(os.environ.get("VOICE_DETECTION_PORT", "8765"))
MODEL_SERVER_SECRET = os.environ.get("MODEL_SERVER_SECRET", "")
WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")

_whisper_model = None


def get_whisper_model():
    """Lazy-load Whisper model singleton."""
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print(f"[server] Loading faster-whisper ({WHISPER_MODEL_SIZE}, int8, cpu)...")
        _whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
        print("[server] Whisper model ready.")
    return _whisper_model


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "stub": STUB_MODE,
        "whisper_model": WHISPER_MODEL_SIZE,
    })


@app.post("/detect")
def detect():
    """Legacy endpoint for backward compatibility."""
    audio = request.files.get("audio")
    if audio is None:
        return jsonify({"error": "Missing 'audio' file in form data"}), 400

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio.save(tmp.name)
        tmp_path = Path(tmp.name)

    try:
        result = run_detection(tmp_path)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
    finally:
        tmp_path.unlink(missing_ok=True)

    return jsonify(result)


def _run_stt(wav_path: Path) -> Dict[str, Any]:
    """Run Whisper transcription on the audio file."""
    if STUB_MODE and os.environ.get("WHISPER_DISABLE_STUB", "") == "1":
        return {
            "text": "Mummy accident ho gaya hai jaldi paise bhejo",
            "language": "hi",
            "segments": [{"start": 0.0, "end": 4.5, "text": "Mummy accident ho gaya hai jaldi paise bhejo"}],
        }

    try:
        whisper = get_whisper_model()
        segments_gen, info = whisper.transcribe(
            str(wav_path),
            language=None,
            vad_filter=True,
            beam_size=1,
        )

        segments_list = []
        full_text_parts = []
        for s in segments_gen:
            segments_list.append({
                "start": round(s.start, 2),
                "end": round(s.end, 2),
                "text": s.text.strip(),
            })
            full_text_parts.append(s.text.strip())

        return {
            "text": " ".join(full_text_parts).strip(),
            "language": info.language if info else "unknown",
            "segments": segments_list,
        }
    except Exception as exc:
        print(f"[server] Whisper transcription failed: {exc}")
        return {
            "text": "",
            "language": "unknown",
            "segments": [],
            "error": str(exc),
        }


@app.post("/analyze")
def analyze():
    # 1. Authenticate via X-Model-Secret header if secret is configured
    if MODEL_SERVER_SECRET:
        req_secret = request.headers.get("X-Model-Secret")
        if not req_secret or req_secret != MODEL_SERVER_SECRET:
            return jsonify({"error": "Unauthorized: invalid or missing X-Model-Secret"}), 401

    # 2. Extract and validate audio file
    audio = request.files.get("audio")
    if audio is None:
        return jsonify({"error": "Missing 'audio' file in multipart form data"}), 400

    # Read audio into memory or tempfile; validate size <= 3 MB
    audio.seek(0, os.SEEK_END)
    size_bytes = audio.tell()
    audio.seek(0)

    if size_bytes > 3 * 1024 * 1024:
        return jsonify({"error": "Audio file exceeds maximum allowed size of 3 MB"}), 400

    # Parse optional members list
    members_data: Optional[List[Dict[str, Any]]] = None
    members_raw = request.form.get("members")
    if members_raw:
        try:
            members_data = json.loads(members_raw)
        except Exception:
            pass

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio.save(tmp.name)
        tmp_path = Path(tmp.name)

    start_total = time.time()
    voice_res: Dict[str, Any] = {}
    stt_res: Dict[str, Any] = {}
    time_voice_ms = 0
    time_stt_ms = 0

    try:
        # Run voice deepfake model and Whisper STT in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            def exec_voice():
                t0 = time.time()
                res = run_detection(tmp_path)
                ms = int((time.time() - t0) * 1000)
                return res, ms

            def exec_stt():
                t0 = time.time()
                res = _run_stt(tmp_path)
                ms = int((time.time() - t0) * 1000)
                return res, ms

            f_voice = executor.submit(exec_voice)
            f_stt = executor.submit(exec_stt)

            raw_voice, time_voice_ms = f_voice.result()
            stt_res, time_stt_ms = f_stt.result()

            voice_res = {
                "spoof_prob": round(raw_voice.get("spoof_prob", 0), 1),
                "real_prob": round(raw_voice.get("real_prob", 0), 1),
                "stub": bool(raw_voice.get("stub", False)),
            }

    except Exception as exc:
        return jsonify({"error": f"Model inference error: {exc}"}), 500
    finally:
        tmp_path.unlink(missing_ok=True)

    # 3. Analyze transcript text for scam urgency keywords and identity claims
    transcript_text = stt_res.get("text", "")
    text_analysis = analyze_text(transcript_text, members_data)

    total_ms = int((time.time() - start_total) * 1000)

    # 4. Return combined contract matching Section 7.1 of the roadmap
    return jsonify({
        "voice": voice_res,
        "transcript": {
            "text": transcript_text,
            "language": stt_res.get("language", "unknown"),
            "segments": stt_res.get("segments", []),
        },
        "text_analysis": text_analysis,
        "timings_ms": {
            "voice": time_voice_ms,
            "stt": time_stt_ms,
            "total": total_ms,
        },
    })


if __name__ == "__main__":
    print(f"[server] starting on http://127.0.0.1:{PORT} (stub={STUB_MODE})")
    app.run(host="127.0.0.1", port=PORT, threaded=True)
