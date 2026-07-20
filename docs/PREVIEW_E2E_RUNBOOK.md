# Preview browser E2E runbook

The Vercel Preview is protected by SSO / Deployment Protection, so the automated
browser E2E (`scripts/test/preview-browser-e2e.mjs`) can only run where the
operator's Vercel automation bypass secret is available, or it can be walked
through by hand in the operator's authenticated SSO browser session. Either path
satisfies the account-layer E2E gate.

The script and this document are kept in sync. The script:

- never reads, requests, or uses `SUPABASE_SERVICE_ROLE_KEY` (or any Admin API);
- takes exactly two environment variables: `PREVIEW_URL` and
  `VERCEL_AUTOMATION_BYPASS_SECRET`;
- does NOT auto-delete test users — cleanup is manual via the Supabase Dashboard
  (see "Cleanup" below);
- emits an explicit final `RESULT:` line and a deterministic exit code.

## Exit codes

| Exit code | Result        | Meaning                                                                 |
| --------- | ------------- | ----------------------------------------------------------------------- |
| `0`       | `PASS`        | Every mandatory step asserted successfully.                             |
| `1`       | `FAIL`        | At least one mandatory assertion failed (e.g. sign-out did nothing).    |
| `2`       | `NOT_EXECUTED`| A mandatory step could not run (missing secret, Playwright not installed, signup required email confirmation and no session could be established). |

A green Vercel deployment is NOT a PASS. The only PASS is exit code 0 from this
script (or the equivalent per-step PASS evidence from the manual walkthrough).

## Prerequisites

- The linked Supabase project (`cgkxarfkrzuzqvvevlxw`) has the 6 migrations applied.
- The Preview deployment is built from `fix/production-corpus-asset-origin`.
- Preview env has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Preview scope).
- Email confirmation is NOT weakened for the test. If signup requires email
  confirmation and the operator cannot receive/click the email, the dependent
  steps are NOT EXECUTED (exit 2), not silently passed.

## Option A — Automated (`scripts/test/preview-browser-e2e.mjs`)

### Reproduceable Playwright install (no uncommitted project mutation)

The project does not depend on Playwright. To run the script without adding an
unpinned/uncommitted mutation to `package.json`, install Playwright into an
**isolated throwaway directory** with a pinned version:

```bash
# 1) Isolated install (does not touch this repo's package.json/lockfile).
mkdir -p /tmp/dhamma-e2e-deps && cd /tmp/dhamma-e2e-deps
npm init -y >/dev/null
npm i playwright@1.48.0
npx playwright install chromium

# 2) Run the script from the repo root, pointing NODE_PATH at the isolated deps.
cd /path/to/Dhamma
PREVIEW_URL="https://dhamma-git-fix-production-corpus-ass-<hash>-dr-giri17s-projects.vercel.app" \
VERCEL_AUTOMATION_BYPASS_SECRET="<from Vercel Project Settings → Deployment Protection>" \
NODE_PATH=/tmp/dhamma-e2e-deps/node_modules \
node scripts/test/preview-browser-e2e.mjs
echo "exit=$?"
```

If you prefer to commit Playwright to the repo instead, add it as a pinned
`devDependency` (`npm i -D playwright@1.48.0`) and run `npx playwright install
chromium` — but do that as its own PR so this remediation commit stays focused.

The bypass secret is read from the environment and sent **only** as the
`x-vercel-protection-bypass` header. It is never printed, logged, placed in a
URL, or rendered in the DOM.

### Interpreting the output

- `RESULT: PASS` / exit 0 — the account layer is verified on Preview.
- `RESULT: FAIL — <reason>` / exit 1 — a real defect; investigate.
- `RESULT: NOT_EXECUTED — <reason>` / exit 2 — the run could not complete; fix
  the blocker (e.g. provide the secret, install Playwright, or complete email
  confirmation) and rerun.

## Option B — Manual, through the operator's authenticated SSO session

Open the Preview URL in the SSO-authenticated browser and report PASS / FAIL /
NOT EXECUTED for each step. Every step is mandatory.

1. **Anonymous reader.** `/reader/dn1` → 200, Pāli renders; `/api/search?q=dukkha&language=en` → 200 with results.
2. **Sign-up user A** (`preview-e2e-a-<stamp>@…`). Report whether the result is **session established** (→/account) or **email confirmation required** (→/auth/sign-in?state=confirm). If confirmation is required and you cannot receive the email, report NOT EXECUTED for steps 3–10 and stop.
3. **SSR cookies persist.** Signed-in `/account` → "Library" → back to `/account`: session survives navigation (no "not signed in" notice).
4. **Bookmark a Pali segment.** `/reader/dn1?page=2&edition=pli` → click ☆ on a segment → `aria-pressed` flips false → true; button shows ★ Bookmarked.
5. **Bookmark page + anchor persistence.** `/account` → the new bookmark link href contains `page=2` and a `#…` anchor.
6. **Click-to-target reach.** Click the bookmark link → lands on `/reader/dn1?page=2#…` and the segment with that DOM id exists and is scrolled into view.
7. **Reading-progress resume.** Navigate to a different reader page while signed in → `/account` shows a "Reading progress" entry for `dn1 · pli · page <n>` with a working resume link.
8. **Sign out.** Click "Sign out" → leaves the session; `/account` now renders the "not signed in" shell (access removed). Report FAIL if sign-out does nothing.
9. **Two-user isolation.** In a second/incognito session, sign up `preview-e2e-b-<stamp>@…` and sign in → its `/account` shows **no bookmarks** (A's bookmark is invisible to B). If B's signup requires email confirmation you cannot complete, report NOT EXECUTED for this step.

## Cleanup (always manual)

The script deliberately has **no service-role / Admin API cleanup path**. After
every run (PASS, FAIL, or NOT EXECUTED), the operator must delete the test users
from the **Supabase Dashboard → Authentication → Users**:

- `preview-e2e-a-<stamp>@…`
- `preview-e2e-b-<stamp>@…`

Deleting a user triggers `on delete cascade` on `bookmarks`, `reading_progress`,
and `user_preferences`, removing all their rows. Confirm afterwards that the
three tables contain no test data.

## What this proves that the Supabase integration smoke does not

- SSR cookie wiring (the middleware refresh + `@supabase/ssr` cookie storage).
- BookmarkButton UI behavior (toggle visual state, `aria-pressed`).
- Deep-link scroll to the persisted anchor in a real browser, against the actual
  DOM id emitted by the reader.
- The app shell's signed-in vs not-signed-in rendering with a real session.
- Two-user isolation at the UI level (not just at the SQL/RLS level).
