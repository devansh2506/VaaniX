import { cn } from "@/lib/utils";

export interface ApiRowProps {
  method: "POST" | "GET" | "SDK" | "PATCH" | "DELETE";
  path: string;
  description: string;
  className?: string;
}

export function ApiRow({ method, path, description, className }: ApiRowProps) {
  const methodBadge = {
    POST: "bg-teal-dark text-white",
    GET: "bg-navy text-white",
    SDK: "bg-green text-white",
    PATCH: "bg-teal text-white",
    DELETE: "bg-red text-white",
  }[method];

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface text-left transition-all hover:border-teal/40",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-bold font-mono tracking-wider shrink-0 select-none",
            methodBadge
          )}
        >
          {method}
        </span>
        <code className="text-sm sm:text-base font-bold text-navy font-mono">
          {path}
        </code>
      </div>
      <p className="text-xs sm:text-sm text-gray sm:text-right">
        {description}
      </p>
    </div>
  );
}
