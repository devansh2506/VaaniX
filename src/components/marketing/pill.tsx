import { cn } from "@/lib/utils";

export function Pill({
  children,
  label,
  className,
}: {
  children?: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-teal-tint px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-[0.08em] text-teal-dark select-none",
        className
      )}
    >
      {label || children}
    </span>
  );
}
