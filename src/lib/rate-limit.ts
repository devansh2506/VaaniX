import { createAdminClient } from '@/lib/supabase/admin';

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and updates rate limits using PostgreSQL rate_limits table.
 * Defaults to 60-second or 3600-second windows.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds = 3600
): Promise<RateLimitResult> {
  const admin = createAdminClient();
  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs).toISOString();
  const resetInSeconds = Math.max(1, Math.ceil((windowStartMs + windowMs - nowMs) / 1000));

  try {
    const { data: existing } = await admin
      .from('rate_limits')
      .select('count')
      .eq('key', key)
      .eq('window_start', windowStart)
      .maybeSingle();

    if (!existing) {
      await admin.from('rate_limits').insert({
        key,
        window_start: windowStart,
        count: 1,
      });

      return {
        allowed: true,
        count: 1,
        remaining: Math.max(0, limit - 1),
        resetInSeconds,
      };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        count: existing.count,
        remaining: 0,
        resetInSeconds,
      };
    }

    const nextCount = existing.count + 1;
    await admin
      .from('rate_limits')
      .update({ count: nextCount })
      .eq('key', key)
      .eq('window_start', windowStart);

    return {
      allowed: true,
      count: nextCount,
      remaining: Math.max(0, limit - nextCount),
      resetInSeconds,
    };
  } catch (err) {
    // If rate limit table is unreachable in local dev / tests, gracefully allow
    console.warn('[rate-limit] Postgres note:', err);
    return {
      allowed: true,
      count: 1,
      remaining: limit - 1,
      resetInSeconds,
    };
  }
}
