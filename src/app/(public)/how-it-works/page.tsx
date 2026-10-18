import Link from "next/link";
import {
  Cpu,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Pill } from "@/components/marketing/pill";
import { Timeline } from "@/components/marketing/timeline";
import { CtaBand } from "@/components/marketing/cta-band";
import { Button } from "@/components/ui/button";

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col w-full text-left">
      {/* Hero */}
      <section className="bg-surface py-16 sm:py-24 border-b border-border/60">
        <div className="container-vaanix max-w-4xl space-y-6">
          <Pill>UNDER THE HOOD</Pill>
          <h1 className="h1-hero text-navy">
            How VaaniX Detects AI Voice Clones in 10 Seconds
          </h1>
          <p className="body-large text-gray leading-relaxed">
            VaaniX runs a dual-engine architecture combining deep acoustic feature verification
            with semantic scam transcript analysis. All calculations are completely transparent — no black boxes.
          </p>

          <div className="p-4 rounded-xl bg-light border border-border inline-block text-xs font-mono text-navy">
            Tech Stack: Python · PyTorch · Flask · faster-whisper · Next.js · Supabase · Telegram Bot API
          </div>
        </div>
      </section>

      {/* Section 1: The 10-Second Listening Window */}
      <section className="section-padding bg-light border-b border-border/60">
        <div className="container-vaanix max-w-4xl space-y-8">
          <div className="space-y-3">
            <h2 className="h2-title text-navy">1. The 10-Second Listening Window</h2>
            <p className="body-large text-gray">
              Listening to full phone calls is intrusive, unnecessary, and raises severe privacy concerns.
              VaaniX activates strictly during seconds 5 to 15 of a connected call.
            </p>
          </div>

          <Timeline />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-2">
              <span className="text-xs font-mono font-bold text-gray uppercase">Seconds 0 – 5</span>
              <h3 className="text-lg font-bold text-navy">Ringing & Greetings</h3>
              <p className="text-sm text-gray leading-relaxed">
                Initial phone connection, ringback tones, and routine hellos are intentionally skipped to avoid false alarms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-teal-tint border-2 border-teal space-y-2">
              <span className="text-xs font-mono font-bold text-teal-dark uppercase">Seconds 5 – 15</span>
              <h3 className="text-lg font-bold text-teal-dark">10-Second Capture</h3>
              <p className="text-sm text-navy leading-relaxed font-medium">
                Captures a single 10-second monophonic 16kHz audio sample — the exact duration where callers state their identity and intent.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-2">
              <span className="text-xs font-mono font-bold text-gray uppercase">Seconds 15+</span>
              <h3 className="text-lg font-bold text-navy">Immediate Evaluation</h3>
              <p className="text-sm text-gray leading-relaxed">
                Recording immediately ceases. Audio is streamed into parallel acoustic and speech-to-text pipelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Dual-Engine Verification */}
      <section className="section-padding bg-surface border-b border-border/60">
        <div className="container-vaanix max-w-4xl space-y-12">
          <div className="space-y-3">
            <h2 className="h2-title text-navy">2. The Dual-Engine Pipeline</h2>
            <p className="body-large text-gray">
              A scam cannot be judged by acoustic timbre alone, nor by vocabulary alone.
              Both pipelines run concurrently to prevent false positives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Engine A: Nes2Net-X Voice Biometrics */}
            <div className="p-8 rounded-2xl bg-light border-2 border-teal/30 space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-teal-tint text-teal-dark">
                <Cpu className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-navy">
                Engine A: Acoustic Deepfake Model (Nes2Net-X)
              </h3>
              <p className="text-sm text-gray leading-relaxed">
                Nes2Net-X evaluates subtle vocal artifacts that humans cannot perceive: spectral anomalies,
                glottal pulse discontinuities, and vocoder phase jitter typical of voice cloning software.
              </p>

              <div className="space-y-2 pt-2 border-t border-border/70 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-gray">Architecture</span>
                  <span className="font-mono font-bold text-navy">wav2vec 2.0 / XLSR-53 + Nes2Net-X</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray">Parameter Count</span>
                  <span className="font-mono font-bold text-navy">~511K back-end weights</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray">Weight in Score</span>
                  <span className="font-mono font-bold text-teal-dark">70% of final risk score</span>
                </div>
              </div>
            </div>

            {/* Engine B: faster-whisper Transcript Analysis */}
            <div className="p-8 rounded-2xl bg-light border-2 border-border space-y-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-surface border border-border text-navy">
                <FileText className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-navy">
                Engine B: Transcript & Intent Extractor
              </h3>
              <p className="text-sm text-gray leading-relaxed">
                Using faster-whisper on CPU with VAD (Voice Activity Detection), speech is transcribed and normalized
                across Hindi script, Hinglish, and English to detect scam keywords and impersonation claims.
              </p>

              <div className="space-y-2 pt-2 border-t border-border/70 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-gray">Transcription</span>
                  <span className="font-mono font-bold text-navy">faster-whisper (auto-language)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray">Claim Matching</span>
                  <span className="font-mono font-bold text-navy">Levenshtein fuzzy matching (≤ 1)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray">Weight in Score</span>
                  <span className="font-mono font-bold text-teal-dark">30% of final risk score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: The Combined Score Formula */}
      <section className="section-padding bg-light border-b border-border/60">
        <div className="container-vaanix max-w-4xl space-y-8">
          <div className="space-y-3">
            <h2 className="h2-title text-navy">3. The Transparent Score Formula</h2>
            <p className="body-large text-gray">
              Every verdict on VaaniX comes from an explicit mathematical formula, never an opaque proprietary black box.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface border border-border space-y-6">
            <div className="p-4 rounded-xl bg-teal-tint border border-teal/30 font-mono text-base sm:text-lg font-bold text-teal-dark text-center">
              risk_score = round(0.70 × voice_score + 0.30 × text_score)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-navy">
              <div className="space-y-2">
                <h4 className="font-bold text-base text-navy">Verdict Decision Rules:</h4>
                <ul className="space-y-2 text-gray">
                  <li className="flex items-start gap-2">
                    <span className="text-red font-bold font-mono">AI_CLONE:</span>
                    <span>
                      Triggered when <code className="font-mono text-navy font-bold">risk_score ≥ 60</code>{" "}
                      <strong>AND</strong> <code className="font-mono text-navy font-bold">voice_score ≥ 50</code>.
                      (The voice model must agree; scam words alone cannot trigger a deepfake alert).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green font-bold font-mono">REAL:</span>
                    <span>
                      Triggered when <code className="font-mono text-navy font-bold">risk_score &lt; 40</code>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#8A5000] font-bold font-mono">INCONCLUSIVE:</span>
                    <span>
                      Scores between 40 and 59. Displays a caution badge; does not fire automated emergency Telegram messages.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-base text-navy">Scam Keyword Weights:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-light">OTP / PIN: +30</div>
                  <div className="p-2 rounded-lg bg-light">Remote App: +30</div>
                  <div className="p-2 rounded-lg bg-light">Money / UPI: +25</div>
                  <div className="p-2 rounded-lg bg-light">Secrecy: +20</div>
                  <div className="p-2 rounded-lg bg-light">Authority: +20</div>
                  <div className="p-2 rounded-lg bg-light">Claimed Identity: +15</div>
                </div>
                <p className="text-xs text-gray pt-1">
                  Matched group weights are summed once and capped at 100. If no speech is heard, text score is 0.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Accuracy & Benchmarks */}
      <section className="section-padding bg-surface border-b border-border/60">
        <div className="container-vaanix max-w-4xl space-y-6">
          <h2 className="h2-title text-navy">4. Model Accuracy & Benchmark Integrity</h2>
          <div className="p-6 rounded-2xl bg-teal-tint/40 border border-teal/20 space-y-3">
            <h3 className="text-lg font-bold text-teal-dark">
              95% accuracy in our internal tests (test set details coming soon)
            </h3>
            <p className="text-sm text-navy leading-relaxed">
              We uphold strict academic integrity. While our internal evaluations with synthetic voice clones
              demonstrated a 95% detection accuracy, independent third-party evaluation datasets and comprehensive
              ROC curves will be published openly upon peer review. Processing duration averages ~10 seconds per check.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Privacy Guarantees */}
      <section className="section-padding bg-light">
        <div className="container-vaanix max-w-4xl space-y-8">
          <div className="space-y-3">
            <h2 className="h2-title text-navy">5. Privacy & Zero-Retention Architecture</h2>
            <p className="body-large text-gray">
              We built VaaniX with the fundamental belief that privacy and fraud security must coexist.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-2">
              <CheckCircle2 className="size-6 text-green" />
              <h4 className="font-bold text-base text-navy">No Audio Stored on Clean Calls</h4>
              <p className="text-xs sm:text-sm text-gray leading-relaxed">
                If the call is verified as natural or inconclusive, the audio buffer is wiped from memory instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-2">
              <Lock className="size-6 text-teal-dark" />
              <h4 className="font-bold text-base text-navy">SHA-256 Forensic Evidence</h4>
              <p className="text-xs sm:text-sm text-gray leading-relaxed">
                Only calls flagged as AI_CLONE are securely retained (30 days maximum) with an immutable cryptographic digest for police complaints.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border space-y-2">
              <ShieldCheck className="size-6 text-navy" />
              <h4 className="font-bold text-base text-navy">No Radar Tracking</h4>
              <p className="text-xs sm:text-sm text-gray leading-relaxed">
                Scam Radar stores aggregated caller phone reputation only. No victim or reporter identity is ever stored or displayed.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Button asChild size="lg" className="font-bold">
              <Link href="/try">
                Try a Demo Check
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
            <Link href="/privacy" className="text-sm font-semibold text-teal-dark hover:underline">
              Read our full Privacy Policy →
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
