import { NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-v1-auth';
import { normalizePhoneE164 } from '@/lib/phone';
import { lookupRadarReputation } from '@/lib/radar/lookup';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request, 'radar');
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const rawNumber = searchParams.get('number');

  if (!rawNumber || !rawNumber.trim()) {
    return NextResponse.json(
      { error: { code: 'MISSING_NUMBER', message: 'Query parameter "number" is required' } },
      { status: 400 }
    );
  }

  const normalized = normalizePhoneE164(rawNumber);
  if (!normalized) {
    return NextResponse.json(
      { error: { code: 'INVALID_NUMBER', message: 'Invalid phone number format. Please provide E.164 (e.g. +919876543210)' } },
      { status: 400 }
    );
  }

  // Higher rate limit for API keys: 600 requests per minute
  const rateLimit = await checkRateLimit(`radar_api_${auth.client.id}`, 600, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: `API key rate limit exceeded. Retry in ${rateLimit.resetInSeconds}s.` } },
      { status: 429 }
    );
  }

  const radar = await lookupRadarReputation(normalized);

  return NextResponse.json(
    { ok: true, radar },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        'X-RateLimit-Limit': '600',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      },
    }
  );
}
