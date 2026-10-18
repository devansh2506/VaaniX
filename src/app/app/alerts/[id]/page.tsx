'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Phone,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Pill } from '@/components/marketing/pill';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RiskMeter } from '@/components/check/risk-meter';
import { ScoreBreakdown } from '@/components/check/score-breakdown';
import { VerdictBanner } from '@/components/check/verdict-banner';
import { TranscriptPanel } from '@/components/check/transcript-panel';
import { ActionRow } from '@/components/check/action-row';
import { AlertStatusList, type AlertStatusItem } from '@/components/check/alert-status-list';
import { DemoModeBadge } from '@/components/check/demo-mode-badge';

interface AlertDetailData {
  alert: {
    id: string;
    check_id: string;
    user_id: string;
    status: 'open' | 'confirmed_scam' | 'verified_genuine' | 'dismissed_genuine';
    impersonated_member_id: string | null;
    member_response: string | null;
    created_at: string;
    updated_at: string;
  };
  check: {
    id: string;
    source: string;
    caller_e164: string | null;
    voice_score: number;
    text_score: number;
    risk_score: number;
    verdict: 'AI_CLONE' | 'REAL' | 'INCONCLUSIVE';
    is_stub: boolean;
    transcript: string | null;
    transcript_lang: string | null;
    transcript_segments: Array<{ start: number; end: number; text: string }> | null;
    scam_groups: string[];
    scam_words: string[];
    scam_type: string | null;
    claim_type: string | null;
    claim_label: string | null;
    audio_path: string | null;
    audio_sha256: string | null;
    created_at: string;
  };
  member: {
    id: string;
    name: string;
    relationship: string;
    phone_e164: string;
    telegram_chat_id: number | null;
    joined_at: string | null;
  } | null;
  messages: Array<{
    id: string;
    recipient: 'user' | 'member';
    chat_id: number;
    telegram_message_id: number | null;
    ok: boolean;
    error: string | null;
    sent_at: string;
  }>;
  complaints: Array<{
    id: string;
    target: string;
    created_at: string;
  }>;
}

interface FamilyMemberOption {
  id: string;
  name: string;
  relationship: string;
}

export default function AlertDetailPage() {
  const params = useParams();
  const alertId = params?.id as string;

  const [data, setData] = React.useState<AlertDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = React.useState<FamilyMemberOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>('');
  const [claiming, setClaiming] = React.useState(false);
  const [markingGenuine, setMarkingGenuine] = React.useState(false);

  const fetchAlert = React.useCallback(async () => {
    if (!alertId) return;

    try {
      const res = await fetch(`/api/alerts/${alertId}`);
      if (!res.ok) {
        throw new Error(`Failed to load alert (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching alert');
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  React.useEffect(() => {
    let active = true;

    async function init() {
      if (!alertId) return;
      try {
        const [alertRes, familyRes] = await Promise.all([
          fetch(`/api/alerts/${alertId}`),
          fetch('/api/family'),
        ]);

        if (active && alertRes.ok) {
          const aData = await alertRes.json();
          setData(aData);
        }
        if (active && familyRes.ok) {
          const fData = await familyRes.json();
          setFamilyMembers(fData.members || []);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error loading alert');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    init();

    // Poll every 5s while alert is open to check for member response
    const interval = setInterval(() => {
      fetchAlert();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [alertId, fetchAlert]);

  const handleClaimMember = async () => {
    if (!selectedMemberId || !alertId) return;
    setClaiming(true);

    try {
      const res = await fetch(`/api/alerts/${alertId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: selectedMemberId }),
      });
      if (!res.ok) throw new Error('Failed to assign member claim');
      await fetchAlert();
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Error updating claim');
    } finally {
      setClaiming(false);
    }
  };

  const handleMarkGenuine = async () => {
    if (!alertId) return;
    if (!confirm('Are you sure you want to mark this check as genuine? This will exclude it from Scam Radar reports.')) {
      return;
    }
    setMarkingGenuine(true);

    try {
      const res = await fetch(`/api/alerts/${alertId}/genuine`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark genuine');
      await fetchAlert();
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : 'Error marking genuine');
    } finally {
      setMarkingGenuine(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted text-sm">
        Loading alert details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4">
        <Link
          href="/app/history"
          className="inline-flex items-center text-sm font-semibold text-teal hover:underline"
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Back to History
        </Link>
        <Card className="p-8 border border-border bg-surface text-center">
          <AlertTriangle className="size-8 text-red mx-auto mb-2" />
          <h2 className="text-lg font-bold text-navy">Alert Not Found</h2>
          <p className="text-sm text-muted mt-1">{error || 'This alert could not be retrieved.'}</p>
        </Card>
      </div>
    );
  }

  const { alert, check, member, messages } = data;
  const isScamConfirmed = alert.status === 'confirmed_scam';
  const isVerifiedGenuine = alert.status === 'verified_genuine';
  const isDismissedGenuine = alert.status === 'dismissed_genuine';
  const isOpen = alert.status === 'open';

  // Construct Alert Status items for Telegram
  const alertStatusItems: AlertStatusItem[] = messages.map((m) => ({
    recipient: m.recipient,
    status: m.ok ? 'sent' : 'failed',
    label: m.recipient === 'user' ? 'Telegram alert to you' : `Telegram to ${member?.name || 'family member'}`,
    details: m.ok ? `Sent at ${new Date(m.sent_at).toLocaleTimeString()}` : m.error || 'Failed to deliver',
  }));

  // If member has no telegram message and wasn't joined
  if (member && !member.telegram_chat_id && !messages.some((m) => m.recipient === 'member')) {
    alertStatusItems.push({
      recipient: 'member',
      status: 'not_joined',
      label: `Telegram to ${member.name}`,
      details: 'Member has not connected Telegram yet',
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/history"
          className="inline-flex items-center text-sm font-semibold text-navy hover:text-teal transition-colors"
        >
          <ArrowLeft className="size-4 mr-1.5" />
          Back to Check History
        </Link>

        <div className="flex items-center gap-2">
          {isOpen && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-tint text-yellow-text border border-yellow/30">
              <Clock className="size-3.5" />
              Verification Pending
            </span>
          )}
          {isScamConfirmed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-tint text-red-text border border-red/30">
              <ShieldAlert className="size-3.5" strokeWidth={2.5} />
              Confirmed Scam
            </span>
          )}
          {isVerifiedGenuine && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-tint text-green-text border border-green/30">
              <ShieldCheck className="size-3.5" strokeWidth={2.5} />
              Verified Genuine
            </span>
          )}
          {isDismissedGenuine && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-light text-navy border border-border">
              Dismissed Genuine
            </span>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div>
        <Pill label="Incident Investigation" />
        <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
          Voice Clone Alert Details
        </h1>
        <p className="text-sm text-muted mt-1.5">
          Recorded {new Date(check.created_at).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          {check.caller_e164 && ` · Caller: ${check.caller_e164}`}
        </p>
      </div>

      {/* 2-Way Member Verification Banner */}
      {isScamConfirmed && (
        <div className="p-5 rounded-2xl bg-red-tint border-2 border-red text-red-text flex items-start gap-4 shadow-sm">
          <ShieldAlert className="size-6 shrink-0 mt-0.5 text-red" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-red-text">
              {member ? `${member.name} confirmed: NOT them on this call.` : "Family member confirmed it's a scam."}
            </h3>
            <p className="text-sm text-red-text/90 mt-1">
              This call is an active voice impersonation scam. An automated Scam Radar report has been recorded. Do not send any funds or credentials.
            </p>
          </div>
        </div>
      )}

      {isVerifiedGenuine && (
        <div className="p-5 rounded-2xl bg-green-tint border-2 border-green text-green-text flex items-start gap-4 shadow-sm">
          <CheckCircle2 className="size-6 shrink-0 mt-0.5 text-green" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-green-text">
              {member ? `${member.name} confirmed: Really them on the call.` : 'Confirmed genuine by family member.'}
            </h3>
            <p className="text-sm text-green-text/90 mt-1">
              Your family member verified this conversation on their Telegram app.
            </p>
          </div>
        </div>
      )}

      {isOpen && (
        <Card className="p-5 border border-border bg-surface space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <Clock className="size-4.5 text-teal" />
                2-Way Family Verification
              </h3>
              <p className="text-xs text-muted mt-1">
                {member
                  ? member.telegram_chat_id
                    ? `An instant verification check was sent to ${member.name}'s Telegram. Waiting for their response.`
                    : `${member.name} has not linked their Telegram yet.`
                  : 'No family member was linked to this check yet.'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAlert()}
              className="text-navy shrink-0 border-border"
            >
              <RefreshCw className="size-3.5 mr-1" />
              Check Status
            </Button>
          </div>

          {!member && (
            <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs font-semibold text-navy whitespace-nowrap">
                Who did the caller claim to be?
              </span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="h-9 rounded-md border border-border bg-surface px-3 py-1 text-xs text-navy focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal flex-1 w-full sm:w-auto"
              >
                <option value="">Select family member...</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relationship})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleClaimMember}
                disabled={!selectedMemberId || claiming}
                className="bg-teal hover:bg-teal-dark text-white font-bold text-xs h-9"
              >
                {claiming ? 'Linking...' : 'Dispatch Verification'}
              </Button>
            </div>
          )}

          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-xs text-muted">
              Was this actually a genuine call?
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkGenuine}
              disabled={markingGenuine}
              className="text-xs border-border text-navy hover:bg-light"
            >
              {markingGenuine ? 'Updating...' : 'Mark as Genuine'}
            </Button>
          </div>
        </Card>
      )}

      {/* Main Analysis Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-surface flex flex-col items-center justify-center text-center">
          <RiskMeter score={check.risk_score} size="lg" />
        </Card>

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <VerdictBanner verdict={check.verdict} />
            {check.is_stub && <DemoModeBadge />}
          </div>
          <ScoreBreakdown
            voiceScore={check.voice_score}
            textScore={check.text_score}
            finalScore={check.risk_score}
          />
        </div>
      </div>

      {/* Transcript Panel */}
      <TranscriptPanel
        rawText={check.transcript || ''}
        segments={check.transcript_segments || []}
        scamWords={check.scam_words || []}
        claimLabel={check.claim_label}
        language={check.transcript_lang || 'en'}
      />

      {/* Automated Telegram Dispatch Status */}
      {alertStatusItems.length > 0 && (
        <AlertStatusList items={alertStatusItems} />
      )}

      {/* One-Tap Reporting Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
          One-Tap Incident Reporting
        </h3>

        <div className="space-y-3">
          <ActionRow
            icon={ShieldAlert}
            label="Report to Cyber Crime"
            explanation="Generate official complaint email to state cyber cell with SHA-256 evidence"
            buttonVariant="navy"
            href={`/r/cyber/${alert.id}`}
          />

          <ActionRow
            icon={Landmark}
            label="Report to Bank (Demo)"
            explanation="Send pre-filled emergency freeze request to Sample Bank fraud desk"
            buttonVariant="default"
            href={`/r/bank/${alert.id}`}
          />

          <ActionRow
            icon={Phone}
            label="Call 1930 Helpline"
            explanation="Direct dial to National Cyber Crime Helpline for immediate financial stop"
            buttonVariant="danger"
            href="/r/call1930"
          />
        </div>
      </div>
    </div>
  );
}
