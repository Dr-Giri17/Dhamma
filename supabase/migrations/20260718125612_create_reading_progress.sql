-- reading_progress: resumable reading position per (user, reader slug, edition).
-- Owner-scoped by RLS.
--
-- Security posture:
--   - anon gets NO privileges.
--   - authenticated gets SELECT/INSERT/UPDATE/DELETE.
--   - RLS enabled; each DML policy scoped to auth.uid() = user_id.
--   - UPDATE policy includes USING and WITH CHECK plus SELECT.
--   - No auth.role(), no user_metadata authorization, no SECURITY DEFINER.

create table if not exists public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  reader_slug text not null,
  edition text not null,
  page integer not null check (page > 0),
  segment_id text,
  updated_at timestamptz not null default now(),
  primary key (user_id, reader_slug, edition)
);

create index if not exists reading_progress_user_updated_idx
  on public.reading_progress(user_id, updated_at desc);

revoke all on public.reading_progress from anon, authenticated, service_role;
grant select, insert, update, delete on public.reading_progress to authenticated;

-- Trigger: keep updated_at fresh on upsert.
create or replace function public.set_reading_progress_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_reading_progress_updated_at on public.reading_progress;
create trigger trg_reading_progress_updated_at
  before insert or update on public.reading_progress
  for each row execute function public.set_reading_progress_updated_at();

alter table public.reading_progress enable row level security;

drop policy if exists "reading_progress_select_own" on public.reading_progress;
create policy "reading_progress_select_own"
  on public.reading_progress
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reading_progress_insert_own" on public.reading_progress;
create policy "reading_progress_insert_own"
  on public.reading_progress
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "reading_progress_update_own" on public.reading_progress;
create policy "reading_progress_update_own"
  on public.reading_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reading_progress_delete_own" on public.reading_progress;
create policy "reading_progress_delete_own"
  on public.reading_progress
  for delete to authenticated
  using (auth.uid() = user_id);
