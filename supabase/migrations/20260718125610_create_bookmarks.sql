-- bookmarks: user-saved scripture segments. Owner-scoped by RLS.
--
-- Security posture:
--   - anon gets NO privileges.
--   - authenticated gets SELECT/INSERT/UPDATE/DELETE.
--   - RLS enabled; each DML policy scoped to auth.uid() = user_id.
--   - UPDATE policy includes USING and WITH CHECK plus SELECT.
--   - No auth.role(), no user_metadata authorization, no SECURITY DEFINER.

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  segment_id text not null,
  source_ref text not null,
  reader_slug text not null,
  edition text not null,
  created_at timestamptz not null default now(),
  unique (user_id, segment_id, edition)
);

create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_user_created_idx
  on public.bookmarks(user_id, created_at desc);

-- Privileges: only authenticated, and only the columns/dml they need.
revoke all on public.bookmarks from anon, authenticated, service_role;
grant select, insert, update, delete on public.bookmarks to authenticated;

alter table public.bookmarks enable row level security;

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
  on public.bookmarks
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
  on public.bookmarks
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
  on public.bookmarks
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
  on public.bookmarks
  for delete to authenticated
  using (auth.uid() = user_id);
