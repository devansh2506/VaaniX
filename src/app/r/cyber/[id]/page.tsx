'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ShieldAlert,
  Mail,
  ExternalLink,
  Phone,
  AlertTriangle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { Pill } from '@/components/marketing/pill';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { buildCyberCrimeEmail } from '@/lib/complaints/email-builder';

interface CyberIncidentData {
  alert: {
    id: string;
    check_id: string;
    status: string;
  };
  check: {
    id: string;
    caller_e164: string | null;
    voice_score: number;
    text_score: number;
    risk_score: number;
    transcript: string | null;
    claim_label: string | null;
    audio_sha256: string | null;
    created_at: string;
  };
  cyberCell: {
    state_code: string;
    state_name: string;
    email: string | null;
    portal_url: string;
    verified: boolean;
  } | null;
  profile: {
    display_name: string | null;
    phone_e164: string | null;
  } | null;
}

function CyberComplaintContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const alertId = params?.id as string;
  const token = searchParams?.get('t');

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<CyberIncidentData | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [loggedComplaint, setLoggedComplaint] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function fetchIncident() {
      if (!alertId) return;

      try {
        const query = token ? `?t=${encodeURIComponent(token)}` : '';
        const res = await fetch(`/api/alerts/${alertId}${query}`);
        if (!res.ok) {
          throw new Error(`Unable to load incident details (${res.status})`);
        }
        const json = await res.json();

        // Also fetch cyber cell info for user's state
        const stateRes = await fetch('/api/settings');
        let cyberCell = null;
        let profile: { display_name: string | null; phone_e164: string | null } | null = null;

        if (stateRes.ok) {
          const sJson = await stateRes.json();
          if (sJson.profile) {
            profile = {
              display_name: sJson.profile.display_name ?? null,
              phone_e164: sJson.profile.phone_e164 ?? null,
            };
            const userStateCode = sJson.profile.state_code;
            if (userStateCode && sJson.states) {
              const matched = sJson.states.find(
                (s: { state_code: string }) => s.state_code === userStateCode
              );
              if (matched) cyberCell = matched;
            }
          }
        }

        if (active) {
          setData({
            alert: json.alert,
            check: json.check,
            cyberCell,
            profile,
          });
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error loading report');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchIncident();

    return () => {
      active = false;
    };
  }, [alertId, token]);

  const logDraftOpened = React.useCallback(async (target: string, payload: Record<string, unknown>) => {
    if (loggedComplaint || !alertId) return;
    try {
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          target,
          payload,
        }),
      });
      setLoggedComplaint(true);
    } catch {
      // Non-critical tracking
    }
  }, [alertId, loggedComplaint]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-muted text-sm">
        Preparing official Cyber Crime complaint draft...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <Card className="p-8 border border-border bg-surface text-center space-y-3">
          <AlertTriangle className="size-8 text-red mx-auto" />
          <h2 className="text-xl font-bold text-navy">Unable to Load Complaint</h2>
          <p className="text-sm text-muted">{error || 'Incident report could not be found or link expired.'}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/check">Return to SatyaVoice</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { check, cyberCell, profile } = data;
  const hasVerifiedEmail = Boolean(cyberCell?.verified && cyberCell?.email);
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const evidenceDownloadUrl = check.audio_sha256
    ? `${siteUrl}/api/v1/evidence/${check.id}`
    : null;

  const emailData = hasVerifiedEmail && cyberCell?.email
    ? buildCyberCrimeEmail({
        alertId,
        checkId: check.id,
        dateStr: new Date(check.created_at).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        callerNumber: check.caller_e164,
        riskScore: check.risk_score,
        voiceScore: check.voice_score,
        textScore: check.text_score,
        claimLabel: check.claim_label,
        transcript: check.transcript,
        audioSha256: check.audio_sha256,
        downloadUrl: evidenceDownloadUrl,
        userName: profile?.display_name,
        userPhone: profile?.phone_e164,
        toEmail: cyberCell.email,
      })
    : null;

  const handleCopyBody = () => {
    if (!emailData) return;
    navigator.clipboard.writeText(emailData.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 sm:py-12">
      {/* Header */}
      <div>
        <Pill label="National Cyber Crime Reporting" />
        <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
          Report AI Voice Scam to Cyber Crime Cell
        </h1>
        <p className="text-sm text-muted mt-1.5">
          Incident recorded at {new Date(check.created_at).toLocaleString('en-IN')}
          {check.caller_e164 && ` from ${check.caller_e164}`}
        </p>
      </div>

      {/* Case 1: Verified state email available */}
      {hasVerifiedEmail && emailData && cyberCell?.email ? (
        <Card className="p-6 sm:p-8 border-2 border-border bg-surface space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Official Cyber Crime Recipient
              </span>
              <div className="text-base font-bold text-navy mt-0.5">
                {cyberCell.state_name} Cyber Police Desk
              </div>
              <p className="text-xs font-mono text-teal-dark mt-0.5">{cyberCell.email}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-tint text-green-text border border-green/30 shrink-0">
              ✓ Verified Official
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-navy hover:bg-navy-light text-white font-bold flex-1"
              onClick={() => logDraftOpened('cyber_cell', { email: cyberCell.email })}
            >
              <a href={emailData.gmailUrl} target="_blank" rel="noopener noreferrer">
                <Mail className="size-4 mr-2 text-teal" />
                Open Prefilled Draft in Gmail
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-border text-navy font-semibold"
              onClick={() => logDraftOpened('cyber_cell', { email: cyberCell.email, client: 'mailto' })}
            >
              <a href={emailData.mailtoUrl}>
                <ExternalLink className="size-4 mr-2" />
                Default Email App (mailto:)
              </a>
            </Button>
          </div>

          {/* Email Preview Box */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Pre-Written Complaint Preview
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyBody}
                className="h-7 text-xs border-border text-navy"
              >
                {copied ? (
                  <>
                    <Check className="size-3 mr-1 text-green" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-3 mr-1" />
                    Copy Body Text
                  </>
                )}
              </Button>
            </div>

            <pre className="p-4 rounded-xl bg-light border border-border text-xs text-navy font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto select-all">
              {emailData.body}
            </pre>
            <p className="text-[11px] text-muted">
              Note: You can review and edit your contact details or statement in Gmail before hitting send.
            </p>
          </div>
        </Card>
      ) : (
        /* Case 2: No verified state email in database -> Show National Portal & 1930 */
        <Card className="p-6 sm:p-8 border-2 border-border bg-surface space-y-6">
          <div className="p-4 rounded-xl bg-light border border-border space-y-2">
            <div className="flex items-center gap-2 text-navy font-bold text-sm">
              <ShieldAlert className="size-5 text-teal" />
              <span>Official Government Reporting Portal</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              To ensure compliance and authenticity, SatyaVoice never invents unverified police email addresses.
              File your formal complaint directly on the Government of India National Cyber Crime Portal or call the 24x7 helpline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-teal hover:bg-teal-dark text-white font-bold h-14"
              onClick={() => logDraftOpened('portal', { portal: 'cybercrime.gov.in' })}
            >
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <FileText className="size-5" />
                <span>File on cybercrime.gov.in</span>
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              className="bg-navy hover:bg-navy-light text-white font-bold h-14"
              onClick={() => logDraftOpened('portal', { phone: '1930' })}
            >
              <a href="tel:1930" className="flex items-center justify-center gap-2">
                <Phone className="size-5 text-red" />
                <span>Call 1930 National Helpline</span>
              </a>
            </Button>
          </div>
        </Card>
      )}

      {/* Emergency Call Box */}
      <div className="p-5 rounded-2xl bg-light border border-border flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-navy">Financial Loss Emergency?</h4>
          <p className="text-xs text-muted mt-0.5">
            If funds were transferred, call 1930 immediately to freeze the money trail with beneficiary banks.
          </p>
        </div>
        <Button asChild size="sm" className="bg-red hover:bg-red/90 text-white font-bold shrink-0">
          <a href="tel:1930">
            <Phone className="size-3.5 mr-1.5" />
            Call 1930
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function CyberRedirectPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-sm text-muted">Loading complaint draft...</div>}>
      <CyberComplaintContent />
    </React.Suspense>
  );
}
