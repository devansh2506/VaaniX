import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const complaintSchema = z.object({
  alert_id: z.string().uuid('Invalid alert ID'),
  target: z.enum(['cyber_cell', 'bank', 'portal', 'api']),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: Request) {
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

  const parseResult = complaintSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input' } },
      { status: 400 }
    );
  }

  const { alert_id, target, payload } = parseResult.data;

  // Insert complaint record
  const { data: complaint, error } = await supabase
    .from('complaints')
    .insert({
      alert_id,
      user_id: user.id,
      target,
      payload: payload as import('@/types/database').Json,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, complaint }, { status: 201 });
}
