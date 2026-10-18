'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Key,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Code2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Pill } from '@/components/marketing/pill';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ALL_SCOPES, DEFAULT_SCOPES, type ApiScope } from '@/lib/api-keys';

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  request_count: number;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = React.useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Creation form state
  const [isCreating, setIsCreating] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [selectedScopes, setSelectedScopes] = React.useState<ApiScope[]>(DEFAULT_SCOPES);
  const [createSubmitting, setCreateSubmitting] = React.useState(false);

  // New key display banner
  const [newlyCreatedKey, setNewlyCreatedKey] = React.useState<{
    name: string;
    key: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = React.useState(false);

  // Revocation state
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  const loadKeys = React.useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/keys');
      if (!res.ok) {
        throw new Error('Failed to load API keys');
      }
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading keys');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    fetch('/api/keys')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load API keys');
        return res.json();
      })
      .then((data) => {
        if (active) {
          setKeys(data.keys || []);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error loading keys');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      setCreateSubmitting(true);
      setError(null);

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: selectedScopes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to create API key');
      }

      setNewlyCreatedKey({
        name: data.name,
        key: data.key,
      });

      setNewKeyName('');
      setSelectedScopes(DEFAULT_SCOPES);
      setIsCreating(false);
      loadKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action is immediate and permanent.')) {
      return;
    }

    try {
      setRevokingId(id);
      const res = await fetch(`/api/keys?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || 'Failed to revoke key');
      }

      loadKeys();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setRevokingId(null);
    }
  };

  const toggleScope = (scope: ApiScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Pill label="Developer Access" />
          <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
            API Keys & Integrations
          </h1>
          <p className="text-base text-muted mt-2">
            Generate and manage API keys for telecommunication and enterprise call center integrations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/developers" className="flex items-center gap-1.5">
              <span>Documentation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Button>
          {!isCreating && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-teal hover:bg-teal-dark text-white font-semibold"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Generate New Key
            </Button>
          )}
        </div>
      </div>

      {/* Alert Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Newly Created Key Modal / Banner */}
      {newlyCreatedKey && (
        <Card className="p-6 border-2 border-teal bg-teal-tint/20 rounded-2xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-teal-dark font-bold text-lg">
              <CheckCircle2 className="w-6 h-6 text-teal" />
              <span>API Key Created: {newlyCreatedKey.name}</span>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-xs text-muted hover:text-navy underline"
            >
              Dismiss
            </button>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Save this key now. For your security, this key will <strong>never be shown again</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={newlyCreatedKey.key}
              className="flex-1 font-mono text-sm bg-white border border-border rounded-xl px-4 py-2.5 text-navy select-all focus:outline-none"
            />
            <Button
              onClick={() => copyToClipboard(newlyCreatedKey.key)}
              className="bg-navy hover:bg-navy-light text-white font-semibold"
            >
              {copiedKey ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-teal" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copy Key
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Create Key Card */}
      {isCreating && (
        <Card className="p-6 border border-border bg-surface rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <Key className="w-5 h-5 text-teal" /> Generate API Key
            </h2>
            <button
              onClick={() => setIsCreating(false)}
              className="text-sm text-muted hover:text-navy"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateKey} className="space-y-4">
            <div>
              <label htmlFor="keyName" className="block text-sm font-semibold text-navy mb-1.5">
                Key Label / Application Name
              </label>
              <input
                id="keyName"
                type="text"
                required
                placeholder="e.g. Call Center Live Monitor or Production Gateway"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-light border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <div>
              <span className="block text-sm font-semibold text-navy mb-2">Granted Scopes</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {ALL_SCOPES.map((scope) => {
                  const checked = selectedScopes.includes(scope);
                  return (
                    <label
                      key={scope}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'border-teal bg-teal-tint/30 text-navy font-medium'
                          : 'border-border bg-light text-muted hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleScope(scope)}
                        className="mt-0.5 rounded text-teal focus:ring-teal"
                      />
                      <div>
                        <div className="font-mono text-xs">{scope}</div>
                        <div className="text-xs text-muted">
                          {scope === 'checks:create' && 'Run voice cloning checks'}
                          {scope === 'checks:read' && 'Query past analysis verdicts'}
                          {scope === 'evidence' && 'Download flagged audio evidence'}
                          {scope === 'complaint' && 'Access structured complaint JSON'}
                          {scope === 'radar' && 'High rate-limit scam number radar'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSubmitting || !newKeyName.trim()}
                className="bg-teal hover:bg-teal-dark text-white font-semibold"
                size="sm"
              >
                {createSubmitting ? 'Generating...' : 'Create Key'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Keys Table */}
      <Card className="border border-border bg-surface rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal" /> Active & Revoked API Keys
          </h2>
          <span className="text-xs text-muted">
            {keys.length} key{keys.length === 1 ? '' : 's'} registered
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading your API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-light text-muted flex items-center justify-center mx-auto text-xl">
              🔑
            </div>
            <p className="text-sm font-semibold text-navy">No API keys created yet</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Generate an API key to connect your phone PBX, telecom gateway, or test the laptop detection pipeline.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-light/60 text-xs text-muted border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Name & Prefix</th>
                  <th className="py-3 px-4 font-semibold">Scopes</th>
                  <th className="py-3 px-4 font-semibold">Requests</th>
                  <th className="py-3 px-4 font-semibold">Last Used</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((k) => {
                  const isRevoked = Boolean(k.revoked_at);
                  return (
                    <tr key={k.id} className={isRevoked ? 'bg-light/40 opacity-60' : 'hover:bg-light/30'}>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-navy">{k.name}</div>
                        <div className="font-mono text-xs text-muted">{k.key_prefix}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {k.scopes.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-light border border-border text-slate-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-navy">
                        {k.request_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted">
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        {isRevoked ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Revoked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isRevoked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={revokingId === k.id}
                            onClick={() => handleRevokeKey(k.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Integration Code Snippet */}
      <Card className="p-6 border border-border bg-surface rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-navy font-bold text-sm">
          <Code2 className="w-4 h-4 text-teal" />
          <span>Quick cURL Verification</span>
        </div>
        <p className="text-xs text-muted">
          Test your generated API key using our v1 analyze endpoint:
        </p>
        <pre className="p-4 bg-navy text-teal-tint font-mono text-xs rounded-xl overflow-x-auto leading-relaxed">
{`curl -X POST "http://localhost:3000/api/v1/analyze" \\
  -H "Authorization: Bearer vx_live_YOUR_KEY_HERE" \\
  -F "audio=@sample_call.wav;type=audio/wav" \\
  -F "caller_e164=+919876543210"`}
        </pre>
      </Card>
    </div>
  );
}
