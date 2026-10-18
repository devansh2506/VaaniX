import { scoreToBand, type RiskBand } from "@/lib/risk";
import { cn } from "@/lib/utils";

const BAR_CLASS: Record<RiskBand, string> = {
  critical: "bg-red",
  high: "bg-red",
  elevated: "bg-gray",
  low: "bg-green",
};

const TEXT_CLASS: Record<RiskBand, string> = {
  critical: "text-red-text font-bold",
  high: "text-red-text",
  elevated: "text-gray",
  low: "text-green-text",
};

export function RiskBadge({ score, className }: { score: number; className?: string }) {
  const band = scoreToBand(score);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("tabular text-[13px] font-semibold w-6 text-right", TEXT_CLASS[band])}>{score}</span>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-light">
        <span
          className={cn("block h-full rounded-full", BAR_CLASS[band])}
          style={{ width: `${Math.max(4, score)}%` }}
        />
      </span>
    </div>
  );
}
