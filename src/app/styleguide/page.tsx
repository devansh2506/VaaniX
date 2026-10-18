import { PhoneCall, AlertTriangle, Landmark, Users, ShieldAlert, Cpu } from "lucide-react";
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
import { Wordmark } from "@/components/layout/wordmark";
import { RiskMeter } from "@/components/check/risk-meter";
import { ScoreBreakdown } from "@/components/check/score-breakdown";
import { VerdictBanner } from "@/components/check/verdict-banner";
import { TranscriptPanel } from "@/components/check/transcript-panel";
import { ActionRow } from "@/components/check/action-row";
import { OfflineState } from "@/components/check/offline-state";
import { DemoModeBadge } from "@/components/check/demo-mode-badge";
import { AlertStatusList } from "@/components/check/alert-status-list";
import { FamilyDiagram } from "@/components/family/family-diagram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function StyleguidePage() {
  return (
    <div className="min-h-screen bg-surface text-navy pb-32">
      {/* Dev Warning Header */}
      <div className="bg-navy text-white py-3 px-6 text-center text-xs font-mono font-semibold tracking-wider uppercase">
        VaaniX Design System Styleguide · Pitch Deck Reference (Navy #0F2A44 + Teal #0E9F9A)
      </div>

      <div className="container-vaanix pt-12 space-y-20">
        {/* Title */}
        <div className="border-b border-border pb-8">
          <Wordmark size="lg" />
          <h1 className="h1-hero mt-4">Design System & Component Library</h1>
          <p className="body-large text-gray mt-2">
            Faithful web implementation of the VaaniX pitch deck. Light theme, minimal, generous white space, WCAG AA compliant.
          </p>
        </div>

        {/* Section 1: Color Tokens */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">1. Color Tokens (Section 5.1)</h2>
            <p className="body-small text-gray">Contrast validated against white surface (WCAG AA ≥ 4.5:1 for normal text)</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs font-mono">
            {/* Navy */}
            <div className="p-4 rounded-xl bg-navy text-white shadow-xs">
              <div className="font-bold">--navy</div>
              <div>#0F2A44</div>
              <div className="text-[10px] text-white/70 mt-2">Text & Frames (14.6:1)</div>
            </div>

            {/* Teal */}
            <div className="p-4 rounded-xl bg-teal text-navy shadow-xs">
              <div className="font-bold">--teal</div>
              <div>#0E9F9A</div>
              <div className="text-[10px] text-navy/70 mt-2">Fills & Icons (3.3:1)</div>
            </div>

            {/* Teal Dark */}
            <div className="p-4 rounded-xl bg-teal-dark text-white shadow-xs">
              <div className="font-bold">--teal-dark</div>
              <div>#0B7C78</div>
              <div className="text-[10px] text-white/70 mt-2">Text & Buttons (5.0:1)</div>
            </div>

            {/* Teal Tint */}
            <div className="p-4 rounded-xl bg-teal-tint text-teal-dark border border-teal/20">
              <div className="font-bold">--teal-tint</div>
              <div>#E3F5F4</div>
              <div className="text-[10px] text-teal-dark/70 mt-2">Cards & Chips</div>
            </div>

            {/* Red */}
            <div className="p-4 rounded-xl bg-red text-white shadow-xs">
              <div className="font-bold">--red</div>
              <div>#DC3D43</div>
              <div className="text-[10px] text-white/70 mt-2">Danger Fills (4.4:1)</div>
            </div>

            {/* Red Text */}
            <div className="p-4 rounded-xl bg-red-tint text-red-text border border-red/30">
              <div className="font-bold">--red-text</div>
              <div>#B8262C</div>
              <div className="text-[10px] text-red-text/70 mt-2">Body Text (6.3:1)</div>
            </div>

            {/* Green */}
            <div className="p-4 rounded-xl bg-green text-white shadow-xs">
              <div className="font-bold">--green</div>
              <div>#1E9E5A</div>
              <div className="text-[10px] text-white/70 mt-2">Safe Fills (3.5:1)</div>
            </div>

            {/* Green Text */}
            <div className="p-4 rounded-xl bg-green-tint text-green-text border border-green/30">
              <div className="font-bold">--green-text</div>
              <div>#167A45</div>
              <div className="text-[10px] text-green-text/70 mt-2">Body Text (5.4:1)</div>
            </div>

            {/* Surface */}
            <div className="p-4 rounded-xl bg-surface text-navy border border-border">
              <div className="font-bold">--surface</div>
              <div>#FFFFFF</div>
              <div className="text-[10px] text-gray mt-2">Page Background</div>
            </div>

            {/* Light */}
            <div className="p-4 rounded-xl bg-light text-navy border border-border">
              <div className="font-bold">--light</div>
              <div>#F3F6F9</div>
              <div className="text-[10px] text-gray mt-2">Neutral Cards</div>
            </div>

            {/* Gray */}
            <div className="p-4 rounded-xl bg-gray text-white">
              <div className="font-bold">--gray</div>
              <div>#5A6B7D</div>
              <div className="text-[10px] text-white/70 mt-2">Subtext (5.5:1)</div>
            </div>

            {/* Telegram */}
            <div className="p-4 rounded-xl bg-telegram text-white">
              <div className="font-bold">--telegram</div>
              <div>#2AABEE</div>
              <div className="text-[10px] text-white/70 mt-2">Telegram Headers</div>
            </div>
          </div>
        </section>

        {/* Section 2: Typography */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">2. Typography Hierarchy (Carlito Font)</h2>
            <p className="body-small text-gray">Metric-compatible with pitch deck Calibri</p>
          </div>

          <div className="space-y-4 p-8 rounded-2xl border border-border bg-light">
            <div>
              <span className="text-xs font-mono text-gray">H1 (56px Desktop / 36px Mobile, Bold 700)</span>
              <h1 className="h1-hero text-navy">Catch AI voice-clone scams during the call.</h1>
            </div>
            <div>
              <span className="text-xs font-mono text-gray">H2 (40px Desktop / 28px Mobile, Bold 700)</span>
              <h2 className="h2-title text-navy">Real-time biometrics and transcript analysis</h2>
            </div>
            <div>
              <span className="text-xs font-mono text-gray">H3 (24px Desktop / 20px Mobile, Bold 700)</span>
              <h3 className="h3-subtitle text-navy">Instant alert to family and financial safeguards</h3>
            </div>
            <div>
              <span className="text-xs font-mono text-gray">Body Large (18px Desktop / 16px Mobile, Regular 400)</span>
              <p className="body-large text-gray">
                VaaniX records seconds 5 to 15 of an incoming call, verifies speaker biometric consistency using Nes2Net-X, and monitors speech patterns for emergency scam coercion.
              </p>
            </div>
            <div>
              <span className="text-xs font-mono text-gray">Monospace (JetBrains Mono)</span>
              <p className="font-mono text-sm text-navy bg-surface p-3 rounded-lg border border-border inline-block">
                POST /api/v1/analyze · Bearer vx_live_7a8f9c0e2b1d4e
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Pitch Deck Badges, Chips & Buttons */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">3. Chips, Pills & Buttons</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Pill>AI IN CYBERSECURITY</Pill>
            <Pill className="bg-navy text-white">PROTECTION ENGINE</Pill>
            <DemoModeBadge />
            <Badge variant="teal">Real-time</Badge>
            <Badge variant="critical">92/100 Risk</Badge>
            <Badge variant="positive">Verified Genuine</Badge>
            <Badge variant="warning">Inconclusive</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button size="lg">Primary Action (Teal Dark)</Button>
            <Button size="lg" variant="navy">Dark Button (Navy)</Button>
            <Button size="lg" variant="secondary">Secondary Button</Button>
            <Button size="lg" variant="outline">Outline Button</Button>
            <Button size="lg" variant="danger">Danger Action</Button>
            <Button size="lg" variant="success">Safe Confirmation</Button>
          </div>
        </section>

        {/* Section 4: Verified StatCards (Slide 2) */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">4. Stat Cards (Slide 2 — Verified Facts Only)</h2>
            <p className="body-small text-gray">Every number strictly sourced from Section 13 with verified outbound links</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              value="47%"
              label="of Indian adults have faced, or know someone hit by, an AI voice scam"
              source="McAfee Artificial Impostor Study"
              sourceUrl="https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams"
              variant="teal"
            />
            <StatCard
              value="83%"
              label="of Indian victims lost money; 48% of them lost over ₹50,000"
              source="McAfee Survey / Digital Terminal"
              sourceUrl="https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams"
              variant="danger"
            />
            <StatCard
              value="3 sec"
              label="of audio was enough for an 85% voice clone match in security evaluations"
              source="McAfee Research"
              sourceUrl="https://digitalterminal.in/tech-companies/mcafee-reveals-47-of-indians-have-faced-ai-voice-scams"
              variant="teal"
            />
          </div>
        </section>

        {/* Section 5: Flow Diagram Components (Slide 3) */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">5. Flow Diagram & Timeline (Slide 3)</h2>
          </div>

          <Timeline />

          <div className="flex flex-col lg:flex-row items-center justify-center gap-3 p-6 rounded-2xl bg-light border border-border overflow-x-auto">
            <FlowBox title="Call Connects" subtitle="Caller speaks" variant="gray" />
            <FlowArrow />
            <FlowBox title="5s Wait" subtitle="Skip ringtone & intro" variant="gray" />
            <FlowArrow />
            <FlowBox title="Record 5–15s" subtitle="10-second sample" variant="teal" />
            <FlowArrow />
            <DecisionDiamond label="AI voice?" />
            <FlowArrow variant="danger" />
            <FlowBox title="AI Detected" subtitle="Instant red warning" variant="red" />
          </div>
        </section>

        {/* Section 6: Phone Mockup & In-Call Overlays (Slide 1, 4, 6) */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">6. Phone Mockups & Telegram Alerts (Slides 1 & 4)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start justify-items-center">
            {/* Phone 1: In-call alert */}
            <PhoneMock caption="In-call detection overlay (Slide 1 & 4)">
              <div className="flex-1 flex flex-col justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-light flex items-center justify-center text-gray">
                    <PhoneCall className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-navy">+91 98765 43210</h4>
                    <span className="text-xs text-gray">Active Call · 00:14</span>
                  </div>
                </div>

                <div className="my-auto space-y-4">
                  <div className="p-4 rounded-2xl bg-red-tint border-2 border-red text-center space-y-2">
                    <AlertTriangle className="size-8 text-red mx-auto" strokeWidth={2.5} />
                    <h3 className="text-lg font-bold text-red leading-tight">AI VOICE DETECTED</h3>
                    <p className="text-xs text-red-text font-medium">
                      Biometric mismatch. High synthetic probability.
                    </p>
                    <div className="text-2xl font-bold text-red tabular">87 / 100</div>
                  </div>
                </div>

                <Button variant="danger" className="w-full font-bold">
                  Hang Up & Verify
                </Button>
              </div>
            </PhoneMock>

            {/* Telegram 1: Victim alert */}
            <TelegramBubble
              title="⚠️ Possible voice-clone alert"
              callMeta="Call from +91 98765 43210 · Just now"
              riskScore={87}
              claimedIdentity="Rahul (Son)"
              bodyText="Said: 'Mummy, accident ho gaya, paise bhejo'"
              advice="Do NOT approve payments or share OTPs. Call Rahul back on his saved number."
              buttons={[
                { text: "🚨 Report Cyber Crime", variant: "red" },
                { text: "🏦 Report to Bank", variant: "navy" },
                { text: "📞 Call Helpline 1930", variant: "teal" },
                { text: "✅ This is genuine", variant: "green" },
              ]}
            />

            {/* Telegram 2: Family verification */}
            <TelegramBubble
              title="🛡️ Family Impersonation Alert"
              callMeta="Verification Request · Just now"
              bodyText="Someone is using YOUR VOICE to call your parent right now. Are you currently speaking with them?"
              buttons={[
                { text: "🚨 No, it's a scam!", variant: "red" },
                { text: "✅ Yes, that's me", variant: "green" },
              ]}
            />
          </div>
        </section>

        {/* Section 7: Detection Result Panels */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">7. Detection Verification Panels (Check Core)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 rounded-2xl bg-light border border-border">
            <RiskMeter score={87} size="lg" />
            <div className="md:col-span-2 space-y-4">
              <VerdictBanner verdict="AI_CLONE" />
              <ScoreBreakdown voiceScore={92} textScore={75} finalScore={87} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TranscriptPanel
              language="hi"
              claimLabel="Rahul (Son)"
              scamWords={["accident", "paise", "jaldi", "upi"]}
              segments={[
                { start: 5.2, end: 7.8, text: "Mummy, mera accident ho gaya hai." },
                { start: 8.1, end: 11.4, text: "Hospital mein hoon, jaldi se 20,000 paise upi kar do." },
                { start: 11.9, end: 14.5, text: "Kisi ko mat batana, police aayi hai." },
              ]}
            />

            <AlertStatusList
              items={[
                {
                  recipient: "user",
                  status: "sent",
                  label: "Telegram alert to you",
                  details: "Delivered to @username (+91 98765...)",
                },
                {
                  recipient: "member",
                  status: "sent",
                  label: "Impersonation check to Rahul (Son)",
                  details: "Prompting: 'Is it you on this call?'",
                },
                {
                  recipient: "radar",
                  status: "sent",
                  label: "Scam Radar indexed",
                  details: "Report logged for +91 98765 43210",
                },
              ]}
            />
          </div>
        </section>

        {/* Section 8: Family Diagram (Slide 5) */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">8. Family Circle (Slide 5)</h2>
          </div>

          <div className="rounded-2xl border border-border bg-light p-6">
            <FamilyDiagram />
          </div>
        </section>

        {/* Section 9: One-Tap Reporting & API Rows (Slide 7) */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">9. One-Tap Reporting & API Endpoints (Slide 7)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="h3-subtitle">One-Tap Reporting</h3>
              <ActionRow
                icon={ShieldAlert}
                label="Report Cyber Crime"
                explanation="Pre-fills official complaint email with cryptographic audio SHA-256 hash"
                buttonVariant="danger"
              />
              <ActionRow
                icon={Landmark}
                label="Report to Bank"
                explanation="Notifies bank fraud desk to freeze suspicious outgoing transactions"
                buttonVariant="navy"
              />
              <ActionRow
                icon={PhoneCall}
                label="Helpline 1930"
                explanation="Direct national cyber crime emergency speed dial to intercept funds"
                buttonVariant="default"
              />
            </div>

            <div className="space-y-3">
              <h3 className="h3-subtitle">Developer API Endpoints</h3>
              <ApiRow
                method="POST"
                path="/api/v1/analyze"
                description="Submit 10s audio clip; returns combined risk score"
              />
              <ApiRow
                method="POST"
                path="/api/v1/complaint"
                description="Generates pre-formatted complaint draft with evidence link"
              />
              <ApiRow
                method="GET"
                path="/api/v1/radar/lookup"
                description="Sub-300ms number reputation query for call screening"
              />
              <ApiRow
                method="SDK"
                path="satyavoice-sdk"
                description="Android Jetpack Compose library module (Planned)"
              />
            </div>
          </div>
        </section>

        {/* Section 10: Audience & CTA (Slide 8) */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">10. Audience Cards & CTA Band (Slide 8)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AudienceCard
              icon={Users}
              title="Senior Citizens & Families"
              description="Protect parents from panic-driven emergency calls faking their children's voices."
            />
            <AudienceCard
              icon={Landmark}
              title="Banks & UPI Apps"
              description="Plug audio fraud scoring and payment cooldowns before unauthorized fund transfers."
            />
            <AudienceCard
              icon={Cpu}
              title="Telecom & Law Enforcement"
              description="Forensic evidence packets with SHA-256 hashes for rapid police intervention."
            />
          </div>
        </section>

        {/* Section 11: Honest States & Form Controls */}
        <section className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="h2-title">11. Honest States & Input Cards</h2>
            <p className="body-small text-gray">No fake data, no simulated verdicts when offline</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <OfflineState />

            <Card className="p-6 space-y-4">
              <CardHeader className="p-0">
                <CardTitle>Caller Number Lookup</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <p className="text-sm text-gray">
                  Enter an Indian phone number (+91) to test reputation scoring against Scam Radar records.
                </p>
                <div className="flex gap-2">
                  <Input placeholder="+91 98765 43210" defaultValue="+91 98765 43210" />
                  <Button variant="default">Lookup</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* CTA Band at bottom of styleguide */}
      <div className="mt-20">
        <CtaBand />
      </div>
    </div>
  );
}
