import { cn } from "@/lib/utils";

export interface FlowBoxProps {
  title: string;
  subtitle?: string;
  variant?: "teal" | "red" | "gray" | "navy" | "green";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function FlowBox({
  title,
  subtitle,
  variant = "gray",
  icon,
  children,
  className,
}: FlowBoxProps) {
  const variantStyles = {
    teal: "border-teal bg-teal-tint/30 text-navy",
    red: "border-red bg-red-tint/40 text-navy",
    green: "border-green bg-green-tint/40 text-navy",
    navy: "border-navy bg-light text-navy",
    gray: "border-border bg-light text-navy",
  }[variant];

  return (
    <div
      className={cn(
        "flex flex-col justify-center rounded-[14px] border-2 p-4 sm:p-5 transition-all text-left",
        variantStyles,
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon && <span className="shrink-0">{icon}</span>}
        <h4 className="text-base sm:text-lg font-bold leading-snug text-navy">
          {title}
        </h4>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs sm:text-sm text-gray leading-relaxed">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
