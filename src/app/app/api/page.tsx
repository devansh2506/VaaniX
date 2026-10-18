import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/marketing/pill';

export default function ApiKeysPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Pill label="Developer Access" />
          <h1 className="text-3xl font-extrabold text-navy tracking-tight mt-3">
            API Keys & Integrations
          </h1>
          <p className="text-base text-muted mt-2">
            Generate and manage API keys for telecommunication and enterprise call center integrations.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/developers">View API Documentation →</Link>
        </Button>
      </div>

      <Card className="p-12 border border-border bg-surface text-center">
        <div className="w-16 h-16 rounded-full bg-teal-tint text-teal-dark flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          🔑
        </div>
        <h2 className="text-xl font-bold text-navy mb-2">API Key Management</h2>
        <p className="text-sm text-muted max-w-md mx-auto mb-4">
          API key creation, hashing, and quota monitoring will be enabled in Phase 6.
        </p>
      </Card>
    </div>
  );
}
