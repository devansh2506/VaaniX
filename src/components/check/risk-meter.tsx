import { scoreToBand, RISK_BAND_LABEL, type RiskBand } from "@/lib/risk";
import { cn } from "@/lib/utils";

export function RiskMeter({
  score,
  size = "md",
  className,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const band: RiskBand = scoreToBand(score);
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  // SVG circular gauge parameters
  const dimensions = size === "lg" ? 180 : size === "sm" ? 100 : 140;
  const strokeWidth = size === "lg" ? 14 : size === "sm" ? 8 : 10;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const bandColors: Record<RiskBand, { stroke: string; text: string; bg: string }> = {
    critical: { stroke: "#DC3D43", text: "text-red font-bold", bg: "bg-red-tint" },
    high: { stroke: "#DC3D43", text: "text-red", bg: "bg-red-tint" },
    elevated: { stroke: "#5A6B7D", text: "text-gray font-semibold", bg: "bg-light" },
    low: { stroke: "#1E9E5A", text: "text-green-text font-semibold", bg: "bg-green-tint" },
  };

  const currentColors = bandColors[band];

  return (
    <div className={cn("flex flex-col items-center justify-center text-center select-none", className)}>
      <div className="relative flex items-center justify-center" style={{ width: dimensions, height: dimensions }}>
        <svg
          width={dimensions}
          height={dimensions}
          className="rotate-[-90deg] transform"
        >
          {/* Track circle */}
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            stroke="#D5DEE7"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            stroke={currentColors.stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span
              className={cn(
                "tabular font-bold leading-none tracking-tight text-navy",
                size === "lg" ? "text-5xl" : size === "sm" ? "text-2xl" : "text-4xl"
              )}
            >
              {clampedScore}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-gray ml-0.5">/100</span>
          </div>
          <span
            className={cn(
              "mt-1 uppercase tracking-wider text-[11px] sm:text-xs font-bold",
              currentColors.text
            )}
          >
            {RISK_BAND_LABEL[band]} Risk
          </span>
        </div>
      </div>
    </div>
  );
}
