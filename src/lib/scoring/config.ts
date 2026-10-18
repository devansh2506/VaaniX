/**
 * SatyaVoice / VaaniX Risk Scoring Configuration
 *
 * NOTE: These weights are starting values chosen by engineering, not measured results.
 * All weights and thresholds are centralized here so they can be tuned after test calls.
 * Never show the weights as "accuracy" or as research (Roadmap Section 6).
 */

export interface ScoringWeights {
  voiceWeight: number;
  textWeight: number;
  aiRiskThreshold: number;
  aiVoiceMinScore: number;
  realRiskThreshold: number;
}

export const SCORING_CONFIG: ScoringWeights = {
  voiceWeight: 0.70,
  textWeight: 0.30,
  aiRiskThreshold: 60,
  aiVoiceMinScore: 50,
  realRiskThreshold: 40,
};

export type RiskBand = 'low' | 'elevated' | 'high' | 'critical';
export type Verdict = 'AI_CLONE' | 'REAL' | 'INCONCLUSIVE';

export interface ScoreResult {
  voiceScore: number;
  textScore: number;
  riskScore: number;
  verdict: Verdict;
  band: RiskBand;
  bandLabel: string;
  hasSpeech: boolean;
  explanation: string;
}

/**
 * Calculates the combined risk score and verdict based on Section 6 of the roadmap:
 * - risk_score = round(0.70 * voice_score + 0.30 * text_score)
 * - AI_CLONE when risk_score >= 60 and voice_score >= 50
 * - REAL when risk_score < 40
 * - INCONCLUSIVE otherwise
 */
export function calculateRiskScore(
  voiceScore: number,
  textScore: number,
  hasSpeech: boolean = true
): ScoreResult {
  // Clamp scores between 0 and 100
  const clampedVoice = Math.max(0, Math.min(100, Math.round(voiceScore)));
  const clampedText = hasSpeech ? Math.max(0, Math.min(100, Math.round(textScore))) : 0;

  // Formula: 70% acoustic voice clone score + 30% natural language transcript urgency
  const riskScore = Math.round(
    SCORING_CONFIG.voiceWeight * clampedVoice +
    SCORING_CONFIG.textWeight * clampedText
  );

  // Verdict decision
  let verdict: Verdict;
  if (riskScore >= SCORING_CONFIG.aiRiskThreshold && clampedVoice >= SCORING_CONFIG.aiVoiceMinScore) {
    verdict = 'AI_CLONE';
  } else if (riskScore < SCORING_CONFIG.realRiskThreshold) {
    verdict = 'REAL';
  } else {
    verdict = 'INCONCLUSIVE';
  }

  // Display band (Section 6.4)
  let band: RiskBand;
  let bandLabel: string;
  if (riskScore <= 29) {
    band = 'low';
    bandLabel = 'Low Risk';
  } else if (riskScore <= 59) {
    band = 'elevated';
    bandLabel = 'Elevated Risk';
  } else if (riskScore <= 84) {
    band = 'high';
    bandLabel = 'High Risk';
  } else {
    band = 'critical';
    bandLabel = 'Critical Risk';
  }

  let explanation: string;
  if (!hasSpeech) {
    explanation = 'No clear speech detected — voice acoustic check only.';
  } else if (verdict === 'AI_CLONE') {
    explanation = 'Acoustic deepfake patterns detected with matching scam urgency indicators.';
  } else if (verdict === 'REAL') {
    explanation = 'Natural human vocal characteristics detected with no scam urgency markers.';
  } else {
    explanation = 'Inconclusive signals. Be careful and verify the caller through a secondary channel.';
  }

  return {
    voiceScore: clampedVoice,
    textScore: clampedText,
    riskScore,
    verdict,
    band,
    bandLabel,
    hasSpeech,
    explanation,
  };
}
