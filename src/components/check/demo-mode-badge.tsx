import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoModeBadge({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-[#FEF6E7] border border-[#F5C26B] px-3.5 py-1 text-xs font-bold text-[#8A5000] select-none",
        className
      )}
    >
      <AlertCircle className="size-3.5 text-[#E58A00] shrink-0" />
      <span>Demo mode – not a real result</span>
    </div>
  );
}
