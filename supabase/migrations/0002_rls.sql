-- SatyaVoice / VaaniX Row Level Security (RLS)
-- Migration: 0002_rls.sql

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.family_members enable row level security;
alter table public.checks enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_messages enable row level security;
alter table public.complaints enable row level security;
alter table public.radar_reports enable row level security;
alter table public.feedback enable row level security;
alter table public.cyber_cells enable row level security;
alter table public.banks enable row level security;
alter table public.api_clients enable row level security;
alter table public.rate_limits enable row level security;

-- 1. Profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- 2. Family Members
create policy "family_members_all_own" on public.family_members
  for all using (auth.uid() = user_id);

-- 3. Checks
create policy "checks_all_own" on public.checks
  for all using (auth.uid() = user_id);

-- 4. Alerts
create policy "alerts_all_own" on public.alerts
  for all using (auth.uid() = user_id);

-- 5. Alert Messages (User can view dispatch logs for their alerts)
create policy "alert_messages_select_own" on public.alert_messages
  for select using (
    exists (
      select 1 from public.alerts
      where alerts.id = alert_messages.alert_id
      and alerts.user_id = auth.uid()
    )
  );

-- 6. Complaints
create policy "complaints_all_own" on public.complaints
  for all using (auth.uid() = user_id);

-- 7. Radar Reports (User can view and submit their own reports)
create policy "radar_reports_select_own" on public.radar_reports
  for select using (auth.uid() = reporter_user_id);

create policy "radar_reports_insert_own" on public.radar_reports
  for insert with check (auth.uid() = reporter_user_id);

-- 8. Feedback
create policy "feedback_all_own" on public.feedback
  for all using (auth.uid() = user_id);

-- 9. Cyber Cells (Public directory read)
create policy "cyber_cells_select_all" on public.cyber_cells
  for select using (true);

-- 10. Banks (Public directory read)
create policy "banks_select_all" on public.banks
  for select using (true);

-- 11. API Clients (Owner manages keys)
create policy "api_clients_all_own" on public.api_clients
  for all using (auth.uid() = owner_user_id);

-- 12. Rate Limits (Service role only - no public policies created)

-- Storage: Evidence Bucket Configuration (Private)
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do update set public = false;

create policy "evidence_select_own" on storage.objects
  for select using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidence_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
