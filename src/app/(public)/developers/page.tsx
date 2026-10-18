"use client";

import { useState } from "react";
import { Copy, Check, Key, Smartphone } from "lucide-react";
import { Pill } from "@/components/marketing/pill";
import { Badge } from "@/components/ui/badge";

export default function DevelopersPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeSnippets = {
    analyze: `curl -X POST "https://vaanix.in/api/v1/analyze" \\
  -H "Authorization: Bearer vx_live_7a8f9c0e2b1d4e" \\
  -F "audio=@suspicious_call_10s.wav" \\
  -F 'members=[{"id":"fam_01","name":"Rahul","relationship":"son"}]'`,
    analyzeResponse: `{
  "voice": {
    "spoof_prob": 92.4,
    "real_prob": 7.6,
    "stub": false
  },
  "transcript": {
    "text": "Mummy accident ho gaya hai jaldi paise bhejo",
    "language": "hi",
    "segments": [
      { "start": 0.0, "end": 4.2, "text": "Mummy accident ho gaya hai jaldi paise bhejo" }
    ]
  },
  "text_analysis": {
    "groups": ["money", "accident", "urgency"],
    "matched_words": ["accident", "paise", "jaldi"],
    "text_score": 70,
    "claim": {
      "type": "family",
      "member_id": "fam_01",
      "label": "Rahul (Son)",
      "source": "transcript_relation"
    }
  },
  "risk_score": 86,
  "verdict": "AI_CLONE"
}`,
    radar: `curl -X GET "https://vaanix.in/api/v1/radar/lookup?number=%2B919876543210" \\
  -H "Authorization: Bearer vx_live_7a8f9c0e2b1d4e"`,
    radarResponse: `{
  "number_e164": "+919876543210",
  "level": "potential_scam",
  "reporters_24h": 4,
  "reporters_7d": 11,
  "primary_scam_type": "police_arrest_impersonation",
  "threshold_exceeded": true
}`,
  };

  return (
    <div className="flex flex-col w-full text-left py-12 sm:py-20">
      <div className="container-vaanix max-w-4xl space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Pill>DEVELOPER REST API & SDK</Pill>
          <h1 className="h1-hero text-navy">VaaniX API Documentation</h1>
          <p className="body-large text-gray leading-relaxed max-w-2xl">
            Integrate real-time acoustic voice biometrics, community threat radar, and forensic
            complaint packaging into banking, telecom, or custom mobile applications.
          </p>
        </div>

        {/* Authentication Notice */}
        <div className="p-6 rounded-2xl bg-light border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Key className="size-5 text-teal-dark" />
            <h3 className="text-lg font-bold text-navy">Authentication</h3>
          </div>
          <p className="text-sm text-gray leading-relaxed">
            All API requests must supply an API key in the standard Authorization header:
          </p>
          <pre className="p-3.5 rounded-xl bg-surface border border-border font-mono text-xs sm:text-sm text-navy overflow-x-auto">
            Authorization: Bearer vx_live_your_32_byte_secret_key
          </pre>
          <p className="text-xs text-faint">
            Keys can be created and managed in the logged-in app console under <code className="font-mono">/app/api</code>.
          </p>
        </div>

        {/* Endpoint 1: POST /api/v1/analyze */}
        <section className="space-y-4 pt-4 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-teal-dark text-white">
                POST
              </span>
              <code className="text-lg font-bold font-mono text-navy">/api/v1/analyze</code>
            </div>
            <Badge variant="teal">Rate: 120 req / min</Badge>
          </div>

          <p className="text-sm text-gray leading-relaxed">
            Submit an 8–12 second audio sample with optional family member metadata.
            Returns acoustic model probability, transcript, extracted claims, and combined risk score.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-gray uppercase">Example Request (curl)</span>
              <button
                type="button"
                onClick={() => handleCopy("analyze", codeSnippets.analyze)}
                className="text-xs text-teal-dark font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedKey === "analyze" ? <Check className="size-3.5 text-green" /> : <Copy className="size-3.5" />}
                {copiedKey === "analyze" ? "Copied" : "Copy cURL"}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-navy text-white font-mono text-xs overflow-x-auto">
              {codeSnippets.analyze}
            </pre>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono font-bold text-gray uppercase">Example Response (200 OK)</span>
            <pre className="p-4 rounded-xl bg-light border border-border font-mono text-xs text-navy overflow-x-auto">
              {codeSnippets.analyzeResponse}
            </pre>
          </div>
        </section>

        {/* Endpoint 2: GET /api/v1/radar/lookup */}
        <section className="space-y-4 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-navy text-white">
                GET
              </span>
              <code className="text-lg font-bold font-mono text-navy">/api/v1/radar/lookup</code>
            </div>
            <Badge variant="teal">Latency: &lt; 300ms</Badge>
          </div>

          <p className="text-sm text-gray leading-relaxed">
            Fast number reputation check designed for call screening and ringing pop-ups.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-gray uppercase">Example Request</span>
              <button
                type="button"
                onClick={() => handleCopy("radar", codeSnippets.radar)}
                className="text-xs text-teal-dark font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedKey === "radar" ? <Check className="size-3.5 text-green" /> : <Copy className="size-3.5" />}
                {copiedKey === "radar" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-navy text-white font-mono text-xs overflow-x-auto">
              {codeSnippets.radar}
            </pre>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono font-bold text-gray uppercase">Example Response</span>
            <pre className="p-4 rounded-xl bg-light border border-border font-mono text-xs text-navy overflow-x-auto">
              {codeSnippets.radarResponse}
            </pre>
          </div>
        </section>

        {/* SDK Section */}
        <section className="p-8 rounded-2xl bg-light border-2 border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="size-6 text-teal-dark" />
              <h3 className="text-xl font-bold text-navy">Android Mobile SDK</h3>
            </div>
            <Badge variant="default" className="bg-navy text-white font-mono">Planned</Badge>
          </div>
          <p className="text-sm text-gray leading-relaxed">
            The embeddable <code className="font-mono text-navy font-bold">satyavoice-sdk</code> library module
            allows banking, telecom, and fintech applications to implement Payment Guard UPI overlays and
            on-device audio sampling with zero background latency.
          </p>
        </section>
      </div>
    </div>
  );
}
