import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyzeAudioWithModel } from '@/lib/model-client';
import { calculateRiskScore } from '@/lib/scoring/config';
import { normalizePhoneE164 } from '@/lib/phone';
import { dispatch2WayAlerts } from '@/lib/telegram/bot';

export const maxDuration = 60; // Next.js max route handler execution duration

export async function GET(request: Request) {
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
  const verdict = searchParams.get('verdict');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('checks')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (verdict && ['AI_CLONE', 'REAL', 'INCONCLUSIVE'].includes(verdict)) {
    query = query.eq('verdict', verdict as 'AI_CLONE' | 'REAL' | 'INCONCLUSIVE');
  }

  const { data: checks, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 400 });
  }

  return NextResponse.json({
    checks: checks || [],
    total: count || 0,
    page,
    limit,
  });
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
      { error: { code: 'MISSING_AUDIO', message: 'Missing audio file in request' } },
      { status: 400 }
    );
  }

  const source = (formData.get('source') as string) || 'web_mic';
  const rawCallerNumber = (formData.get('caller_number') as string) || null;
  const callerNumber = rawCallerNumber ? normalizePhoneE164(rawCallerNumber) : null;

  // 1. Fetch user's family members context for claim verification
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('id, name, aliases, relationship')
    .eq('user_id', user.id);

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
  const { data: newCheck, error: insertError } = await supabase
    .from('checks')
    .insert({
      user_id: user.id,
      source: source as 'web_mic' | 'web_upload' | 'api' | 'laptop_pipeline',
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
  let alertSentStatus: { telegramUser: boolean; telegramMember: boolean | null } | undefined;

  // 6. If AI_CLONE: Upload evidence, create alert, add Scam Radar report (only for non-stub checks)
  if (scoreResult.verdict === 'AI_CLONE') {
    // Save evidence to private bucket evidence/<user_id>/<check_id>.wav
    audioPath = `evidence/${user.id}/${checkId}.wav`;
    const admin = createAdminClient();

    try {
      await admin.storage
        .from('evidence')
        .upload(`${user.id}/${checkId}.wav`, audioBuffer, {
          contentType: 'audio/wav',
          upsert: true,
        });

      // Update check record with audio_path
      await supabase
        .from('checks')
        .update({ audio_path: audioPath })
        .eq('id', checkId);
    } catch (uploadErr) {
      console.error('[checks/route] evidence upload failed:', uploadErr);
    }

    // Create alert record
    const { data: alertRecord } = await supabase
      .from('alerts')
      .insert({
        check_id: checkId,
        user_id: user.id,
        status: 'open',
        impersonated_member_id: claimData.member_id,
      })
      .select()
      .single();

    if (alertRecord) {
      alertId = alertRecord.id;
      if (!isStub) {
        try {
          const dispatchRes = await dispatch2WayAlerts({
            alertId: alertRecord.id,
            checkId,
            userId: user.id,
            callerNumber,
            riskScore: scoreResult.riskScore,
            claimLabel: claimData.label,
            scamWords: modelData.text_analysis.matched_words,
            scamType: modelData.text_analysis.groups[0] || null,
            impersonatedMemberId: claimData.member_id,
          });
          alertSentStatus = {
            telegramUser: dispatchRes.userTelegramOk,
            telegramMember: dispatchRes.memberTelegramOk,
          };
        } catch (dispatchErr) {
          console.error('[checks/route] telegram dispatch error:', dispatchErr);
        }
      }
    }

    // If caller number is available and check is real (not stub), add to Scam Radar
    if (callerNumber && !isStub) {
      try {
        await supabase.from('radar_reports').insert({
          number_e164: callerNumber,
          reporter_user_id: user.id,
          source: 'ai_flag',
          check_id: checkId,
          scam_type: modelData.text_analysis.groups[0] || 'voice_clone',
        });
      } catch (radarErr) {
        // Daily unique constraint may ignore duplicate report on same day
        console.warn('[checks/route] radar report insertion note:', radarErr);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    check: {
      id: checkId,
      source: newCheck.source,
      callerNumber: newCheck.caller_e164,
      voiceScore: scoreResult.voiceScore,
      textScore: scoreResult.textScore,
      riskScore: scoreResult.riskScore,
      verdict: scoreResult.verdict,
      band: scoreResult.band,
      bandLabel: scoreResult.bandLabel,
      explanation: scoreResult.explanation,
      transcript: modelData.transcript.text,
      transcriptLanguage: modelData.transcript.language,
      transcriptSegments: modelData.transcript.segments,
      scamGroups: modelData.text_analysis.groups,
      scamWords: modelData.text_analysis.matched_words,
      claim: {
        type: claimData.type,
        memberId: claimData.member_id,
        label: claimData.label,
        source: claimData.source,
      },
      isStub,
      alertId,
      timingsMs: modelData.timings_ms,
      alertSent: alertSentStatus,
    },
  });
}
