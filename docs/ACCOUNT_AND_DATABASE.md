# Account layer, Supabase, and RLS security model

This document covers the **optional** account layer (Supabase Auth + a small
owner-scoped schema for bookmarks, reading progress, and preferences), how to
run it locally, how to migrate it safely, and how to roll it back. It is the
single source of truth for the security model around user data.

The account layer is strictly **additive**: public scripture reading, search,
and Ask work with zero Supabase configuration. If Supabase is unconfigured or
unreachable, every account-aware route degrades to an anonymous, public-friendly
state and the rest of the app is unaffected.

---

## 1. Corpus architecture boundary

The scripture corpus is **never** stored in Supabase and is **never** migrated
there. It lives in the Next.js app as immutable static assets under
`public/corpus/*` and is served with a CDN `Cache-Control: public,
max-age=31536000, immutable` header (see `next.config.mjs`). At runtime the app
self-fetches these assets via `src/lib/corpus/trusted-assets.ts`, resolving the
origin through `src/lib/corpus/trusted-origin.ts`:

| Environment | Origin source | Notes |
| --- | --- | --- |
| Production | `VERCEL_PROJECT_PRODUCTION_URL` | Strictly validated `https://*.vercel.app`, no credentials, no path. |
| Preview | `VERCEL_URL` | Same strict validation. |
| Local | `http://127.0.0.1:<PORT>` (default 3000) | Fixed loopback; never a public origin. |

The origin is **never** derived from `Host`, `X-Forwarded-Host`, or
`X-Forwarded-Proto`. See `src/lib/corpus/__tests__/trusted-origin.test.ts` for
the regression coverage.

**Supabase tables hold only user-specific pointers** (segment IDs, slugs,
editions, pages) — never scripture text, hashes, provenance, licenses, or
classification. Corpus bytes and licensing are immutable by this layer.

---

## 2. Supabase local development

Prerequisites: Docker, Node 20+, the Supabase CLI (`npx supabase@latest`).

```bash
# From the repo root. The local DB runs on port 55422 by default in this repo
# (see supabase/config.toml) to avoid colliding with other local stacks.
npx supabase start
npx supabase db reset          # applies every migration in supabase/migrations/
npx supabase migration list --local
npx supabase db lint --local   # schema lint
```

To regenerate TypeScript types after a schema change:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

To re-run the two-user RLS isolation harness:

```bash
npx supabase db reset
PGPASSWORD=postgres psql -h 127.0.0.1 -p 55422 -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -f supabase/tests/rls_isolation.sql
# Expect: 10 "CHECK N PASS" notices + "ALL RLS ISOLATION CHECKS PASSED".
```

Stop the local stack with `npx supabase stop`. Local data is preserved in a
Docker volume; `db reset` rebuilds the schema from migrations only.

### App env for local auth

Create `.env.local` (never committed) with placeholder values from your local
Supabase stack:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon key printed by `supabase start`>
```

Then `PORT=3100 npm run start` (3100 to avoid colliding with other local
services on 3000). Without these variables the app still serves the corpus;
account features simply render their anonymous state.

---

## 3. Migration runbook

Migrations are versioned files in `supabase/migrations/` and are applied in
lexically sorted order. The four account-layer migrations are:

1. `20260718125607_create_user_preferences.sql`
2. `20260718125610_create_bookmarks.sql`
3. `20260718125612_create_reading_progress.sql`
4. `20260718131431_constrain_account_editions.sql`

### Applying to a linked project (staging/preview FIRST)

> Never run `db reset` against a linked production project. `db reset` is
> destructive and drops local data; for remote projects use `db push`, which
> only applies new migrations.

```bash
npx supabase link --project-ref <STAGING_PROJECT_REF>
npx supabase db push                      # previews the migration set, then applies
npx supabase migration list               # confirms remote state
```

Always apply to a **development/staging** project first. Preview the generated
diff (`supabase db diff --linked`) before pushing to any environment the
operator has not explicitly approved.

### Regenerating types

After any schema migration, regenerate and commit the typed definitions:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

A drift check is part of the release gate: if the generated types do not match
the committed file, the release is blocked.

---

## 4. RLS and security model

Every user-data table enforces, by construction:

- **anon gets nothing.** `revoke all ... from anon`; no RLS policy targets
  `anon`. Anonymous users cannot query, insert, update, or delete user data.
- **service_role gets nothing through the app.** `revoke all ... from
  service_role`; the service_role key is never read in code and is never
  shipped to the browser (`NEXT_PUBLIC_*` exposes only the publishable/anon
  key). The three application functions marked `SECURITY DEFINER`
  (`handle_new_user_preferences`, `set_user_preferences_updated_at`,
  `set_reading_progress_updated_at`) have EXECUTE granted only to
  `postgres`/`service_role` (revoked from PUBLIC/anon/authenticated), and each
  is scoped with `set search_path = public`.

> **Erratum — `public.rls_auto_enable()` (platform-managed).** An earlier
> migration comment states `public.rls_auto_enable()` does not exist in this
> schema. That is accurate for the *local* Supabase stack but **inaccurate for
> the remote project**: the remote `cgkxarfkrzuzqvvevlxw` ships the
> platform-managed `public.rls_auto_enable()` SECURITY DEFINER function, bound
> to the `ensure_rls` DDL event trigger that auto-enables RLS on any new
> `public` table (a fail-closed safety feature). We do NOT own this object and
> intentionally do NOT modify it; mutating platform-managed objects risks
> breaking future Supabase platform updates and the auto-RLS safety net. The
> two Supabase advisor warnings
> (`anon_security_definer_function_executable` and
> `authenticated_security_definer_function_executable`) that reference it are
> therefore **intentionally unresolved**. The function body reads only
> `pg_event_trigger_ddl_commands()`, which is empty outside a DDL event, so
> direct RPC invocation by anon/authenticated is a no-op (no privilege
> escalation surface in practice).
- **authenticated gets only the DML it needs.** `grant select, insert, update,
  delete` (and `select, insert, update` only for `user_preferences`, which is
  removed implicitly via `on delete cascade`).
- **RLS is enabled** on every table, with owner-scoped policies:
  `to authenticated using (auth.uid() = user_id)` / `with check (...)`.
- **UPDATE policies** include both `USING` and `WITH CHECK`, plus the SELECT
  policy is required to read first.
- **No `auth.role()`, no `user_metadata` authorization.** Identity is
  established from `auth.uid()` (JWT `sub`), validated server-side via
  `auth.getClaims()` — never via `getSession()`, which reads from cookies that
  can be tampered with.
- **Schema-level CHECK constraints** reject malformed values: `interface_language
  in (ru,en,id)`, `preferred_edition in (pli,en,ru,id)`, `bookmarks.edition in
  (pli,en,ru,id)`, `reading_progress.edition in (pli,en,ru,id)`, `page > 0`.

### Auth cookies

Sessions are carried in `@supabase/ssr`-managed cookies that are `httpOnly`,
`secure`, and `sameSite=Lax`. The middleware proxy (`src/middleware.ts` →
`src/lib/supabase/middleware.ts`) refreshes the session on every request via
`getUser()`. Sign-out (`signOutAction`) clears the cookies and revalidates the
layout, removing access to `/account` and any owner-scoped data.

### Proof: two-user isolation

`supabase/tests/rls_isolation.sql` is the executable evidence. It creates two
independent users, seeds a row for user A, and asserts across 10 checks:

1. User A reads own bookmarks.
2. User B sees **0** of user A's bookmarks.
3. User B **cannot insert** a row claiming `user_id = user A`.
4. User B **cannot alter** user A's rows.
5. User B **cannot delete** user A's rows.
6. `user_id` reassignment (A → B) is **rejected** by `WITH CHECK`.
7. Malformed `edition` is **rejected**.
8. Malformed `interface_language` is **rejected**.
9. Non-positive `page` is **rejected**.
10. `anon` role **cannot read** user data.

Run it after every migration change.

---

## 5. Deployment runbook (Vercel)

1. **Variables** (configured in the Vercel project, values never printed or
   committed):
   - `NEXT_PUBLIC_SUPABASE_URL` — the project URL.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the **anon/publishable** key only.
   - **Never** add a `service_role` value under any `NEXT_PUBLIC_*` variable.
2. **Trusted corpus origin** is already wired:
   - Production reads `VERCEL_PROJECT_PRODUCTION_URL` (Vercel injects it).
   - Preview reads `VERCEL_URL` (Vercel injects it).
3. **Auth redirect URLs** must allow `localhost`, the Vercel preview URLs, and
   the production apex — set these in the Supabase dashboard under
   Authentication → URL Configuration.
4. Deploy preview first. Run the route matrix and the RLS harness against the
   preview's linked staging database before any production promotion.

---

## 6. Rollback procedure

The account layer is opt-in and decoupled from the corpus. Roll back in order:

### 6a. Application rollback (revert the PR)

The account routes (`/auth/*`, `/account`) and the bookmark/progress UI are
purely additive. Reverting the merge commit restores the public-only app; no
corpus data is touched and no migration needs to run. Vercel redeploy of the
prior production commit is sufficient.

### 6b. Database rollback (if migrations were applied to a remote project)

Migrations are forward-only by convention. If a schema rollback is required:

1. Confirm the target project ref with the operator.
2. Snapshot the affected tables first:
   `pg_dump -t public.bookmarks -t public.reading_progress -t public.user_preferences > backup.sql`.
3. Write a new **down** migration that drops only the account tables
   (`drop table if exists public.bookmarks, public.reading_progress,
   public.user_preferences cascade;`) and the two helper triggers/functions.
   This never touches `auth.users` rows themselves; it only removes the
   per-user pointers. Users keep their identities; they simply lose bookmarks
   and progress.
4. Apply the down migration to the staging project first, verify, then to
   production only after explicit operator approval.

> The corpus is not stored in Supabase, so no database rollback can affect
> scripture content, hashes, provenance, licensing, or classification.

---

## 7. Out of scope (by design)

The account layer does **not** store and will never store:

- Questions or doctrinal answers (Ask stays local / source-grounded only).
- Health-related text.
- Machine translation, external LLM calls, embeddings, or `pgvector`.
- Scripture text, hashes, provenance, licensing, or classification.
- Any data accessible to anonymous users beyond the public corpus.
