# VaaniX Website — Implementation Roadmap (for Antigravity)

> **Who this is for:** the coding agent (Antigravity) that will build the VaaniX website inside the existing repo `github.com/Err-rr/VaaniX`.
> **How to use it:** read Sections 0–3 fully before touching code. Then work phase by phase (Section 16). Do not skip the acceptance checks at the end of each phase.

---

## 0. Ground rules (read first)

1. **No made-up data. Ever.** Every number, name, email address, statistic or result shown on the website must come from (a) this file, (b) real data in the database, or (c) a real model run. If something is missing, show an empty state or a clearly labelled placeholder, and add it to `OPEN_QUESTIONS.md`. Do not invent it.
2. **No mock datasets.** The old `src/data/mock-*.ts` files are deleted (Section 12). Do not create new ones. Seed data is allowed only where this file says so (one demo bank, Section 9.3).
3. **No fake results.** The current Live Detection page shows random scores based on single or double click (Section 2.2). That must be removed. Every verdict on the site must come from the real model server, or be clearly marked **"Demo mode – not a real result"**.
4. **Next.js 16 has breaking changes.** `AGENTS.md` in the repo says so. Before writing routing, data fetching, middleware or caching code, read the guides in `node_modules/next/dist/docs/`. Follow the deprecation notices.
5. **No team or project info on the website.** No team names, member names, college, hackathon name or "Team …" footer. The project owner asked for this.
6. **No photos or AI-generated images of people or police.** Use icons (lucide-react), simple shapes and UI mock-ups (phones, Telegram bubbles) only, the same as the pitch deck.
7. **Secrets never go in code.** Use environment variables only (Section 15).
8. **Simple, plain English** in all UI copy. Short sentences. No jargon on public pages.

---

## 1. Decisions already made (do not change without asking)

| Topic | Decision |
|---|---|
| Website scope | **Public info site + logged-in working app** |
| Frontend | Keep the existing **Next.js 16 + React 19 + Tailwind 4 + Radix UI** repo. Restyle and restructure it. |
| Database + login | **Supabase** (Postgres, Auth, Storage, Row Level Security) |
| Model hosting | **Owner's laptop + tunnel.** The existing Flask model server (`voice_detection_pipeline/server.py`) runs on the laptop and is exposed with **Cloudflare Tunnel** (or ngrok). The website works fully only while the laptop is on. |
| Voice model | **wav2vec2 / XLSR + Nes2Net-X** (existing code, about 511K back-end parameters) |
| Speech-to-text | **faster-whisper** (to add, on the same laptop model server) |
| Score | **One combined risk score (0–100) from voice model + transcript** (Section 6) |
| Telegram bot | **@Prevent_Scambot** |
| Report to Cyber Crime | **Official cyber crime channels only**: verified state cyber cell email (if known), plus links to cybercrime.gov.in and helpline 1930 |
| Report to Bank | **One sample/demo bank only** ("Sample Bank (Demo)") |
| Old fraud-report table + Gmail reader | **Delete** |
| Logo | **None exists.** Use a simple wordmark (Section 5.6) |
| Android app | **Not started.** Out of scope for this website. Payment Guard and the ringing pop-up are explained on the site as "coming in the Android app"; the website does not fake them. |
| Theme | **Light theme only**, matching the pitch deck (navy + teal). Remove dark mode. |

---

## 2. What is in the repo today (audit)

### 2.1 Summary
- `src/` is a **telecom/SOC analyst console** (dashboard, live calls, investigations, call history, analytics, settings). Almost all of it runs on **mock data** from `src/data/`. All of it is being removed.
- Theme is **purple** (`--accent: #5b3df0`). The deck is **navy `#0F2A44` + teal `#0E9F9A`**. It must be restyled.
- Auth is a **fake zustand store** (`src/store/auth-store.ts`): "sign in" just sets a flag.
- Risk formula in `src/lib/risk.ts` uses speaker mismatch and prosody signals that don't exist in our product. It must be replaced (Section 6).
- **Working Python parts to keep:** `voice_detection_pipeline/` (capture → Nes2Net-X → REAL/SPOOF with probabilities; Flask `/health` and `/detect`). It returns `classification, confidence, real_prob, spoof_prob, real_logit, spoof_logit, stub`.
- **Model weights:** `xlsr2_300m.pt` (about 3.8 GB) + `wav2vec2_Nes2Net_X_best.pth` (about 1.2 GB). These are not in git. That's why the model runs on the laptop.
- **No database, no Android code.**

### 2.2 Critical problems found (fix first)
1. **Fake detection results.** `src/hooks/use-live-detection.ts` → `submitAudio()` does **not** send audio to the model. It waits 7 seconds, then makes a random score: 70–100 if the mic was **double-clicked** ("AI"), 0–30 if **single-clicked** ("REAL"). The README calls this page "real, not mocked". **Remove this logic completely.** Replace it with the real API call (Section 8.3).
2. **Leaked Telegram bot token.** `telegram/_client.py` line 23 has the bot token hardcoded, and the repo is public. The owner must **revoke it in @BotFather**. The agent must:
   - remove it from the code
   - read the token from `TELEGRAM_BOT_TOKEN`
   - remove it from git history (`git filter-repo --replace-text`) and force-push, after the owner agrees
3. **Hardcoded personal chat id** in `voice_detection_pipeline/pipeline_with_alerts.py` (`TELEGRAM_CHAT_ID = "1814620976"`). Remove it. Alerts will go through the website backend.
4. **Personal paths** in `DEMO_STEPS.txt` (`/Users/devanshkedia/...`). Rewrite with relative paths.

---

## 3. What we are building

**VaaniX** catches AI voice-clone scam calls. During a call it records seconds **5 to 15** (one 10-second clip) and checks it **once**:
- **Nes2Net-X** says whether the voice is real or AI-generated.
- The **faster-whisper transcript** shows who the caller claims to be and picks up scam words.

Both results are combined into **one risk score (0–100)**. A high score fires alerts:
- a warning on screen
- a Telegram message to the user
- a Telegram message to the family member being impersonated ("Is it you on this call?")

The user can then report in **one tap** (on the website or in Telegram).

### 3.1 The website has two halves

**A. Public site** (no login). It explains the product in the same style as the deck:
- Home
- How it works
- Features
- Try it (demo check)
- Scam Radar lookup
- For developers (API docs)
- Privacy

**B. Logged-in app** (Supabase Auth). The working product:
- New check (mic or upload)
- Check history
- Alert detail + one-tap reporting
- Family Group
- Telegram connection
- Settings
- API keys

### 3.2 Features and where they live

| Feature (from deck) | Website behaviour |
|---|---|
| 10-second check (voice + transcript, one score) | **Real.** `/app/check`: 5 s countdown → 10 s recording (or file upload) → result. |
| Instant alerts (screen + Telegram to user + Telegram to impersonated person) | **Real.** Result screen warning + Telegram bot messages. |
| Family Group with relationships | **Real.** `/app/family`. Members join through a Telegram invite link. |
| Call transcript: who is being faked | **Real.** Shown on the result and alert pages. |
| One-tap reporting (Cyber Crime, Bank, 1930, This is genuine) | **Real**, on the website and in Telegram. |
| Scam Radar (many users flag the same number) | **Real lookup** on `/radar`. The ringing pop-up is Android-only, so it's explained, not faked. |
| Payment Guard (WAIT screen before UPI) | **Explained only** ("Coming in the Android app"). Do not build a fake one. |
| API & SDK | **Real API** (`/api/v1/*`) + API key management + docs page. The Android SDK is "planned". |

---

## 4. Architecture

```
Browser (public site + app)
   │  HTTPS
   ▼
Next.js 16 app (deploy: Vercel) ─────────────► Supabase (Postgres + Auth + Storage)
   │  server-side only, shared secret
   ▼
Cloudflare Tunnel URL ──► Owner's laptop: Flask model server (Python 3.10)
                              ├── Nes2Net-X voice check (existing)
                              ├── faster-whisper transcript (new)
                              └── transcript analysis: scam words + claimed identity (new)

Telegram  ◄──► Next.js webhook route /api/telegram/webhook (bot logic lives here, always online on Vercel)

Laptop demo pipeline (BlackHole capture, pipeline_with_alerts.py)
   └── POSTs its 10 s clip to Next.js /api/v1/analyze with an API key, instead of calling Telegram itself
```

**Why this split:**
- The heavy model stays on the laptop, as agreed.
- The website, database and Telegram bot stay online 24/7.
- If the laptop is off, the site still works. Checks show "Detection engine offline. Try again when the demo machine is on." No fake result is shown.

**Who does what:**
- **Python server** (laptop): audio → `voice` probabilities + `transcript` + `text_analysis`.
- **Next.js server:**
  - final score fusion (Section 6)
  - saving to the database
  - Scam Radar
  - alerts and Telegram
  - complaints and email drafts
  - API keys

---

## 5. Design system — must match the pitch deck

The deck is the visual reference. **Light, calm, minimal, lots of white space.** Navy text, teal accents, red only for danger, green only for safe. No gradients, no glow, no dark mode, no stock photos, no AI images.

### 5.1 Colour tokens (replace everything in `src/app/globals.css`)

| Token | Hex | Use |
|---|---|---|
| `--navy` | `#0F2A44` | Headings, main text, dark buttons, phone frames |
| `--teal` | `#0E9F9A` | Brand accent: fills, icons, borders, large text only |
| `--teal-dark` | `#0B7C78` | Teal **text** and links (passes AA) |
| `--teal-tint` | `#E3F5F4` | Highlight cards, flow boxes |
| `--red` | `#DC3D43` | Danger fills, AI-detected borders, big numbers |
| `--red-text` | `#B8262C` | Red **body-size text** (passes AA) |
| `--red-tint` | `#FDECEC` | Danger card background |
| `--green` | `#1E9E5A` | Safe fills, "This is genuine" button |
| `--green-text` | `#167A45` | Green body-size text |
| `--green-tint` | `#E6F6EC` | Safe card background |
| `--surface` | `#FFFFFF` | Page background |
| `--light` | `#F3F6F9` | Neutral cards, sections |
| `--gray` | `#5A6B7D` | Secondary text |
| `--faint` | `#8A99A8` | Captions ≥ 18px only, or decorative |
| `--border` | `#D5DEE7` | Card and panel borders |
| `--arrow` | `#9FB0C0` | Flow arrows and connectors |
| `--telegram` | `#2AABEE` | Only for Telegram message mock-up headers (pair with **bold** white text ≥ 18px) |

**Contrast** (checked; WCAG AA needs 4.5:1 for normal text):
- Pass on white: navy 14.6, teal-dark 5.0, gray 5.5, red-text 6.3, green-text 5.4.
- Fail for small text: teal `#0E9F9A` is 3.3, red `#DC3D43` is 4.4, green `#1E9E5A` is 3.5, faint is 2.9. Use these only for fills, icons, borders or large bold text (≥ 24px, or ≥ 18.66px bold).
- White text on teal `#0E9F9A` is only 3.3. Teal buttons must use **`--teal-dark` background** for white text, or bold text ≥ 18px.

### 5.2 Typography
- The deck uses **Calibri**. On the web, use **Carlito** (open-source and metric-compatible with Calibri). Load it with `next/font/google` if available; otherwise self-host the Carlito `.woff2` (OFL licence).
- Fallback stack: `Calibri, Carlito, "Segoe UI", system-ui, sans-serif`. Verify that Carlito loads before shipping. Remove Inter and Geist.
- Scale (desktop / mobile):
  - H1 56/36
  - H2 40/28
  - H3 24/20
  - body 18/16
  - small 15/14
- Weight: headings bold (700), body regular (400). Line height: 1.2 headings, 1.5 body.
- Monospace (API docs only): `"JetBrains Mono", ui-monospace, monospace`.

### 5.3 Layout
- Max content width 1200px, centred.
- Side padding 24px (desktop) / 16px (mobile). No horizontal scroll at 360px width.
- 8px spacing grid. Section vertical padding 96px desktop / 56px mobile.
- Corner radius:
  - cards 16px
  - flow boxes 14px
  - pills and buttons 999px
  - phone frames 40px outer / 22px screen
- Shadows: almost none. Cards are flat on `--light` or have a 1px `--border`. One soft shadow is allowed on phone mock-ups only.

### 5.4 Components to build (each copies a deck element)

| Component | Copies deck element | Spec |
|---|---|---|
| `Pill` | "AI IN CYBERSECURITY" chip (slide 1) | teal-tint bg, teal-dark bold uppercase 14px, letter-spacing .08em |
| `StatCard` | Slide 2 stat cards | big number 56px bold (red on red-tint, or teal-dark on teal-tint); 1–2 line label; italic gray source line **with a link** |
| `FlowBox` + `FlowArrow` | Slides 3, 5, 6 flows | rounded box, 2px border (teal / red / gray), title bold + one-line subtitle; arrow = block arrow SVG `M0 10H24V0L40 15L24 30V20H0Z` in `--arrow` (or red when leading to danger) |
| `DecisionDiamond` | "AI voice?" diamond (slide 3) | navy 3px stroke, YES (red) / NO (green) branches |
| `Timeline` | 0 s → 5 s → 15 s → result bar (slide 3) | gray track, teal 10 s segment labelled "10-second listening window" |
| `PhoneMock` | phones on slides 1, 4, 6 | navy frame, white screen, notch bar `#2E4A66` |
| `TelegramBubble` | slide 4 Telegram screens | `--telegram` header with "VaaniX Bot", light message card, stacked full-width buttons (teal-dark / navy / red / green) |
| `RiskMeter` | "Risk score 87 / 100" | 0–100 bar or ring; band label (Section 6.4); colour by band |
| `TranscriptPanel` | slide 5 transcript card | light card, timestamped lines in mono-ish digits, red highlighted scam words, red "→ Claims to be …" line |
| `FamilyDiagram` | slide 5 family circle | centre teal circle "YOU", members in white circles with teal 4px border, gray connectors, Telegram icon when joined |
| `ActionRow` | slide 7 left column | pill button (icon + label) + one-line explanation on a light card |
| `ApiRow` | slide 7 API panel | method chip (POST teal-dark, GET navy, SDK green) + path in bold + gray description |
| `AudienceCard` | slide 8 "Who VaaniX protects" | teal circle icon, bold title, gray text |
| `CtaBand` | slide 8 teal band | full-width teal-dark band, white bold line "Your voice is your identity. VaaniX protects it." |
| `EmptyState`, `OfflineState`, `DemoModeBadge` | — | honest states (Section 0) |

Reuse Radix primitives in `src/components/ui/` (button, card, dialog, sheet, tabs, input, label, select, switch, tooltip, badge, progress, separator, checkbox, dropdown-menu, table, scroll-area). Restyle them with the new tokens.

### 5.5 Motion
Subtle only:
- 150–200 ms fades and slides
- the mic level meter
- the countdown ring

Respect `prefers-reduced-motion`. No looping background animations.

### 5.6 Wordmark (no logo exists)
- Text "**Vaani**" in navy bold + "**X**" in teal-dark bold, next to a simple teal shield icon (lucide `ShieldCheck`, same as the slide 8 band).
- Replace `src/components/layout/logo.tsx` and `src/app/icon.svg` with a teal shield on white. Don't design anything more complex.

---

## 6. Combined risk score (voice + transcript)

> These weights are **starting values chosen by engineering**, not measured results. Keep them in one config file (`src/lib/scoring/config.ts`) so they can be tuned after test calls. **Never show the weights as "accuracy" or as research.**

### 6.1 Inputs (from the Python server)
- `voice_score` = `spoof_prob` from Nes2Net-X (0–100).
- `text_score` (0–100) from the transcript. Add up the group weights, once per group, then cap at 100:

| Scam-word group | Weight | Example words (Latin + Devanagari forms) |
|---|---|---|
| `otp_pin` | 30 | otp, pin, cvv, password, code batao |
| `remote_app` | 30 | anydesk, teamviewer, screen share, apk |
| `money` | 25 | upi, paise, transfer, bhejo, gpay, phonepe, paytm, qr |
| `secrecy` | 20 | kisi ko mat batana, mat batana, don't tell |
| `authority` | 20 | police, cbi, customs, rbi, trai, warrant, digital arrest |
| `kyc` | 20 | kyc, account block, card block, band ho jayega |
| `urgency` | 15 | jaldi, abhi, turant, urgent, emergency |
| `accident` | 15 | accident, hospital, injured, jail, arrest |
| `claimed_identity` | 15 | a family member or authority claim was found (Section 7.3) |

### 6.2 Formula
```
risk_score = round(0.70 * voice_score + 0.30 * text_score)
```
If the transcript is empty (no speech found), use `text_score = 0`. Mark the result "No clear speech – voice check only".

### 6.3 Verdict
- `AI_CLONE` when `risk_score >= 60` **and** `voice_score >= 50`. The voice model must agree, so scam words alone can't make an AI verdict.
- `REAL` when `risk_score < 40`.
- Otherwise `INCONCLUSIVE`: no Telegram alert, and show a yellow "Be careful" note on screen.

### 6.4 Display bands
Rewrite `src/lib/risk.ts`:

| Score | Band | Colour |
|---|---|---|
| 0–29 | Low | green |
| 30–59 | Elevated | gray / amber note |
| 60–84 | High | red |
| 85–100 | Critical | red, bold |

Every result screen shows **all three numbers**: Voice score, Transcript score and Final risk score, plus the transcript itself. That way the score is never a black box.

### 6.5 Unit tests (required)
`scoring.test.ts`: at least 15 cases, covering:
- empty transcript
- voice high with text low
- voice low with text high (must **not** be AI_CLONE)
- boundary values 39 / 40 / 59 / 60
- the cap at 100

---

## 7. Python model server changes (`voice_detection_pipeline/`)

### 7.1 New endpoint `POST /analyze` (keep `/health` and `/detect`)

**Request:** `multipart/form-data`
- `audio`: WAV/WEBM/MP3, 8–12 s
- `members`: JSON list `[{id, name, aliases[], relationship}]`, optional

**Auth:** header `X-Model-Secret` must equal env `MODEL_SERVER_SECRET`. Reject anything else with 401.

**Steps:**
1. Validate the file: size ≤ 3 MB, duration 8–12 s. Convert to 16 kHz mono with `librosa` or `ffmpeg`.
2. **Voice:** run the existing `run_detection()` and get `spoof_prob`, `real_prob`.
3. **Transcript:** `faster-whisper`, in parallel with step 2 (thread pool).
   - Settings: `language=None` (auto), `vad_filter=True`, `beam_size=1`.
   - Model size: `small` by default (env `WHISPER_MODEL`), `compute_type="int8"` on CPU.
4. **Text analysis:**
   - Normalise: lowercase; transliterate Devanagari → Latin with `indic-transliteration`; strip punctuation.
   - Match scam-word groups from `data/scam_words.yaml` (create this file with the words in Section 6.1).
   - **Claim extraction:**
     - Name patterns: `main <name> bol raha/rahi hoon`, `this is <name>`, `mera naam <name> hai`. Fuzzy-match against members (Levenshtein ≤ 1 for names of 4+ letters).
     - Relationship words: `mummy/mom/papa` → the caller claims to be the user's child; `beta/beti` → parent; `bhaiya/didi` → sibling; `dadi/nani/dada/nana` → grandchild. `raha`/`rahi` narrows gender.
     - Authority words: bank, police, CBI, customs, RBI, TRAI → "Bank officer", "Police officer", etc.
5. **Return:**
```json
{
  "voice": {"spoof_prob": 0-100, "real_prob": 0-100, "stub": false},
  "transcript": {"text": "...", "language": "hi", "segments": [{"start": 0.0, "end": 2.1, "text": "..."}]},
  "text_analysis": {
    "groups": ["money", "urgency"], "matched_words": ["upi", "jaldi"],
    "text_score": 0-100,
    "claim": {"type": "family|authority|none", "member_id": "uuid|null", "label": "Rahul (Son)|Bank officer|null", "source": "transcript_name|transcript_relation|none", "candidates": ["uuid", "..."]}
  },
  "timings_ms": {"voice": 0, "stt": 0, "total": 0}
}
```
6. **Do not save audio on the laptop** except when running the CLI pipeline in debug mode.
7. `VOICE_DETECTION_STUB=1` must still work. When it's on, set `"stub": true`. The website must then show the **DemoModeBadge** and must not send real Telegram alerts or count towards Scam Radar.

### 7.2 Other changes
- Add `faster-whisper` and `indic-transliteration` to `requirements.txt`. Add `ffmpeg` to the setup notes.
- Add `python-Levenshtein` or `rapidfuzz` for fuzzy name matching.
- Add `pytest` tests for claim extraction and scam words: at least 20 sentences across Hindi script, Hinglish and English.
- `pipeline_with_alerts.py`: remove the direct Telegram import and the chat id. After capture, POST the WAV to `${VAANIX_API_URL}/api/v1/analyze` with header `Authorization: Bearer ${VAANIX_API_KEY}`, then print the JSON result.
- Startup script `run_server.sh`:
  - activates the venv
  - starts Flask on `127.0.0.1:8765`
  - prints the instructions to start `cloudflared tunnel --url http://127.0.0.1:8765`
  - reminds the owner to paste the tunnel URL into Vercel env `MODEL_SERVER_URL`

  Note: a free quick-tunnel URL changes every run. A named tunnel needs a domain. Document both options.

### 7.3 Speed
The owner reports **about 10 seconds** of processing per check on the laptop. The UI must show a clear "Analysing… (about 10 seconds)" step with progress text. The Next.js request timeout must be **≥ 60 s**. Check the Vercel function `maxDuration` for the project plan.

---

## 8. Website pages

### 8.1 Public pages

**`/` Home**
Sections in this order (each mirrors a slide):
1. **Hero** (slide 1):
   - `Pill` "AI IN CYBERSECURITY"
   - H1 "VaaniX"
   - line "Catch AI voice-clone scams **during the call** — before the money moves." ("during the call" in teal-dark)
   - one-paragraph explainer
   - buttons "Try a check" (→ `/try`) and "How it works"
   - right side: `PhoneMock` showing the "AI VOICE DETECTED" screen. Label the mock-up "Example screen" in small gray text.
2. **The problem** (slide 2): `StatCard` grid with the **verified stats in Section 13 only**, plus the 4-step "How the scam plays out" vertical flow:
   - copies a few seconds of voice
   - AI clones it
   - "Mummy, accident ho gaya, jaldi paise bhejo!"
   - parent panics and pays
3. **How it works** (slide 3):
   - horizontal flow: Call connects → Wait 5 s → Record 5–15 s → (Voice check ∥ Transcript) → combined score → AI voice? diamond → AI detected / Real voice
   - the `Timeline`
   - the two-line "Under the hood" text (Section 13.2)
4. **Instant alerts** (slide 4): three `PhoneMock`s (on screen / Telegram to you / Telegram to the real Rahul) connected by arrows. Make clear these are example screens.
5. **Family Group + Transcript** (slide 5).
6. **Scam Radar + Payment Guard** (slide 6). Label Payment Guard and the ringing pop-up "**Coming in the Android app**".
7. **One-tap reporting + API & SDK** (slide 7).
8. **Who VaaniX protects** (slide 8) + `CtaBand`.

**`/how-it-works`**: a longer version of section 3. Adds:
- the score formula in plain words ("70% voice, 30% transcript, both shown to you")
- privacy points
- the model accuracy statement (Section 13.3)

**`/try`** (public demo check, no login):
- same check UI as `/app/check`
- results are not saved and don't trigger Telegram or Scam Radar
- rate limit: 5 checks per IP per hour
- consent checkbox: "I have permission to record this audio."

**`/radar`**: enter a phone number → `GET /api/radar/lookup`.
- Shows level `none` / `caution` / `potential_scam`, distinct reporters in 24 h and 7 d, and the most common scam type.
- Note: "Numbers can be faked. VaaniX only warns, it never blocks."
- No reporter identities are shown, ever.

**`/developers`**:
- API overview (Section 10)
- auth with API keys
- request/response examples for `POST /api/v1/analyze`, `POST /api/v1/complaint`, `GET /api/v1/evidence/{id}`, `GET /api/v1/radar/lookup`
- Android SDK marked "Planned"

**`/privacy`**: what is recorded (10 s only), what is stored (only flagged checks), retention (Section 15), who sees what, how to delete your data.

**`/login`**: Supabase Auth.
- Email magic link + Google OAuth.
- Replace the fake zustand auth.

### 8.2 App pages (behind login; middleware/proxy redirects to `/login`)

Simple top bar (wordmark, nav, account menu). On mobile, nav becomes a bottom bar or sheet. Nav: **Check · History · Family · Settings · API**.

**`/app` → redirects to `/app/check`.** If the user has no family members and no Telegram linked, show a 3-step onboarding card first:
1. Connect Telegram
2. Add family
3. Run a check

**`/app/check`**, the core page:
- Two inputs: **Record with mic** (call on speaker) or **Upload a recording**.
- Mic flow (copies the product):
  1. press Start
  2. **5 s countdown** ("Skipping ring and greetings")
  3. **10 s recording** with a level meter and countdown ring
  4. auto-submit
  5. "Analysing… (about 10 seconds)"
- Optional field: "Caller number" (E.164, for Scam Radar).
- Result screen:
  - `RiskMeter` with the final score and band
  - three sub-scores
  - verdict banner (red "AI VOICE DETECTED" / green "Real voice" / yellow "Be careful")
  - `TranscriptPanel` with scam words highlighted and the "Claims to be …" line
  - if `AI_CLONE`: an "Alerts sent" checklist with real statuses from the database (Telegram to you ✓/✗, Telegram to Rahul ✓/✗/not joined)
  - `ActionRow` buttons (Section 9)
- Offline handling: if the model server is unreachable, show `OfflineState` and keep the recording so the user can retry. No fake verdict.

**`/app/history`**:
- list of the user's checks (date, caller number, final score, verdict, claimed identity)
- filter by verdict
- empty state when there are none

**`/app/alerts/[id]`** (opened from history or the Telegram link):
- full result
- family member response ("Rahul said: No, it's a scam" / "Waiting" / "Not joined")
- complaint history
- buttons

**`/app/family`**:
- `FamilyDiagram` + list.
- Add a member: name, aliases (comma list), relationship (son, daughter, husband, wife, father, mother, brother, sister, grandson, granddaughter, other), real phone number.
- Each member gets an invite link `https://t.me/Prevent_Scambot?start=m_<token>`, with **Copy**, **Share on WhatsApp** (`https://wa.me/?text=`) and joined status.
- Edit and remove members.

**`/app/settings`**:
- Connect Telegram (`https://t.me/Prevent_Scambot?start=u_<token>`, shows linked or not linked)
- your state (for the cyber cell email)
- your bank (only "Sample Bank (Demo)" for now)
- display name
- delete my data

**`/app/api`**:
- create/revoke API keys (show the key once, store only the hash)
- usage count
- link to `/developers`

### 8.3 Replace the fake Live Detection
- Delete `src/hooks/use-live-detection.ts` and rebuild it as `src/hooks/use-voice-check.ts`.
- Keep the useful parts: mic capture with `AudioContext`, level meter and WAV encoding from `src/lib/wav-encoder.ts`.
- The new hook:
  1. countdown 5 s
  2. record exactly 10 s
  3. encode WAV 16 kHz mono
  4. POST to `/api/checks`
  5. return the server result
- No single/double-click modes, no `Math.random`, no fixed delay.

---

## 9. Alerts, Telegram and one-tap reporting

### 9.1 Telegram bot (Next.js webhook)
- Route `POST /api/telegram/webhook`. Verify the header `X-Telegram-Bot-Api-Secret-Token` equals env `TELEGRAM_WEBHOOK_SECRET`.
- Register the webhook once with a script: `scripts/set-telegram-webhook.ts`.
- **Linking:**
  - `/start u_<token>` → save `chat_id` on the profile, reply "✅ VaaniX alerts connected."
  - `/start m_<token>` → save `chat_id` on the family member, reply "You are now protecting <owner name> as their <relationship>. If someone uses your voice to call them, you'll get a message here."
  - Tokens must be `[A-Za-z0-9_-]`, ≤ 64 characters.
- **Message to the user** when the verdict is `AI_CLONE`:
  ```
  ⚠️ AI-cloned voice detected
  Call from <number or "unknown"> · <time>
  Risk <score>/100
  Claimed to be: <label or "unknown">
  Said: "<up to 3 scam words>"
  <one-line advice for the scam type>
  ```
  Buttons:
  - **Report to Cyber Crime** (URL → `/r/cyber/<alert_id>?t=<signed>`)
  - **Report to Bank** (URL → `/r/bank/<alert_id>?t=<signed>`)
  - **Call 1930** (URL → `/r/call1930`, a page with a big `tel:1930` button)
  - **This is genuine** (callback)

  Telegram URL buttons only open http(s) and tg:// links, so mail and phone actions go through these small redirect pages.
- **Message to the impersonated member:** "Someone is using **your voice** to call <owner> right now. Is it you on this call?"
  - Buttons: **Yes, it's me** / **No, it's a scam** (callbacks).
  - On "No": set the alert to `confirmed_scam`, tell the owner in Telegram "Rahul says it's NOT him. This is a scam.", and add a Scam Radar report `impersonation_denied`.
  - On "Yes": tell the owner "Rahul confirmed it's really him." and set the status to `verified_genuine`.
- **"This is genuine"** → set the status to `dismissed_genuine`, save feedback, and exclude this check from Scam Radar counts.
- Save every sent message in `alert_messages`. If sending fails, store the error and show ✗ on the website. Don't pretend it worked.

### 9.2 Report to Cyber Crime (official channels only)
- The `/r/cyber/<id>` page and the website button open a **Gmail compose** link:
  - `https://mail.google.com/mail/?view=cm&fs=1&to=<email>&su=<subject>&body=<body>`
  - with a `mailto:` fallback for other mail apps
- `to` comes from the `cyber_cells` table for the user's state, **only if `verified = true`**.
  - **The agent must not invent any cyber cell email.** The table starts empty except for columns.
  - The owner fills it from official state police / cyber cell websites, with a `source_url` and `verified_on` date.
  - If there's no verified email for the state: hide the email option and show "File your complaint on the official portal: **cybercrime.gov.in**" + "Call **1930**".
- Pre-written email body (plain text):
  - date and time
  - caller number
  - risk score
  - voice and transcript scores
  - claimed identity
  - transcript excerpt
  - evidence ID + SHA-256 hash
  - link to download evidence (signed, expires in 7 days)
  - the user's name and phone (the user can edit before sending)
- Save a `complaints` row when the user opens the draft (`target='cyber_cell'`).

### 9.3 Report to Bank (sample only)
- Seed **one** row in `banks`: `name = "Sample Bank (Demo)"`, `fraud_email = "fraud@samplebank.example"`.
  - `.example` is a reserved, non-real domain, so no real bank gets emails.
  - Show a "Demo" badge next to it everywhere.
- Same Gmail compose flow. The email asks to freeze or flag a transaction.

### 9.4 Call 1930
The page has a single big `tel:1930` button: "National Cyber Crime Helpline 1930 — call fast to stop the money."

---

## 10. API (Next.js route handlers)

All JSON. Errors look like `{error: {code, message}}`. Validate every input with **zod**.

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/checks` | Supabase session | Website check. Forwards audio + the user's family members to the model server, computes the score (Section 6), saves to the DB. If `AI_CLONE`: saves evidence, creates the alert, sends Telegram, adds a radar report. Returns the full result. |
| `POST /api/try` | none (rate-limited) | Public demo. Same as above but **no DB writes, no alerts, no radar** |
| `GET /api/checks?verdict=&page=` | session | History |
| `GET /api/alerts/:id` | session (owner only) | Alert detail |
| `POST /api/alerts/:id/genuine` | session | Mark genuine |
| `POST /api/alerts/:id/claim` | session | Manual "They said they are ___" (member_id) |
| `POST /api/complaints` | session | Log that a complaint draft was opened |
| `GET/POST/PATCH/DELETE /api/family` | session | Family CRUD + invite tokens |
| `GET /api/radar/lookup?number=` | none (rate-limited) | Radar level. Response < 300 ms (index + 60 s cache) |
| `POST /api/telegram/webhook` | Telegram secret header | Bot |
| `GET /api/health` | none | `{web:"ok", db:"ok"|"down", model:"ok"|"offline"|"stub"}` |
| **Public API v1** (for police, banks, telecom; API key in `Authorization: Bearer`) | | |
| `POST /api/v1/analyze` | API key | Same as `/api/checks` for integrators and the laptop pipeline |
| `POST /api/v1/complaint` | API key | Returns a structured complaint JSON for an alert |
| `GET /api/v1/evidence/:id` | API key (scope `evidence`) | Metadata + SHA-256 + short-lived download URL |
| `GET /api/v1/radar/lookup?number=` | API key | Same as the public lookup, higher rate limit |

Rate limits are stored in Postgres (table `rate_limits`) or Upstash. Pick Postgres to avoid a new service.

---

## 11. Database (Supabase)

Create these with SQL migrations in `supabase/migrations/`. Enable **RLS on every table**. Every user-owned row has `user_id` and the policy `user_id = auth.uid()`. Server-only tables are written with the service role key, from server code only.

```sql
profiles (id uuid pk references auth.users, display_name text, phone_e164 text,
  state_code text, bank_id uuid null references banks,
  telegram_chat_id bigint null, telegram_link_token text unique, created_at timestamptz default now())

family_members (id uuid pk, user_id uuid references profiles, name text not null,
  aliases text[] default '{}', relationship text not null, phone_e164 text not null,
  telegram_chat_id bigint null, join_token text unique not null, joined_at timestamptz null,
  created_at timestamptz default now())

checks (id uuid pk, user_id uuid references profiles, source text,          -- 'web_mic'|'web_upload'|'api'|'laptop_pipeline'
  caller_e164 text null, voice_score int, text_score int, risk_score int,
  verdict text,                                                              -- 'AI_CLONE'|'REAL'|'INCONCLUSIVE'
  is_stub boolean default false, transcript text, transcript_lang text, transcript_segments jsonb,
  scam_groups text[] default '{}', scam_words text[] default '{}', scam_type text null,
  claim_type text null, claim_label text null, claimed_member_id uuid null references family_members,
  audio_path text null, audio_sha256 text null, timings_ms jsonb, created_at timestamptz default now())

alerts (id uuid pk, check_id uuid references checks, user_id uuid references profiles,
  status text default 'open',            -- 'open'|'confirmed_scam'|'verified_genuine'|'dismissed_genuine'
  impersonated_member_id uuid null references family_members, member_response text null,
  created_at timestamptz default now(), updated_at timestamptz default now())

alert_messages (id uuid pk, alert_id uuid references alerts, recipient text,   -- 'user'|'member'
  chat_id bigint, telegram_message_id bigint null, ok boolean, error text null, sent_at timestamptz default now())

complaints (id uuid pk, alert_id uuid references alerts, user_id uuid references profiles,
  target text,                            -- 'cyber_cell'|'bank'|'portal'|'api'
  payload jsonb, created_at timestamptz default now())

radar_reports (id uuid pk, number_e164 text not null, reporter_user_id uuid references profiles,
  source text not null,                   -- 'ai_flag'|'user_report'|'impersonation_denied'
  check_id uuid null references checks, scam_type text null, excluded boolean default false,
  created_at timestamptz default now())
  -- index (number_e164, created_at desc); unique (number_e164, reporter_user_id, source, date_trunc('day', created_at))

feedback (id uuid pk, check_id uuid references checks, user_id uuid references profiles,
  label text, created_at timestamptz default now())   -- 'genuine'|'scam'

cyber_cells (state_code text pk, state_name text, email text null, portal_url text,
  source_url text null, verified boolean default false, verified_on date null)
  -- seed: all states/UTs with email = null, verified = false, portal_url = 'https://cybercrime.gov.in'

banks (id uuid pk, name text, fraud_email text, is_demo boolean default true)
  -- seed exactly one: ('Sample Bank (Demo)', 'fraud@samplebank.example', true)

api_clients (id uuid pk, owner_user_id uuid references profiles, name text, key_prefix text,
  key_hash text, scopes text[], revoked_at timestamptz null, last_used_at timestamptz null,
  request_count int default 0, created_at timestamptz default now())

rate_limits (key text, window_start timestamptz, count int, primary key (key, window_start))
```

- **Storage:** private bucket `evidence/`. Path `evidence/<user_id>/<check_id>.wav`. Upload **only when the verdict is `AI_CLONE`**. Compute SHA-256 on the server before upload.
- **Scam Radar rule** (default, configurable in `src/lib/radar/config.ts`):
  - `potential_scam` when **≥ 3 distinct reporters in 24 h**, or any `impersonation_denied` in 24 h
  - `caution` when there are 1–2 reporters in 24 h, or any in 7 days
  - otherwise `none`
  - A user's own reports on the same number count once.
  - `excluded = true` rows (marked genuine) don't count.
  - Stub-mode checks never create reports.
- Write **SQL tests or Vitest integration tests** that prove user A cannot read user B's checks, alerts or family.

---

## 12. Repo changes: delete / keep / modify / add

### 12.1 DELETE (the whole telecom dashboard + mock data + Gmail fraud reports)
```
src/app/(shell)/dashboard/
src/app/(shell)/live-calls/               (incl. [id]/)
src/app/(shell)/investigations/           (incl. [id]/)
src/app/(shell)/alerts/                    (old SOC alerts page — new alerts live under /app/alerts/[id])
src/app/(shell)/call-history/
src/app/(shell)/analytics/
src/app/(shell)/settings/                  (page.tsx, policies/, integrations/, team/, audit-log/)
src/app/(shell)/live-detection/            (rebuilt as /app/check)
src/app/(shell)/layout.tsx                 (replaced by src/app/app/layout.tsx)
src/app/api/emails/refresh/route.ts
src/app/login/page.tsx                     (rebuilt with Supabase)

src/components/tables/                     (live-calls, call-history, investigations, alerts tables)
src/components/calls/                      (action-panel, call-meta, evidence-panel, risk-timeline, signal-panel, voice-analysis-visual, risk-gauge*)
src/components/charts/                     (all 7 chart files)
src/components/dashboard/                  (recent-activity-list, summary-strip, risk-waveform)
src/components/alerts/alert-detail-sheet.tsx
src/components/layout/sidebar.tsx, topbar.tsx, command-menu.tsx, notification-center.tsx, nav-config.ts, app-shell.tsx, page-header.tsx
src/components/shared/filter-bar.tsx, filter-select.tsx, pagination.tsx, severity-badge.tsx, status-badge.tsx, visual-placeholder.tsx
src/components/ui/slider.tsx, avatar.tsx   (only if unused after the rebuild — confirm with `npx knip`)

src/data/                                  (constants.ts, mock-alerts.ts, mock-analytics.ts, mock-calls.ts, mock-investigations.ts, mock-overview.ts, mock-settings.ts)
src/hooks/use-fraud-reports.ts, use-live-call.ts, use-risk-updates.ts, use-theme.ts, use-live-detection.ts
src/lib/parse-fraud-reports.ts
src/store/                                 (auth-store.ts, analysis-store.ts — replaced by Supabase session)
src/types/call.ts, investigation.ts, alert.ts, fraud-report.ts, settings.ts, common.ts, voice.ts   (replaced by src/types/*.ts below)

email_agent/                               (whole folder: email_connector.py, save_emails.py, emails.json, __init__.py)
public/emails.json
public/next.svg, vercel.svg, globe.svg, window.svg, file.svg   (Next.js boilerplate)

telegram/                                  (whole folder — the bot moves to Next.js; first port the button/callback logic from alerts.py and bot_listener.py)
```
`*` `risk-gauge.tsx`: delete it, but look at its drawing code when building the new `RiskMeter`.

Also remove from `requirements.txt`: `google-auth`, `google-auth-oauthlib`, `google-api-python-client` (Gmail is gone).
Remove from `package.json` if unused after the rebuild: `recharts`, `cmdk`, `zustand`, `@radix-ui/react-avatar`, `@radix-ui/react-slider`, `@radix-ui/react-radio-group`, `@radix-ui/react-popover`.

### 12.2 KEEP (as is or restyled)
```
voice_detection_pipeline/capture.py, model_runner.py, model_scripts/wav2vec2_Nes2Net_X.py, pipeline.py, server.py (extend)
src/components/ui/*  (Radix primitives; restyle with new tokens)
src/components/shared/empty-state.tsx, loading-state.tsx, risk-badge.tsx (restyle)
src/components/live-detection/level-meter.tsx, mic-orb.tsx (restyle; mic-orb loses double-click logic)
src/lib/wav-encoder.ts, src/lib/utils.ts
src/app/api/live-detection/route.ts → rename/merge into src/app/api/checks/route.ts (keep its offline handling idea)
next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs, AGENTS.md, .gitignore
```

### 12.3 MODIFY
| File | Change |
|---|---|
| `src/app/globals.css` | Replace all tokens with Section 5.1. Remove `.dark`. |
| `src/app/layout.tsx` | Carlito font. Remove the theme script. New metadata: title "VaaniX — Catch AI voice-clone scam calls", description from the hero line. Add Open Graph tags. |
| `src/app/page.tsx` | Becomes the public Home (Section 8.1), not a redirect. |
| `src/lib/risk.ts` | New bands (6.4). Delete the old fusion weights. |
| `voice_detection_pipeline/server.py` | Add `/analyze` + secret header (Section 7). |
| `voice_detection_pipeline/pipeline_with_alerts.py` | POST to the website API; remove Telegram + chat id. |
| `requirements.txt` | Add faster-whisper, indic-transliteration, rapidfuzz, pytest; remove the Google libs. |
| `README.md` | Rewrite: what VaaniX is, architecture, setup (web, Supabase, model server, tunnel, Telegram webhook), env vars, honest status. |
| `DEMO_STEPS.txt` → `docs/DEMO.md` | Rewrite with relative paths and the new flow (Section 17). |
| `.gitignore` | Add `supabase/.temp`, `*.wav` in results, `.env*` (already there). |

### 12.4 ADD (new files)
```
src/app/(public)/layout.tsx                 public header + footer (wordmark, nav, privacy link; no team info)
src/app/(public)/page.tsx                   Home  (or keep at src/app/page.tsx)
src/app/(public)/how-it-works/page.tsx
src/app/(public)/try/page.tsx
src/app/(public)/radar/page.tsx
src/app/(public)/developers/page.tsx
src/app/(public)/privacy/page.tsx
src/app/login/page.tsx                      Supabase magic link + Google
src/app/auth/callback/route.ts              Supabase OAuth callback
src/app/app/layout.tsx                      auth gate + app nav
src/app/app/page.tsx                        → redirect to /app/check (+ onboarding)
src/app/app/check/page.tsx
src/app/app/history/page.tsx
src/app/app/alerts/[id]/page.tsx
src/app/app/family/page.tsx
src/app/app/settings/page.tsx
src/app/app/api/page.tsx                    API keys
src/app/r/cyber/[id]/page.tsx, src/app/r/bank/[id]/page.tsx, src/app/r/call1930/page.tsx
src/app/api/checks/route.ts, src/app/api/try/route.ts, src/app/api/alerts/[id]/route.ts (+ genuine, claim)
src/app/api/complaints/route.ts, src/app/api/family/route.ts, src/app/api/radar/lookup/route.ts
src/app/api/telegram/webhook/route.ts, src/app/api/health/route.ts
src/app/api/v1/analyze/route.ts, src/app/api/v1/complaint/route.ts, src/app/api/v1/evidence/[id]/route.ts, src/app/api/v1/radar/lookup/route.ts
src/middleware.ts (or the Next 16 equivalent — check docs)   protect /app/*
src/lib/supabase/{server.ts, client.ts, admin.ts}
src/lib/scoring/{config.ts, score.ts, score.test.ts}
src/lib/radar/{config.ts, lookup.ts, lookup.test.ts}
src/lib/telegram/{client.ts, messages.ts, callbacks.ts}
src/lib/complaints/{gmail-link.ts, templates.ts}
src/lib/model-client.ts                     calls MODEL_SERVER_URL/analyze with secret, 60 s timeout, offline handling
src/lib/api-keys.ts                         create (random 32 bytes, show once), hash (sha256), verify, scopes
src/lib/rate-limit.ts
src/lib/phone.ts                            E.164 normalise (+91 default) using libphonenumber-js
src/hooks/use-voice-check.ts                5 s wait + 10 s record + submit (no fake logic)
src/components/marketing/*                  Pill, StatCard, FlowBox, FlowArrow, DecisionDiamond, Timeline, PhoneMock, TelegramBubble, AudienceCard, CtaBand
src/components/check/*                      RiskMeter, ScoreBreakdown, TranscriptPanel, VerdictBanner, AlertStatusList, ActionRow, OfflineState, DemoModeBadge
src/components/family/*                     FamilyDiagram, MemberForm, InviteLinkCard
src/components/layout/{public-header.tsx, public-footer.tsx, app-nav.tsx, wordmark.tsx}
src/types/{check.ts, alert.ts, family.ts, radar.ts, api.ts}
supabase/migrations/0001_init.sql, 0002_rls.sql, 0003_seed_banks_and_states.sql
scripts/set-telegram-webhook.ts
voice_detection_pipeline/analysis/{stt.py, text_analysis.py, claims.py}
voice_detection_pipeline/data/scam_words.yaml, relationships.yaml
voice_detection_pipeline/tests/test_claims.py, test_scam_words.py
voice_detection_pipeline/run_server.sh
tests/e2e/*.spec.ts                         Playwright
.env.example
OPEN_QUESTIONS.md
docs/DEMO.md
```
New npm deps:
- `@supabase/supabase-js`, `@supabase/ssr`
- `zod`
- `libphonenumber-js`
- dev: `vitest`, `@playwright/test`, `knip`

---

## 13. Content: verified facts only

### 13.1 Problem stats (use these and only these; each card shows its source link)

| Card | Text | Source |
|---|---|---|
| 47% | "of Indian adults have faced, or know someone hit by, an AI voice scam (global average: 25%)" | McAfee "Beware the Artificial Impostor" survey, Apr 2023, 7,054 people in 7 countries. [Digital Terminal](https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams), [BOOM](https://www.boomlive.in/explainers/ai-voice-scam-voice-cloning-mcafee-report-21851) |
| 83% | "of Indian victims lost money; 48% of them lost over ₹50,000" | Same McAfee survey ([Digital Terminal](https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams)). BOOM words it as "up to ₹50,000", so use Digital Terminal's wording and link it. |
| 3 sec | "of audio was enough for an 85% voice match in McAfee's tests" | Same McAfee report ([Digital Terminal](https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams)) |
| 3× | "Indians lost ₹22,845 crore to cyber fraud in 2024, up from ₹7,465 crore in 2023" | Government reply in Lok Sabha, 22 Jul 2025. [Scroll](https://scroll.in/latest/1084796/indians-lost-rs-22845-crore-to-cyber-fraud-in-2024-a-206-rise-from-previous-year-centre), [The Week/PTI](https://www.theweek.in/wire-updates/business/2025/07/22/del23-lsq-cyber-fraud.html) |
| 27% | "of deepfake speech samples were missed by people in a 529-person study, even after training" | UCL, PLOS ONE, Aug 2023 (people spotted fakes 73% of the time). [UCL news](https://www.ucl.ac.uk/news/2023/aug/humans-unable-detect-over-quarter-deepfake-speech-samples) |

**Do not use** these deck numbers. They could not be verified:
- "10x rise, ₹22.9 bn (2022) → ₹228.46 bn (2024)": no source was found for the 2022 figure.
- "50/50 – humans spot deepfakes at chance level": the study above says 73%, not 50%.
- "0 people get warnings today": not a measured fact. A qualitative line like "Today, nothing warns you while the call is still going on" is fine as copy, not as a stat card.

### 13.2 "Under the hood" text (owner-approved wording)
> VaaniX records a 10-second clip of the call and checks it two ways: the Nes2Net-X model tells whether the voice is real or AI-generated, and the transcript shows who the caller claims to be and picks up any scam words.
> Both results are combined into one risk score from 0 to 100, and a high score instantly triggers the alerts.

### 13.3 Model performance statement
- The owner reports **95% accuracy** in their own testing. **The dataset and test conditions are not yet known.**
- Until the owner gives them, display it exactly as: "**95% accuracy in our internal tests** (test set details coming soon)". Put this in `OPEN_QUESTIONS.md`.
- Do not call it a benchmark result, and do not compare it to other products.
- Processing time: "about 10 seconds per check on our demo machine".

### 13.4 Tech stack line
"Python · PyTorch · Flask · faster-whisper · Next.js · Supabase · Telegram Bot API". Use only things that are actually used in the code.

---

## 14. Quality and testing (QA plan)

**Unit (Vitest):**
- scoring
- radar levels and thresholds
- Gmail link builder (URL-encodes the body, stays under 2,000 characters, otherwise trims the transcript excerpt)
- phone normalisation
- API key hash/verify
- Telegram message builder

**Python (pytest):**
- claim extraction (≥ 20 sentences)
- scam words
- `/analyze` contract with the stub model
- secret header rejection

**Integration:**
- `/api/checks` with a mocked model server returning (a) AI, (b) real, (c) offline, (d) stub
- assert DB rows, alerts, `alert_messages`, radar rows and evidence upload only for AI
- RLS: user A can't read user B's data

**E2E (Playwright, model server mocked):**
1. sign up
2. add a family member
3. upload a sample WAV
4. see the AI result with transcript
5. alert page shows the statuses
6. click Report to Cyber Crime → Gmail URL opens with a prefilled body
7. mark genuine → radar count drops
8. `/radar` lookup
9. `/try` doesn't save anything

Also test the mic flow with Playwright's fake media stream flag.

**Manual real run (on the laptop, before the demo):** 3 real-voice clips + 3 AI-voice clips through `/app/check` with the real model. Record the actual outputs in `docs/TEST_RUNS.md`. Never edit the numbers.

**Accessibility:**
- WCAG 2.1 AA: contrast (Section 5.1), keyboard navigation, visible focus ring (teal-dark 2px)
- form labels, `aria-live` for countdown and result
- respect reduced motion
- axe checks in Playwright

**Responsive:** test at 360, 390, 768, 1024, 1280, 1440 px. The flow diagrams wrap vertically on mobile (arrows rotate down).

**Performance:**
- Lighthouse ≥ 90 on Home (mobile)
- LCP < 2.5 s
- no images heavier than 150 KB; mock-ups are HTML/SVG, not screenshots

**Security:**
- the secret scan (`gitleaks`) passes
- no secrets in client bundles
- the service role key is used only in server files
- rate limits work
- the webhook secret is checked
- signed redirect links expire

---

## 15. Security, privacy and environment

- **Audio retention:**
  - Non-flagged clips are never stored (analysed in memory, then dropped).
  - Flagged (`AI_CLONE`) clips are stored for **30 days** (`EVIDENCE_RETENTION_DAYS`). A daily cleanup deletes older ones (Supabase cron or Vercel cron).
- **Transcripts** are stored only for the logged-in user's own checks and can be deleted with "Delete my data".
- **Consent:** the check page needs a tick: "I have permission to record this call." Show the recording laws reminder in plain words.
- **Scam Radar** never shows who reported a number.
- **Model server:** only reachable with `X-Model-Secret`. Flask binds to 127.0.0.1, and the tunnel is the only way in.

**`.env.example`:**
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MODEL_SERVER_URL=            # Cloudflare tunnel URL to the laptop
MODEL_SERVER_SECRET=
TELEGRAM_BOT_TOKEN=          # new token after revoking the leaked one
TELEGRAM_BOT_USERNAME=Prevent_Scambot
TELEGRAM_WEBHOOK_SECRET=
LINK_SIGNING_SECRET=         # for /r/* links
EVIDENCE_RETENTION_DAYS=30
RADAR_THRESHOLD=3
AI_RISK_THRESHOLD=60
# laptop side (voice_detection_pipeline/.env)
MODEL_SERVER_SECRET=
WHISPER_MODEL=small
VOICE_DETECTION_STUB=0
VAANIX_API_URL=
VAANIX_API_KEY=
```

---

## 16. Build phases (do them in order; each ends with checks)

**Phase 0: Clean up and secure**
- Rotate and remove the Telegram token and chat id. Purge them from history (owner approval needed for the force-push).
- Delete everything in 12.1. Get the app compiling with an empty Home.
- ✅ Check: `npm run build` and `npm run lint` pass; `gitleaks detect` is clean; no `mock-` imports remain.

**Phase 1: Design system**
- Tokens, Carlito font, Radix restyle, wordmark, all components in 5.4 (static), a `/styleguide` page (dev only).
- ✅ Check: the styleguide matches deck screenshots side by side; contrast checks pass.

**Phase 2: Public site**
- Home (8 sections), How it works, Privacy, Developers (static docs). Verified stats with links.
- ✅ Check: responsive at all widths; Lighthouse ≥ 90; no team info; every number has a source.

**Phase 3: Supabase + auth**
- Migrations, RLS, seeds (states with null emails, one demo bank), login (magic link + Google), the `/app` gate, profile and settings.
- ✅ Check: RLS tests pass; logout/login works; a new user gets a profile row.

**Phase 4: Model server + real check**
- `/analyze` with faster-whisper + text analysis, Python tests, `model-client.ts`, scoring, `/app/check` (mic + upload), `/try`, history, offline and stub states.
- ✅ Check: a real AI clip and a real human clip produce real, different results on the laptop; offline shows OfflineState; stub shows DemoModeBadge; no `Math.random` anywhere in `src/`.

**Phase 5: Family + Telegram + alerts**
- Family CRUD + invite links, webhook, linking, alert messages, callbacks, alert detail page, statuses.
- ✅ Check: with two real Telegram accounts, an AI check sends both messages; "No, it's a scam" updates the website within 5 s.

**Phase 6: Reporting + Scam Radar + API**
- Gmail compose links, `/r/*` pages, complaints log, radar lookup + page, API keys + `/api/v1/*`, the laptop pipeline posting to the API.
- ✅ Check: complaint emails open prefilled; radar reaches `potential_scam` after 3 distinct test users; an API key can call `/api/v1/analyze` and is rejected after revoke.

**Phase 7: QA, polish, deploy**
- Full test suite, accessibility pass, README and `docs/DEMO.md`, deploy to Vercel, set the webhook, run the manual real test and write `docs/TEST_RUNS.md`.
- ✅ Check: Section 18 definition of done.

---

## 17. Demo flow (website)
1. On the laptop: start `run_server.sh` and the tunnel. Update `MODEL_SERVER_URL` if the URL changed. Open `/api/health` → `model: ok`.
2. Show Home briefly (problem → how it works).
3. Log in → Family shows "Rahul (Son)" joined on Telegram.
4. `/app/check` → play the AI-cloned clip on speaker → 5 s wait → 10 s record → about 10 s analysis → red result with voice score, transcript score, transcript, "Claims to be Rahul (Son)".
5. The user's phone shows the Telegram alert; Rahul's phone gets "Is it you?" → tap "No, it's a scam" → the website updates to "Confirmed scam".
6. Tap "Report to Cyber Crime" → Gmail opens with the prefilled complaint (portal link if no verified state email).
7. `/radar` → look up the number → shows the reports.
8. `/developers` → show the same check through `POST /api/v1/analyze`.

---

## 18. Definition of done
- [ ] No telecom dashboard code, mock data, Gmail fraud table or fake detection left in the repo.
- [ ] No secrets in code or git history; the token is rotated.
- [ ] Every number on the site is from Section 13 (with a link) or real data.
- [ ] Every verdict comes from the real model, or is labelled Demo mode.
- [ ] The UI matches the deck: light theme, navy/teal, same components; no people images; no team info.
- [ ] All pages are responsive (360–1440 px) and pass WCAG AA contrast and keyboard checks.
- [ ] Unit, Python, integration and E2E tests pass in CI (GitHub Actions: lint, typecheck, vitest, pytest with stub, playwright).
- [ ] README, `.env.example`, `docs/DEMO.md` and `OPEN_QUESTIONS.md` are up to date.

---

## 19. Open questions (start `OPEN_QUESTIONS.md` with these)
1. **Model accuracy:** which dataset and how many clips gave 95%? (Until answered, show the wording in 13.3.)
2. **State cyber cell emails:** to be filled by the owner from official websites, with source links. Until then the site uses cybercrime.gov.in + 1930.
3. **Domain / tunnel:** is there a domain for a named Cloudflare tunnel? If not, use a quick tunnel and update `MODEL_SERVER_URL` before each demo.
4. **Scam Radar threshold:** 3 distinct users in 24 h is the default; the owner hasn't confirmed it. Keep it configurable.
5. **Score weights** (70/30, word weights, thresholds 60/40) are starting values. Tune them after the Phase 7 real test runs and record the reason for any change.
