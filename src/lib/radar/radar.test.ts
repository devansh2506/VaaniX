import { describe, it, expect } from 'vitest';
import { computeRadarLevel, DEFAULT_RADAR_THRESHOLD } from './config';

describe('Scam Radar Threat Engine (computeRadarLevel)', () => {
  it('has default threshold of 3', () => {
    expect(DEFAULT_RADAR_THRESHOLD).toBe(3);
  });

  it('defaults to none when no reporters exist', () => {
    const level = computeRadarLevel(0, 0, false);
    expect(level).toBe('none');
  });

  it('marks caution if 1 reporter reported in the last 24h', () => {
    const level = computeRadarLevel(1, 1, false);
    expect(level).toBe('caution');
  });

  it('marks caution if 2 reporters reported in the last 24h', () => {
    const level = computeRadarLevel(2, 2, false);
    expect(level).toBe('caution');
  });

  it('marks caution if reported in last 7 days but 0 in last 24h', () => {
    const level = computeRadarLevel(0, 3, false);
    expect(level).toBe('caution');
  });

  it('marks potential_scam when reporters in 24h reaches threshold (3)', () => {
    const level = computeRadarLevel(3, 3, false);
    expect(level).toBe('potential_scam');
  });

  it('marks potential_scam when reporters in 24h exceeds threshold', () => {
    const level = computeRadarLevel(5, 12, false);
    expect(level).toBe('potential_scam');
  });

  it('marks potential_scam immediately if impersonation was denied, even with only 1 reporter', () => {
    const level = computeRadarLevel(1, 1, true);
    expect(level).toBe('potential_scam');
  });

  it('marks potential_scam if impersonation was denied even with 0 general reporters', () => {
    const level = computeRadarLevel(0, 0, true);
    expect(level).toBe('potential_scam');
  });

  it('respects a custom threshold', () => {
    expect(computeRadarLevel(2, 2, false, 2)).toBe('potential_scam');
    expect(computeRadarLevel(3, 3, false, 5)).toBe('caution');
  });
});
