import { cn } from "@/lib/utils";

export interface PhoneMockProps {
  children: React.ReactNode;
  caption?: string;
  className?: string;
}

export function PhoneMock({ children, caption, className }: PhoneMockProps) {
  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      {/* Outer Navy Phone Frame: 40px radius, navy #0F2A44 */}
      <div className="relative w-[280px] sm:w-[320px] rounded-[40px] bg-navy p-3 sm:p-3.5 phone-shadow border border-navy/20">
        {/* Top speaker / camera notch bar */}
        <div className="flex justify-center pt-1.5 pb-2">
          <div className="h-4 w-24 rounded-full bg-[#2E4A66] flex items-center justify-end px-2">
            <div className="size-2 rounded-full bg-navy/60" />
          </div>
        </div>

        {/* Inner Screen: 22px radius, white surface */}
        <div className="relative min-h-[460px] sm:min-h-[520px] w-full overflow-hidden rounded-[22px] bg-surface text-navy flex flex-col">
          {/* Subtle Phone Status Bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[11px] font-semibold text-gray">
            <span>10:42</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="h-2.5 w-5 rounded-xs border border-gray p-0.5 flex items-center">
                <div className="h-full w-full bg-gray rounded-xs" />
              </div>
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 flex flex-col p-4 sm:p-5">{children}</div>

          {/* Bottom Home Indicator */}
          <div className="py-2 flex justify-center">
            <div className="h-1 w-28 rounded-full bg-gray/30" />
          </div>
        </div>
      </div>

      {caption && (
        <span className="mt-3 text-xs italic text-faint font-medium">
          {caption}
        </span>
      )}
    </div>
  );
}
