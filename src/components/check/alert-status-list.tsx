import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertStatusItem {
  recipient: string;
  status: "sent" | "failed" | "not_joined" | "pending";
  label: string;
  details?: string;
}

export function AlertStatusList({
  items = [],
  className,
}: {
  items: AlertStatusItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-light p-5 text-left text-navy select-none",
        className
      )}
    >
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray mb-3">
        Automated Security Dispatch
      </h4>

      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const isSent = item.status === "sent";
          const isFailed = item.status === "failed";
          const isNotJoined = item.status === "not_joined";

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/50 text-sm"
            >
              <div className="flex items-center gap-2.5">
                {isSent ? (
                  <CheckCircle2 className="size-4.5 text-green shrink-0" strokeWidth={2.5} />
                ) : isFailed ? (
                  <XCircle className="size-4.5 text-red shrink-0" strokeWidth={2.5} />
                ) : (
                  <Clock className="size-4.5 text-gray shrink-0" strokeWidth={2} />
                )}
                <div>
                  <span className="font-semibold text-navy">{item.label}</span>
                  {item.details && (
                    <p className="text-xs text-gray">{item.details}</p>
                  )}
                </div>
              </div>

              <span
                className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  isSent
                    ? "bg-green-tint text-green-text"
                    : isFailed
                    ? "bg-red-tint text-red-text"
                    : isNotJoined
                    ? "bg-light text-gray border border-border"
                    : "bg-light text-gray"
                )}
              >
                {isSent ? "Delivered" : isFailed ? "Failed" : isNotJoined ? "Not on Telegram" : "Pending"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
