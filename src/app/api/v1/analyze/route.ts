import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { authenticateApiKey } from '@/lib/api-v1-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyzeAudioWithModel } from '@/lib/model-client';
import { calculateRiskScore } from '@/lib/scoring/config';
import { normalizePhoneE164 } from '@/lib/phone';
import { dispatch2WayAlerts } from '@/lib/telegram/bot';

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request, 'checks:create');
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = auth.client.owner_user_id;
  const admin = createAdminClient();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Expected multipart/form-data request' } },
      { status: 400 }
    );
  }

  const audioEntry = formData.get('audio');
  if (!audioEntry || !(audioEntry instanceof Blob)) {
    return NextResponse.json(
      { error: { code: 'MISSING_AUDIO', message: "Missing 'audio' file chunk in multipart request" } },
      { status: 400 }
    );
  }

  const rawCallerNumber = (formData.get('caller_e164') as string) || (formData.get('caller_number') as string) || null;
  const callerNumber = rawCallerNumber ? normalizePhoneE164(rawCallerNumber) : null;

  // 1. Fetch user's family members context for claim verification
  const { data: familyMembers } = await admin
    .from('family_members')
    .select('id, name, aliases, relationship')
    .eq('user_id', userId);

  const familyContext = (familyMembers || []).map((m) => ({
    id: m.id,
    name: m.name,
    aliases: m.aliases || [],
    relationship: m.relationship,
  }));

  // 2. Call local/tunneled Python model server
  const modelRes = await analyzeAudioWithModel(audioEntry, 'audio.wav', familyContext);

  if (!modelRes.ok) {
    if (modelRes.error === 'OFFLINE') {
      return NextResponse.json(
        { error: { code: 'MODEL_OFFLINE', message: modelRes.message } },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: { code: modelRes.error, message: modelRes.message } },
      { status: 500 }
    );
  }

  const modelData = modelRes.data;
  const isStub = Boolean(modelData.voice.stub);
  const voiceScore = modelData.voice.spoof_prob;
  const textScore = modelData.text_analysis.text_score;
  const hasSpeech = Boolean(modelData.transcript.text && modelData.transcript.text.trim().length > 0);

  // 3. Compute combined score and verdict using Section 6 formula
  const scoreResult = calculateRiskScore(voiceScore, textScore, hasSpeech);

  // 4. Compute audio SHA-256 hash
  const audioBuffer = Buffer.from(await audioEntry.arrayBuffer());
  const audioSha256 = crypto.createHash('sha256').update(audioBuffer).digest('hex');

  // 5. Insert check record into database
  const claimData = modelData.text_analysis.claim;
  const { data: newCheck, error: insertError } = await admin
    .from('checks')
    .insert({
      user_id: userId,
      source: 'api',
      caller_e164: callerNumber,
      voice_score: scoreResult.voiceScore,
      text_score: scoreResult.textScore,
      risk_score: scoreResult.riskScore,
      verdict: scoreResult.verdict,
      is_stub: isStub,
      transcript: modelData.transcript.text,
      transcript_lang: modelData.transcript.language,
      transcript_segments: modelData.transcript.segments as unknown as import('@/types/database').Json,
      scam_groups: modelData.text_analysis.groups,
      scam_words: modelData.text_analysis.matched_words,
      scam_type: modelData.text_analysis.groups[0] || null,
      claim_type: claimData.type,
      claim_label: claimData.label,
      claimed_member_id: claimData.member_id,
      audio_sha256: audioSha256,
      timings_ms: modelData.timings_ms as unknown as import('@/types/database').Json,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: insertError.message } }, { status: 500 });
  }

  const checkId = newCheck.id;
  let audioPath: string | null = null;
  let alertId: string | null = null;

  // 6. If AI_CLONE: Upload evidence, create alert, add Scam Radar report (only for non-stub checks)
  if (scoreResult.verdict === 'AI_CLONE') {
    audioPath = `evidence/${userId}/${checkId}.wav`;

    try {
      await admin.storage
        .from('evidence')
        .upload(`${userId}/${checkId}.wav`, audioBuffer, {
          contentType: 'audio/wav',
          upsert: true,
        });

      await admin
        .from('checks')
        .update({ audio_path: audioPath })
        .eq('id', checkId);
    } catch (uploadErr) {
      console.error('[api/v1/analyze] evidence upload failed:', uploadErr);
    }

    const { data: alertRecord } = await admin
      .from('alerts')
      .insert({
        check_id: checkId,
        user_id: userId,
        status: 'open',
        impersonated_member_id: claimData.member_id,
      })
      .select()
      .single();

    if (alertRecord) {
      alertId = alertRecord.id;
      if (!isStub) {
        try {
          await dispatch2WayAlerts({
            alertId: alertRecord.id,
            checkId,
            userId,
            callerNumber,
            riskScore: scoreResult.riskScore,
            claimLabel: claimData.label,
            scamWords: modelData.text_analysis.matched_words,
            scamType: modelData.text_analysis.groups[0] || null,
            impersonatedMemberId: claimData.member_id,
          });
        } catch (dispatchErr) {
          console.error('[api/v1/analyze] telegram dispatch error:', dispatchErr);
        }
      }
    }

    if (callerNumber && !isStub) {
      try {
        await admin.from('radar_reports').insert({
          number_e164: callerNumber,
          reporter_user_id: userId,
          source: 'ai_flag',
          check_id: checkId,
          scam_type: modelData.text_analysis.groups[0] || 'voice_clone',
        });
      } catch (radarErr) {
        console.error('[api/v1/analyze] radar insert error:', radarErr);
      }
    }
  }

  return NextResponse.json({
    check: {
      id: checkId,
      verdict: scoreResult.verdict,
      riskScore: scoreResult.riskScore,
      voiceScore: scoreResult.voiceScore,
      textScore: scoreResult.textScore,
      isStub,
      transcript: modelData.transcript.text,
      transcriptLanguage: modelData.transcript.language,
      scamWords: modelData.text_analysis.matched_words,
      scamGroups: modelData.text_analysis.groups,
      scamType: modelData.text_analysis.groups[0] || null,
      claim: claimData,
      alertId,
      audioSha256,
      audioPath,
      timingsMs: modelData.timings_ms,
      createdAt: newCheck.created_at,
    },
  }, { status: 201 });
}
