import { cn } from "@/lib/utils";

export function Timeline({ className }: { className?: string }) {
  return (
    <div className={cn("w-full max-w-3xl mx-auto py-6 select-none", className)}>
      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-gray mb-2 px-1">
        <span>0s (Call connects)</span>
        <span>5s</span>
        <span>15s</span>
        <span>~25s (Result)</span>
      </div>

      {/* Track */}
      <div className="relative h-6 w-full rounded-full bg-light border border-border overflow-hidden flex">
        {/* 0s to 5s segment (gray / neutral) */}
        <div
          className="h-full bg-border/40 flex items-center justify-center text-[10px] sm:text-xs text-gray font-medium px-2"
          style={{ width: "20%" }}
        >
          <span className="truncate">Wait 5s (greetings)</span>
        </div>

        {/* 5s to 15s segment (active teal listening window) */}
        <div
          className="h-full bg-teal text-white flex items-center justify-center text-[11px] sm:text-xs font-bold px-2 relative"
          style={{ width: "40%" }}
        >
          <span className="truncate">10-second listening window</span>
        </div>

        {/* 15s to 25s segment (processing & score fusion) */}
        <div
          className="h-full bg-teal-tint flex items-center justify-center text-[10px] sm:text-xs text-teal-dark font-medium px-2"
          style={{ width: "40%" }}
        >
          <span className="truncate">Parallel Analysis (~10s)</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray mt-2 px-1">
        <span>Caller picks up</span>
        <span className="font-semibold text-teal-dark">Acoustic Model ∥ Speech-to-Text</span>
        <span>Instant Warning & Alerts</span>
      </div>
    </div>
  );
}
