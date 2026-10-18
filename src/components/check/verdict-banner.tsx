import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerdictType = "AI_CLONE" | "REAL" | "INCONCLUSIVE";

export function VerdictBanner({
  verdict,
  className,
}: {
  verdict: VerdictType;
  className?: string;
}) {
  if (verdict === "AI_CLONE") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-red-tint border-2 border-red px-5 py-4 text-left select-none",
          className
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-red text-white shrink-0">
          <AlertTriangle className="size-6" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-red leading-tight">
            AI VOICE DETECTED
          </h3>
          <p className="text-xs sm:text-sm text-red-text font-medium mt-0.5">
            High probability of synthetic voice clone. Do not transfer funds or share OTPs.
          </p>
        </div>
      </div>
    );
  }

  if (verdict === "REAL") {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-green-tint border-2 border-green px-5 py-4 text-left select-none",
          className
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-green text-white shrink-0">
          <CheckCircle2 className="size-6" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-green-text leading-tight">
            Real Voice Confirmed
          </h3>
          <p className="text-xs sm:text-sm text-green-text/90 font-medium mt-0.5">
            Acoustic biometric parameters match natural human speech.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-[#FEF6E7] border-2 border-[#F5C26B] px-5 py-4 text-left select-none",
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-[#E58A00] text-white shrink-0">
        <AlertCircle className="size-6" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-[#8A5000] leading-tight">
          Be Careful — Result Inconclusive
        </h3>
        <p className="text-xs sm:text-sm text-[#8A5000] font-medium mt-0.5">
          Audio quality or signals are borderline. Hang up and verify through an independent channel.
        </p>
      </div>
    </div>
  );
}
