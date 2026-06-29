
create extension if not exists pgcrypto;

create table if not exists public.sloty_workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  profile jsonb not null,
  data jsonb not null default '{}'::jsonb,
  appearance jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_sloty_workspaces_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_sloty_workspaces_updated_at on public.sloty_workspaces;
create trigger trg_touch_sloty_workspaces_updated_at
before update on public.sloty_workspaces
for each row
execute function public.touch_sloty_workspaces_updated_at();

alter table public.sloty_workspaces enable row level security;

create policy "service role manages sloty workspaces"
on public.sloty_workspaces
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
