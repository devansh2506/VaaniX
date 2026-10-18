# VaaniX End-to-End Live Demonstration Guide

Follow these sequential steps to demonstrate VaaniX live to evaluators, judges, or partners.

---

## Pre-Demo Checklist

1. **Activate Python Virtual Environment & Start Model Server:**
   ```bash
   source .venv/bin/activate
   bash voice_detection_pipeline/run_server.sh
   ```
2. **Start Public Cloudflare Tunnel (if running remotely):**
   ```bash
   cloudflared tunnel --url http://127.0.0.1:8765
   ```
   *Note: If testing locally on the same machine, `MODEL_SERVER_URL=http://127.0.0.1:8765` in `.env.local` is sufficient.*
3. **Verify System Health:**
   Open [http://localhost:3000/api/health](http://localhost:3000/api/health) in your browser:
   ```json
   {
     "web": "ok",
     "db": "ok",
     "model": "ok"
   }
   ```
4. **Prepare Audio Clip:**
   Have your 10-second AI-cloned sample audio ready on a phone speaker or external player (e.g. *"Papa, please send ₹25,000 urgently, police have detained me"*).

---

## Live Demonstration Flow

### Step 1: Public Threat Overview (Home)
- Navigate to [http://localhost:3000](http://localhost:3000).
- Highlight the problem scale cards verified with government and study sources:
  - **47%** of Indian adults faced or know someone targeted by AI voice scams.
  - **83%** of Indian victims lost money ($\ge$ ₹50,000 for nearly half).
  - **3 seconds** of audio is enough for an 85% voice clone match.
- Show the 2-step verification architecture diagram: Nes2Net-X acoustic inference + transcript claim extraction.

### Step 2: Family Protection Group
- Log in and open **Family Group** ([/app/family](http://localhost:3000/app/family)).
- Point out the interactive orbit graph showing registered family members (e.g. *Rahul — Son*).
- Show the connected Telegram status badge confirming two-way active protection.

### Step 3: Real-Time Call Analysis Check
- Navigate to **Voice Check** ([/app/check](http://localhost:3000/app/check)).
- Confirm call consent and click **Start Call Check**.
- During the **5-second countdown**, begin playing the audio clip on your speaker.
- During the **10-second recording**, watch the live animated audio level meter.
- After processing (~10 seconds), the screen renders the red **AI Clone Detected** verdict banner:
  - **Acoustic Spoof Score:** $\ge 90/100$ (Nes2Net-X)
  - **Transcript Keyword Score:** Urgency & scam words highlighted
  - **Persona Claim:** *"Claims to be Rahul (Son)"*
  - **Combined Threat Level:** 90–100 / 100

### Step 4: Two-Way Telegram Alert & Verification
- Check the recipient user's phone: An immediate high-urgency security card is delivered with incident details and one-tap emergency buttons.
- Check Rahul's phone: A verification query is delivered:
  > *"Someone is calling using your voice claiming to be your son. Is this you?"*
  > `[No, it's a scam]` `[Yes, it's me]`
- Tap **"No, it's a scam"** on Rahul's phone.
- Return to the website incident alert page ([/app/alerts/[id]](http://localhost:3000/app/alerts)): The status transitions to **"Confirmed Scam"** in real-time ($< 5\text{ s}$).

### Step 5: Immediate Incident Response
- Click **"Report to Cyber Crime"**:
  - Opens pre-filled Gmail draft populated with incident timestamp, caller number, threat breakdown, audio SHA-256 fingerprint, and a secure 7-day signed evidence download link.
  - If state police email is unverified, cleanly redirects to the official portal `cybercrime.gov.in` + Call 1930.
- Click **"Emergency Bank Freeze"**:
  - Displays instant freeze request email addressed to customer support.
- Show **National Helpline 1930** ([/r/call1930](http://localhost:3000/r/call1930)) speed dial.

### Step 6: Community Scam Radar
- Open **Scam Radar** ([/radar](http://localhost:3000/radar)).
- Enter the suspect phone number:
  - Demonstrates reputation escalation to **Potential Scam** with active incident reports and impersonation denial history.

### Step 7: Telecom & Banking Developer API
- Open **Developers API** ([/developers](http://localhost:3000/developers)).
- Demonstrate that call centers and telecom providers can execute the exact same check via CLI or REST:
  ```bash
  curl -X POST "http://localhost:3000/api/v1/analyze" \
    -H "Authorization: Bearer vx_live_..." \
    -F "audio=@sample_scam.wav;type=audio/wav" \
    -F "caller_e164=+919876543210"
  ```
