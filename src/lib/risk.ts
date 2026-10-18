export type RiskBand = "low" | "elevated" | "high" | "critical";

export function scoreToBand(score: number): RiskBand {
  if (score >= 85) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "elevated";
  return "low";
}

export const RISK_BAND_LABEL: Record<RiskBand, string> = {
  critical: "Critical",
  high: "High",
  elevated: "Elevated",
  low: "Low",
};

export const RISK_BAND_COLOR: Record<RiskBand, { text: string; bg: string; border: string }> = {
  critical: {
    text: "text-red-text font-bold",
    bg: "bg-red-tint",
    border: "border-red",
  },
  high: {
    text: "text-red-text",
    bg: "bg-red-tint",
    border: "border-red",
  },
  elevated: {
    text: "text-gray",
    bg: "bg-light",
    border: "border-border",
  },
  low: {
    text: "text-green-text",
    bg: "bg-green-tint",
    border: "border-green",
  },
};
