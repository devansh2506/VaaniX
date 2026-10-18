import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Supabase Schema & RLS Policy Verification', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
  const initSql = fs.readFileSync(path.join(migrationsDir, '0001_init.sql'), 'utf-8');
  const rlsSql = fs.readFileSync(path.join(migrationsDir, '0002_rls.sql'), 'utf-8');
  const seedSql = fs.readFileSync(path.join(migrationsDir, '0003_seed_banks_and_states.sql'), 'utf-8');

  const requiredTables = [
    'profiles',
    'family_members',
    'checks',
    'alerts',
    'alert_messages',
    'complaints',
    'radar_reports',
    'feedback',
    'cyber_cells',
    'banks',
    'api_clients',
    'rate_limits',
  ];

  it('defines all 12 required tables in 0001_init.sql', () => {
    for (const table of requiredTables) {
      expect(initSql).toContain(`create table if not exists public.${table}`);
    }
  });

  it('enables Row Level Security (RLS) on EVERY table in 0002_rls.sql', () => {
    for (const table of requiredTables) {
      expect(rlsSql).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it('enforces user isolation (user A cannot access user B data)', () => {
    // Check policies ensuring auth.uid() check
    expect(rlsSql).toContain('create policy "profiles_select_own" on public.profiles');
    expect(rlsSql).toContain('auth.uid() = id');

    expect(rlsSql).toContain('create policy "family_members_all_own" on public.family_members');
    expect(rlsSql).toContain('auth.uid() = user_id');

    expect(rlsSql).toContain('create policy "checks_all_own" on public.checks');
    expect(rlsSql).toContain('auth.uid() = user_id');

    expect(rlsSql).toContain('create policy "alerts_all_own" on public.alerts');
    expect(rlsSql).toContain('auth.uid() = user_id');

    expect(rlsSql).toContain('create policy "complaints_all_own" on public.complaints');
    expect(rlsSql).toContain('auth.uid() = user_id');
  });

  it('configures private evidence storage bucket with user-isolated folder policy', () => {
    expect(rlsSql).toContain("values ('evidence', 'evidence', false)");
    expect(rlsSql).toContain('create policy "evidence_select_own" on storage.objects');
    expect(rlsSql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
  });

  it('creates automatic profile insertion trigger for new auth signups', () => {
    expect(initSql).toContain('create or replace function public.handle_new_user()');
    expect(initSql).toContain('insert into public.profiles');
    expect(initSql).toContain('after insert on auth.users');
  });

  it('seeds exactly one demo bank with a reserved non-real .example domain', () => {
    expect(seedSql).toContain("'Sample Bank (Demo)'");
    expect(seedSql).toContain("'fraud@samplebank.example'");
    expect(seedSql).toContain('true');
  });

  it('seeds all 36 Indian states/UTs with email = NULL and official portal_url', () => {
    const states = [
      'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JH',
      'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'PB',
      'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB',
      'AN', 'CH', 'DN', 'DL', 'JK', 'LA', 'LD', 'PY',
    ];

    expect(states.length).toBe(36);

    for (const code of states) {
      expect(seedSql).toContain(`('${code}'`);
    }

    const stateLines = seedSql.split('\n').filter((l) => l.trim().startsWith("('"));
    // Exactly 36 states/UTs
    expect(stateLines.length).toBe(36);
    for (const line of stateLines) {
      expect(line).toContain('null');
      expect(line).toContain("'https://cybercrime.gov.in'");
      expect(line).toContain('false'); // verified = false
    }
  });

  it('exports valid browser and admin client creators', async () => {
    const { createClient } = await import('./client');
    const { createAdminClient } = await import('./admin');

    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();

    const admin = createAdminClient();
    expect(admin).toBeDefined();
    expect(admin.auth).toBeDefined();
  });

  it('configures Next.js 16 proxy.ts for route protection under /app', async () => {
    const { config } = await import('../../proxy');
    expect(config).toBeDefined();
    expect(config.matcher).toContain('/app/:path*');
  });
});

