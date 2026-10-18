import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionRowProps {
  icon: LucideIcon;
  label: string;
  explanation: string;
  buttonVariant?: "default" | "navy" | "danger" | "success" | "secondary" | "outline";
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function ActionRow({
  icon: Icon,
  label,
  explanation,
  buttonVariant = "default",
  onClick,
  href,
  className,
}: ActionRowProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-light border border-border text-left transition-all",
        className
      )}
    >
      <div className="flex items-center gap-3.5">
        <Button
          variant={buttonVariant}
          size="default"
          onClick={onClick}
          className="shrink-0 font-bold"
        >
          <Icon className="size-4 shrink-0 mr-1.5" strokeWidth={2.2} />
          {label}
        </Button>
      </div>

      <p className="text-sm text-gray font-medium leading-normal flex-1 sm:text-right">
        {explanation}
      </p>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block focus-visible:outline-none">
        {content}
      </a>
    );
  }

  return content;
}
