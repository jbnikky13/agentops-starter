create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  url text not null,
  goal text not null default 'Get traffic',
  country text not null default 'Nigeria',
  daily_budget numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','approved','active','paused','completed')),
  ai_provider text not null default 'gemini',
  blueprint jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists campaigns_created_at_idx on public.campaigns(created_at desc);

alter table public.campaigns enable row level security;

-- V1 uses the server-side service role for persistence. Do not expose
-- SUPABASE_SERVICE_ROLE_KEY to the browser. Add authenticated-user policies
-- when Supabase Auth is enabled in the next phase.

create table if not exists public.ad_platform_connections (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('google_ads','meta_ads','tiktok_ads','x_ads')),
  account_name text,
  status text not null default 'not_connected',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ad_platform_connections enable row level security;

create table if not exists public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists campaign_events_campaign_idx on public.campaign_events(campaign_id, created_at desc);
alter table public.campaign_events enable row level security;
