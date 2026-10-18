import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

  // 1. Fetch Alert (by alert ID or associated check ID)
  let { data: alert } = await supabase
    .from('alerts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!alert) {
    const { data: alertByCheck } = await supabase
      .from('alerts')
      .select('*')
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

  // 2. Fetch Check Details
  const { data: check } = await supabase
    .from('checks')
    .select('*')
    .eq('id', alert.check_id)
    .single();

  // 3. Fetch Impersonated Member if assigned
  let member = null;
  if (alert.impersonated_member_id) {
    const { data: memberData } = await supabase
      .from('family_members')
      .select('id, name, relationship, phone_e164, telegram_chat_id, joined_at')
      .eq('id', alert.impersonated_member_id)
      .single();
    member = memberData;
  }

  // 4. Fetch Alert Messages
  const { data: messages } = await supabase
    .from('alert_messages')
    .select('*')
    .eq('alert_id', id)
    .order('sent_at', { ascending: true });

  // 5. Fetch Complaints
  const { data: complaints } = await supabase
    .from('complaints')
    .select('*')
    .eq('alert_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    ok: true,
    alert,
    check,
    member,
    messages: messages || [],
    complaints: complaints || [],
  });
}
