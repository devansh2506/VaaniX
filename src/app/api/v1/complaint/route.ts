import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-v1-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const complaintQuerySchema = z.object({
  alert_id: z.string().uuid('Invalid alert ID'),
});

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request, 'complaint');
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Expected JSON body with alert_id' } },
      { status: 400 }
    );
  }

  const parseResult = complaintQuerySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input' } },
      { status: 400 }
    );
  }

  const { alert_id } = parseResult.data;
  const admin = createAdminClient();

  const { data: alert, error: alertErr } = await admin
    .from('alerts')
    .select('id, check_id, user_id, status, impersonated_member_id, member_response, created_at')
    .eq('id', alert_id)
    .single();

  if (alertErr || !alert) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Alert incident not found' } },
      { status: 404 }
    );
  }

  const { data: check, error: checkErr } = await admin
    .from('checks')
    .select('*')
    .eq('id', alert.check_id)
    .single();

  if (checkErr || !check) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Check associated with alert not found' } },
      { status: 404 }
    );
  }

  // Generate signed evidence download URL if audio was captured
  let evidenceDownloadUrl: string | null = null;
  if (check.audio_path) {
    const storagePath = check.audio_path.replace(/^evidence\//, '');
    const { data: signedData } = await admin.storage
      .from('evidence')
      .createSignedUrl(storagePath, 7 * 24 * 3600);
    evidenceDownloadUrl = signedData?.signedUrl || null;
  }

  return NextResponse.json({
    complaint: {
      incident_id: alert.id,
      alert_id: alert.id,
      check_id: check.id,
      generated_at: new Date().toISOString(),
      incident_timestamp: check.created_at,
      caller_phone: check.caller_e164,
      verdict: check.verdict,
      risk_score: check.risk_score,
      voice_score: check.voice_score,
      text_score: check.text_score,
      impersonation: {
        claimed_label: check.claim_label,
        claim_type: check.claim_type,
        member_response: alert.member_response,
        incident_status: alert.status,
      },
      transcript: check.transcript,
      scam_words: check.scam_words,
      scam_category: check.scam_type,
      digital_forensics: {
        evidence_id: check.id,
        audio_sha256: check.audio_sha256,
        evidence_download_url: evidenceDownloadUrl,
        retention_days: 30,
      },
    },
  });
}
