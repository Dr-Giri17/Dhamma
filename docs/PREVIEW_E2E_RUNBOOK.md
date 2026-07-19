# Preview browser E2E runbook

The Vercel Preview is protected by SSO / Deployment Protection, so an
automated browser E2E can only run where the operator's Vercel automation
bypass secret is available, or by hand through the operator's authenticated
SSO browser session. This document is the manual flow that
`scripts/test/preview-browser-e2e.mjs` automates; either path satisfies
the account-layer E2E gate.

## Prerequisites

- The linked Supabase project (`cgkxarfkrzuzqvvevlxw`) has the 6 migrations applied.
- The Preview deployment is built from `fix/production-corpus-asset-origin`.
- Preview env has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Preview scope).
- The operator can receive confirmation emails or local email confirmation is enabled for the test users.

## Option A — Automated (`scripts/test/preview-browser-e2e.mjs`)

```bash
npm i -D playwright && npx playwright install chromium
PREVIEW_URL="https://dhamma-git-fix-production-corpus-ass-<hash>-dr-giri17s-projects.vercel.app" \
VERCEL_AUTOMATION_BYPASS_SECRET="<from Vercel Project Settings → Deployment Protection>" \
SUPABASE_URL="https://cgkxarfkrzuzqvvevlxw.supabase.co" \
SUPABASE_PUBLISHABLE_KEY="<publishable key>" \
node scripts/test/preview-browser-e2e.mjs
```

The bypass secret is read from the environment and sent **only** as the
`x-vercel-protection-bypass` header. It is never printed, logged, placed in a
URL, or rendered in the DOM. If any required variable is missing, the script
prints `NOT EXECUTED` and exits 0 (no false pass).

## Option B — Manual, through the operator's authenticated SSO session

Open the Preview URL in the SSO-authenticated browser and walk through:

1. **Anonymous reader.** `/reader/dn1` → 200, Pāli renders. `/api/search?q=dukkha&language=en` → 200 with results. → *PASS*
2. **Sign-up user A.** `/auth/sign-up` → create `preview-e2e-a-<stamp>@…` → follow the email-confirmation callback link → `/auth/callback` exchanges the code → lands on `/account`. → *PASS*
3. **Sign-in user A.** Sign out; `/auth/sign-in` with A's email/password → redirects to `/account`, which renders the signed-in shell (no "not signed in" notice) and shows A's email. → *PASS*
4. **SSR cookies persist.** From `/account`, click "Library" then back to `/account` — the session survives navigation (cookie refresh via middleware). → *PASS*
5. **Bookmark a segment.** `/reader/dn1?page=2` → click ☆ on a Pāli segment → the button flips to ★ Bookmarked. → *PASS*
6. **Page + anchor persistence + deep-link.** `/account` → the new bookmark link's href contains `page=2` and a `#<segmentUid>` anchor. Click it → returns to `/reader/dn1?page=2#<segmentUid>` and scrolls to the segment. → *PASS*
7. **Reading progress.** Navigate to a different page while signed in → return to `/account` → the "Reading progress" section lists `dn1 · pli · page <n>` with a working resume link. → *PASS*
8. **Sign-out.** `/account` → Sign out → lands on the home page; navigate to `/account` → renders the not-signed-in shell (access removed). → *PASS*
9. **Two-user isolation.** In a second browser/incognito, sign up `preview-e2e-b-<stamp>@…` and sign in → its `/account` shows **no bookmarks** (A's bookmark is invisible to B). → *PASS*
10. **Cleanup.** From the Supabase dashboard, delete the two test users (`preview-e2e-a-*`, `preview-e2e-b-*`) — `on delete cascade` removes their bookmarks/progress/preferences. Confirm the three tables are empty of test data.

## What this proves that the Supabase integration smoke does not

- SSR cookie wiring (the middleware refresh + `@supabase/ssr` cookie storage).
- BookmarkButton UI behavior (toggle visual state, aria-pressed).
- Deep-link scroll to the persisted anchor in a real browser.
- The app shell's signed-in vs not-signed-in rendering with a real session.
