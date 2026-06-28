create extension if not exists pgcrypto;

alter table public.sloty_workspaces
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create unique index if not exists sloty_workspaces_owner_id_key
  on public.sloty_workspaces (owner_id)
  where owner_id is not null;

create index if not exists sloty_workspaces_slug_idx
  on public.sloty_workspaces (slug);

create table if not exists public.sloty_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'assistant')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create table if not exists public.sloty_chat_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  client_name text not null,
  client_phone text not null,
  channel text not null default 'Telegram' check (channel in ('Telegram', 'MAX')),
  segment text,
  source text,
  next_visit date,
  is_priority boolean not null default false,
  bot_connected boolean not null default true,
  last_message_preview text,
  last_message_at timestamptz not null default timezone('utc', now()),
  unread_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sloty_chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  thread_id uuid not null references public.sloty_chat_threads(id) on delete cascade,
  author text not null check (author in ('client', 'master', 'system')),
  body text not null,
  delivery_state text check (delivery_state in ('queued', 'sent', 'delivered', 'read')),
  via_bot boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_sloty_generic_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_sloty_chat_threads_updated_at on public.sloty_chat_threads;
create trigger trg_touch_sloty_chat_threads_updated_at
before update on public.sloty_chat_threads
for each row
execute function public.touch_sloty_generic_updated_at();

alter table public.sloty_workspace_members enable row level security;
alter table public.sloty_chat_threads enable row level security;
alter table public.sloty_chat_messages enable row level security;

create or replace function public.sloty_can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sloty_workspaces w
    where w.id = target_workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.sloty_workspace_members m
    where m.workspace_id = target_workspace_id
      and m.user_id = auth.uid()
  );
$$;

drop policy if exists "sloty owner can read workspace members" on public.sloty_workspace_members;
create policy "sloty owner can read workspace members"
on public.sloty_workspace_members
for select
using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage workspace members" on public.sloty_workspace_members;
create policy "sloty owner can manage workspace members"
on public.sloty_workspace_members
for all
using (public.sloty_can_access_workspace(workspace_id))
with check (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can read chat threads" on public.sloty_chat_threads;
create policy "sloty owner can read chat threads"
on public.sloty_chat_threads
for select
using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage chat threads" on public.sloty_chat_threads;
create policy "sloty owner can manage chat threads"
on public.sloty_chat_threads
for all
using (public.sloty_can_access_workspace(workspace_id))
with check (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can read chat messages" on public.sloty_chat_messages;
create policy "sloty owner can read chat messages"
on public.sloty_chat_messages
for select
using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage chat messages" on public.sloty_chat_messages;
create policy "sloty owner can manage chat messages"
on public.sloty_chat_messages
for all
using (public.sloty_can_access_workspace(workspace_id))
with check (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner manages workspaces" on public.sloty_workspaces;
create policy "sloty owner manages workspaces"
on public.sloty_workspaces
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "service role manages sloty workspaces" on public.sloty_workspaces;
create policy "service role manages sloty workspaces"
on public.sloty_workspaces
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
