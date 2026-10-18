import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateApiKey, DEFAULT_SCOPES } from '@/lib/api-keys';

const createKeySchema = z.object({
  name: z.string().trim().min(1, 'Key name is required').max(64, 'Key name too long'),
  scopes: z.array(z.enum(['checks:create', 'checks:read', 'evidence', 'complaint', 'radar'])).optional(),
});

export async function GET() {
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

  const { data: keys, error } = await supabase
    .from('api_clients')
    .select('id, name, key_prefix, scopes, created_at, last_used_at, revoked_at, request_count')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ keys: keys ?? [] });
}

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

  const parseResult = createKeySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input' } },
      { status: 400 }
    );
  }

  const { name, scopes } = parseResult.data;
  const keyScopes = scopes && scopes.length > 0 ? scopes : DEFAULT_SCOPES;

  const generated = generateApiKey();

  const { data: keyRecord, error } = await supabase
    .from('api_clients')
    .insert({
      owner_user_id: user.id,
      name,
      key_prefix: generated.keyPrefix,
      key_hash: generated.keyHash,
      scopes: keyScopes,
    })
    .select('id, name, key_prefix, scopes, created_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: keyRecord.id,
    name: keyRecord.name,
    key: generated.plaintext, // Displayed ONLY ONCE upon creation
    key_prefix: keyRecord.key_prefix,
    scopes: keyRecord.scopes,
    created_at: keyRecord.created_at,
  }, { status: 201 });
}

export async function DELETE(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Key ID is required' } },
      { status: 400 }
    );
  }

  const { data: updated, error } = await supabase
    .from('api_clients')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .select('id, revoked_at')
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, revoked_at: updated.revoked_at });
}
