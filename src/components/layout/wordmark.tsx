import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const iconSize = size === "lg" ? "size-7" : size === "sm" ? "size-5" : "size-6";
  const textSize = size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className={cn("inline-flex items-center gap-2 font-bold tracking-tight select-none", className)}>
      <ShieldCheck className={cn(iconSize, "text-teal-dark shrink-0")} strokeWidth={2.5} />
      <span className={textSize}>
        <span className="text-navy font-bold">Vaani</span>
        <span className="text-teal-dark font-bold">X</span>
      </span>
    </div>
  );
}
