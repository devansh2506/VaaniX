# Open Questions & Tracking

This file tracks open questions, missing inputs, and decisions needing user/owner confirmation per the implementation roadmap.

---

## 1. Roadmap Open Questions (Section 19)

1. **Model Accuracy & Benchmark Conditions:**
   - *Question:* Which dataset and how many audio clips yielded the internal 95% accuracy figure?
   - *Current Stance:* The website will display strictly: **"95% accuracy in our internal tests (test set details coming soon)"**. No benchmark comparison or unverified claims will be shown.

2. **State Cyber Crime Cell Contact Emails:**
   - *Question:* What are the verified official cyber cell direct intake emails for Indian States and UTs?
   - *Current Stance:* The `cyber_cells` table initializes with `email = NULL` and `verified = false`. Until official, verified addresses with source URLs are provided by the project owner, the site guides users exclusively to official portal filing via [cybercrime.gov.in](https://cybercrime.gov.in) and helpline **1930**.

3. **Cloudflare Tunnel Deployment / Domain:**
   - *Question:* Is there an active custom domain configured for a named Cloudflare Tunnel (e.g., `model.vaanix.in`), or will a free quick tunnel (`*.trycloudflare.com`) be used for demo runs?
   - *Current Stance:* Setup scripts document both. Quick tunnel URLs must be updated in `MODEL_SERVER_URL` on each restart.

4. **Scam Radar Reporting Thresholds:**
   - *Question:* Default threshold is 3 distinct reporter accounts in 24 hours (or 1 denied family impersonation) to trigger `potential_scam`. Has this threshold been confirmed with team advisors?
   - *Current Stance:* Kept configurable via `RADAR_THRESHOLD` in `src/lib/radar/config.ts`.

5. **Risk Score Weighting & Thresholds:**
   - *Question:* The initial fusion formula `0.70 * voice_score + 0.30 * text_score` with `AI_CLONE` cutoffs at `risk >= 60` and `voice >= 50` are engineering baselines.
   - *Current Stance:* All parameters isolated in `src/lib/scoring/config.ts` so they can be tuned systematically against real audio clips in Phase 7.

---

## 2. Repository Artifacts from Prior Sessions

- **Android App & SDK (`android/`):**
  - Android application and library module were created in a prior session. The roadmap specifies Android features (Payment Guard and live overlay) are "Coming in the Android app" and out of scope for the website. The files remain in the repo for reference unless explicitly requested to be removed.
- **FastAPI Backend (`backend/`), Docker (`docker-compose.yml`), & Local DB (`satyavoice.db`):**
  - Created in prior prototype. The website application uses Next.js Route Handlers + Supabase as defined in Section 1 and Section 10.
