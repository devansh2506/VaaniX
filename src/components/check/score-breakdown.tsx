import { cn } from "@/lib/utils";

export interface ScoreBreakdownProps {
  voiceScore: number;
  textScore: number;
  finalScore: number;
  className?: string;
}

export function ScoreBreakdown({
  voiceScore,
  textScore,
  finalScore,
  className,
}: ScoreBreakdownProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-light border border-border text-center select-none",
        className
      )}
    >
      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-surface border border-border/50">
        <span className="text-xs font-semibold text-gray uppercase tracking-wider">
          Voice Check
        </span>
        <div className="mt-1 flex items-baseline gap-0.5">
          <span className="text-2xl font-bold tabular text-navy">{Math.round(voiceScore)}</span>
          <span className="text-xs text-gray font-medium">/100</span>
        </div>
        <span className="text-[11px] text-faint mt-0.5">Nes2Net-X (70%)</span>
      </div>

      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-surface border border-border/50">
        <span className="text-xs font-semibold text-gray uppercase tracking-wider">
          Transcript Check
        </span>
        <div className="mt-1 flex items-baseline gap-0.5">
          <span className="text-2xl font-bold tabular text-navy">{Math.round(textScore)}</span>
          <span className="text-xs text-gray font-medium">/100</span>
        </div>
        <span className="text-[11px] text-faint mt-0.5">Scam Signals (30%)</span>
      </div>

      <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-teal-tint/50 border border-teal/20">
        <span className="text-xs font-bold text-teal-dark uppercase tracking-wider">
          Final Combined Risk
        </span>
        <div className="mt-1 flex items-baseline gap-0.5">
          <span className="text-2xl font-bold tabular text-navy">{Math.round(finalScore)}</span>
          <span className="text-xs text-teal-dark font-medium">/100</span>
        </div>
        <span className="text-[11px] text-teal-dark font-medium mt-0.5">Weighted Fusion</span>
      </div>
    </div>
  );
}
