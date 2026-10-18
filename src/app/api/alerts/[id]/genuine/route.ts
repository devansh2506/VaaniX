import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // 1. Fetch Alert (by alert ID or check ID)
  let { data: alert } = await supabase
    .from('alerts')
    .select('id, check_id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!alert) {
    const { data: alertByCheck } = await supabase
      .from('alerts')
      .select('id, check_id, user_id')
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

  // 2. Update Alert Status
  const { error: updateError } = await supabase
    .from('alerts')
    .update({
      status: 'dismissed_genuine',
      updated_at: new Date().toISOString(),
    })
    .eq('id', alert.id)
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: updateError.message } },
      { status: 500 }
    );
  }

  // 3. Insert Feedback
  try {
    await supabase.from('feedback').insert({
      check_id: alert.check_id,
      user_id: user.id,
      label: 'genuine',
    });
  } catch (fErr) {
    console.warn('[alerts/genuine] feedback insert note:', fErr);
  }

  // 4. Exclude from Scam Radar
  try {
    await supabase
      .from('radar_reports')
      .update({ excluded: true })
      .eq('check_id', alert.check_id);
  } catch (rErr) {
    console.warn('[alerts/genuine] radar report exclude note:', rErr);
  }

  return NextResponse.json({
    ok: true,
    status: 'dismissed_genuine',
    message: 'Alert marked as genuine and excluded from Scam Radar.',
  });
}
