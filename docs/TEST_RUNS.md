# VaaniX Verification & Test Run Records

> **Protocol Rule:** Record actual outputs from the live Nes2Net-X and faster-whisper pipeline. Never modify or fabricate test results.

---

## 1. Test Protocol

- **Target Audio:** 16 kHz mono WAV, 10 seconds duration per sample.
- **Model Engine:** PyTorch `wav2vec2_Nes2Net_X` checkpoint + `faster-whisper` (`small`).
- **Scoring Weights:** 70% Voice Spoof Probability + 30% Transcript Urgency Score.
- **Classification Bands:**
  - Risk Score $\ge 60$: `AI_CLONE`
  - Risk Score $\le 40$: `REAL`
  - $41 \le \text{Risk Score} \le 59$: `INCONCLUSIVE`

---

## 2. Test Run Matrix (3 Real Human + 3 AI-Cloned Samples)

| # | Sample File | Type | Expected | Voice Score | Text Score | Final Risk | Final Verdict | Latency (ms) | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `sample_human_hi_01.wav` | Real Human | `REAL` | — | — | — | — | — | Conversational Hindi, natural cadence |
| 2 | `sample_human_en_02.wav` | Real Human | `REAL` | — | — | — | — | — | Casual family call, English |
| 3 | `sample_human_hinglish_03.wav` | Real Human | `REAL` | — | — | — | — | — | Normal Hinglish greeting, no urgency words |
| 4 | `sample_clone_police_01.wav` | AI Clone | `AI_CLONE` | — | — | — | — | — | Synthetic police arrest extortion call |
| 5 | `sample_clone_hospital_02.wav`| AI Clone | `AI_CLONE` | — | — | — | — | — | Synthetic son accident / hospital emergency |
| 6 | `sample_clone_bank_03.wav` | AI Clone | `AI_CLONE` | — | — | — | — | — | Synthetic bank KYC / OTP freeze threat |

---

## 3. Run Instructions for Laptop Evaluator

To execute this matrix with the live pipeline:

```bash
# 1. Start the model server
source .venv/bin/activate
bash voice_detection_pipeline/run_server.sh

# 2. Run analysis for each test clip via CLI
python voice_detection_pipeline/pipeline_with_alerts.py -f path/to/sample.wav -c "+919876543210"

# 3. Or upload directly via the web check console at http://localhost:3000/app/check
```

Log the exact JSON payload returned in Section 4 below without altering values.

---

## 4. Raw Pipeline Results Log

*(To be populated during laptop verification session prior to live demo)*
