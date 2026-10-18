import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { normalizePhoneE164 } from '@/lib/phone';

const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  relationship: z.string().min(1, 'Relationship is required').max(50),
  phone_e164: z.string().min(6, 'Valid phone number is required'),
  aliases: z.array(z.string()).optional().default([]),
});

const updateMemberSchema = z.object({
  id: z.string().uuid('Invalid member ID'),
  name: z.string().min(1).max(100).optional(),
  relationship: z.string().min(1).max(50).optional(),
  phone_e164: z.string().min(6).optional(),
  aliases: z.array(z.string()).optional(),
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

  const { data: members, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, members: members || [] });
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

  const parseResult = createMemberSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input' } },
      { status: 400 }
    );
  }

  const { name, relationship, phone_e164, aliases } = parseResult.data;
  const normalizedPhone = normalizePhoneE164(phone_e164);
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: { code: 'INVALID_PHONE', message: 'Invalid phone number format' } },
      { status: 400 }
    );
  }

  const joinToken = crypto.randomBytes(16).toString('hex'); // 32-char hex string: [A-Za-z0-9_-] <= 64 chars

  const cleanedAliases = (aliases || [])
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  const { data: newMember, error } = await supabase
    .from('family_members')
    .insert({
      user_id: user.id,
      name: name.trim(),
      relationship: relationship.trim(),
      phone_e164: normalizedPhone,
      aliases: cleanedAliases,
      join_token: joinToken,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, member: newMember }, { status: 201 });
}

export async function PATCH(request: Request) {
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

  const parseResult = updateMemberSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input' } },
      { status: 400 }
    );
  }

  const { id, name, relationship, phone_e164, aliases } = parseResult.data;
  const updates: import('@/types/database').Database['public']['Tables']['family_members']['Update'] = {};

  if (name !== undefined) updates.name = name.trim();
  if (relationship !== undefined) updates.relationship = relationship.trim();
  if (phone_e164 !== undefined) {
    const norm = normalizePhoneE164(phone_e164);
    if (!norm) {
      return NextResponse.json(
        { error: { code: 'INVALID_PHONE', message: 'Invalid phone number format' } },
        { status: 400 }
      );
    }
    updates.phone_e164 = norm;
  }
  if (aliases !== undefined) {
    updates.aliases = aliases.map((a) => a.trim()).filter((a) => a.length > 0);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: { code: 'NO_UPDATES', message: 'No fields provided to update' } },
      { status: 400 }
    );
  }

  const { data: updatedMember, error } = await supabase
    .from('family_members')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, member: updatedMember });
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

  let id: string | null = null;
  const url = new URL(request.url);
  id = url.searchParams.get('id');

  if (!id) {
    try {
      const body = await request.json();
      if (body && typeof body.id === 'string') {
        id = body.id;
      }
    } catch {
      // url search param fallback
    }
  }

  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_ID', message: 'Member ID is required to delete' } },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: 'Member deleted' });
}
