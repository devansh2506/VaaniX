import { cn } from "@/lib/utils";

export function FlowArrow({
  direction = "right",
  variant = "default",
  className,
}: {
  direction?: "right" | "down";
  variant?: "default" | "danger" | "success";
  className?: string;
}) {
  const fillColor =
    variant === "danger"
      ? "fill-red"
      : variant === "success"
      ? "fill-green"
      : "fill-arrow";

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 self-center",
        direction === "down" ? "py-2 rotate-90 sm:rotate-0" : "",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 30"
        className={cn("w-8 h-6 sm:w-10 sm:h-7 shrink-0", fillColor)}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Block arrow path from spec: M0 10H24V0L40 15L24 30V20H0Z */}
        <path d="M0 10H24V0L40 15L24 30V20H0Z" />
      </svg>
    </div>
  );
}
