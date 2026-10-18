import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const updateProfileSchema = z.object({
  display_name: z.string().trim().max(100).optional(),
  phone_e164: z.string().trim().max(20).optional().nullable(),
  state_code: z.string().trim().max(5).optional().nullable(),
  bank_id: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  const [profileRes, statesRes, banksRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('cyber_cells').select('state_code, state_name, verified').order('state_name'),
    supabase.from('banks').select('id, name, is_demo').order('name'),
  ]);

  return NextResponse.json({
    profile: profileRes.data,
    states: statesRes.data || [],
    banks: banksRes.data || [],
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.parse(body);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: parsed.display_name,
        phone_e164: parsed.phone_e164,
        state_code: parsed.state_code,
        bank_id: parsed.bank_id,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 400 });
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message } }, { status: 400 });
  }
}
