'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/marketing/pill';
import { formatPhoneReadable } from '@/lib/phone';
import { DemoModeBadge } from '@/components/check/demo-mode-badge';
import type { Database } from '@/types/database';

type CheckRow = Database['public']['Tables']['checks']['Row'];

export default function HistoryPage() {
  const [checks, setChecks] = React.useState<CheckRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      setLoading(true);
      try {
        const url = new URL('/api/checks', window.location.origin);
        if (filter !== 'all') {
          url.searchParams.set('verdict', filter);
        }
        url.searchParams.set('page', page.toString());
        url.searchParams.set('limit', '20');

        const res = await fetch(url.toString());
        if (res.ok && !ignore) {
          const data = await res.json();
          setChecks(data.checks || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load check history:', err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [filter, page]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Pill label="Verification Logs" />
          <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
            Check History
          </h1>
          <p className="text-base text-gray mt-2">
            Review past voice analyses, deepfake acoustic scores, transcripts, and alerts.
          </p>
        </div>

        <Button asChild variant="default" size="sm">
          <Link href="/app/check">+ New Voice Check</Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-gray mr-2">Filter:</span>
        {[
          { id: 'all', label: 'All Checks' },
          { id: 'AI_CLONE', label: '⚠️ AI Clones' },
          { id: 'REAL', label: '✓ Real Voices' },
          { id: 'INCONCLUSIVE', label: 'Inconclusive' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleFilterChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              filter === tab.id
                ? 'bg-navy text-white'
                : 'bg-light text-gray hover:text-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Checks List */}
      {loading ? (
        <Card className="p-12 text-center text-gray border border-border bg-surface">
          Loading past checks...
        </Card>
      ) : checks.length === 0 ? (
        <Card className="p-12 border border-border bg-surface text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-light text-gray flex items-center justify-center mx-auto text-xl font-bold">
            📋
          </div>
          <h2 className="text-lg font-bold text-navy">No voice checks logged yet</h2>
          <p className="text-sm text-gray max-w-sm mx-auto">
            {filter === 'all'
              ? 'Run your first check using your microphone or an audio file to log detection results.'
              : `No checks matching filter "${filter}".`}
          </p>
          <Button asChild variant="navy" size="sm">
            <Link href="/app/check">Start a Check</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {checks.map((c) => {
            const dateStr = new Date(c.created_at).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <Card
                key={c.id}
                className="p-5 sm:p-6 border border-border bg-surface hover:border-teal/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Verdict, Source, Time */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {c.verdict === 'AI_CLONE' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-tint text-red border border-red/30">
                          ⚠️ AI VOICE DETECTED
                        </span>
                      ) : c.verdict === 'REAL' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-tint text-green-text border border-green/30">
                          ✓ Real Voice
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-light text-gray border border-border">
                          Be Careful (Inconclusive)
                        </span>
                      )}

                      {c.is_stub && <DemoModeBadge />}

                      <span className="text-xs text-gray font-mono">{dateStr}</span>
                    </div>

                    <div className="text-sm font-semibold text-navy flex items-center gap-2">
                      <span>Caller: {formatPhoneReadable(c.caller_e164)}</span>
                      {c.claim_label && (
                        <span className="text-xs font-medium text-red bg-red-tint/60 px-2 py-0.5 rounded">
                          Claimed to be {c.claim_label}
                        </span>
                      )}
                    </div>

                    {c.transcript && (
                      <p className="text-xs text-gray line-clamp-2 max-w-xl italic">
                        &ldquo;{c.transcript}&rdquo;
                      </p>
                    )}

                    {c.verdict === 'AI_CLONE' && (
                      <div className="pt-1">
                        <Link
                          href={`/app/alerts/${c.id}`}
                          className="inline-flex items-center text-xs font-bold text-teal hover:text-teal-dark hover:underline"
                        >
                          View Alert & 2-Way Status →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Right: Scores */}
                  <div className="sm:text-right shrink-0">
                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between gap-1">
                      <span className="text-xs text-gray uppercase font-bold tracking-wider">Risk Score</span>
                      <span
                        className={`text-2xl font-extrabold font-mono ${
                          c.risk_score >= 60
                            ? 'text-red'
                            : c.risk_score >= 30
                            ? 'text-gray'
                            : 'text-green-text'
                        }`}
                      >
                        {c.risk_score} / 100
                      </span>
                    </div>
                    <div className="text-xs text-faint mt-1">
                      Voice: {c.voice_score} · Transcript: {c.text_score}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Pagination Controls */}
          {total > 20 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-gray">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} checks
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * 20 >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
