-- 20260502_0019_clickbook_real_subscriptions.sql
-- Real persistent ClickBook subscriptions: Start by default, paid plans only when the DB says so.

create extension if not exists pgcrypto;

create or replace function public.sloty_now_utc()
returns timestamptz
language sql
stable
as $$
  select timezone('utc', now())::timestamptz;
$$;

create table if not exists public.sloty_workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  plan text not null default 'start',
  status text not null default 'active',
  billing_cycle text not null default 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider text not null default 'manual',
  payment_method_label text,
  provider_customer_id text,
  provider_subscription_id text,
  trial_ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc(),
  unique (workspace_id)
);

alter table public.sloty_workspace_subscriptions add column if not exists plan text;
alter table public.sloty_workspace_subscriptions add column if not exists status text;
alter table public.sloty_workspace_subscriptions add column if not exists billing_cycle text;
alter table public.sloty_workspace_subscriptions add column if not exists current_period_start timestamptz;
alter table public.sloty_workspace_subscriptions add column if not exists current_period_end timestamptz;
alter table public.sloty_workspace_subscriptions add column if not exists cancel_at_period_end boolean;
alter table public.sloty_workspace_subscriptions add column if not exists provider text;
alter table public.sloty_workspace_subscriptions add column if not exists payment_method_label text;
alter table public.sloty_workspace_subscriptions add column if not exists provider_customer_id text;
alter table public.sloty_workspace_subscriptions add column if not exists provider_subscription_id text;
alter table public.sloty_workspace_subscriptions add column if not exists trial_ends_at timestamptz;
alter table public.sloty_workspace_subscriptions add column if not exists metadata jsonb;
alter table public.sloty_workspace_subscriptions add column if not exists created_at timestamptz;
alter table public.sloty_workspace_subscriptions add column if not exists updated_at timestamptz;

-- If an older DB used plan_id instead of plan, copy it without referencing a missing column statically.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sloty_workspace_subscriptions'
      and column_name = 'plan_id'
  ) then
    execute 'update public.sloty_workspace_subscriptions set plan = coalesce(nullif(plan, ''''), nullif(plan_id, ''''), ''start'')';
  end if;
end $$;

update public.sloty_workspace_subscriptions
set
  plan = case
    when lower(coalesce(plan, '')) in ('free', 'base', 'basic', 'starter', 'start') then 'start'
    when lower(plan) in ('pro', 'studio', 'premium') then lower(plan)
    else 'start'
  end,
  status = case
    when lower(coalesce(status, '')) in ('active', 'trialing', 'past_due', 'cancelled', 'inactive') then lower(status)
    else 'active'
  end,
  billing_cycle = case
    when lower(coalesce(billing_cycle, '')) = 'yearly' then 'yearly'
    else 'monthly'
  end,
  current_period_start = coalesce(current_period_start, public.sloty_now_utc()),
  cancel_at_period_end = coalesce(cancel_at_period_end, false),
  provider = coalesce(nullif(provider, ''), 'manual'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, public.sloty_now_utc()),
  updated_at = public.sloty_now_utc();

alter table public.sloty_workspace_subscriptions alter column plan set default 'start';
alter table public.sloty_workspace_subscriptions alter column plan set not null;
alter table public.sloty_workspace_subscriptions alter column status set default 'active';
alter table public.sloty_workspace_subscriptions alter column status set not null;
alter table public.sloty_workspace_subscriptions alter column billing_cycle set default 'monthly';
alter table public.sloty_workspace_subscriptions alter column billing_cycle set not null;
alter table public.sloty_workspace_subscriptions alter column cancel_at_period_end set default false;
alter table public.sloty_workspace_subscriptions alter column cancel_at_period_end set not null;
alter table public.sloty_workspace_subscriptions alter column provider set default 'manual';
alter table public.sloty_workspace_subscriptions alter column provider set not null;
alter table public.sloty_workspace_subscriptions alter column metadata set default '{}'::jsonb;
alter table public.sloty_workspace_subscriptions alter column metadata set not null;
alter table public.sloty_workspace_subscriptions alter column created_at set default public.sloty_now_utc();
alter table public.sloty_workspace_subscriptions alter column created_at set not null;
alter table public.sloty_workspace_subscriptions alter column updated_at set default public.sloty_now_utc();
alter table public.sloty_workspace_subscriptions alter column updated_at set not null;

alter table public.sloty_workspace_subscriptions drop constraint if exists sloty_workspace_subscriptions_plan_check;
alter table public.sloty_workspace_subscriptions
  add constraint sloty_workspace_subscriptions_plan_check
  check (plan in ('start', 'pro', 'studio', 'premium'));

alter table public.sloty_workspace_subscriptions drop constraint if exists sloty_workspace_subscriptions_status_check;
alter table public.sloty_workspace_subscriptions
  add constraint sloty_workspace_subscriptions_status_check
  check (status in ('active', 'trialing', 'past_due', 'cancelled', 'inactive'));

alter table public.sloty_workspace_subscriptions drop constraint if exists sloty_workspace_subscriptions_billing_cycle_check;
alter table public.sloty_workspace_subscriptions
  add constraint sloty_workspace_subscriptions_billing_cycle_check
  check (billing_cycle in ('monthly', 'yearly'));

create unique index if not exists sloty_workspace_subscriptions_workspace_unique
  on public.sloty_workspace_subscriptions (workspace_id);
create index if not exists sloty_workspace_subscriptions_plan_status_idx
  on public.sloty_workspace_subscriptions (plan, status);

create table if not exists public.sloty_subscription_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.sloty_workspaces(id) on delete cascade,
  subscription_id uuid references public.sloty_workspace_subscriptions(id) on delete cascade,
  event_type text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'RUB',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_subscription_events add column if not exists workspace_id uuid references public.sloty_workspaces(id) on delete cascade;
alter table public.sloty_subscription_events add column if not exists subscription_id uuid references public.sloty_workspace_subscriptions(id) on delete cascade;
alter table public.sloty_subscription_events add column if not exists event_type text;
alter table public.sloty_subscription_events add column if not exists amount numeric(12,2);
alter table public.sloty_subscription_events add column if not exists currency text;
alter table public.sloty_subscription_events add column if not exists metadata jsonb;
alter table public.sloty_subscription_events add column if not exists created_at timestamptz;

update public.sloty_subscription_events
set
  event_type = coalesce(nullif(event_type, ''), 'subscription_event'),
  amount = coalesce(amount, 0),
  currency = coalesce(nullif(currency, ''), 'RUB'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, public.sloty_now_utc());

alter table public.sloty_subscription_events alter column event_type set not null;
alter table public.sloty_subscription_events alter column amount set default 0;
alter table public.sloty_subscription_events alter column amount set not null;
alter table public.sloty_subscription_events alter column currency set default 'RUB';
alter table public.sloty_subscription_events alter column currency set not null;
alter table public.sloty_subscription_events alter column metadata set default '{}'::jsonb;
alter table public.sloty_subscription_events alter column metadata set not null;
alter table public.sloty_subscription_events alter column created_at set default public.sloty_now_utc();
alter table public.sloty_subscription_events alter column created_at set not null;

create index if not exists sloty_subscription_events_workspace_created_idx
  on public.sloty_subscription_events (workspace_id, created_at desc);
create index if not exists sloty_subscription_events_subscription_idx
  on public.sloty_subscription_events (subscription_id, created_at desc);

-- Every existing workspace gets Start unless it already has a subscription.
insert into public.sloty_workspace_subscriptions (
  workspace_id,
  plan,
  status,
  billing_cycle,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  provider,
  payment_method_label,
  metadata
)
select
  w.id,
  'start',
  'active',
  'monthly',
  public.sloty_now_utc(),
  null,
  false,
  'manual',
  null,
  jsonb_build_object('planId', 'start', 'planName', 'Start', 'source', 'migration_default')
from public.sloty_workspaces w
where not exists (
  select 1
  from public.sloty_workspace_subscriptions s
  where s.workspace_id = w.id
)
on conflict (workspace_id) do nothing;

insert into public.sloty_subscription_events (
  workspace_id,
  subscription_id,
  event_type,
  amount,
  currency,
  metadata
)
select
  s.workspace_id,
  s.id,
  'subscription_created',
  0,
  'RUB',
  jsonb_build_object('planId', s.plan, 'planName', initcap(s.plan), 'status', s.status, 'method', 'migration')
from public.sloty_workspace_subscriptions s
where not exists (
  select 1
  from public.sloty_subscription_events e
  where e.subscription_id = s.id
    and e.event_type = 'subscription_created'
);

-- Keep updated_at fresh when the subscription changes.
create or replace function public.sloty_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = public.sloty_now_utc();
  return new;
end;
$$;

drop trigger if exists sloty_workspace_subscriptions_touch_updated_at on public.sloty_workspace_subscriptions;
create trigger sloty_workspace_subscriptions_touch_updated_at
before update on public.sloty_workspace_subscriptions
for each row execute function public.sloty_touch_updated_at();

alter table public.sloty_workspace_subscriptions enable row level security;
alter table public.sloty_subscription_events enable row level security;

-- MVP works through service_role in API routes. Keep read policies permissive for owner-based future Supabase client reads.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sloty_workspace_subscriptions'
      and policyname = 'sloty_workspace_subscriptions_service_role_all'
  ) then
    create policy sloty_workspace_subscriptions_service_role_all
      on public.sloty_workspace_subscriptions
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sloty_subscription_events'
      and policyname = 'sloty_subscription_events_service_role_all'
  ) then
    create policy sloty_subscription_events_service_role_all
      on public.sloty_subscription_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
