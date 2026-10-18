-- SatyaVoice / VaaniX Initial Schema
-- Migration: 0001_init.sql

create extension if not exists "pgcrypto";

-- 1. Banks (must exist before profiles foreign key)
create table if not exists public.banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fraud_email text not null,
  is_demo boolean default true,
  created_at timestamptz default now()
);

-- 2. Cyber Cells (States / UTs directory)
create table if not exists public.cyber_cells (
  state_code text primary key,
  state_name text not null,
  email text null,
  portal_url text not null default 'https://cybercrime.gov.in',
  source_url text null,
  verified boolean default false,
  verified_on date null
);

-- 3. Profiles (User account details linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  phone_e164 text null,
  state_code text null references public.cyber_cells(state_code) on delete set null,
  bank_id uuid null references public.banks(id) on delete set null,
  telegram_chat_id bigint null,
  telegram_link_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now()
);

-- 4. Family Members (Registered members protected by the user)
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  aliases text[] default '{}',
  relationship text not null,
  phone_e164 text not null,
  telegram_chat_id bigint null,
  join_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  joined_at timestamptz null,
  created_at timestamptz default now()
);

-- 5. Checks (Voice verification records)
create table if not exists public.checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null default 'web_mic', -- 'web_mic'|'web_upload'|'api'|'laptop_pipeline'
  caller_e164 text null,
  voice_score int not null default 0,
  text_score int not null default 0,
  risk_score int not null default 0,
  verdict text not null, -- 'AI_CLONE'|'REAL'|'INCONCLUSIVE'
  is_stub boolean default false,
  transcript text null,
  transcript_lang text null,
  transcript_segments jsonb default '[]'::jsonb,
  scam_groups text[] default '{}',
  scam_words text[] default '{}',
  scam_type text null,
  claim_type text null,
  claim_label text null,
  claimed_member_id uuid null references public.family_members(id) on delete set null,
  audio_path text null,
  audio_sha256 text null,
  timings_ms jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 6. Alerts (Generated for high-risk AI_CLONE checks)
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.checks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open', -- 'open'|'confirmed_scam'|'verified_genuine'|'dismissed_genuine'
  impersonated_member_id uuid null references public.family_members(id) on delete set null,
  member_response text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. Alert Messages (Telegram messages dispatched for each alert)
create table if not exists public.alert_messages (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  recipient text not null, -- 'user'|'member'
  chat_id bigint not null,
  telegram_message_id bigint null,
  ok boolean not null default false,
  error text null,
  sent_at timestamptz default now()
);

-- 8. Complaints (Logs when user opens cyber cell, bank or portal report drafts)
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  target text not null, -- 'cyber_cell'|'bank'|'portal'|'api'
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 9. Radar Reports (Crowdsourced and automated scam caller registry)
create table if not exists public.radar_reports (
  id uuid primary key default gen_random_uuid(),
  number_e164 text not null,
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null, -- 'ai_flag'|'user_report'|'impersonation_denied'
  check_id uuid null references public.checks(id) on delete set null,
  scam_type text null,
  excluded boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_radar_number_created on public.radar_reports (number_e164, created_at desc);
create unique index if not exists uq_radar_report_daily on public.radar_reports (
  number_e164,
  reporter_user_id,
  source,
  (date_trunc('day', created_at))
);

-- 10. Feedback (Accuracy signals from users)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references public.checks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null, -- 'genuine'|'scam'
  created_at timestamptz default now()
);

-- 11. API Clients (Developer and integration API keys)
create table if not exists public.api_clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{"checks:create", "checks:read"}',
  revoked_at timestamptz null,
  last_used_at timestamptz null,
  request_count int default 0,
  created_at timestamptz default now()
);

-- 12. Rate Limits (Stored in PostgreSQL to avoid additional dependencies)
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (key, window_start)
);

-- Automatic Profile Creation Trigger on Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, telegram_link_token)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    encode(gen_random_bytes(16), 'hex')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Delete Account and Cascaded Data Function
create or replace function public.delete_user_account()
returns void as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
