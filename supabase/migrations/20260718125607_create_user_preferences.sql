-- user_preferences: one row per authenticated user, storing interface language
-- and preferred scripture edition. Owner-scoped by RLS.
--
-- Security posture:
--   - anon gets NO privileges (user data must never be public).
--   - authenticated gets SELECT/INSERT/UPDATE only (no DELETE; the row is
--     deleted implicitly via ON DELETE CASCADE when the auth.users row goes).
--   - RLS enabled; owner = auth.uid() via auth.getClaims()-validated session.
--   - No auth.role(), no user_metadata authorization, no auth.role().

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interface_language text not null default 'en'
    check (interface_language in ('ru', 'en', 'id')),
  preferred_edition text not null default 'pli'
    check (preferred_edition in ('pli', 'en', 'ru', 'id')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tighten column privileges: only the owner ever touches their row.
revoke all on public.user_preferences from anon, authenticated, service_role;
grant select, insert, update on public.user_preferences to authenticated;

-- Trigger: keep updated_at fresh.
create or replace function public.set_user_preferences_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_user_preferences_updated_at();

-- Auto-insert a preferences row when a new auth.users record is created.
create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_preferences();

-- Row Level Security: owner-scoped SELECT, INSERT, UPDATE.
alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
  on public.user_preferences
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
  on public.user_preferences
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
  on public.user_preferences
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
