-- Reconcile the older 20260831 schema with the current AdPilot schema.
do $$
begin
  if to_regclass('public.campaigns') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='campaigns' and column_name='name')
       and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='campaigns' and column_name='brand') then
      execute 'alter table public.campaigns rename column name to brand';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='campaigns' and column_name='website_url')
       and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='campaigns' and column_name='url') then
      execute 'alter table public.campaigns rename column website_url to url';
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='campaigns' and column_name='strategy')
       and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='campaigns' and column_name='blueprint') then
      execute 'alter table public.campaigns rename column strategy to blueprint';
    end if;
  end if;
end $$;

alter table public.campaigns
  add column if not exists brand text,
  add column if not exists url text,
  add column if not exists goal text default 'Get traffic',
  add column if not exists country text default 'Nigeria',
  add column if not exists daily_budget numeric default 0,
  add column if not exists status text default 'draft',
  add column if not exists ai_provider text default 'gemini',
  add column if not exists blueprint jsonb default '{}'::jsonb,
  add column if not exists approved_at timestamptz,
  add column if not exists external_campaign_id text,
  add column if not exists platform text;

update public.campaigns set brand = coalesce(brand, 'Untitled Campaign') where brand is null;
update public.campaigns set url = coalesce(url, 'https://example.com') where url is null;
update public.campaigns set blueprint = coalesce(blueprint, '{}'::jsonb) where blueprint is null;

alter table public.ad_platform_connections
  add column if not exists customer_id text,
  add column if not exists refresh_token_encrypted text,
  add column if not exists access_token_expires_at timestamptz;

create unique index if not exists ad_platform_connections_platform_unique
  on public.ad_platform_connections(platform);

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
