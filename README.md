# SatyaVoice

> **AI-Powered Real-Time Voice-Clone Scam Protection, Family Impersonation Shield & Payment Guard**

SatyaVoice is an end-to-end anti-fraud system consisting of an **Android App & SDK**, a **Python FastAPI Backend**, an **Acoustic Deep Learning Model Server (Nes2Net-X)**, and an **Interactive Telegram Alerting Bot** that protects citizens and enterprises from AI voice-clone scam calls.

---

## 1. System Architecture

```text
┌──────────────────────── Android App (Kotlin, Jetpack Compose) ────────────────────────┐
│ CallScreeningService ──► Radar lookup ──► Ringing pop-up overlay                       │
│ Call state listener ──► CallGuardService (foreground, mic) ──► record 5–15 s ──► upload│
│ WarningOverlay (red in-call warning)   PaymentGuardService (usage-stats + overlay)     │
│ Report actions (Gmail intent, dial 1930)   Family Group screens   Settings / onboarding│
│ satyavoice-sdk (embeddable library module for bank & telecom apps)                     │
└───────────────┬───────────────────────────────────────────────────────────────────────┘
                │ HTTPS / REST (JWT)
┌───────────────▼──────────────── Backend API (Python, FastAPI) ─────────────────────────┐
│ /v1/analyze  /v1/radar/*  /v1/groups/*  /v1/alerts/*  /v1/complaint  /v1/evidence/*   │
│ Analysis orchestrator ─► Model server client (Flask :8765, Nes2Net-X)                  │
│                       ─► STT (faster-whisper) ─► Claim + scam-word extractor           │
│ Alert dispatcher ─► Telegram bot (alerts, family verification callbacks)               │
│ Redirect pages /r/... (mailto:, tel: links with HMAC-SHA256 signatures)                │
└───────────────┬───────────────────────────────────────────────────────────────────────┘
                │
        PostgreSQL / SQLite database  │  Cryptographic audio evidence (SHA-256)
```

---

## 2. Protection Stages & Features

| Stage | Feature | What happens |
|---|---|---|
| **Before the call** | **Scam Radar** | While the phone is ringing, SatyaVoice looks up the caller's number in `< 300ms`. If 3+ users have flagged it as a scam, a Truecaller-style red pop-up warns: *"Potential scam — reported by N users today"*. |
| **During the call** | **Live 10-Second Check** | 5 seconds after the call connects, SatyaVoice records seconds **5 → 15** (one 10s clip) and checks it: (a) Nes2Net-X evaluates *real vs. AI-cloned voice*, (b) speech-to-text transcript extracts who the caller claims to be and scam keywords. |
| **During the call** | **In-Call Red Warning** | If an AI clone is detected: a full-width security red floating overlay appears over the active call displaying the risk score (0–100) and advice. |
| **During the call** | **Telegram Alerts** | (1) To the victim receiving the call, with 4 action buttons; (2) To the **impersonated family member**: *"Someone is using your voice to call Mom right now. Is it you? Yes / No"*. |
| **After the call** | **Payment Guard** | For 30 minutes after an AI-flagged call, opening any UPI/banking app (Google Pay, PhonePe, Paytm, BHIM, YONO, iMobile) triggers a full-screen intervention with a **60s cooldown pause**. |
| **After the call** | **One-Tap Reporting** | Report to State Cyber Crime Cell (pre-filled email), Report to Bank (pre-filled fraud freeze request), Call 1930 (national cyber helpline), and *"This is genuine"* false-positive feedback. |
| **Always** | **Family Group** | User creates a group and adds family members with relationships (*Son, Daughter, Husband, Wife, etc.*). Members join via a one-tap Telegram invite link (`t.me/<BOT>?start=m_<token>`). |
| **Always** | **Forensic Evidence** | Every flagged recording receives an immutable SHA-256 cryptographic digest for police verification. |
| **Integrations** | **API & Android SDK** | Public REST API (`/v1/analyze`, `/v1/complaint`, `/v1/evidence/{id}`, `/v1/radar/lookup`) and embeddable SDK (`satyavoice-sdk`) for banking apps. |

---

## 3. Technology Stack

- **Android App & SDK:** Kotlin 2.0, Jetpack Compose, Material 3, OkHttp/Retrofit, Coroutines, `CallScreeningService`, `UsageStatsManager`, `AudioRecord`.
- **Backend API:** Python 3.10+, FastAPI, SQLAlchemy 2, Pydantic v2, PyYAML, aiosqlite / asyncpg, pytest.
- **Deepfake Voice Detection:** PyTorch, Nes2Net-X, wav2vec 2.0 / XLSR-53 (300M parameter front-end), Flask daemon (:8765).
- **Speech-To-Text:** faster-whisper (Hindi / English / Hinglish auto-detection).
- **Incident Alerting:** Telegram Bot API (`@Prevent_Scambot`).
- **Web Operations Console:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts, Radix UI.

---

## 4. Repository Structure

```text
SatyaVoice/
├── android/                         # Android Studio project
│   ├── app/                         # Compose app (Screens, CallScreening, CallGuard, PaymentGuard)
│   └── satyavoice-sdk/              # Embeddable library module for bank apps
│
├── backend/                         # FastAPI REST Backend
│   ├── app/
│   │   ├── main.py                  # API entry point & health check
│   │   ├── config.py                # Pydantic settings & environment configuration
│   │   ├── db/                      # Models (User, Call, Alert, GroupMember, RadarReport) & async session
│   │   ├── services/                # Model client, STT, Claims extraction, Scam words, Radar, Evidence, Bot
│   │   ├── routers/                 # Endpoints (/v1/analyze, /v1/radar, /v1/groups, /v1/alerts, etc.)
│   │   └── data/                    # scam_words.yaml, relationships.yaml, cyber_cells.yaml, banks.yaml
│   ├── tests/                       # Pytest test suite (claims, risk, scam words, radar, signatures)
│   └── Dockerfile
│
├── voice_detection_pipeline/        # Nes2Net-X acoustic inference server
│   ├── server.py                    # Persistent Flask daemon on port 8765
│   ├── model_runner.py              # Single model loader and inference engine
│   └── model_scripts/               # wav2vec2_Nes2Net_X architecture
│
├── telegram/                        # Telegram client utilities and bot listener
├── src/                             # Next.js 16 Security Operations Console
├── docs/API.md                      # REST API reference with curl examples
└── docker-compose.yml               # Multi-container orchestration (API + Model + Postgres)
```

---

## 5. Getting Started (Local Development)

### A. Run Backend API
```bash
# 1. Activate shared Python environment
source .venv/bin/activate

# 2. Install dependencies (if not already installed)
pip install -r backend/requirements.txt

# 3. Start FastAPI server
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API runs on `http://localhost:8000`. Test interactive docs at `http://localhost:8000/docs`.

### B. Run Backend Test Suite
```bash
PYTHONPATH=backend pytest backend/tests/
```

### C. Run Voice Detection Model Server
```bash
cd voice_detection_pipeline
# Run in stub mode (no ~5GB checkpoint download needed for UI/API testing)
VOICE_DETECTION_STUB=1 python server.py
```
Listens on `http://127.0.0.1:8765`.

### D. Run Next.js Security Console
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

### E. Open Android Studio
Open the `android/` directory in Android Studio (Giraffe or newer). Sync Gradle and launch on an emulator or physical device running Android 10+ (API 29+).

---

## 6. Live 3-Minute Demo Script

1. **Scam Radar:** In Android, open **Demo Mode**. Target number has been reported by previous users → Red banner appears: *"POTENTIAL SCAM — reported by 3 users"*.
2. **Live Voice Check:** Tap **Start Live Call Simulation** with `cloned_rahul.wav`. Call connects; after 5s buffer, seconds 5–15 are analyzed.
3. **In-Call Warning:** Red overlay pops over call screen: *"⚠️ AI VOICE DETECTED · Risk 87/100 · Caller claims Rahul (Son)"*.
4. **Telegram Verification:**
   - User receives immediate alert with 4 action buttons.
   - Real Rahul gets verification prompt: *"Someone is using your voice to call Mom... Is it you? Yes / No"*. He taps **No** → Status flips to **CONFIRMED SCAM**.
5. **One-Tap Complaint:** Tap **Report to Cyber Crime** → Opens pre-filled official complaint draft with audio SHA-256 evidence.
6. **Payment Guard:** Tap **Simulate Opening Google Pay** → Full-screen **WAIT ✋** intervention appears with **60s countdown pause** protecting funds.
