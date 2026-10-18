"""
CLI Pipeline with API forwarding:
Captures call audio from microphone/BlackHole -> saves local WAV
-> POSTs to VaaniX website API (${VAANIX_API_URL}/api/v1/analyze)
-> Prints verified detection verdict, transcript, and risk analysis JSON.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

import requests

from capture import record_sample

VAANIX_API_URL = os.environ.get("VAANIX_API_URL", "http://localhost:3000").rstrip("/")
VAANIX_API_KEY = os.environ.get("VAANIX_API_KEY", "")


def main() -> None:
    wav_path = record_sample()
    print(f"\n[pipeline] Audio captured: {wav_path.name}")

    api_endpoint = f"{VAANIX_API_URL}/api/v1/analyze"
    print(f"[pipeline] Posting to VaaniX API: {api_endpoint}")

    headers = {}
    if VAANIX_API_KEY:
        headers["Authorization"] = f"Bearer {VAANIX_API_KEY}"

    try:
        with open(wav_path, "rb") as f:
            files = {"audio": (wav_path.name, f, "audio/wav")}
            response = requests.post(api_endpoint, files=files, headers=headers, timeout=65)

        if response.status_code == 401:
            print("[pipeline] Error: Unauthorized. Check VAANIX_API_KEY in environment.")
            return

        if not response.ok:
            print(f"[pipeline] Error from API ({response.status_code}): {response.text}")
            return

        result = response.json()

        print(f"\n{'='*55}")
        print("VAANIX VERIFICATION RESULT")
        print(f"{'='*55}")

        check = result.get("check", result)
        verdict = check.get("verdict", "UNKNOWN")
        risk_score = check.get("riskScore", check.get("risk_score", 0))
        voice_score = check.get("voiceScore", check.get("voice_score", 0))
        text_score = check.get("textScore", check.get("text_score", 0))
        transcript = check.get("transcript", "")
        claim = check.get("claim", {})

        icon = "🚨" if verdict == "AI_CLONE" else "✅" if verdict == "REAL" else "⚠️"
        print(f"{icon} Verdict:     {verdict}")
        print(f"   Risk Score:  {risk_score}/100")
        print(f"   Voice Score: {voice_score}/100")
        print(f"   Text Score:  {text_score}/100")

        if claim and claim.get("label"):
            print(f"   Claimed ID:  {claim.get('label')}")

        if transcript:
            print(f"   Transcript:  \"{transcript}\"")

        print(f"{'='*55}\n")
        print(json.dumps(result, indent=2))

    except Exception as exc:
        print(f"[pipeline] Failed to post audio to VaaniX API: {exc}")


if __name__ == "__main__":
    main()
