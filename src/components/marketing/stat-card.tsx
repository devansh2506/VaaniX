import { cn } from "@/lib/utils";

export interface StatCardProps {
  value: string;
  label: string;
  source: string;
  sourceUrl: string;
  variant?: "teal" | "danger";
  className?: string;
}

export function StatCard({
  value,
  label,
  source,
  sourceUrl,
  variant = "teal",
  className,
}: StatCardProps) {
  const isDanger = variant === "danger";

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl p-6 sm:p-7 border transition-all",
        isDanger
          ? "bg-red-tint border-red/20"
          : "bg-teal-tint border-teal/20",
        className
      )}
    >
      <div>
        <div
          className={cn(
            "text-4xl sm:text-[56px] font-bold leading-none tabular tracking-tight",
            isDanger ? "text-red" : "text-teal-dark"
          )}
        >
          {value}
        </div>
        <p className="mt-4 text-base sm:text-lg font-medium text-navy leading-snug">
          {label}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-border/40">
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs sm:text-sm italic text-gray hover:text-teal-dark hover:underline transition-colors"
        >
          Source: {source} →
        </a>
      </div>
    </div>
  );
}
