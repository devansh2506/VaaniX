'use client';

import * as React from 'react';
import {
  Plus,
  Copy,
  Check,
  Send,
  MessageCircle,
  Trash2,
  Edit2,
  RefreshCw,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Pill } from '@/components/marketing/pill';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FamilyDiagram, type FamilyMemberItem } from '@/components/family/family-diagram';

interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  aliases: string[];
  relationship: string;
  phone_e164: string;
  telegram_chat_id: number | null;
  join_token: string;
  joined_at: string | null;
  created_at: string;
}

const RELATIONSHIPS = [
  'son',
  'daughter',
  'husband',
  'wife',
  'father',
  'mother',
  'brother',
  'sister',
  'grandson',
  'granddaughter',
  'other',
];

export default function FamilyPage() {
  const [members, setMembers] = React.useState<FamilyMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<FamilyMember | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Form states
  const [formName, setFormName] = React.useState('');
  const [formRelationship, setFormRelationship] = React.useState('son');
  const [formPhone, setFormPhone] = React.useState('');
  const [formAliases, setFormAliases] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const fetchMembers = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const res = await fetch('/api/family');
      if (!res.ok) {
        throw new Error(`Failed to load family members (${res.status})`);
      }
      const data = await res.json();
      setMembers(data.members || []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching family network');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const res = await fetch('/api/family');
        if (active && res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error fetching family network');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    // Auto-refresh every 8 seconds to reflect Telegram joins in real time
    const interval = setInterval(() => {
      fetchMembers(true);
    }, 8000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchMembers]);

  const resetForm = () => {
    setFormName('');
    setFormRelationship('son');
    setFormPhone('');
    setFormAliases('');
    setFormError(null);
    setEditingMember(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (member: FamilyMember) => {
    resetForm();
    setEditingMember(member);
    setFormName(member.name);
    setFormRelationship(member.relationship.toLowerCase());
    setFormPhone(member.phone_e164);
    setFormAliases((member.aliases || []).join(', '));
    setIsAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const aliasesArray = formAliases
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    try {
      if (editingMember) {
        // PATCH
        const res = await fetch('/api/family', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingMember.id,
            name: formName,
            relationship: formRelationship,
            phone_e164: formPhone,
            aliases: aliasesArray,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to update member');
      } else {
        // POST
        const res = await fetch('/api/family', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            relationship: formRelationship,
            phone_e164: formPhone,
            aliases: aliasesArray,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to add member');
      }

      setIsAddOpen(false);
      resetForm();
      fetchMembers(true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Save operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your family network?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/family?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete member');
      }
      fetchMembers(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleCopyLink = (memberId: string, token: string) => {
    const inviteUrl = `https://t.me/Prevent_Scambot?start=m_${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(memberId);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const diagramMembers: FamilyMemberItem[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    relationship: m.relationship,
    isJoined: Boolean(m.telegram_chat_id),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Pill label="2-Way Protection" />
          <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
            Family Network
          </h1>
          <p className="text-base text-muted mt-1.5 max-w-xl">
            When an AI clone impersonates a family member, SatyaVoice sends an instant verification check to their personal Telegram account.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMembers(true)}
            disabled={refreshing || loading}
            className="text-navy"
            title="Refresh statuses"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleOpenAdd}
            className="bg-teal hover:bg-teal-dark text-white font-bold"
          >
            <Plus className="size-4 mr-1.5" />
            Add Family Member
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-tint border border-red text-red-text text-sm flex items-center gap-3">
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Network Map */}
      <Card className="p-6 border border-border bg-surface shadow-xs text-center relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Live Protection Orbit
          </span>
          <span className="text-xs text-gray font-medium">
            {members.filter((m) => m.telegram_chat_id).length} of {members.length} connected
          </span>
        </div>

        <FamilyDiagram members={diagramMembers} />
      </Card>

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <Users className="size-5 text-teal" />
            Protected Family Members ({members.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted text-sm">
            Loading family network...
          </div>
        ) : members.length === 0 ? (
          <Card className="p-10 border border-dashed border-border bg-light text-center">
            <div className="w-14 h-14 rounded-full bg-teal-tint text-teal-dark flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              🛡
            </div>
            <h3 className="text-base font-bold text-navy mb-1">No family members registered yet</h3>
            <p className="text-sm text-muted max-w-md mx-auto mb-5">
              Add your children, spouse, or parents. They will receive an automated Telegram ping whenever an incoming call uses their voice.
            </p>
            <Button
              variant="default"
              size="default"
              onClick={handleOpenAdd}
              className="bg-teal hover:bg-teal-dark text-white font-bold"
            >
              <Plus className="size-4 mr-1.5" />
              Add First Family Member
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => {
              const isJoined = Boolean(member.telegram_chat_id);
              const inviteUrl = `https://t.me/Prevent_Scambot?start=m_${member.join_token}`;
              const whatsappShareText = `Hey ${member.name}, I'm setting up SatyaVoice to protect our family against AI voice clone scams. Tap this link to connect your Telegram so the bot can verify if someone is using your voice: ${inviteUrl}`;
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappShareText)}`;

              return (
                <Card
                  key={member.id}
                  className="p-5 border border-border bg-surface flex flex-col justify-between hover:border-teal/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-navy">{member.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-light text-navy border border-border capitalize">
                            {member.relationship}
                          </span>
                        </div>
                        <p className="text-xs text-muted font-mono mt-0.5">{member.phone_e164}</p>
                      </div>

                      {/* Joined Badge */}
                      {isJoined ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-green-tint text-green-text border border-green/30 shrink-0">
                          <Check className="size-3.5" strokeWidth={3} />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-tint text-yellow-text border border-yellow/30 shrink-0">
                          <Send className="size-3" />
                          Pending Join
                        </span>
                      )}
                    </div>

                    {/* Aliases */}
                    {member.aliases && member.aliases.length > 0 && (
                      <div className="text-xs text-muted">
                        <span className="font-medium text-gray">Aliases: </span>
                        {member.aliases.map((a, i) => (
                          <span
                            key={i}
                            className="inline-block bg-light px-1.5 py-0.5 rounded text-[11px] font-medium mr-1 text-navy border border-border/60"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pairing Box */}
                    <div className="rounded-xl border border-border/80 bg-light p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between text-gray">
                        <span className="font-semibold text-navy">Telegram Invite Link</span>
                        {isJoined && member.joined_at && (
                          <span className="text-[11px] text-muted">
                            Joined {new Date(member.joined_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg p-1.5 font-mono text-[11px] text-muted truncate">
                        <span className="truncate flex-1 select-all">{inviteUrl}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(member.id, member.join_token)}
                          className="h-8 text-xs font-semibold flex-1 border-border text-navy"
                        >
                          {copiedId === member.id ? (
                            <>
                              <Check className="size-3 mr-1 text-green" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="size-3 mr-1" />
                              Copy Link
                            </>
                          )}
                        </Button>

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-md bg-[#25D366] hover:bg-[#1EBE5D] text-white transition-colors"
                        >
                          <MessageCircle className="size-3.5 mr-1" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(member)}
                      className="h-7 text-xs text-navy border-border"
                    >
                      <Edit2 className="size-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(member.id, member.name)}
                      className="h-7 text-xs text-red border-border hover:bg-red-tint"
                    >
                      <Trash2 className="size-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Member Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-surface border border-border text-navy">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-navy">
              {editingMember ? 'Edit Family Member' : 'Add Family Member'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted">
              Add contact details and known nicknames so SatyaVoice can link voice claims and dispatch verification alerts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 rounded-lg bg-red-tint border border-red text-red-text text-xs">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="memberName" className="text-xs font-bold text-navy">
                Full Name *
              </Label>
              <Input
                id="memberName"
                placeholder="e.g. Rahul Sharma"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="bg-surface border-border text-navy"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="memberRelationship" className="text-xs font-bold text-navy">
                  Relationship *
                </Label>
                <select
                  id="memberRelationship"
                  value={formRelationship}
                  onChange={(e) => setFormRelationship(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 py-1 text-sm text-navy capitalize focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
                >
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel} className="capitalize">
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="memberPhone" className="text-xs font-bold text-navy">
                  Phone (E.164) *
                </Label>
                <Input
                  id="memberPhone"
                  placeholder="+91 98765 43210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                  className="bg-surface border-border text-navy"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memberAliases" className="text-xs font-bold text-navy">
                Aliases & Nicknames (Optional, comma-separated)
              </Label>
              <Input
                id="memberAliases"
                placeholder="e.g. Guddu, Beta, Sonny"
                value={formAliases}
                onChange={(e) => setFormAliases(e.target.value)}
                className="bg-surface border-border text-navy"
              />
              <p className="text-[11px] text-muted">
                Words the scammer might use when claiming to be them (e.g. &ldquo;Mummy, main Guddu bol raha hoon&rdquo;).
              </p>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={submitting}
                className="border-border text-navy"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-teal hover:bg-teal-dark text-white font-bold"
              >
                {submitting ? 'Saving...' : editingMember ? 'Save Changes' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
