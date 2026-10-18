# SatyaVoice REST API Reference

The SatyaVoice REST API powers real-time voice-cloning detection, crowd-sourced scam radar, family impersonation verification, and automated police/bank complaint generation.

- **Base URL (Local / Dev):** `http://localhost:8000`
- **Interactive OpenAPI Documentation:** `http://localhost:8000/docs`

---

## 1. Health Check

### `GET /health`
Returns system status for the API, database connectivity, and the Nes2Net-X deepfake model server.

```bash
curl -X GET http://localhost:8000/health
```

**Response 200:**
```json
{
  "api": "ok",
  "db": "ok",
  "model": "stub",
  "stt": "ok",
  "environment": "dev"
}
```

---

## 2. Authentication

### `POST /v1/auth/dev-login`
Generates a JWT Bearer token for app or developer access.

```bash
curl -X POST http://localhost:8000/v1/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "display_name": "Devansh"}'
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "phone": "+919876543210",
    "display_name": "Devansh",
    "telegram_linked": false
  }
}
```

### `GET /v1/me/telegram-link`
Retrieves user deep link for Telegram alerts.

```bash
curl -X GET http://localhost:8000/v1/me/telegram-link \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 3. Real-Time Call Analysis

### `POST /v1/analyze`
Submits seconds 5–15 of an incoming call for multi-window Nes2Net-X inference, STT claim extraction, and automated alerts.

```bash
curl -X POST http://localhost:8000/v1/analyze \
  -H "Authorization: Bearer <TOKEN>" \
  -F "audio=@sample_call.wav;type=audio/wav" \
  -F "caller_number=+919876543210" \
  -F "direction=incoming"
```

**Response 200:**
```json
{
  "call_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "alert_id": "7c2deb4e-4c8e-5cae-acde-3c1e8c4ecb7e",
  "verdict": "AI_CLONE",
  "risk_score": 87,
  "risk_band": "critical",
  "window_scores": [0.84, 0.91, 0.86],
  "transcript": "Mummy, main Rahul बोल रहा हूँ. Mera accident ho gaya hai. Jaldi 50,000 UPI kar do. Papa ko mat batana.",
  "transcript_lang": "hi",
  "claimed_identity": {
    "member_id": "member-uuid",
    "text": "Rahul (Son)",
    "source": "transcript_name",
    "candidates": []
  },
  "scam_words": ["accident", "upi", "jaldi", "kisi ko mat batana"],
  "scam_type": "family_emergency",
  "advice": "Hang up and call them back on their real number.",
  "evidence_sha256": "9f2c7a3b4e18d6f5c2a1e9b8d7f4a2c1e8b7d6f5a3c2e1b9d8f7a6c5e4b3a210",
  "notified": {
    "user_telegram": true,
    "impersonated_telegram": true
  },
  "timings_ms": {
    "model": 780,
    "stt": 1240,
    "total": 1450
  }
}
```

---

## 4. Scam Radar

### `GET /v1/radar/lookup?number=+91...`
Responds in `< 300ms` during phone ringing to flag known scam numbers.

```bash
curl -X GET "http://localhost:8000/v1/radar/lookup?number=%2B919876543210"
```

**Response 200:**
```json
{
  "number": "+919876543210",
  "level": "potential_scam",
  "distinct_reporters_24h": 4,
  "distinct_reporters_7d": 9,
  "top_scam_type": "family_emergency",
  "top_claim": "Caller claimed to be Rahul (Son)",
  "last_reported_at": "2026-10-18T10:45:00Z"
}
```

### `POST /v1/radar/report`
Flags a phone number.

```bash
curl -X POST http://localhost:8000/v1/radar/report \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"number": "+919876543210", "reason": "user_report", "scam_type": "family_emergency"}'
```

---

## 5. Family Groups

### `GET /v1/groups/mine`
Retrieves user family group and member protection status.

```bash
curl -X GET http://localhost:8000/v1/groups/mine \
  -H "Authorization: Bearer <TOKEN>"
```

### `POST /v1/groups/{group_id}/members`
Adds a member to protect against impersonation.

```bash
curl -X POST http://localhost:8000/v1/groups/<GROUP_ID>/members \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Rahul", "aliases": ["Bittu"], "relationship": "son", "phone": "+919811122233"}'
```

---

## 6. Official Complaints & Police Integration

### `POST /v1/complaint`
Generates a structured complaint for cyber police portals or bank fraud operations.

```bash
curl -X POST http://localhost:8000/v1/complaint \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"alert_id": "<ALERT_ID>", "target": "cyber_cell"}'
```

---

## 7. Forensic Evidence

### `GET /v1/evidence/{call_id}`
Retrieves tamper-proof SHA-256 metadata.

```bash
curl -X GET http://localhost:8000/v1/evidence/<CALL_ID>
```

### `POST /v1/evidence/verify`
Cryptographically verifies an audio recording against the immutable evidence hash.

```bash
curl -X POST http://localhost:8000/v1/evidence/verify \
  -F "call_id=<CALL_ID>" \
  -F "audio=@evidence.wav"
```

**Response 200:**
```json
{
  "call_id": "call-uuid",
  "expected_sha256": "9f2c...e410",
  "computed_sha256": "9f2c...e410",
  "match": true
}
```
