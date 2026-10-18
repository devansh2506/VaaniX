import * as React from 'react';
import Link from 'next/link';
import { PhoneCall, ShieldAlert, ArrowLeft, ExternalLink, Clock } from 'lucide-react';
import { Pill } from '@/components/marketing/pill';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Call 1930 — National Cyber Crime Helpline | VaaniX',
  description: 'National Cyber Crime Helpline 1930 — call immediately to report financial fraud and freeze fraudulent transactions.',
};

export default function Call1930Page() {
  return (
    <div className="min-h-screen bg-light py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to VaaniX
        </Link>

        <Card className="p-6 sm:p-8 border-2 border-red-200 bg-surface shadow-xl rounded-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-3xl shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <Pill label="Emergency Financial Fraud Response" className="border-red-300 text-red-700 bg-red-50" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight mt-2">
              National Cyber Crime Helpline
            </h1>
            <p className="text-base text-muted max-w-md mx-auto">
              If money has been transferred or unauthorized access was attempted, call immediately within the golden hour to freeze funds across recipient accounts.
            </p>
          </div>

          {/* Big Prominent Call Button */}
          <div className="pt-2">
            <a
              href="tel:1930"
              className="group block w-full py-5 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xl sm:text-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] border-2 border-red-700"
              id="call-1930-btn"
            >
              <div className="flex items-center justify-center gap-3">
                <PhoneCall className="w-8 h-8 animate-pulse text-white" />
                <span>Call 1930 Now</span>
              </div>
              <span className="block text-xs sm:text-sm font-medium text-red-100 mt-1 opacity-90 group-hover:opacity-100">
                National Cyber Crime Helpline 1930 — call fast to stop the money
              </span>
            </a>
          </div>

          {/* What to tell operator */}
          <div className="text-left bg-light rounded-xl p-5 border border-border space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-navy">
              <Clock className="w-4 h-4 text-teal" />
              <span>What to share with the 1930 helpline executive:</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside">
              <li>Exact time and date of the incident or unauthorized transaction</li>
              <li>Caller phone number or impersonated persona</li>
              <li>Your bank name, account number, or UPI ID used</li>
              <li>Transaction ID / reference number from SMS or bank statement (if available)</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-teal-dark hover:underline"
            >
              Official Cyber Crime Portal (cybercrime.gov.in)
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-slate-400">Toll-free 24x7 government helpline</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
