import { describe, it, expect } from 'vitest';
import { calculateRiskScore } from './config';

describe('SatyaVoice Scoring Engine (Roadmap Section 6)', () => {
  it('applies the 70% voice and 30% text weighting formula correctly', () => {
    // 70% * 80 + 30% * 40 = 56 + 12 = 68
    const res = calculateRiskScore(80, 40);
    expect(res.riskScore).toBe(68);
    expect(res.verdict).toBe('AI_CLONE');
    expect(res.band).toBe('high');
  });

  // 1. Empty transcript: text_score = 0
  it('case 1: handles empty transcript (voice check only)', () => {
    const res = calculateRiskScore(70, 0, false);
    // 0.70 * 70 = 49
    expect(res.riskScore).toBe(49);
    expect(res.textScore).toBe(0);
    expect(res.hasSpeech).toBe(false);
    expect(res.verdict).toBe('INCONCLUSIVE');
  });

  // 2. High voice, high text -> AI_CLONE Critical
  it('case 2: high voice + high text produces AI_CLONE and critical band', () => {
    const res = calculateRiskScore(90, 80);
    // 0.70 * 90 + 0.30 * 80 = 63 + 24 = 87
    expect(res.riskScore).toBe(87);
    expect(res.verdict).toBe('AI_CLONE');
    expect(res.band).toBe('critical');
  });

  // 3. High voice with low text (voice >= 50 and risk >= 60)
  it('case 3: voice high with text low can still trigger AI_CLONE if risk >= 60', () => {
    // 0.70 * 90 + 0.30 * 0 = 63 >= 60
    const res = calculateRiskScore(90, 0);
    expect(res.riskScore).toBe(63);
    expect(res.verdict).toBe('AI_CLONE');
    expect(res.band).toBe('high');
  });

  // 4. Voice low with text high: MUST NOT BE AI_CLONE
  it('case 4: voice low with text high must NOT be AI_CLONE (scam words alone cannot make AI verdict)', () => {
    // 0.70 * 40 + 0.30 * 100 = 28 + 30 = 58
    const res = calculateRiskScore(40, 100);
    expect(res.riskScore).toBe(58);
    expect(res.verdict).not.toBe('AI_CLONE');
    expect(res.verdict).toBe('INCONCLUSIVE');
  });

  // 5. Another voice low with text high test where risk >= 60 but voice < 50
  it('case 5: risk >= 60 but voice < 50 must NOT be AI_CLONE (voice model must agree)', () => {
    // 0.70 * 48 + 0.30 * 100 = 33.6 + 30 = 64
    const res = calculateRiskScore(48, 100);
    expect(res.riskScore).toBe(64);
    expect(res.voiceScore).toBe(48);
    // Even though risk is 64 >= 60, voiceScore is 48 < 50
    expect(res.verdict).toBe('INCONCLUSIVE');
  });

  // 6. Both low -> REAL
  it('case 6: both voice and text low produces REAL', () => {
    // 0.70 * 20 + 0.30 * 20 = 14 + 6 = 20
    const res = calculateRiskScore(20, 20);
    expect(res.riskScore).toBe(20);
    expect(res.verdict).toBe('REAL');
    expect(res.band).toBe('low');
  });

  // 7. Boundary: risk score exactly 39 (REAL boundary)
  it('case 7: boundary test risk_score 39 is REAL (< 40)', () => {
    // 0.70 * 40 + 0.30 * 37 = 28 + 11.1 = 39.1 -> 39
    const res = calculateRiskScore(40, 37);
    expect(res.riskScore).toBe(39);
    expect(res.verdict).toBe('REAL');
  });

  // 8. Boundary: risk score exactly 40 (INCONCLUSIVE boundary)
  it('case 8: boundary test risk_score 40 is INCONCLUSIVE (>= 40 and < 60)', () => {
    // 0.70 * 40 + 0.30 * 40 = 28 + 12 = 40
    const res = calculateRiskScore(40, 40);
    expect(res.riskScore).toBe(40);
    expect(res.verdict).toBe('INCONCLUSIVE');
    expect(res.band).toBe('elevated');
  });

  // 9. Boundary: risk score exactly 59 (INCONCLUSIVE boundary)
  it('case 9: boundary test risk_score 59 is INCONCLUSIVE (< 60)', () => {
    // 0.70 * 60 + 0.30 * 57 = 42 + 17.1 = 59.1 -> 59
    const res = calculateRiskScore(60, 57);
    expect(res.riskScore).toBe(59);
    expect(res.verdict).toBe('INCONCLUSIVE');
    expect(res.band).toBe('elevated');
  });

  // 10. Boundary: risk score exactly 60 and voice >= 50 -> AI_CLONE
  it('case 10: boundary test risk_score 60 with voice >= 50 triggers AI_CLONE', () => {
    // 0.70 * 60 + 0.30 * 60 = 42 + 18 = 60
    const res = calculateRiskScore(60, 60);
    expect(res.riskScore).toBe(60);
    expect(res.verdict).toBe('AI_CLONE');
    expect(res.band).toBe('high');
  });

  // 11. Upper bound cap: 100
  it('case 11: scores are clamped and capped at 100', () => {
    const res = calculateRiskScore(120, 150);
    expect(res.voiceScore).toBe(100);
    expect(res.textScore).toBe(100);
    expect(res.riskScore).toBe(100);
    expect(res.band).toBe('critical');
  });

  // 12. Lower bound cap: 0
  it('case 12: negative inputs are clamped to 0', () => {
    const res = calculateRiskScore(-10, -5);
    expect(res.voiceScore).toBe(0);
    expect(res.textScore).toBe(0);
    expect(res.riskScore).toBe(0);
    expect(res.verdict).toBe('REAL');
    expect(res.band).toBe('low');
  });

  // 13. Elevated band edge: 29 vs 30
  it('case 13: score 29 is low band, score 30 is elevated band', () => {
    // 0.70 * 30 + 0.30 * 27 = 21 + 8.1 = 29
    const res29 = calculateRiskScore(30, 27);
    expect(res29.riskScore).toBe(29);
    expect(res29.band).toBe('low');

    // 0.70 * 30 + 0.30 * 30 = 21 + 9 = 30
    const res30 = calculateRiskScore(30, 30);
    expect(res30.riskScore).toBe(30);
    expect(res30.band).toBe('elevated');
  });

  // 14. High band edge: 84 vs 85
  it('case 14: score 84 is high band, score 85 is critical band', () => {
    // 0.70 * 84 + 0.30 * 84 = 58.8 + 25.2 = 84
    const res84 = calculateRiskScore(84, 84);
    expect(res84.riskScore).toBe(84);
    expect(res84.band).toBe('high');

    // 0.70 * 85 + 0.30 * 85 = 59.5 + 25.5 = 85
    const res85 = calculateRiskScore(85, 85);
    expect(res85.riskScore).toBe(85);
    expect(res85.band).toBe('critical');
  });

  // 15. Real speech with moderate voice score 50 and text score 80
  it('case 15: voice 50 + text 80 = risk 59 (inconclusive elevated)', () => {
    // 0.70 * 50 + 0.30 * 80 = 35 + 24 = 59
    const res = calculateRiskScore(50, 80);
    expect(res.riskScore).toBe(59);
    expect(res.verdict).toBe('INCONCLUSIVE');
  });
});
