import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { dispatch2WayAlerts } from '@/lib/telegram/bot';

const claimSchema = z.object({
  member_id: z.string().uuid('Invalid family member ID'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid JSON payload' } },
      { status: 400 }
    );
  }

  const parseResult = claimSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input' } },
      { status: 400 }
    );
  }

  const { member_id } = parseResult.data;

  // 1. Verify Member belongs to user
  const { data: member, error: memberError } = await supabase
    .from('family_members')
    .select('id, name, relationship, telegram_chat_id')
    .eq('id', member_id)
    .eq('user_id', user.id)
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Family member not found' } },
      { status: 404 }
    );
  }

  // 2. Verify Alert exists and belongs to user (by alert ID or check ID)
  let { data: alert } = await supabase
    .from('alerts')
    .select('id, check_id, user_id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!alert) {
    const { data: alertByCheck } = await supabase
      .from('alerts')
      .select('id, check_id, user_id, status')
      .eq('check_id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    alert = alertByCheck;
  }

  if (!alert) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Alert not found' } },
      { status: 404 }
    );
  }

  // 3. Update alert impersonated_member_id
  await supabase
    .from('alerts')
    .update({
      impersonated_member_id: member.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alert.id);

  // 4. Update check claimed_member_id & claim_label
  const claimLabel = `${member.name} (${member.relationship})`;
  await supabase
    .from('checks')
    .update({
      claimed_member_id: member.id,
      claim_type: 'family',
      claim_label: claimLabel,
    })
    .eq('id', alert.check_id);

  // 5. If member has Telegram and alert is still open, attempt to dispatch member verification message
  let memberAlertSent: boolean | null = null;
  if (member.telegram_chat_id && alert.status === 'open') {
    const { data: check } = await supabase
      .from('checks')
      .select('caller_e164, risk_score, scam_words, scam_type, is_stub')
      .eq('id', alert.check_id)
      .single();

    if (check && !check.is_stub) {
      try {
        const dispatchRes = await dispatch2WayAlerts({
          alertId: alert.id,
          checkId: alert.check_id,
          userId: user.id,
          callerNumber: check.caller_e164,
          riskScore: check.risk_score,
          claimLabel,
          scamWords: check.scam_words || [],
          scamType: check.scam_type,
          impersonatedMemberId: member.id,
        });
        memberAlertSent = dispatchRes.memberTelegramOk;
      } catch (dispatchErr) {
        console.error('[alerts/claim] telegram dispatch error:', dispatchErr);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    claimed: {
      memberId: member.id,
      memberName: member.name,
      relationship: member.relationship,
      telegramSent: memberAlertSent,
    },
  });
}
