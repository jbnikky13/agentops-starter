create extension if not exists pgcrypto;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  url text not null,
  goal text not null default 'Get traffic',
  country text not null default 'Nigeria',
  daily_budget numeric(12,2) not null default 0,
  status text not null default 'draft',
  ai_provider text not null default 'gemini',
  blueprint jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  platform text,
  external_campaign_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists campaigns_created_at_idx on public.campaigns(created_at desc);
create index if not exists campaigns_platform_idx on public.campaigns(platform);
create index if not exists campaigns_external_id_idx on public.campaigns(external_campaign_id);

alter table public.campaigns enable row level security;

create table if not exists public.ad_platform_connections (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  account_name text,
  customer_id text,
  status text not null default 'not_connected',
  refresh_token_encrypted text,
  access_token_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ad_platform_connections_platform_unique on public.ad_platform_connections(platform);
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

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  status text not null default 'completed',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_runs_campaign_idx on public.agent_runs(campaign_id, created_at desc);
alter table public.agent_runs enable row level security;

-- The service role is used by server routes. Never expose SUPABASE_SERVICE_ROLE_KEY in browser code.
