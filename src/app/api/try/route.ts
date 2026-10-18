import { NextResponse } from 'next/server';
import { analyzeAudioWithModel } from '@/lib/model-client';
import { calculateRiskScore } from '@/lib/scoring/config';

export const maxDuration = 60;

// In-memory rate limiting map for /api/try (5 checks per IP per hour)
const ipRateLimits = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const record = ipRateLimits.get(ip);

  if (!record || now - record.windowStart > windowMs) {
    ipRateLimits.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= 5) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  // 1. Rate limiting by client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit reached: maximum 5 demo checks per hour. Please sign in to run unlimited checks.',
        },
      },
      { status: 429 }
    );
  }

  // 2. Parse audio from multipart/form-data
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

  // 3. Forward to model server (with no family members context)
  const modelRes = await analyzeAudioWithModel(audioEntry, 'demo_audio.wav');

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

  // 4. Compute combined score and verdict using Section 6 formula
  const scoreResult = calculateRiskScore(voiceScore, textScore, hasSpeech);

  // NOTE: Strictly ZERO database writes, ZERO alerts, ZERO radar entries as mandated by Roadmap Section 10 & 8.1
  return NextResponse.json({
    ok: true,
    check: {
      source: 'web_mic',
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
      claim: modelData.text_analysis.claim,
      isStub,
      timingsMs: modelData.timings_ms,
    },
  });
}
