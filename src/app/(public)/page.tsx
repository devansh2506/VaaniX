import Link from "next/link";
import {
  PhoneCall,
  AlertTriangle,
  Landmark,
  ShieldAlert,
  Users,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Pill } from "@/components/marketing/pill";
import { StatCard } from "@/components/marketing/stat-card";
import { FlowBox } from "@/components/marketing/flow-box";
import { FlowArrow } from "@/components/marketing/flow-arrow";
import { DecisionDiamond } from "@/components/marketing/decision-diamond";
import { Timeline } from "@/components/marketing/timeline";
import { PhoneMock } from "@/components/marketing/phone-mock";
import { TelegramBubble } from "@/components/marketing/telegram-bubble";
import { AudienceCard } from "@/components/marketing/audience-card";
import { CtaBand } from "@/components/marketing/cta-band";
import { ApiRow } from "@/components/marketing/api-row";
import { FamilyDiagram } from "@/components/family/family-diagram";
import { TranscriptPanel } from "@/components/check/transcript-panel";
import { ActionRow } from "@/components/check/action-row";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* ================================================================= */}
      {/* SECTION 1: HERO (Slide 1)                                        */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden bg-surface py-16 sm:py-24 border-b border-border/60">
        <div className="container-vaanix grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            <Pill>AI IN CYBERSECURITY</Pill>

            <h1 className="h1-hero text-navy tracking-tight">
              Vaani<span className="text-teal-dark">X</span>
            </h1>

            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-navy">
              Catch AI voice-clone scams{" "}
              <span className="text-teal-dark underline decoration-teal/40 decoration-wavy">
                during the call
              </span>{" "}
              — before the money moves.
            </p>

            <p className="body-large text-gray max-w-xl leading-relaxed">
              Generative AI can replicate any family member’s voice from just 3 seconds of audio.
              VaaniX listens to seconds 5 to 15 of suspicious calls, verifies biometric vocal authenticity using
              deep acoustic models, and halts fraudulent transfers in real time.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg" className="font-bold shadow-sm">
                <Link href="/try">
                  <ShieldCheck className="size-5 mr-1" />
                  Try a check
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold">
                <Link href="/how-it-works">
                  How it works
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-gray">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-green" />
                10-Second Acoustic Analysis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-green" />
                Transparent Dual Scoring
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-green" />
                Zero Call Audio Stored
              </span>
            </div>
          </div>

          {/* Right Column: Phone Mockup with in-call red overlay */}
          <div className="lg:col-span-5 flex justify-center">
            <PhoneMock caption="Live call interception overlay (Slide 1 & 4)">
              <div className="flex-1 flex flex-col justify-between py-2 text-left">
                {/* Simulated In-Call Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-light flex items-center justify-center text-gray shrink-0">
                      <PhoneCall className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-navy">+91 98765 43210</h4>
                      <span className="text-xs text-gray font-medium">Unknown Caller · 00:14</span>
                    </div>
                  </div>
                  <Badge variant="critical">Analyzing</Badge>
                </div>

                {/* Red In-Call Threat Card */}
                <div className="my-auto py-4">
                  <div className="p-4 rounded-2xl bg-red-tint border-2 border-red text-center space-y-2 shadow-xs">
                    <div className="size-10 rounded-full bg-red text-white flex items-center justify-center mx-auto">
                      <AlertTriangle className="size-6" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-red leading-tight">
                      AI VOICE DETECTED
                    </h3>
                    <p className="text-xs text-red-text font-medium leading-normal">
                      Acoustic biometric anomaly detected. High synthetic clone probability.
                    </p>
                    <div className="flex items-baseline justify-center gap-1 pt-1">
                      <span className="text-3xl font-bold tabular text-red">87</span>
                      <span className="text-xs font-semibold text-red-text">/ 100 Risk</span>
                    </div>
                    <div className="text-[11px] font-semibold text-navy bg-surface/80 py-1 px-2 rounded-md">
                      Claims: <span className="text-teal-dark font-bold">Rahul (Son)</span>
                    </div>
                  </div>
                </div>

                {/* Call Controls */}
                <div className="space-y-2">
                  <Button variant="danger" className="w-full font-bold">
                    Hang Up & Verify with Rahul
                  </Button>
                  <p className="text-[11px] text-faint text-center">
                    Instant Telegram alert sent to your registered account
                  </p>
                </div>
              </div>
            </PhoneMock>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 2: THE PROBLEM (Slide 2 — Verified Facts Only)             */}
      {/* ================================================================= */}
      <section className="section-padding bg-light border-b border-border/60">
        <div className="container-vaanix space-y-12">
          <div className="max-w-3xl space-y-3 text-left">
            <Pill>THE REALITY</Pill>
            <h2 className="h2-title text-navy">The AI Voice-Clone Threat in India</h2>
            <p className="body-large text-gray">
              Criminal syndicates weaponize generative voice cloning to impersonate sons, daughters, and officials.
              Traditional spam call filters fail completely because the voice sounds authentic to the parent.
            </p>
          </div>

          {/* StatCards Grid: Strictly verified sources from Section 13 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              value="47%"
              label="of Indian adults have faced, or know someone hit by, an AI voice scam (global average: 25%)"
              source="McAfee 'Artificial Impostor' Study, 7,054 participants"
              sourceUrl="https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams"
              variant="teal"
            />
            <StatCard
              value="83%"
              label="of Indian victims lost money; 48% of them lost over ₹50,000 to fraud"
              source="McAfee Survey / Digital Terminal Report"
              sourceUrl="https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams"
              variant="danger"
            />
            <StatCard
              value="3 sec"
              label="of audio was enough for an 85% voice match in security evaluations"
              source="McAfee Research & Testing"
              sourceUrl="https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams"
              variant="teal"
            />
            <StatCard
              value="3×"
              label="Indians lost ₹22,845 crore to cyber fraud in 2024, up from ₹7,465 crore in 2023"
              source="Government reply in Lok Sabha, 22 Jul 2025"
              sourceUrl="https://scroll.in/latest/1084796/indians-lost-rs-22845-crore-to-cyber-fraud-in-2024-a-206-rise-from-previous-year-centre"
              variant="danger"
            />
            <StatCard
              value="27%"
              label="of deepfake speech samples were missed by people in a 529-person study, even after training"
              source="UCL, PLOS ONE Study, Aug 2023"
              sourceUrl="https://www.ucl.ac.uk/news/2023/aug/humans-unable-detect-over-quarter-deepfake-speech-samples"
              variant="teal"
            />
          </div>

          {/* 4-Step Vertical Scam Flow from Slide 2 */}
          <div className="mt-12 p-8 rounded-2xl bg-surface border border-border">
            <h3 className="h3-subtitle text-navy mb-6">How the Voice-Clone Scam Plays Out</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-light border border-border/70 space-y-2 text-left">
                <span className="text-xs font-mono font-bold text-teal-dark uppercase">Step 01</span>
                <h4 className="font-bold text-navy text-base">Voice Harvesting</h4>
                <p className="text-xs sm:text-sm text-gray leading-relaxed">
                  Scammers capture 3 seconds of voice from social media videos or a 2-second blank robocall.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-light border border-border/70 space-y-2 text-left">
                <span className="text-xs font-mono font-bold text-teal-dark uppercase">Step 02</span>
                <h4 className="font-bold text-navy text-base">Neural Cloning</h4>
                <p className="text-xs sm:text-sm text-gray leading-relaxed">
                  Deep generative AI clones the family member’s pitch, tone, vocal cadence, and accent in seconds.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-red-tint/60 border border-red/30 space-y-2 text-left">
                <span className="text-xs font-mono font-bold text-red-text uppercase">Step 03</span>
                <h4 className="font-bold text-navy text-base">The Distress Call</h4>
                <p className="text-xs sm:text-sm text-red-text font-medium leading-relaxed">
                  &ldquo;Mummy, accident ho gaya, police station mein hoon, jaldi paise bhejo!&rdquo;
                </p>
              </div>

              <div className="p-5 rounded-xl bg-light border border-border/70 space-y-2 text-left">
                <span className="text-xs font-mono font-bold text-teal-dark uppercase">Step 04</span>
                <h4 className="font-bold text-navy text-base">Panic & Payment</h4>
                <p className="text-xs sm:text-sm text-gray leading-relaxed">
                  The terrified parent sends funds via UPI before hanging up or verifying with family.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 3: HOW IT WORKS (Slide 3)                                */}
      {/* ================================================================= */}
      <section className="section-padding bg-surface border-b border-border/60">
        <div className="container-vaanix space-y-12">
          <div className="max-w-3xl space-y-3 text-left">
            <Pill>HOW IT WORKS</Pill>
            <h2 className="h2-title text-navy">10 Seconds to Absolute Certainty</h2>
            <p className="body-large text-gray">
              VaaniX does not tap or record entire phone calls. It monitors a single 10-second window
              (seconds 5 to 15), processes acoustics and transcript in parallel, and scores risk transparently.
            </p>
          </div>

          {/* Timeline Bar */}
          <Timeline />

          {/* Horizontal Flow Pipeline */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-2 p-6 sm:p-8 rounded-2xl bg-light border border-border overflow-x-auto">
            <FlowBox title="Call Connects" subtitle="0s · Ringing connects" variant="gray" />
            <FlowArrow />
            <FlowBox title="Skip Greetings" subtitle="0s–5s · Ignore intro" variant="gray" />
            <FlowArrow />
            <FlowBox title="10s Recording" subtitle="5s–15s · Mono 16kHz" variant="teal" />
            <FlowArrow />
            <div className="flex flex-col gap-2">
              <div className="p-2.5 rounded-lg bg-teal-tint border border-teal text-xs font-bold text-teal-dark text-center">
                Nes2Net-X Voice Biometrics (70%)
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border text-xs font-bold text-navy text-center">
                faster-whisper Transcript (30%)
              </div>
            </div>
            <FlowArrow />
            <DecisionDiamond label="AI Voice?" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red font-mono uppercase">YES →</span>
                <FlowBox title="AI Detected" subtitle="Risk ≥ 60 & Voice ≥ 50" variant="red" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green font-mono uppercase">NO →</span>
                <FlowBox title="Real Voice" subtitle="Risk < 40" variant="green" />
              </div>
            </div>
          </div>

          {/* Under The Hood Text (Approved Wording Section 13.2) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-teal-tint/40 border border-teal/20 text-left space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-teal-dark">
              Under The Hood (Biometric & Semantic Dual Verification)
            </h4>
            <p className="body-large text-navy leading-relaxed">
              VaaniX records a 10-second clip of the call and checks it two ways: the Nes2Net-X model tells whether
              the voice is real or AI-generated, and the transcript shows who the caller claims to be and picks up any scam words.
              Both results are combined into one risk score from 0 to 100, and a high score instantly triggers the alerts.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 4: INSTANT ALERTS (Slide 4)                              */}
      {/* ================================================================= */}
      <section className="section-padding bg-light border-b border-border/60">
        <div className="container-vaanix space-y-12">
          <div className="max-w-3xl space-y-3 text-left">
            <Pill>DEFENSE MECHANISM</Pill>
            <h2 className="h2-title text-navy">Three Instant Lines of Defense</h2>
            <p className="body-large text-gray">
              When a voice clone is identified, alerts fire simultaneously across the screen, your Telegram,
              and to the real family member being impersonated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start justify-items-center">
            {/* Alert 1: On-Screen Warning */}
            <div className="flex flex-col items-center space-y-3 text-center">
              <PhoneMock caption="1. In-Call Overlay Screen">
                <div className="flex-1 flex flex-col justify-between py-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="text-xs font-bold text-navy">Live Call Protected</span>
                    <Badge variant="critical">Threat Level High</Badge>
                  </div>
                  <div className="my-auto p-4 rounded-xl bg-red-tint border-2 border-red text-center space-y-2">
                    <AlertTriangle className="size-8 text-red mx-auto" />
                    <h4 className="text-base font-bold text-red">AI VOICE DETECTED</h4>
                    <p className="text-xs text-red-text">Do NOT transfer money or share OTPs.</p>
                    <div className="text-2xl font-bold text-red tabular">87 / 100</div>
                  </div>
                  <Button variant="danger" className="w-full text-xs font-bold">
                    Disconnect Call
                  </Button>
                </div>
              </PhoneMock>
              <h4 className="font-bold text-base text-navy">On-Screen Intervention</h4>
              <p className="text-xs text-gray max-w-xs">
                Direct floating overlay informs the victim of synthetic speech during the active call.
              </p>
            </div>

            {/* Alert 2: Telegram to User */}
            <div className="flex flex-col items-center space-y-3 text-center">
              <TelegramBubble
                title="⚠️ AI-cloned voice detected"
                callMeta="Call from +91 98765 43210 · 10:42 AM"
                riskScore={87}
                claimedIdentity="Rahul (Son)"
                bodyText="Said: 'accident, jaldi paise, upi'"
                advice="Do NOT approve UPI payments. Verify independently."
                buttons={[
                  { text: "🚨 Report Cyber Crime", variant: "red" },
                  { text: "🏦 Report to Bank", variant: "navy" },
                  { text: "📞 Call Helpline 1930", variant: "teal" },
                  { text: "✅ This is genuine", variant: "green" },
                ]}
              />
              <h4 className="font-bold text-base text-navy">Telegram Alert to You</h4>
              <p className="text-xs text-gray max-w-xs">
                Instant notification with pre-drafted reporting links and 1-tap helpline access.
              </p>
            </div>

            {/* Alert 3: Telegram to Impersonated Member */}
            <div className="flex flex-col items-center space-y-3 text-center">
              <TelegramBubble
                title="🛡️ Family Impersonation Check"
                callMeta="Urgent Verification · 10:42 AM"
                bodyText="Someone is using YOUR VOICE to call your mother right now. Are you on a call with her?"
                advice="If this is not you, tap 'No, it's a scam' immediately to warn her."
                buttons={[
                  { text: "🚨 No, it's a scam!", variant: "red" },
                  { text: "✅ Yes, that's me", variant: "green" },
                ]}
              />
              <h4 className="font-bold text-base text-navy">Impersonation Shield</h4>
              <p className="text-xs text-gray max-w-xs">
                The real family member receives a prompt: &ldquo;Is it you?&rdquo; Tapping &ldquo;No&rdquo; immediately confirms the scam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 5: FAMILY GROUP + TRANSCRIPT (Slide 5)                   */}
      {/* ================================================================= */}
      <section className="section-padding bg-surface border-b border-border/60">
        <div className="container-vaanix space-y-12">
          <div className="max-w-3xl space-y-3 text-left">
            <Pill>FAMILY PROTECTION</Pill>
            <h2 className="h2-title text-navy">Family Circle & Live Transcript Inspection</h2>
            <p className="body-large text-gray">
              Add your children, spouse, and parents. When a caller claims to be your son,
              VaaniX cross-references your family relationships and verifies the claim in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Family Diagram */}
            <div className="lg:col-span-6 rounded-2xl border border-border bg-light p-6">
              <h3 className="h3-subtitle text-navy mb-2 text-left">Protected Family Circle</h3>
              <p className="text-sm text-gray text-left mb-4">
                Each member joins via a simple Telegram invite link (<code className="text-xs font-mono">t.me/Prevent_Scambot</code>).
              </p>
              <FamilyDiagram />
            </div>

            {/* Right: Transcript Panel */}
            <div className="lg:col-span-6 space-y-4">
              <TranscriptPanel
                language="hi"
                claimLabel="Rahul (Son)"
                scamWords={["accident", "paise", "jaldi", "upi", "police"]}
                segments={[
                  { start: 5.1, end: 7.6, text: "Mummy, mera car accident ho gaya hai." },
                  { start: 8.0, end: 11.2, text: "Police khadi hai, jaldi se 25,000 paise upi bhejo." },
                  { start: 11.8, end: 14.6, text: "Papa ko mat batana abhi, emergency hai." },
                ]}
              />

              <div className="p-4 rounded-xl bg-light border border-border text-left space-y-1">
                <span className="text-xs font-bold text-teal-dark uppercase tracking-wider">
                  How Claim Extraction Works
                </span>
                <p className="text-xs sm:text-sm text-gray leading-relaxed">
                  Natural language extraction detects family terminology (&ldquo;Mummy&rdquo; → caller claims to be child; &ldquo;Beta&rdquo; → claims to be parent)
                  and fuzzy matches names against your registered group members with Levenshtein distance ≤ 1.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 6: SCAM RADAR + PAYMENT GUARD (Slide 6)                  */}
      {/* ================================================================= */}
      <section className="section-padding bg-light border-b border-border/60">
        <div className="container-vaanix space-y-12">
          <div className="max-w-3xl space-y-3 text-left">
            <Pill>DEFENSE ECOSYSTEM</Pill>
            <h2 className="h2-title text-navy">Scam Radar & Payment Guard</h2>
            <p className="body-large text-gray">
              Collective protection across callers before pickup, and automated financial friction after the call.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Radar Card */}
            <div className="flex flex-col justify-between p-8 rounded-2xl bg-surface border border-border text-left space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="h3-subtitle text-navy">Scam Radar Community Lookup</h3>
                  <Badge variant="teal">Fast (&lt; 300ms)</Badge>
                </div>
                <p className="body-large text-gray leading-relaxed">
                  While the phone is ringing, the caller’s number is queried against the decentralized Scam Radar index.
                  If 3 or more users flagged the number in 24 hours, a warning pop-up alerts you before answering.
                </p>

                <div className="p-4 rounded-xl bg-light border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-navy">+91 98765 43210</span>
                    <span className="text-red-text font-bold">POTENTIAL SCAM (4 reports)</span>
                  </div>
                  <p className="text-xs text-gray">
                    Most reported scam category: <strong className="text-navy">Fake Police / Arrest Impersonation</strong>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button asChild variant="outline" className="font-bold">
                  <Link href="/radar">Explore Scam Radar →</Link>
                </Button>
                <p className="text-xs text-faint mt-2 italic">
                  Note: Numbers can be spoofed. VaaniX warns, it never blocks. No reporter identities are ever exposed.
                </p>
              </div>
            </div>

            {/* Payment Guard Card (Clearly Marked Android App) */}
            <div className="flex flex-col justify-between p-8 rounded-2xl bg-surface border border-border text-left space-y-6 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="h3-subtitle text-navy">Payment Guard Intercept</h3>
                  <Badge variant="default" className="bg-navy text-white">Coming in Android App</Badge>
                </div>
                <p className="body-large text-gray leading-relaxed">
                  For 30 minutes following an AI-flagged call, opening any UPI or banking application
                  (Google Pay, PhonePe, Paytm, BHIM, YONO) initiates a mandatory 60-second cooldown screen.
                </p>

                <div className="p-4 rounded-xl bg-red-tint/70 border border-red/30 space-y-2">
                  <div className="flex items-center gap-2 text-red font-bold text-sm">
                    <Clock className="size-4" />
                    <span>60-Second UPI Cooldown Active</span>
                  </div>
                  <p className="text-xs text-red-text">
                    &ldquo;You just finished an AI voice-flagged call. Pause and call your family member on a trusted number before transferring funds.&rdquo;
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-medium text-gray">
                  <Lock className="size-4 text-teal-dark" />
                  <span>Android accessibility & usage stats guard (SDK planned)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 7: ONE-TAP REPORTING & API (Slide 7)                      */}
      {/* ================================================================= */}
      <section className="section-padding bg-surface border-b border-border/60">
        <div className="container-vaanix space-y-12">
          <div className="max-w-3xl space-y-3 text-left">
            <Pill>ACTION & INTEGRATIONS</Pill>
            <h2 className="h2-title text-navy">One-Tap Reporting & Developer API</h2>
            <p className="body-large text-gray">
              Streamline reporting to law enforcement and financial institutions, or embed deepfake audio detection
              directly into fintech mobile applications.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Reporting Actions */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="h3-subtitle text-navy text-left">Official Escalation Channels</h3>
              <ActionRow
                icon={ShieldAlert}
                label="Report Cyber Crime"
                explanation="Pre-fills official complaint email with cryptographic audio SHA-256 hash"
                buttonVariant="danger"
              />
              <ActionRow
                icon={Landmark}
                label="Report to Bank"
                explanation="Drafts emergency transaction freeze notice to your registered bank fraud desk"
                buttonVariant="navy"
              />
              <ActionRow
                icon={PhoneCall}
                label="Helpline 1930"
                explanation="One-tap dialer for the National Cyber Crime Helpline (stops financial flight)"
                buttonVariant="default"
              />
              <ActionRow
                icon={CheckCircle2}
                label="This is Genuine"
                explanation="Provides user feedback to refine scoring and exclude numbers from radar"
                buttonVariant="secondary"
              />
            </div>

            {/* Right: API Rows */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between text-left">
                <h3 className="h3-subtitle text-navy">Developer REST API</h3>
                <Link href="/developers" className="text-xs font-bold text-teal-dark hover:underline flex items-center gap-1">
                  Read API Docs <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-3">
                <ApiRow
                  method="POST"
                  path="/api/v1/analyze"
                  description="Submit 10s audio WAV; returns biometrics, transcript, and risk score"
                />
                <ApiRow
                  method="POST"
                  path="/api/v1/complaint"
                  description="Generates structured JSON complaint package with signed evidence link"
                />
                <ApiRow
                  method="GET"
                  path="/api/v1/radar/lookup"
                  description="Sub-300ms number reputation query for telecom and caller-ID apps"
                />
                <ApiRow
                  method="SDK"
                  path="satyavoice-sdk"
                  description="Embeddable Android module for banking and UPI applications (Planned)"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SECTION 8: AUDIENCE & CTA BAND (Slide 8)                         */}
      {/* ================================================================= */}
      <section className="section-padding bg-light">
        <div className="container-vaanix space-y-12">
          <div className="max-w-3xl space-y-3 text-left">
            <Pill>ECOSYSTEM IMPACT</Pill>
            <h2 className="h2-title text-navy">Who VaaniX Protects</h2>
            <p className="body-large text-gray">
              Engineered for Indian families, financial institutions, and cyber crime investigation units.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AudienceCard
              icon={Users}
              title="Senior Citizens & Families"
              description="Shields parents and grandparents from extortion calls faking their children's voices in mock accidents, hospital emergencies, or digital arrest scams."
            />
            <AudienceCard
              icon={Landmark}
              title="Banks & UPI Applications"
              description="Integrate acoustic scoring and automated transaction cooldowns before victims authorize irrevocable immediate payments."
            />
            <AudienceCard
              icon={Cpu}
              title="Telecoms & Law Enforcement"
              description="Generates immutable SHA-256 evidence digests and structured complaint formats for state cyber crime cells and helpline 1930 operators."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA Band from Slide 8 */}
      <CtaBand />
    </div>
  );
}
