alter table public.ad_platform_connections
  add column if not exists customer_id text,
  add column if not exists refresh_token_encrypted text,
  add column if not exists access_token_expires_at timestamptz;

create unique index if not exists ad_platform_connections_platform_unique
  on public.ad_platform_connections(platform);

alter table public.campaigns
  add column if not exists approved_at timestamptz,
  add column if not exists external_campaign_id text,
  add column if not exists platform text;

create index if not exists campaigns_platform_idx on public.campaigns(platform);
create index if not exists campaigns_external_id_idx on public.campaigns(external_campaign_id);

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
