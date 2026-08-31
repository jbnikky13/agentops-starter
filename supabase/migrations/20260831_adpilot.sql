create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  website_url text not null,
  goal text,
  country text,
  daily_budget numeric,
  status text not null default 'draft',
  strategy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  platform text not null,
  customer_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, platform, customer_id)
);

create table if not exists public.campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  platform text not null,
  external_campaign_id text,
  metric_date date not null,
  impressions bigint default 0,
  clicks bigint default 0,
  spend numeric default 0,
  conversions numeric default 0,
  revenue numeric default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists campaign_metrics_campaign_date_idx on public.campaign_metrics(campaign_id, metric_date);

alter table public.campaigns enable row level security;
alter table public.ad_platform_connections enable row level security;
alter table public.campaign_metrics enable row level security;

-- For the first deployment, keep writes server-side. Add authenticated-user policies after Supabase Auth is wired into the dashboard.
