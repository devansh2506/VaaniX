import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/marketing/pill';

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasTelegram = false;
  let hasFamily = false;

  if (user) {
    const [profileRes, familyRes] = await Promise.all([
      supabase.from('profiles').select('telegram_chat_id').eq('id', user.id).single(),
      supabase.from('family_members').select('id').eq('user_id', user.id).limit(1),
    ]);

    hasTelegram = Boolean(profileRes.data?.telegram_chat_id);
    hasFamily = Boolean(familyRes.data && familyRes.data.length > 0);
  }

  // If already onboarded, redirect straight to /app/check
  if (hasTelegram && hasFamily) {
    redirect('/app/check');
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 text-center sm:text-left">
        <Pill label="Getting Started" />
        <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
          Welcome to VaaniX
        </h1>
        <p className="text-base text-gray mt-2">
          Set up 2-way scam protection for you and your family in 3 simple steps.
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1: Telegram Alerts */}
        <Card className="p-6 border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              hasTelegram ? 'bg-green-text text-white' : 'bg-teal-tint text-teal-dark'
            }`}>
              {hasTelegram ? '✓' : '1'}
            </div>
            <div>
              <h2 className="text-base font-bold text-navy">
                Link Telegram Bot
                {hasTelegram && <span className="ml-2 text-xs font-semibold text-green-text">(Connected)</span>}
              </h2>
              <p className="text-sm text-gray mt-1 leading-relaxed">
                Receive real-time ⚠️ AI scam alerts with one-tap reporting when a high-risk call is detected.
              </p>
            </div>
          </div>
          <Button asChild variant={hasTelegram ? 'outline' : 'default'} size="sm" className="shrink-0 w-full sm:w-auto">
            <Link href="/app/settings">
              {hasTelegram ? 'Manage Telegram' : 'Connect Telegram'}
            </Link>
          </Button>
        </Card>

        {/* Step 2: Family Protection */}
        <Card className="p-6 border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              hasFamily ? 'bg-green-text text-white' : 'bg-teal-tint text-teal-dark'
            }`}>
              {hasFamily ? '✓' : '2'}
            </div>
            <div>
              <h2 className="text-base font-bold text-navy">
                Add Family Members
                {hasFamily && <span className="ml-2 text-xs font-semibold text-green-text">(Added)</span>}
              </h2>
              <p className="text-sm text-gray mt-1 leading-relaxed">
                Register loved ones so the AI verifies whether the caller matches their identity and alerts them instantly if impersonated.
              </p>
            </div>
          </div>
          <Button asChild variant={hasFamily ? 'outline' : 'default'} size="sm" className="shrink-0 w-full sm:w-auto">
            <Link href="/app/family">
              {hasFamily ? 'View Family' : 'Add Member'}
            </Link>
          </Button>
        </Card>

        {/* Step 3: Run First Check */}
        <Card className="p-6 border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-tint text-teal-dark flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-navy">
                Run Your First Voice Check
              </h2>
              <p className="text-sm text-gray mt-1 leading-relaxed">
                Record a live audio snippet from your microphone or upload an audio file to inspect for AI acoustic cloning and scam urgency keywords.
              </p>
            </div>
          </div>
          <Button asChild variant="navy" size="sm" className="shrink-0 w-full sm:w-auto">
            <Link href="/app/check">
              Start Check →
            </Link>
          </Button>
        </Card>
      </div>

      <div className="mt-8 text-center sm:text-right">
        <Link
          href="/app/check"
          className="text-sm font-semibold text-teal-dark hover:underline"
        >
          Skip onboarding and go directly to Check →
        </Link>
      </div>
    </div>
  );
}
