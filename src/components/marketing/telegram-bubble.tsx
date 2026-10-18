import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TelegramButton {
  text: string;
  variant?: "teal" | "navy" | "red" | "green";
  onClick?: () => void;
}

export interface TelegramBubbleProps {
  sender?: string;
  title: string;
  callMeta?: string;
  riskScore?: number;
  claimedIdentity?: string;
  bodyText?: string;
  advice?: string;
  timestamp?: string;
  buttons?: TelegramButton[];
  className?: string;
}

export function TelegramBubble({
  sender = "VaaniX Bot",
  title,
  callMeta,
  riskScore,
  claimedIdentity,
  bodyText,
  advice,
  timestamp = "Just now",
  buttons = [],
  className,
}: TelegramBubbleProps) {
  const buttonColors = {
    teal: "bg-teal-dark hover:opacity-90 text-white",
    navy: "bg-navy hover:bg-navy/90 text-white",
    red: "bg-red hover:bg-red/90 text-white",
    green: "bg-green hover:bg-green/90 text-white",
  };

  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-2xl overflow-hidden border border-border shadow-xs bg-[#E7EBF0] text-navy select-none",
        className
      )}
    >
      {/* Telegram Header */}
      <div className="bg-[#2AABEE] px-4 py-2.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-white flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5 text-[#2AABEE]" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight flex items-center gap-1">
              {sender}
              <span className="text-[10px] bg-white/20 px-1 rounded-xs uppercase">bot</span>
            </div>
            <div className="text-[11px] text-white/80 leading-tight">Verified Alert System</div>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="p-3.5 space-y-3">
        {/* Chat Bubble */}
        <div className="rounded-xl bg-surface p-4 shadow-xs border border-border/40 text-left space-y-2">
          <div className="text-sm font-bold text-navy flex items-center justify-between">
            <span>{title}</span>
            {riskScore !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-tint text-red-text font-bold">
                Risk {riskScore}/100
              </span>
            )}
          </div>

          {callMeta && <div className="text-xs text-gray">{callMeta}</div>}

          {claimedIdentity && (
            <div className="text-xs font-semibold text-navy bg-light p-2 rounded-lg border border-border/60">
              Claimed Identity: <span className="text-teal-dark">{claimedIdentity}</span>
            </div>
          )}

          {bodyText && <div className="text-xs sm:text-sm text-navy">{bodyText}</div>}

          {advice && (
            <div className="text-xs text-red-text font-medium bg-red-tint/60 p-2 rounded-lg border border-red/20">
              {advice}
            </div>
          )}

          <div className="text-[10px] text-faint text-right">{timestamp}</div>
        </div>

        {/* Stacked Full-Width Buttons */}
        {buttons.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                type="button"
                onClick={btn.onClick}
                className={cn(
                  "w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer shadow-xs",
                  buttonColors[btn.variant ?? "navy"]
                )}
              >
                {btn.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
