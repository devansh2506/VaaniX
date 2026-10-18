'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldAlert, Building2, PhoneCall } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/marketing/pill';
import { useVoiceCheck } from '@/hooks/use-voice-check';
import { RiskMeter } from '@/components/check/risk-meter';
import { VerdictBanner } from '@/components/check/verdict-banner';
import { ScoreBreakdown } from '@/components/check/score-breakdown';
import { TranscriptPanel } from '@/components/check/transcript-panel';
import { OfflineState } from '@/components/check/offline-state';
import { DemoModeBadge } from '@/components/check/demo-mode-badge';
import { AlertStatusList } from '@/components/check/alert-status-list';
import { ActionRow } from '@/components/check/action-row';

export default function CheckPage() {
  const [callerNumber, setCallerNumber] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'mic' | 'upload'>('mic');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    state,
    countdown,
    recordSecondsRemaining,
    audioLevel,
    result,
    errorMessage,
    startMicCheck,
    uploadAudioCheck,
    retryCheck,
    reset,
  } = useVoiceCheck({ endpoint: '/api/checks' });

  const handleStartMic = () => {
    startMicCheck(callerNumber);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAudioCheck(file, callerNumber);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Pill label="Voice Verification" />
          <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
            Real-Time Voice Check
          </h1>
          <p className="text-base text-gray mt-2">
            Verify caller voice authenticity using Wav2Vec2 Nes2Net acoustic analysis and natural language urgency scoring.
          </p>
        </div>

        {state === 'complete' && (
          <Button variant="outline" size="sm" onClick={reset}>
            ← Check Another Call
          </Button>
        )}
      </div>

      {/* 1. IDLE STATE: Form & Input Tabs */}
      {state === 'idle' && (
        <div className="space-y-6">
          {/* Optional Caller Number Input */}
          <Card className="p-6 border border-border bg-surface">
            <label htmlFor="caller_number" className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              Caller Phone Number (Optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="caller_number"
                placeholder="+91 98765 43210"
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                className="max-w-md font-mono"
              />
              <span className="text-xs text-gray self-center">
                Enables automatic Scam Radar lookup and crowd reputation checks.
              </span>
            </div>
          </Card>

          {/* Tab Selector */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('mic')}
              className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'mic'
                  ? 'border-teal-dark text-teal-dark'
                  : 'border-transparent text-gray hover:text-navy'
              }`}
            >
              🎙 Microphone (Call on Speaker)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`pb-3 px-6 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-teal-dark text-teal-dark'
                  : 'border-transparent text-gray hover:text-navy'
              }`}
            >
              📁 Upload Recording
            </button>
          </div>

          {/* Mode 1: Microphone */}
          {activeTab === 'mic' && (
            <Card className="p-8 sm:p-12 border border-border bg-surface text-center space-y-6">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-16 h-16 rounded-full bg-teal-tint text-teal-dark flex items-center justify-center mx-auto text-2xl font-bold">
                  🎙
                </div>
                <h2 className="text-xl font-bold text-navy">Record Call via Microphone</h2>
                <p className="text-sm text-gray leading-relaxed">
                  Put your incoming call on speakerphone and hold your microphone near the speaker. The system skips 5s of ring and greeting, records exactly 10s of voice, and runs verification.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleStartMic}
                  className="px-10 h-14 text-base font-bold shadow-sm"
                >
                  Start 10-Second Check
                </Button>
              </div>
            </Card>
          )}

          {/* Mode 2: File Upload */}
          {activeTab === 'upload' && (
            <Card className="p-8 sm:p-12 border border-dashed border-border bg-surface text-center space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.webm"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-16 h-16 rounded-full bg-light text-navy flex items-center justify-center mx-auto text-2xl font-bold">
                  📁
                </div>
                <h2 className="text-xl font-bold text-navy">Upload Audio Recording</h2>
                <p className="text-sm text-gray leading-relaxed">
                  Upload an audio clip (8–12 seconds, max 3 MB) in WAV, MP3, M4A, or WEBM format.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="navy"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-10 h-14 text-base font-bold"
                >
                  Select Audio File
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 2. COUNTDOWN STATE (5 seconds skipping greetings) */}
      {state === 'countdown' && (
        <Card className="p-12 border border-border bg-surface text-center space-y-6">
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-light animate-pulse" />
            <div className="w-24 h-24 rounded-full bg-teal-tint flex items-center justify-center">
              <span className="text-4xl font-extrabold text-teal-dark font-mono">{countdown}</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-navy">Skipping Ring and Greetings...</h2>
            <p className="text-sm text-gray max-w-md mx-auto">
              Please hold your phone near the speaker. 10-second acoustic analysis begins in {countdown} seconds.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={reset}>
            Cancel Check
          </Button>
        </Card>
      )}

      {/* 3. RECORDING STATE (10 seconds active listening) */}
      {state === 'recording' && (
        <Card className="p-12 border-2 border-teal-dark bg-surface text-center space-y-6">
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {/* Pulsing ring matching audio level */}
            <div
              className="absolute inset-0 rounded-full bg-teal-tint transition-transform duration-75"
              style={{ transform: `scale(${1 + audioLevel * 0.4})` }}
            />
            <div className="relative z-10 w-24 h-24 rounded-full bg-teal-dark text-white flex flex-col items-center justify-center shadow-lg">
              <span className="text-3xl font-extrabold font-mono">{recordSecondsRemaining}s</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Listening</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-navy">Listening to Call Audio...</h2>
            <p className="text-sm text-gray max-w-md mx-auto">
              Recording 16 kHz mono audio sample ({recordSecondsRemaining} seconds remaining). Analysis will run automatically.
            </p>
          </div>

          {/* Real-time Level Bar */}
          <div className="max-w-xs mx-auto">
            <div className="h-2 w-full bg-light rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-teal-dark transition-all duration-75"
                style={{ width: `${Math.round(audioLevel * 100)}%` }}
              />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={reset}>
            Stop & Cancel
          </Button>
        </Card>
      )}

      {/* 4. ANALYZING STATE */}
      {state === 'analyzing' && (
        <Card className="p-12 border border-border bg-surface text-center space-y-6">
          <div className="w-16 h-16 rounded-full border-4 border-teal border-t-transparent animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-navy">Analysing… (about 10 seconds)</h2>
            <p className="text-sm text-gray max-w-md mx-auto leading-relaxed">
              Running Wav2Vec2 Nes2Net-X acoustic deepfake classification and Whisper multilingual transcription simultaneously on the analysis server.
            </p>
          </div>
        </Card>
      )}

      {/* 5. OFFLINE STATE */}
      {state === 'offline' && (
        <div className="space-y-4">
          <OfflineState onRetry={retryCheck} />
          <div className="text-center">
            <Button variant="outline" size="sm" onClick={reset}>
              Discard Recording & Start Over
            </Button>
          </div>
        </div>
      )}

      {/* 6. ERROR STATE */}
      {state === 'error' && (
        <Card className="p-8 border border-red/30 bg-surface text-center space-y-4">
          <div className="text-red font-bold text-lg">Verification Encountered an Issue</div>
          <p className="text-sm text-gray max-w-md mx-auto">{errorMessage}</p>
          <Button variant="default" size="sm" onClick={reset}>
            Try Again
          </Button>
        </Card>
      )}

      {/* 7. COMPLETE RESULT STATE */}
      {state === 'complete' && result && (
        <div className="space-y-8 animate-fadeIn">
          {/* Honest Demo Mode Badge */}
          {result.isStub && (
            <div className="flex justify-center">
              <DemoModeBadge />
            </div>
          )}

          {/* Verdict Banner */}
          <VerdictBanner verdict={result.verdict} />

          {/* Score & Transcript Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Risk Gauge & Sub-scores */}
            <Card className="p-6 sm:p-8 border border-border bg-surface flex flex-col items-center text-center space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray">
                  Overall Decision Score
                </p>
                <div className="mt-4">
                  <RiskMeter score={result.riskScore} size="lg" />
                </div>
              </div>

              <div className="w-full pt-4 border-t border-border">
                <ScoreBreakdown
                  voiceScore={result.voiceScore}
                  textScore={result.textScore}
                  finalScore={result.riskScore}
                />
              </div>

              <p className="text-xs text-gray max-w-xs">{result.explanation}</p>
            </Card>

            {/* Transcript & Urgency Keywords */}
            <div className="space-y-6">
              <TranscriptPanel
                rawText={result.transcript}
                segments={result.transcriptSegments}
                scamWords={result.scamWords}
                claimLabel={result.claim?.label}
                language={result.transcriptLanguage}
              />

              {/* Alert Status (for AI_CLONE) */}
              {result.verdict === 'AI_CLONE' && (
                <AlertStatusList
                  items={[
                    {
                      recipient: 'You (Telegram)',
                      status: result.alertSent?.telegramUser ? 'sent' : 'failed',
                      label: 'Telegram Alert to Owner',
                      details: result.alertSent?.telegramUser ? 'Delivered' : 'Telegram not connected in Settings',
                    },
                    ...(result.claim?.label
                      ? [
                          {
                            recipient: result.claim.label,
                            status: (result.alertSent?.telegramMember === true
                              ? 'sent'
                              : result.alertSent?.telegramMember === false
                              ? 'failed'
                              : 'not_joined') as 'sent' | 'failed' | 'not_joined',
                            label: `Impersonation Warning to ${result.claim.label}`,
                            details: '2-way verification alert',
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            </div>
          </div>

          {/* One-Tap Action Buttons (Roadmap Section 9) */}
          {result.verdict === 'AI_CLONE' && (
            <Card className="p-6 border border-border bg-surface space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
                  Immediate Protection Actions
                </h3>
                {(result.alertId || result.id) && (
                  <Link
                    href={`/app/alerts/${result.alertId || result.id}`}
                    className="text-xs font-bold text-teal hover:text-teal-dark hover:underline"
                  >
                    View Live 2-Way Member Verification →
                  </Link>
                )}
              </div>
              <div className="space-y-3">
                <ActionRow
                  icon={ShieldAlert}
                  label="Report to Cyber Crime"
                  explanation="Pre-fills official police complaint draft for your state"
                  buttonVariant="danger"
                  onClick={() => window.open(`/r/cyber/${result.id || 'draft'}`, '_blank')}
                />
                <ActionRow
                  icon={Building2}
                  label="Report to Bank"
                  explanation="Drafts emergency freeze notification for fraudulent transactions"
                  buttonVariant="navy"
                  onClick={() => window.open(`/r/bank/${result.id || 'draft'}`, '_blank')}
                />
                <ActionRow
                  icon={PhoneCall}
                  label="Call 1930"
                  explanation="Direct dial to National Cyber Crime Helpline"
                  buttonVariant="outline"
                  onClick={() => window.open('tel:1930', '_self')}
                />
              </div>
            </Card>
          )}

          {/* Timing details */}
          <div className="text-center text-xs text-faint">
            Analysis timings: Voice {result.timingsMs.voice}ms · STT {result.timingsMs.stt}ms · Total {result.timingsMs.total}ms
          </div>
        </div>
      )}
    </div>
  );
}
