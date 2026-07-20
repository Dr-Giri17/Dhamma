-- Forward-only remediation: harden SECURITY DEFINER function EXECUTE surface and
-- recreate the 11 owner-scoped RLS policies using `(select auth.uid())`.
--
-- Why this migration exists
-- --------------------------
-- 1) The three SECURITY DEFINER functions created by earlier migrations
--    (handle_new_user_preferences, set_user_preferences_updated_at,
--    set_reading_progress_updated_at) inherited EXECUTE from PUBLIC, anon, and
--    authenticated by default. These functions run as the table owner (postgres)
--    from triggers, so they do NOT need EXECUTE from any client role. Tightening
--    to owner-only removes a privilege-escalation surface: an authenticated
--    client can no longer invoke them directly via REST/RPC and rely on them
--    running as postgres. Triggers continue to fire normally because the
--    trigger invocation uses the function owner's privileges, not the caller's.
--
-- 2) Recreating the policies with `(select auth.uid())` (a subquery wrapper
--    around the STABLE function) lets the planner fold the value once per
--    statement. This both clarifies intent and resolves the Supabase advisor
--    performance warning that fires when auth.uid() is referenced directly in
--    multiple policies on the same table. The semantics are identical: TO
--    authenticated, owner-scoped USING / WITH CHECK, no change to the role or
--    the comparison.
--
-- Note on public.rls_auto_enable()
-- --------------------------------
-- An audit step asked us NOT to blind-modify public.rls_auto_enable(). We
-- verified (information_schema / pg_proc) that NO such function exists in this
-- project's schema (public or otherwise), so there is nothing to revoke from
-- or alter here. If a future Supabase platform version introduces a managed
-- helper with that name, it will be owned by the platform and must be handled
-- separately; this migration intentionally does not touch it.

-- ---------------------------------------------------------------------------
-- 1) Revoke EXECUTE on the application's SECURITY DEFINER functions.
-- ---------------------------------------------------------------------------

revoke execute on function public.handle_new_user_preferences() from PUBLIC;
revoke execute on function public.handle_new_user_preferences() from anon;
revoke execute on function public.handle_new_user_preferences() from authenticated;

revoke execute on function public.set_user_preferences_updated_at() from PUBLIC;
revoke execute on function public.set_user_preferences_updated_at() from anon;
revoke execute on function public.set_user_preferences_updated_at() from authenticated;

revoke execute on function public.set_reading_progress_updated_at() from PUBLIC;
revoke execute on function public.set_reading_progress_updated_at() from anon;
revoke execute on function public.set_reading_progress_updated_at() from authenticated;

-- ---------------------------------------------------------------------------
-- 2) Recreate the 11 owner-scoped policies with `(select auth.uid())`.
--    Drop-then-create keeps the policy names and roles identical; only the
--    expression is wrapped in a SELECT so it is evaluated once per statement.
-- ---------------------------------------------------------------------------

-- user_preferences -----------------------------------------------------------
drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
  on public.user_preferences
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
  on public.user_preferences
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
  on public.user_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- bookmarks ------------------------------------------------------------------
drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
  on public.bookmarks
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
  on public.bookmarks
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
  on public.bookmarks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
  on public.bookmarks
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- reading_progress -----------------------------------------------------------
drop policy if exists "reading_progress_select_own" on public.reading_progress;
create policy "reading_progress_select_own"
  on public.reading_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "reading_progress_insert_own" on public.reading_progress;
create policy "reading_progress_insert_own"
  on public.reading_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "reading_progress_update_own" on public.reading_progress;
create policy "reading_progress_update_own"
  on public.reading_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "reading_progress_delete_own" on public.reading_progress;
create policy "reading_progress_delete_own"
  on public.reading_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);
