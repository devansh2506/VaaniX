'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pill } from '@/components/marketing/pill';

interface CyberCell {
  state_code: string;
  state_name: string;
  verified: boolean;
}

interface Bank {
  id: string;
  name: string;
  is_demo: boolean;
}

interface Profile {
  id: string;
  display_name: string | null;
  phone_e164: string | null;
  state_code: string | null;
  bank_id: string | null;
  telegram_chat_id: number | null;
  telegram_link_token: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [states, setStates] = React.useState<CyberCell[]>([]);
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form fields
  const [displayName, setDisplayName] = React.useState('');
  const [phoneE164, setPhoneE164] = React.useState('');
  const [selectedState, setSelectedState] = React.useState('');
  const [selectedBank, setSelectedBank] = React.useState('');

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteInput, setDeleteInput] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) {
          throw new Error('Failed to load profile settings');
        }
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setDisplayName(data.profile.display_name || '');
          setPhoneE164(data.profile.phone_e164 || '');
          setSelectedState(data.profile.state_code || '');
          setSelectedBank(data.profile.bank_id || '');
        }
        setStates(data.states || []);
        setBanks(data.banks || []);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Error loading settings');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus('idle');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          phone_e164: phoneE164 || null,
          state_code: selectedState || null,
          bank_id: selectedBank || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to update profile');
      }

      setSaveStatus('success');
      setProfile(result.profile);
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err: unknown) {
      setSaveStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteData = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);

    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Deletion failed');
      }
      router.push('/login?message=account_deleted');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  const telegramLink = profile?.telegram_link_token
    ? `https://t.me/Prevent_Scambot?start=u_${profile.telegram_link_token}`
    : 'https://t.me/Prevent_Scambot';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-muted">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Pill label="Settings & Preferences" />
        <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
          Account & Alert Settings
        </h1>
        <p className="text-base text-muted mt-2">
          Configure real-time Telegram notification channels, jurisdiction routing, and profile details.
        </p>
      </div>

      {saveStatus === 'success' && (
        <div className="p-4 rounded-xl bg-teal-tint/60 border border-teal/30 text-teal-dark font-medium text-sm flex items-center gap-2">
          <span>✓</span> Settings saved successfully.
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-tint border border-red/20 text-red font-medium text-sm">
          {errorMessage}
        </div>
      )}

      {/* 1. Telegram Connection Card */}
      <Card className="p-6 sm:p-8 border border-border bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-navy">Telegram Alert Dispatch</h2>
              {profile?.telegram_chat_id ? (
                <Badge variant="teal">Connected</Badge>
              ) : (
                <Badge variant="outline">Not Linked</Badge>
              )}
            </div>
            <p className="text-sm text-muted mt-1 leading-relaxed">
              When high-risk AI voice clones are identified, instant alerts with one-tap reporting actions are dispatched via the bot.
            </p>
          </div>

          <div className="shrink-0">
            {profile?.telegram_chat_id ? (
              <span className="text-xs font-mono text-muted bg-light px-3 py-1.5 rounded-lg border border-border">
                Chat ID: {profile.telegram_chat_id}
              </span>
            ) : (
              <Button asChild variant="navy" size="sm">
                <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                  Connect Telegram Bot ↗
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="pt-6">
          <p className="text-xs font-bold text-navy uppercase tracking-wider mb-2">
            Your Personal Pairing Link
          </p>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={telegramLink}
              className="flex-1 bg-light border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-navy select-all"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(telegramLink);
                alert('Copied Telegram link to clipboard!');
              }}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-faint mt-2">
            Clicking the link will open @Prevent_Scambot with your unique pairing token <code className="font-mono text-navy">u_{profile?.telegram_link_token?.slice(0, 8)}...</code>.
          </p>
        </div>
      </Card>

      {/* 2. Profile and Jurisdiction Preferences */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 sm:p-8 border border-border bg-surface space-y-6">
          <h2 className="text-lg font-bold text-navy">Personal & Jurisdiction Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="display_name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Display Name
              </label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Devansh Kedia"
              />
            </div>

            <div>
              <label htmlFor="phone_e164" className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Your Phone Number (E.164)
              </label>
              <Input
                id="phone_e164"
                value={phoneE164}
                onChange={(e) => setPhoneE164(e.target.value)}
                placeholder="+919876543210"
              />
              <p className="text-xs text-faint mt-1">
                Prefills the complainant phone number in draft cyber crime complaint emails.
              </p>
            </div>

            <div>
              <label htmlFor="state_code" className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Your State / UT (For Cyber Cell Reports)
              </label>
              <select
                id="state_code"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-base text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-dark"
              >
                <option value="">Select your state...</option>
                {states.map((st) => (
                  <option key={st.state_code} value={st.state_code}>
                    {st.state_name} ({st.state_code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-faint mt-1">
                Used to route draft complaints to state-specific cyber police portals and verified contacts.
              </p>
            </div>

            <div>
              <label htmlFor="bank_id" className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Primary Bank (For Fraud Freezes)
              </label>
              <select
                id="bank_id"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-base text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-dark"
              >
                <option value="">Select bank...</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.is_demo ? '(Demo)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-faint mt-1">
                Bank fraud department email for one-tap freeze request drafts.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" variant="default" disabled={saving}>
              {saving ? 'Saving Changes...' : 'Save Preferences'}
            </Button>
          </div>
        </Card>
      </form>

      {/* 3. Danger Zone: Delete My Data */}
      <Card className="p-6 sm:p-8 border border-red/30 bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-red">Delete My Data (Right to Erasure)</h2>
            <p className="text-sm text-muted mt-1 leading-relaxed">
              In accordance with India’s Digital Personal Data Protection (DPDP) Act, permanently purge your account, all check recordings, registered family profiles, alerts, and draft complaint logs.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="shrink-0"
          >
            Delete My Data
          </Button>
        </div>

        {deleteConfirmOpen && (
          <div className="mt-6 pt-6 border-t border-red/20 space-y-4">
            <p className="text-sm font-semibold text-navy">
              This action cannot be undone. Type <code className="bg-red-tint px-2 py-0.5 rounded text-red font-mono">DELETE</code> below to confirm permanent deletion:
            </p>
            <div className="flex items-center gap-3">
              <Input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="max-w-xs border-red/40"
              />
              <Button
                type="button"
                variant="danger"
                disabled={deleteInput !== 'DELETE' || deleting}
                onClick={handleDeleteData}
              >
                {deleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteInput('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
