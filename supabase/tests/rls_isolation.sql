-- RLS two-user isolation evidence for public.user_preferences, public.bookmarks,
-- public.reading_progress. Run against a local Supabase stack after the
-- migrations have been applied (supabase db reset).
--
-- This script is idempotent and self-verifying. Each check raises an ASSERT
-- failure on violation and prints a NOTICE otherwise. Run with:
--   PGPASSWORD=postgres psql -h 127.0.0.1 -p 55422 -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql

\set ON_ERROR_STOP on

-- Two independent users. auth.users is a Supabase internal table we may
-- insert into as superuser for test-harness purposes only.
delete from public.bookmarks where user_id in ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002');
delete from public.reading_progress where user_id in ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002');
delete from public.user_preferences where user_id in ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002');
delete from auth.users where id in ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002');

insert into auth.users (id, aud, role, email, encrypted_password, instance_id, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-1111-1111-000000000001','authenticated','authenticated','a@example.test','x','00000000-0000-0000-0000-000000000000','{}','{}',now(),now(),now()),
  ('11111111-1111-1111-1111-000000000002','authenticated','authenticated','b@example.test','x','00000000-0000-0000-0000-000000000000','{}','{}',now(),now(),now());

-- Helpers to switch identity within a DO block. SET LOCAL only accepts a
-- literal, so we run it via EXECUTE using a quoted UUID string.
create or replace function pg_temp.become(p_role text, p_uid text default null) returns void
language plpgsql as $$
begin
  execute format('set local role %I', p_role);
  if p_uid is not null then
    -- auth.uid() parses request.jwt.claims as a JSON object and reads .sub.
    execute format('set local request.jwt.claims = %L', json_build_object('sub', p_uid, 'role', p_role)::text);
  else
    execute format('set local request.jwt.claims = %L', '{}');
  end if;
end;
$$;

-- Restore superuser role. Note: `set local role` cannot run inside a
-- security-definer function, so this runs as the invoker. Callers must ensure
-- they are still operating as a privileged role when restore() is invoked; for
-- the anon checks below we instead use privilege introspection from the
-- superuser context so the role is never actually switched.
create or replace function pg_temp.restore() returns void
language plpgsql as $$
begin
  set local role postgres;
end;
$$;

do $$
declare
  user_a uuid := '11111111-1111-1111-1111-000000000001';
  user_b uuid := '11111111-1111-1111-1111-000000000002';
  uid_a text := '11111111-1111-1111-1111-000000000001';
  uid_b text := '11111111-1111-1111-1111-000000000002';
  cnt integer;
begin
  -- Seed a row for user A as superuser.
  insert into public.bookmarks (user_id, segment_id, source_ref, reader_slug, edition)
  values (user_a, 'dn1:1.1', 'dn1', 'dn1', 'pli')
  on conflict (user_id, segment_id, edition) do nothing;
  insert into public.reading_progress (user_id, reader_slug, edition, page, segment_id)
  values (user_a, 'dn1', 'pli', 3, 'dn1:1.1')
  on conflict (user_id, reader_slug, edition) do update set page = excluded.page;

  -- CHECK 1: user A can SELECT their own bookmarks.
  perform pg_temp.become('authenticated', uid_a);
  select count(*) into cnt from public.bookmarks where user_id = user_a;
  perform pg_temp.restore();
  assert cnt = 1, 'CHECK 1 FAILED: user A cannot read own bookmarks';
  raise notice 'CHECK 1 PASS: user A reads own bookmarks (count=%)', cnt;

  -- CHECK 2: user B CANNOT see user A's bookmarks.
  perform pg_temp.become('authenticated', uid_b);
  select count(*) into cnt from public.bookmarks;
  perform pg_temp.restore();
  assert cnt = 0, 'CHECK 2 FAILED: user B can read user A bookmarks';
  raise notice 'CHECK 2 PASS: user B sees 0 of user A bookmarks';

  -- CHECK 3: user B cannot INSERT a bookmark claiming user_id = user A.
  perform pg_temp.become('authenticated', uid_b);
  begin
    insert into public.bookmarks (user_id, segment_id, source_ref, reader_slug, edition)
    values (user_a, 'dn1:9.9', 'dn1', 'dn1', 'pli');
    perform pg_temp.restore();
    raise exception 'CHECK 3 FAILED: user B inserted a row as user A';
  exception
    when insufficient_privilege or check_violation or integrity_constraint_violation then
      perform pg_temp.restore();
  end;
  select count(*) into cnt from public.bookmarks where user_id = user_a and segment_id = 'dn1:9.9';
  assert cnt = 0, 'CHECK 3b FAILED: cross-user insert leaked';
  raise notice 'CHECK 3 PASS: user B cannot insert as user A';

  -- CHECK 4: user B cannot UPDATE user A's bookmark.
  perform pg_temp.become('authenticated', uid_b);
  begin
    update public.bookmarks set source_ref = 'tampered' where user_id = user_a;
  exception
    when others then null;
  end;
  perform pg_temp.restore();
  select count(*) into cnt from public.bookmarks where user_id = user_a and source_ref = 'tampered';
  assert cnt = 0, 'CHECK 4 FAILED: user B altered user A row';
  raise notice 'CHECK 4 PASS: user B cannot alter user A row';

  -- CHECK 5: user B cannot DELETE user A's bookmark.
  perform pg_temp.become('authenticated', uid_b);
  begin
    delete from public.bookmarks where user_id = user_a;
  exception
    when others then null;
  end;
  perform pg_temp.restore();
  select count(*) into cnt from public.bookmarks where user_id = user_a;
  assert cnt = 1, 'CHECK 5 FAILED: user B deleted user A row';
  raise notice 'CHECK 5 PASS: user B cannot delete user A row (count stays %)', cnt;

  -- CHECK 6: user_id reassignment by user A to user B is rejected (WITH CHECK).
  perform pg_temp.become('authenticated', uid_a);
  begin
    update public.bookmarks set user_id = user_b where user_id = user_a;
    perform pg_temp.restore();
    select count(*) into cnt from public.bookmarks where user_id = user_b and segment_id = 'dn1:1.1';
    assert cnt = 0, 'CHECK 6 FAILED: user A reassigned row to user B';
  exception
    when insufficient_privilege or check_violation or integrity_constraint_violation then
      perform pg_temp.restore();
  end;
  raise notice 'CHECK 6 PASS: user_id reassignment rejected';

  -- CHECK 7: malformed edition value rejected by CHECK constraint.
  perform pg_temp.become('authenticated', uid_a);
  begin
    insert into public.bookmarks (user_id, segment_id, source_ref, reader_slug, edition)
    values (user_a, 'dn1:2.2', 'dn1', 'dn1', 'malformed-edition');
    perform pg_temp.restore();
    raise exception 'CHECK 7 FAILED: malformed edition accepted';
  exception
    when check_violation or integrity_constraint_violation then
      perform pg_temp.restore();
  end;
  raise notice 'CHECK 7 PASS: malformed edition rejected';

  -- CHECK 8: malformed interface_language rejected by user_preferences CHECK.
  insert into public.user_preferences (user_id) values (user_a) on conflict do nothing;
  perform pg_temp.become('authenticated', uid_a);
  begin
    update public.user_preferences set interface_language = 'fr' where user_id = user_a;
    perform pg_temp.restore();
    raise exception 'CHECK 8 FAILED: malformed interface_language accepted';
  exception
    when check_violation or integrity_constraint_violation then
      perform pg_temp.restore();
  end;
  raise notice 'CHECK 8 PASS: malformed interface_language rejected';

  -- CHECK 9: malformed page (<=0) rejected by reading_progress CHECK.
  perform pg_temp.become('authenticated', uid_a);
  begin
    insert into public.reading_progress (user_id, reader_slug, edition, page)
    values (user_a, 'dn2', 'pli', 0);
    perform pg_temp.restore();
    raise exception 'CHECK 9 FAILED: non-positive page accepted';
  exception
    when check_violation or integrity_constraint_violation then
      perform pg_temp.restore();
  end;
  raise notice 'CHECK 9 PASS: non-positive page rejected';

  -- CHECK 10: anon role CANNOT read or write user data.
  -- We prove this from the superuser context via privilege/RLS introspection,
  -- which is unambiguous and cannot produce a false positive:
  --   (a) anon has NO table privileges on bookmarks/user_preferences/reading_progress
  --       (confirmed via has_table_privilege for SELECT/INSERT/UPDATE/DELETE),
  --   (b) RLS is enabled on all three tables, and
  --   (c) no policy targets the anon role.
  -- If any of these is false, anon could read or write user data and the test
  -- FAILS loudly. This supersedes the earlier "set role anon" form which was
  -- false-positive-prone (an empty RLS-filtered SELECT returned 0 rows but did
  -- not raise, so the test "passed" even if anon retained privileges).
  declare
    t text;
    priv text;
    has_priv boolean;
    rls_on boolean;
    anon_policies integer;
  begin
    foreach t in array array['user_preferences','bookmarks','reading_progress'] loop
      foreach priv in array array['SELECT','INSERT','UPDATE','DELETE'] loop
        select has_table_privilege('anon', format('public.%I', t), priv) into has_priv;
        assert not has_priv, 'CHECK 10 FAILED: anon has %s on %s', priv, t;
      end loop;
      select c.relrowsecurity into rls_on
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = t;
      assert rls_on, 'CHECK 10 FAILED: RLS not enabled on %s', t;
      select count(*) into anon_policies from pg_policies
        where schemaname = 'public' and tablename = t and array_to_string(roles, ',') like '%anon%';
      assert anon_policies = 0, 'CHECK 10 FAILED: anon-targeted policy exists on %s', t;
    end loop;
  end;
  raise notice 'CHECK 10 PASS: anon has no privileges, RLS is on, no anon policies';

  raise notice 'ALL RLS ISOLATION CHECKS PASSED';
end;
$$;

-- Cleanup test fixtures so the harness is fully idempotent.
delete from public.bookmarks where user_id in ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002');
delete from public.reading_progress where user_id in ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002');
delete from public.user_preferences where user_id in ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002');
delete from auth.users where id in ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002');
