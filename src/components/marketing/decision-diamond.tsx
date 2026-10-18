import { cn } from "@/lib/utils";

export function DecisionDiamond({
  label = "AI voice?",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex items-center justify-center py-6 select-none", className)}>
      {/* Central Diamond Box */}
      <div className="relative flex items-center justify-center size-28 sm:size-32">
        {/* Rotated background diamond */}
        <div
          className="absolute inset-2 border-[3px] border-navy bg-surface shadow-xs rotate-45 rounded-lg"
          aria-hidden="true"
        />
        {/* Unrotated label text */}
        <span className="relative z-10 text-center font-bold text-navy text-sm sm:text-base px-2">
          {label}
        </span>
      </div>
    </div>
  );
}
