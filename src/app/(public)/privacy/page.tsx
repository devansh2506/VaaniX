import { Shield, Lock, Trash2, Eye, Server, CheckCircle2 } from "lucide-react";
import { Pill } from "@/components/marketing/pill";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col w-full text-left py-12 sm:py-20">
      <div className="container-vaanix max-w-4xl space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <Pill>TRANSPARENCY & TRUST</Pill>
          <h1 className="h1-hero text-navy">VaaniX Privacy Policy</h1>
          <p className="body-large text-gray leading-relaxed max-w-2xl">
            We believe that protecting citizens against voice fraud should never come at the expense of privacy.
            This policy outlines in plain English exactly what we record, what we discard, and how your data is protected.
          </p>
          <div className="text-xs font-mono text-faint">
            Effective Date: October 2026 · Compliant with Digital Personal Data Protection Act (DPDP)
          </div>
        </div>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-light border border-border space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-tint text-teal-dark">
              <Lock className="size-5" />
            </div>
            <h3 className="text-lg font-bold text-navy">Zero Full-Call Recording</h3>
            <p className="text-sm text-gray leading-relaxed">
              VaaniX never records full phone conversations. Only seconds 5 to 15 (a single 10-second window)
              are temporarily captured to verify vocal authenticity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-light border border-border space-y-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-green-tint text-green-text">
              <CheckCircle2 className="size-5" />
            </div>
            <h3 className="text-lg font-bold text-navy">Clean Calls Are Dropped Instantly</h3>
            <p className="text-sm text-gray leading-relaxed">
              If an audio sample is verified as natural speech or inconclusive, the audio buffer is wiped
              from memory immediately. Clean audio is never written to disk or database.
            </p>
          </div>
        </div>

        {/* Section 1: What is Recorded */}
        <section className="space-y-4 pt-4 border-t border-border">
          <h2 className="h2-title text-navy">1. What We Record</h2>
          <div className="space-y-3 text-sm text-gray leading-relaxed">
            <p>
              When a voice verification is initiated on your device (via microphone capture or manual upload):
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-navy">10-Second Audio Chunk:</strong> High-resolution 16kHz mono audio
                captured strictly during the active listening window.
              </li>
              <li>
                <strong className="text-navy">Optional Caller Number:</strong> If provided, the caller&apos;s phone number
                (in E.164 format) is used strictly to cross-reference Scam Radar reputation.
              </li>
              <li>
                <strong className="text-navy">Speech Transcript:</strong> Converted to text locally and in memory
                to detect emergency scam coercion keywords (e.g. &ldquo;accident&rdquo;, &ldquo;police&rdquo;, &ldquo;UPI&rdquo;).
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Audio Storage & Retention */}
        <section className="space-y-4 pt-4 border-t border-border">
          <h2 className="h2-title text-navy">2. Retention and Cryptographic Evidence</h2>
          <div className="space-y-3 text-sm text-gray leading-relaxed">
            <p>
              We enforce a strict 30-day retention window exclusively for malicious calls:
            </p>
            <div className="p-5 rounded-xl bg-surface border border-border space-y-3">
              <div className="flex items-center gap-2 font-bold text-navy">
                <Server className="size-4 text-teal-dark" />
                <span>Evidence Lifecycle</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-gray">
                <li>
                  <strong className="text-navy">Non-Flagged Calls:</strong> 0 seconds stored. Completely ephemeral.
                </li>
                <li>
                  <strong className="text-navy">Flagged AI Voice Clones:</strong> Audio is cryptographically signed
                  with an immutable SHA-256 hash and stored in an encrypted private vault for 30 days.
                  This permits pre-filling official cyber cell police complaint dossiers.
                </li>
                <li>
                  <strong className="text-navy">Automated Purge:</strong> After 30 days, all retained evidence files
                  are automatically purged from storage.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Who Sees What */}
        <section className="space-y-4 pt-4 border-t border-border">
          <h2 className="h2-title text-navy">3. Access Control & Anonymity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-5 rounded-xl bg-light border border-border space-y-2">
              <div className="flex items-center gap-2 font-bold text-navy">
                <Eye className="size-4 text-teal-dark" />
                <span>Account Transcripts</span>
              </div>
              <p className="text-xs sm:text-sm text-gray leading-relaxed">
                Transcripts and check history are accessible solely by you through authenticated session tokens
                guaranteed by PostgreSQL Row Level Security (RLS). No public feeds exist.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-light border border-border space-y-2">
              <div className="flex items-center gap-2 font-bold text-navy">
                <Shield className="size-4 text-teal-dark" />
                <span>Scam Radar Anonymity</span>
              </div>
              <p className="text-xs sm:text-sm text-gray leading-relaxed">
                When a number is reported on Scam Radar, your identity, account ID, and personal information
                are completely omitted. Only the aggregate count of distinct daily reporters is published.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Data Deletion */}
        <section className="space-y-4 pt-4 border-t border-border">
          <h2 className="h2-title text-navy">4. Complete Data Deletion Rights</h2>
          <div className="p-6 rounded-2xl bg-red-tint/50 border border-red/20 space-y-3">
            <div className="flex items-center gap-2 font-bold text-red-text">
              <Trash2 className="size-5" />
              <span>Right to Erasure (&ldquo;Delete My Data&rdquo;)</span>
            </div>
            <p className="text-sm text-navy leading-relaxed">
              You retain absolute ownership of your data. You may delete your account, remove family members,
              or purge your entire check history at any time directly within the Settings console (<code className="font-mono text-xs">/app/settings</code>).
              Deletion permanently purges all database records and storage buckets.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
