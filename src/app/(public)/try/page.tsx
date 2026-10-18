"use client";

import { useState } from "react";
import Link from "next/link";
import { Mic, Upload, ShieldCheck, AlertCircle, Info, RefreshCw } from "lucide-react";
import { Pill } from "@/components/marketing/pill";
import { RiskMeter } from "@/components/check/risk-meter";
import { ScoreBreakdown } from "@/components/check/score-breakdown";
import { VerdictBanner, type VerdictType } from "@/components/check/verdict-banner";
import { TranscriptPanel } from "@/components/check/transcript-panel";
import { DemoModeBadge } from "@/components/check/demo-mode-badge";
import { OfflineState } from "@/components/check/offline-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TryPage() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [mode, setMode] = useState<"upload" | "mic">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Demo evaluation state
  const [result, setResult] = useState<{
    verdict: VerdictType;
    voiceScore: number;
    textScore: number;
    finalScore: number;
    isStub: boolean;
    transcript: string;
    scamWords: string[];
    claimLabel?: string | null;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentGiven) {
      setError("Please confirm you have permission to evaluate this audio.");
      return;
    }

    if (mode === "upload" && !file) {
      setError("Please select an audio file (WAV, MP3, or WEBM).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setIsOffline(false);

    try {
      // Calls public /api/live-detection or /api/try
      const formData = new FormData();
      if (file) {
        formData.append("audio", file);
      }

      const res = await fetch("/api/try", {
        method: "POST",
        body: formData,
      });

      if (res.status === 503) {
        setIsOffline(true);
        setIsSubmitting(false);
        return;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        throw new Error(data?.error?.message || data?.error || "Detection failed. Please try again.");
      }

      const check = data.check || {};
      const voiceScore = check.voiceScore ?? 0;
      const textScore = check.textScore ?? 0;
      const finalScore = check.riskScore ?? Math.round(0.7 * voiceScore + 0.3 * textScore);

      setResult({
        verdict: check.verdict || "INCONCLUSIVE",
        voiceScore,
        textScore,
        finalScore,
        isStub: Boolean(check.isStub),
        transcript: check.transcript || "No speech detected in audio sample.",
        scamWords: check.scamWords || [],
        claimLabel: check.claim?.label || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach detection server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full text-left py-12 sm:py-20">
      <div className="container-vaanix max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <Pill>INTERACTIVE DEMO</Pill>
          <h1 className="h1-hero text-navy">Try a Live Voice Verification</h1>
          <p className="body-large text-gray leading-relaxed max-w-2xl">
            Test an 8–12 second voice recording through the acoustic Nes2Net-X model.
            Rate limit: 5 checks per IP per hour. Results on this public page are not stored in any database.
          </p>
        </div>

        {/* Input Card */}
        <Card className="p-6 sm:p-8 bg-surface border-2 border-border space-y-6">
          <form onSubmit={handleDemoSubmit} className="space-y-6">
            {/* Mode Selector */}
            <div className="flex items-center gap-3 border-b border-border/70 pb-4">
              <Button
                type="button"
                variant={mode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("upload")}
                className="font-bold"
              >
                <Upload className="size-4 mr-1.5" />
                Upload Audio File
              </Button>
              <Button
                type="button"
                variant={mode === "mic" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("mic")}
                className="font-bold"
              >
                <Mic className="size-4 mr-1.5" />
                Record via Microphone
              </Button>
            </div>

            {/* Mode 1: File Upload */}
            {mode === "upload" && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-navy">
                  Select Call Audio Sample (8–12s recommended)
                </label>
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border hover:border-teal-dark bg-light transition-colors text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept="audio/wav,audio/mp3,audio/webm,audio/m4a"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="size-8 text-gray mb-2" />
                  <p className="text-sm font-semibold text-navy">
                    {file ? file.name : "Click to select or drag & drop audio"}
                  </p>
                  <p className="text-xs text-faint mt-1">WAV, MP3, or WEBM · Maximum 3 MB</p>
                </div>
              </div>
            )}

            {/* Mode 2: Mic prompt */}
            {mode === "mic" && (
              <div className="p-6 rounded-xl bg-light border border-border text-center space-y-3">
                <Mic className="size-8 text-teal-dark mx-auto" />
                <h4 className="font-bold text-navy text-base">Full Microphone Experience in App</h4>
                <p className="text-xs sm:text-sm text-gray max-w-md mx-auto">
                  The logged-in app features real-time 5s countdown + 10s auto-capture with volume meters.
                  For this public demo, uploading a sample file is recommended.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href="/login">Sign in for live call capture</Link>
                </Button>
              </div>
            )}

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-light border border-border/70">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="size-4.5 rounded-sm border-gray text-teal-dark focus:ring-teal-dark mt-0.5"
              />
              <label htmlFor="consent" className="text-xs sm:text-sm text-gray leading-snug cursor-pointer select-none">
                <strong className="text-navy">Consent acknowledgement:</strong> I confirm that I have legal permission
                to evaluate this audio clip, and that it contains no confidential or unlawful communications.
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-tint border border-red/30 text-red-text text-sm font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !consentGiven || (mode === "upload" && !file)}
                className="font-bold"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin mr-2" />
                    Analyzing acoustics (~10 seconds)...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-5 mr-1.5" />
                    Run Voice Verification
                  </>
                )}
              </Button>

              <span className="text-xs text-faint">Rate limit: 5 / hr</span>
            </div>
          </form>
        </Card>

        {/* Offline Notice */}
        {isOffline && (
          <OfflineState onRetry={() => setIsOffline(false)} />
        )}

        {/* Result Area */}
        {result && (
          <div className="space-y-6 pt-4 border-t border-border animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="h2-title text-navy">Detection Result</h2>
              {result.isStub && <DemoModeBadge />}
            </div>

            <VerdictBanner verdict={result.verdict} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 rounded-2xl bg-light border border-border">
              <RiskMeter score={result.finalScore} size="lg" />
              <div className="md:col-span-2">
                <ScoreBreakdown
                  voiceScore={result.voiceScore}
                  textScore={result.textScore}
                  finalScore={result.finalScore}
                />
              </div>
            </div>

            <TranscriptPanel
              rawText={result.transcript}
              scamWords={result.scamWords}
              claimLabel={result.claimLabel}
            />

            <div className="p-4 rounded-xl bg-surface border border-border text-xs text-gray space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-navy">
                <Info className="size-4 text-teal-dark" />
                <span>Demo Mode Notice</span>
              </div>
              <p>
                This was an unauthenticated public check. In the working logged-in app, an AI_CLONE verdict
                instantly dispatches real Telegram warnings, family impersonation alerts, and registers on Scam Radar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
