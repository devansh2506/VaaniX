import { NextResponse } from 'next/server';
import { normalizePhoneE164 } from '@/lib/phone';
import { lookupRadarReputation } from '@/lib/radar/lookup';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
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

  // Rate limiting per IP: 60 requests per 60 seconds
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
  const rateLimit = await checkRateLimit(`radar_ip_${ip}`, 60, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: `Too many lookup requests. Retry in ${rateLimit.resetInSeconds}s.` } },
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
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      },
    }
  );
}
