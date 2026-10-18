'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Landmark,
  Mail,
  ExternalLink,
  Phone,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { Pill } from '@/components/marketing/pill';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DemoModeBadge } from '@/components/check/demo-mode-badge';
import { buildBankFreezeEmail } from '@/lib/complaints/email-builder';

interface BankIncidentData {
  alert: {
    id: string;
    check_id: string;
    status: string;
  };
  check: {
    id: string;
    caller_e164: string | null;
    created_at: string;
    claim_label: string | null;
  };
  bank: {
    id: string;
    name: string;
    fraud_email: string;
    is_demo: boolean;
  };
  profile: {
    display_name: string | null;
    phone_e164: string | null;
  } | null;
}

function BankComplaintContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const alertId = params?.id as string;
  const token = searchParams?.get('t');

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<BankIncidentData | null>(null);
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

        // Fetch user profile and bank list from settings
        const stateRes = await fetch('/api/settings');
        let bank = {
          id: 'demo-bank',
          name: 'Sample Bank (Demo)',
          fraud_email: 'fraud@samplebank.example',
          is_demo: true,
        };
        let profile: { display_name: string | null; phone_e164: string | null } | null = null;

        if (stateRes.ok) {
          const sJson = await stateRes.json();
          if (sJson.profile) {
            profile = {
              display_name: sJson.profile.display_name ?? null,
              phone_e164: sJson.profile.phone_e164 ?? null,
            };
          }
          if (sJson.banks && sJson.banks.length > 0) {
            bank = sJson.banks[0];
          }
        }

        if (active) {
          setData({
            alert: json.alert,
            check: json.check,
            bank,
            profile,
          });
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error loading bank report');
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

  const logDraftOpened = React.useCallback(async (payload: Record<string, unknown>) => {
    if (loggedComplaint || !alertId) return;
    try {
      await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          target: 'bank',
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
      <div className="max-w-2xl mx-auto py-16 text-center text-gray text-sm">
        Preparing bank freeze notification...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <Card className="p-8 border border-border bg-surface text-center space-y-3">
          <AlertTriangle className="size-8 text-red mx-auto" />
          <h2 className="text-xl font-bold text-navy">Unable to Load Report</h2>
          <p className="text-sm text-gray">{error || 'Incident report could not be found or link expired.'}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/check">Return to SatyaVoice</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { check, bank, profile } = data;

  const emailData = buildBankFreezeEmail({
    alertId,
    checkId: check.id,
    dateStr: new Date(check.created_at).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    callerNumber: check.caller_e164,
    bankName: bank.name,
    toEmail: bank.fraud_email,
    userName: profile?.display_name,
    userPhone: profile?.phone_e164,
    claimLabel: check.claim_label,
  });

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailData.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 sm:py-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Pill label="Emergency Bank Freeze" />
          {bank.is_demo && <DemoModeBadge />}
        </div>
        <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
          Report Incident to Bank Fraud Desk
        </h1>
        <p className="text-sm text-gray mt-1.5">
          Send an immediate transaction flag and debit alert request to your bank&apos;s fraud monitoring desk.
        </p>
      </div>

      <Card className="p-6 sm:p-8 border-2 border-border bg-surface space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray">
              Target Banking Institution
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-lg font-bold text-navy">{bank.name}</h2>
              {bank.is_demo && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-light text-navy border border-border">
                  Demo Desk
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-teal-dark mt-0.5">{bank.fraud_email}</p>
          </div>

          <div className="size-10 rounded-full bg-teal-tint text-teal-dark flex items-center justify-center shrink-0">
            <Landmark className="size-5" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            asChild
            size="lg"
            className="bg-navy hover:bg-navy-light text-white font-bold flex-1"
            onClick={() => logDraftOpened({ email: bank.fraud_email, bank: bank.name })}
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
            onClick={() => logDraftOpened({ email: bank.fraud_email, bank: bank.name, client: 'mailto' })}
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
            <span className="text-xs font-bold uppercase tracking-wider text-gray">
              Pre-Written Request Preview
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
          <p className="text-[11px] text-gray">
            Note: You can verify and fill in your specific account numbers or transaction IDs directly in Gmail before sending.
          </p>
        </div>
      </Card>

      {/* Emergency Helpline */}
      <div className="p-5 rounded-2xl bg-light border border-border flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-navy">Need Instant Stop on Ongoing Transactions?</h4>
          <p className="text-xs text-gray mt-0.5">
            Call National Cyber Crime Helpline 1930 to trigger inter-bank coordination freeze.
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

export default function BankRedirectPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-sm text-gray">Loading bank report...</div>}>
      <BankComplaintContent />
    </React.Suspense>
  );
}
