import { FileText, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptPanelProps {
  segments?: TranscriptSegment[];
  rawText?: string;
  scamWords?: string[];
  claimLabel?: string | null;
  language?: string;
  className?: string;
}

export function TranscriptPanel({
  segments = [],
  rawText,
  scamWords = [],
  claimLabel,
  language,
  className,
}: TranscriptPanelProps) {
  // Highlight matching scam words in text
  const renderHighlightedText = (text: string) => {
    if (!scamWords.length) return text;
    // Build regex from scam words
    const escaped = scamWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = scamWords.some((w) => w.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <span
            key={i}
            className="rounded-xs bg-red-tint px-1 py-0.5 font-bold text-red-text border border-red/30"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const hasContent = (segments && segments.length > 0) || Boolean(rawText);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-light p-5 text-left text-navy select-text",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-teal-dark shrink-0" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-navy">
            Call Transcript
          </h4>
        </div>
        {language && (
          <span className="text-[11px] font-semibold text-gray uppercase bg-surface px-2 py-0.5 rounded-md border border-border/50">
            {language === "hi" ? "Hindi / Hinglish" : language}
          </span>
        )}
      </div>

      {/* Impersonation claim callout */}
      {claimLabel && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-tint border border-red/30 text-red-text font-bold text-sm">
          <UserCheck className="size-5 shrink-0" />
          <span>→ Caller claims to be: <span className="underline">{claimLabel}</span></span>
        </div>
      )}

      {/* Content */}
      <div className="mt-4 space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {!hasContent ? (
          <p className="text-sm italic text-gray py-4 text-center">
            No clear speech detected — acoustic voice model analyzed audio features only.
          </p>
        ) : segments.length > 0 ? (
          segments.map((seg, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-xs text-gray tabular pt-0.5 shrink-0 select-none">
                {seg.start.toFixed(1)}s
              </span>
              <p className="leading-relaxed text-navy">
                {renderHighlightedText(seg.text)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-relaxed text-navy">
            {renderHighlightedText(rawText || "")}
          </p>
        )}
      </div>

      {scamWords.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-1.5 text-xs text-gray">
          <span className="font-semibold text-navy">Flagged Keywords:</span>
          {scamWords.map((word, idx) => (
            <span
              key={idx}
              className="rounded-full bg-red-tint px-2.5 py-0.5 text-[11px] font-bold text-red-text border border-red/20"
            >
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
