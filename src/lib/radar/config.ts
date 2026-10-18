/**
 * SatyaVoice / VaaniX - Scam Radar Threat Engine
 * Roadmap Section 11 & Section 14
 */

export type RadarLevel = 'none' | 'caution' | 'potential_scam';

export interface RadarEvaluationResult {
  number: string;
  level: RadarLevel;
  reporters24h: number;
  reporters7d: number;
  commonScamType: string | null;
  hasImpersonationDenied24h: boolean;
}

/**
 * Default threshold for potential_scam classification:
 * 3 distinct users in 24 hours, or any impersonation_denied report in 24 hours.
 */
export const DEFAULT_RADAR_THRESHOLD = parseInt(
  process.env.RADAR_THRESHOLD || '3',
  10
);

export function computeRadarLevel(
  reporters24h: number,
  reporters7d: number,
  hasImpersonationDenied24h: boolean,
  threshold = DEFAULT_RADAR_THRESHOLD
): RadarLevel {
  if (reporters24h >= threshold || hasImpersonationDenied24h) {
    return 'potential_scam';
  }
  if (reporters24h >= 1 || reporters7d >= 1) {
    return 'caution';
  }
  return 'none';
}
