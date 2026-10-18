"""
Pytest integration tests for server.py /analyze endpoint.
Tests auth header rejection, stub model contract, and error handling.
"""

import io
import os
import sys
from pathlib import Path
import pytest

# Ensure voice_detection_pipeline is in sys.path
pipeline_dir = Path(__file__).resolve().parent.parent
if str(pipeline_dir) not in sys.path:
    sys.path.insert(0, str(pipeline_dir))

# Force stub mode for fast testing without GPU / heavy checkpoints
os.environ["VOICE_DETECTION_STUB"] = "1"
os.environ["MODEL_SERVER_SECRET"] = "test-secret-1234"

import server


@pytest.fixture
def client():
    server.app.config["TESTING"] = True
    with server.app.test_client() as client:
        yield client


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "ok"
    assert data["stub"] is True


def test_analyze_secret_rejection(client):
    # Missing header -> 401
    res = client.post("/analyze")
    assert res.status_code == 401
    assert "Unauthorized" in res.get_json()["error"]

    # Wrong header -> 401
    res = client.post("/analyze", headers={"X-Model-Secret": "wrong-secret"})
    assert res.status_code == 401


def test_analyze_missing_audio(client):
    res = client.post("/analyze", headers={"X-Model-Secret": "test-secret-1234"})
    assert res.status_code == 400
    assert "Missing 'audio'" in res.get_json()["error"]


def test_analyze_contract_stub(client):
    # Generate dummy WAV bytes (riff header + silence)
    # A minimal valid WAV header: 44 bytes
    wav_header = (
        b"RIFF\x2c\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
        b"\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x08\x00\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x00\x00"
    )

    data = {
        "audio": (io.BytesIO(wav_header), "sample.wav"),
        "members": '[{"id": "m1", "name": "Rahul", "aliases": [], "relationship": "son"}]'
    }

    res = client.post(
        "/analyze",
        headers={"X-Model-Secret": "test-secret-1234"},
        data=data,
        content_type="multipart/form-data"
    )

    assert res.status_code == 200
    json_data = res.get_json()

    # Check contract fields from Roadmap Section 7.1
    assert "voice" in json_data
    assert "spoof_prob" in json_data["voice"]
    assert "real_prob" in json_data["voice"]
    assert "stub" in json_data["voice"]

    assert "transcript" in json_data
    assert "text" in json_data["transcript"]
    assert "language" in json_data["transcript"]
    assert "segments" in json_data["transcript"]

    assert "text_analysis" in json_data
    assert "groups" in json_data["text_analysis"]
    assert "text_score" in json_data["text_analysis"]
    assert "claim" in json_data["text_analysis"]

    assert "timings_ms" in json_data
    assert "total" in json_data["timings_ms"]
