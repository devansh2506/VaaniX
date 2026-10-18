import { NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-v1-auth';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const auth = await authenticateApiKey(request, 'evidence');
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'Evidence ID or Check ID required' } },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Try lookup as check_id first
  let { data: check } = await admin
    .from('checks')
    .select('id, user_id, audio_path, audio_sha256, verdict, risk_score, caller_e164, created_at')
    .eq('id', id)
    .single();

  // If not found as check_id, try lookup as alert_id
  if (!check) {
    const { data: alert } = await admin
      .from('alerts')
      .select('check_id')
      .eq('id', id)
      .single();

    if (alert?.check_id) {
      const { data: checkFromAlert } = await admin
        .from('checks')
        .select('id, user_id, audio_path, audio_sha256, verdict, risk_score, caller_e164, created_at')
        .eq('id', alert.check_id)
        .single();
      check = checkFromAlert;
    }
  }

  if (!check) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Check or alert not found' } },
      { status: 404 }
    );
  }

  if (!check.audio_path) {
    return NextResponse.json(
      { error: { code: 'NO_EVIDENCE', message: 'No stored audio evidence exists for this check' } },
      { status: 404 }
    );
  }

  // Generate 7-day signed download URL from Supabase storage
  const storagePath = check.audio_path.replace(/^evidence\//, '');
  const expiresInSeconds = 7 * 24 * 3600;

  const { data: signedData, error: signError } = await admin.storage
    .from('evidence')
    .createSignedUrl(storagePath, expiresInSeconds);

  if (signError || !signedData?.signedUrl) {
    return NextResponse.json(
      { error: { code: 'STORAGE_ERROR', message: signError?.message || 'Failed to generate signed URL' } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    evidence: {
      check_id: check.id,
      audio_sha256: check.audio_sha256,
      audio_path: check.audio_path,
      verdict: check.verdict,
      risk_score: check.risk_score,
      caller_e164: check.caller_e164,
      download_url: signedData.signedUrl,
      expires_in_seconds: expiresInSeconds,
      created_at: check.created_at,
    },
  });
}
