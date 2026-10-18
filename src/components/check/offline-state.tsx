import { PowerOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OfflineState({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-light border-2 border-border text-navy select-none max-w-lg mx-auto",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-border text-gray mb-4">
        <PowerOff className="size-7" />
      </div>

      <h3 className="text-xl font-bold text-navy">
        Detection Engine Offline
      </h3>

      <p className="mt-2 text-sm text-gray leading-relaxed max-w-md">
        The acoustic Nes2Net-X voice model runs on the demo machine via a secure tunnel.
        Please ensure the local model server is running and try again.
      </p>

      <div className="mt-6 flex items-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="navy" size="default" className="font-bold">
            <RefreshCw className="size-4 mr-2" />
            Retry Connection
          </Button>
        )}
      </div>

      <span className="mt-4 text-[11px] text-faint">
        No simulated or fake verdicts are ever generated when offline.
      </span>
    </div>
  );
}
