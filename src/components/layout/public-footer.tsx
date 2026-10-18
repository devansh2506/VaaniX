import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-light text-navy select-none">
      <div className="container-vaanix py-12 sm:py-16">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="max-w-sm">
            <Wordmark size="md" />
            <p className="mt-3 text-sm text-gray leading-relaxed">
              Real-time acoustic AI voice-clone verification and family impersonation shield.
              Catch deepfake scams during the call — before the money moves.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <h5 className="font-bold text-navy uppercase tracking-wider text-xs mb-3">
                Product
              </h5>
              <ul className="space-y-2 text-gray">
                <li>
                  <Link href="/how-it-works" className="hover:text-teal-dark transition-colors">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/try" className="hover:text-teal-dark transition-colors">
                    Try a check
                  </Link>
                </li>
                <li>
                  <Link href="/radar" className="hover:text-teal-dark transition-colors">
                    Scam Radar
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-navy uppercase tracking-wider text-xs mb-3">
                Developers
              </h5>
              <ul className="space-y-2 text-gray">
                <li>
                  <Link href="/developers" className="hover:text-teal-dark transition-colors">
                    API Docs
                  </Link>
                </li>
                <li>
                  <Link href="/developers" className="hover:text-teal-dark transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-navy uppercase tracking-wider text-xs mb-3">
                Trust & Security
              </h5>
              <ul className="space-y-2 text-gray">
                <li>
                  <Link href="/privacy" className="hover:text-teal-dark transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-teal-dark transition-colors"
                  >
                    Cyber Crime Portal →
                  </a>
                </li>
                <li>
                  <span className="text-xs text-gray">Helpline: 1930</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray">
          <p>© {new Date().getFullYear()} VaaniX. All rights reserved.</p>
          <p>Official cyber helpline: 1930 · National portal: cybercrime.gov.in</p>
        </div>
      </div>
    </footer>
  );
}
