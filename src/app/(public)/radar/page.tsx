"use client";

import { useState } from "react";
import { Search, ShieldAlert, ShieldCheck, Info, PhoneCall } from "lucide-react";
import { Pill } from "@/components/marketing/pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RadarPage() {
  const [phoneNumber, setPhoneNumber] = useState("+91 98765 43210");
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    number: string;
    level: "none" | "caution" | "potential_scam";
    reporters24h: number;
    reporters7d: number;
    commonScamType: string | null;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/radar/lookup?number=${encodeURIComponent(phoneNumber.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `Lookup failed (${res.status})`);
      }

      setLookupResult(data.radar);
      setSearched(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lookup failed. Please check the number format.');
      setSearched(true);
      setLookupResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col w-full text-left py-12 sm:py-20">
      <div className="container-vaanix max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <Pill>COMMUNITY THREAT REPUTATION</Pill>
          <h1 className="h1-hero text-navy">Scam Radar Number Lookup</h1>
          <p className="body-large text-gray leading-relaxed max-w-2xl">
            Query the crowd-verified reputation of incoming phone numbers.
            When 3 or more distinct users report synthetic voice impersonation from a number in 24 hours,
            VaaniX flags it as a high-risk scam call.
          </p>
        </div>

        {/* Search Box */}
        <Card className="p-6 sm:p-8 border-2 border-border bg-surface">
          <form onSubmit={handleLookup} className="space-y-4">
            <label className="block text-sm font-bold text-navy">
              Enter Indian Caller Number (E.164 Format)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <PhoneCall className="absolute left-3.5 top-3.5 size-5 text-gray" />
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="pl-11 font-mono text-base font-semibold"
                />
              </div>
              <Button type="submit" size="lg" disabled={isSearching} className="font-bold shrink-0">
                <Search className="size-4 mr-2" />
                {isSearching ? "Checking Radar..." : "Check Number"}
              </Button>
            </div>
            <p className="text-xs text-gray">
              Try searching <code className="font-mono text-teal-dark font-bold">+91 98765 43210</code> (sample flagged number)
            </p>
          </form>
        </Card>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-tint border border-red text-red-text text-sm">
            {errorMessage}
          </div>
        )}

        {/* Result Area */}
        {searched && lookupResult && (
          <div className="space-y-6 pt-4 animate-fade-in">
            <h2 className="h2-title text-navy">Reputation Analysis</h2>

            {lookupResult.level === "potential_scam" ? (
              <div className="p-6 rounded-2xl bg-red-tint border-2 border-red space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-red text-white flex items-center justify-center">
                      <ShieldAlert className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-red leading-tight">
                        POTENTIAL SCAM DETECTED
                      </h3>
                      <span className="text-xs font-mono font-bold text-navy">
                        {lookupResult.number}
                      </span>
                    </div>
                  </div>
                  <Badge variant="critical">High Threat</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-surface border border-red/20 text-center">
                    <span className="text-xs text-gray font-semibold uppercase">Reports (24h)</span>
                    <div className="text-2xl font-bold tabular text-red">
                      {lookupResult.reporters24h}
                    </div>
                    <span className="text-[10px] text-faint">Distinct Reporters</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface border border-red/20 text-center">
                    <span className="text-xs text-gray font-semibold uppercase">Reports (7d)</span>
                    <div className="text-2xl font-bold tabular text-navy">
                      {lookupResult.reporters7d}
                    </div>
                    <span className="text-[10px] text-faint">Cumulative Flags</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface border border-red/20 text-center">
                    <span className="text-xs text-gray font-semibold uppercase">Primary Pattern</span>
                    <div className="text-xs font-bold text-navy mt-1 leading-snug">
                      {lookupResult.commonScamType || "AI Voice Clone"}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-red-text font-medium pt-1">
                  Community guidance: Do not pick up or authorize any transactions if this number calls.
                </p>
              </div>
            ) : lookupResult.level === "caution" ? (
              <div className="p-6 rounded-2xl bg-yellow-tint border-2 border-yellow space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-yellow text-navy flex items-center justify-center font-bold">
                      !
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-text leading-tight">
                        CAUTION ADVISED
                      </h3>
                      <span className="text-xs font-mono font-bold text-navy">
                        {lookupResult.number}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-yellow text-yellow-text font-bold">Caution</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-surface border border-yellow/20 text-center">
                    <span className="text-xs text-gray font-semibold uppercase">Reports (24h)</span>
                    <div className="text-2xl font-bold tabular text-navy">
                      {lookupResult.reporters24h}
                    </div>
                    <span className="text-[10px] text-faint">Distinct Reporters</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface border border-yellow/20 text-center">
                    <span className="text-xs text-gray font-semibold uppercase">Reports (7d)</span>
                    <div className="text-2xl font-bold tabular text-navy">
                      {lookupResult.reporters7d}
                    </div>
                    <span className="text-[10px] text-faint">Cumulative Flags</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface border border-yellow/20 text-center">
                    <span className="text-xs text-gray font-semibold uppercase">Primary Pattern</span>
                    <div className="text-xs font-bold text-navy mt-1 leading-snug">
                      {lookupResult.commonScamType || "Suspicious Activity"}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-yellow-text font-medium pt-1">
                  Community guidance: This number has recent reports. Verify caller identity before sharing information.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-green-tint border-2 border-green space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-green text-white flex items-center justify-center">
                      <ShieldCheck className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-text leading-tight">
                        No Community Reports Found
                      </h3>
                      <span className="text-xs font-mono font-bold text-navy">
                        {lookupResult.number}
                      </span>
                    </div>
                  </div>
                  <Badge variant="positive">Clean Record</Badge>
                </div>

                <p className="text-xs sm:text-sm text-green-text/90 leading-relaxed">
                  This number has not been flagged for AI voice clone scams by any VaaniX users within the past 7 days.
                </p>
              </div>
            )}

            {/* Privacy Safeguards */}
            <div className="p-5 rounded-2xl bg-light border border-border text-xs text-gray space-y-2">
              <div className="flex items-center gap-2 font-bold text-navy">
                <Info className="size-4 text-teal-dark shrink-0" />
                <span>Radar Privacy Principles</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-gray">
                <li>
                  <strong className="text-navy">Caller ID Spoofing Warning:</strong> Scammers frequently forge caller IDs.
                  A clean radar record does not guarantee safety; a flagged record warns you to remain cautious.
                </li>
                <li>
                  <strong className="text-navy">Strict Anonymity:</strong> Reporter identities, locations, and personal numbers
                  are cryptographically decoupled. Only aggregate count thresholds are public.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
