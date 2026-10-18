import { createAdminClient } from '@/lib/supabase/admin';
import {
  computeRadarLevel,
  DEFAULT_RADAR_THRESHOLD,
  type RadarEvaluationResult,
} from './config';

export async function lookupRadarReputation(
  numberE164: string,
  threshold = DEFAULT_RADAR_THRESHOLD
): Promise<RadarEvaluationResult> {
  const admin = createAdminClient();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Query radar reports for this number over the past 7 days, excluding marked genuine
  const { data: reports, error } = await admin
    .from('radar_reports')
    .select('reporter_user_id, source, scam_type, created_at')
    .eq('number_e164', numberE164)
    .eq('excluded', false)
    .gte('created_at', sevenDaysAgo);

  if (error || !reports || reports.length === 0) {
    return {
      number: numberE164,
      level: 'none',
      reporters24h: 0,
      reporters7d: 0,
      commonScamType: null,
      hasImpersonationDenied24h: false,
    };
  }

  const reporters24hSet = new Set<string>();
  const reporters7dSet = new Set<string>();
  let hasImpersonationDenied24h = false;
  const scamTypeCounts: Record<string, number> = {};

  for (const report of reports) {
    const isWithin24h = report.created_at >= twentyFourHoursAgo;

    if (report.reporter_user_id) {
      reporters7dSet.add(report.reporter_user_id);
      if (isWithin24h) {
        reporters24hSet.add(report.reporter_user_id);
      }
    }

    if (isWithin24h && report.source === 'impersonation_denied') {
      hasImpersonationDenied24h = true;
    }

    if (report.scam_type) {
      scamTypeCounts[report.scam_type] = (scamTypeCounts[report.scam_type] || 0) + 1;
    }
  }

  // Find most frequent scam type
  let commonScamType: string | null = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(scamTypeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      commonScamType = type;
    }
  }

  const reporters24h = reporters24hSet.size;
  const reporters7d = reporters7dSet.size;

  const level = computeRadarLevel(
    reporters24h,
    reporters7d,
    hasImpersonationDenied24h,
    threshold
  );

  return {
    number: numberE164,
    level,
    reporters24h,
    reporters7d,
    commonScamType,
    hasImpersonationDenied24h,
  };
}
