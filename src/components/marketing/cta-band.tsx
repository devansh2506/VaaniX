import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaBand({ className }: { className?: string }) {
  return (
    <section className={cn("w-full bg-teal-dark py-14 sm:py-20 text-white select-none", className)}>
      <div className="container-vaanix flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="max-w-2xl flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex size-16 items-center justify-center rounded-2xl bg-white/10 shrink-0">
            <ShieldCheck className="size-10 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Your voice is your identity.
              <br className="hidden sm:inline" />
              {" "}VaaniX protects it.
            </h2>
            <p className="mt-2 text-white/80 text-sm sm:text-base">
              Real-time acoustic AI voice-clone verification and family impersonation shield.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <Button
            asChild
            size="lg"
            className="bg-white text-teal-dark hover:bg-white/95 font-bold shadow-md text-base"
          >
            <Link href="/try">
              Try a check
              <ArrowRight className="size-5 ml-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white/60 bg-transparent text-white hover:bg-white/10 font-bold text-base"
          >
            <Link href="/how-it-works">How it works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
