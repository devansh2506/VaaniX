import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AudienceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function AudienceCard({
  icon: Icon,
  title,
  description,
  className,
}: AudienceCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-2xl border border-border bg-light p-6 sm:p-7 text-left transition-all",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-teal-tint text-teal-dark shrink-0 mb-5">
        <Icon className="size-7" strokeWidth={2.2} />
      </div>
      <h3 className="text-xl font-bold text-navy leading-snug">
        {title}
      </h3>
      <p className="mt-2.5 text-base text-gray leading-relaxed">
        {description}
      </p>
    </div>
  );
}
