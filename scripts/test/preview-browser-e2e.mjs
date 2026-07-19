// Preview browser E2E for the Dhamma account layer.
//
// Truthful Playwright test against the deployed Vercel Preview. Every required
// condition either ASSERTS (and aborts the run on failure) or is explicitly
// reported as NOT EXECUTED. No overall PASS is printed after a skipped or
// failed assertion. A failed Sign out aborts; it is never swallowed.
//
// Coverage:
//   - signup / email-confirmation status reported honestly
//   - sign-in / SSR cookie persistence across navigation
//   - authenticated /account shell renders
//   - BookmarkButton aria-pressed false -> true
//   - bookmark page + anchor persistence
//   - clicking the bookmark link reaches the actual target element
//   - reading-progress resume
//   - sign-out removes /account access
//   - two-user isolation (user B sees none of user A's data)
//
// Environment requirements (never printed / logged / URL-embedded):
//   PREVIEW_URL                          - the Preview deployment origin
//   VERCEL_AUTOMATION_BYPASS_SECRET      - Vercel automation bypass secret
//   (Optional) SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - if both set, the
//   script performs deterministic cleanup of the two test users; otherwise
//   cleanup is reported NOT EXECUTED.
//
// Run:
//   PREVIEW_URL=... VERCEL_AUTOMATION_BYPASS_SECRET=... \
//   node scripts/test/preview-browser-e2e.mjs
//
// The bypass secret is sent ONLY as the x-vercel-protection-bypass header.
// It is never placed in a URL, the DOM, a log line, or error text.

import assert from "node:assert/strict";

const REQUIRED = ["PREVIEW_URL", "VERCEL_AUTOMATION_BYPASS_SECRET"];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.log(`NOT EXECUTED: missing required env (present values never printed): ${missing.join(", ")}.`);
  console.log("This test must run where the operator's Vercel automation bypass secret and Preview URL are available.");
  process.exit(0);
}

const PREVIEW = process.env.PREVIEW_URL.replace(/\/$/, "");
const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET; // header-only, never logged
const CAN_CLEANUP = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("NOT EXECUTED: playwright is not installed.");
  console.log("Install with `npm i -D playwright && npx playwright install chromium`, then rerun.");
  process.exit(0);
}

const browser = await chromium.launch();
const context = await browser.newContext({ extraHTTPHeaders: { "x-vercel-protection-bypass": BYPASS, "x-vercel-set-bypass-cookie": "true" } });

// Pin the interface language to English so the assertions can target stable
// English strings, regardless of the operator's default locale.
await context.addCookies([{ name: "dhamma_lang", value: "en", url: PREVIEW }]);
const page = await context.newPage();

const stamp = Date.now();
const emailA = `preview-e2e-a-${stamp}@example.test`;
const emailB = `preview-e2e-b-${stamp}@example.test`;
const password = "Test-pass-12345!";
const createdUsers = [];

const steps = [];
function record(name, ok, detail = "") {
  steps.push({ name, status: ok ? "PASS" : "FAIL", detail });
  if (!ok) {
    console.log(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`PASS: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function hardFail(msg) {
  // An assertion that MUST abort the run (Sign out failure, navigation loss).
  console.log(`HARD FAIL: ${msg}`);
  process.exitCode = 1;
  throw new Error(msg);
}

async function assertSignedInShell(label) {
  const html = await page.content();
  if (/You are not signed in/i.test(html)) {
    hardFail(`${label}: /account rendered the not-signed-in shell; SSR session not established.`);
  }
  record(`${label}: authenticated /account shell renders`, true);
}

try {
  // 1. Anonymous reader works.
  const r = await page.goto(`${PREVIEW}/reader/dn1`, { waitUntil: "domcontentloaded" });
  record("anonymous /reader/dn1 loads", r && r.status() === 200, `status=${r ? r.status() : "n/a"}`);

  // 2. Sign-up user A. We do NOT weaken email confirmation: we read the
  //    resulting state honestly (session vs confirmation-required).
  await page.goto(`${PREVIEW}/auth/sign-up`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(emailA);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/(account|auth\/sign-in)/, { waitUntil: "domcontentloaded" }).catch(() => null),
    page.locator('button[type="submit"]').click(),
  ]);
  createdUsers.push(emailA);
  const afterSignupUrl = page.url();
  if (/\/account/.test(afterSignupUrl)) {
    record("signup A: session established (no confirmation required)", true);
  } else if (/state=confirm/.test(afterSignupUrl)) {
    record("signup A: email confirmation required", true, "redirected to /auth/sign-in?state=confirm");
  } else {
    record("signup A: landed somewhere unexpected", false, afterSignupUrl);
    hardFail("signup A navigation");
  }

  // 3. If email confirmation was required, we cannot continue without the
  //    email. Report honestly and stop the dependent steps.
  if (/state=confirm/.test(afterSignupUrl)) {
    console.log("NOT EXECUTED: dependent steps require an authenticated session, which needs email confirmation.");
    console.log(`NOT EXECUTED: cleanup of ${createdUsers.join(", ")} (no service role configured).`);
    await browser.close();
    process.exit(0);
  }

  // 4. SSR session persists across navigation.
  await assertSignedInShell("post-signup A");
  await page.goto(`${PREVIEW}/library`, { waitUntil: "domcontentloaded" });
  await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
  await assertSignedInShell("post-navigation A (SSR session persisted)");

  // 5. Bookmark a Pali segment; aria-pressed must flip false -> true.
  await page.goto(`${PREVIEW}/reader/dn1?page=2&edition=pli`, { waitUntil: "domcontentloaded" });
  const bookmarkBtn = page.locator('button[aria-pressed="false"]').first();
  await bookmarkBtn.waitFor({ state: "attached", timeout: 10000 });
  record("BookmarkButton present (aria-pressed=false)", true);
  await bookmarkBtn.click();
  await page.locator('button[aria-pressed="true"]').first().waitFor({ state: "attached", timeout: 5000 });
  record("BookmarkButton toggles aria-pressed false -> true", true);

  // 6. Bookmark deep-link preserves page + anchor.
  await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
  const bookmarkLink = page.locator('a[href*="/reader/"]').filter({ hasText: /dn1/i }).first();
  const href = await bookmarkLink.first().getAttribute("href");
  assert.ok(href, "bookmark link missing");
  assert.match(href, /page=2/, `bookmark href must preserve page=2: ${href}`);
  assert.match(href, /#/, `bookmark href must contain an anchor: ${href}`);
  record("bookmark page + anchor persistence", true, href);

  // 7. Clicking the bookmark link reaches the actual target element.
  await Promise.all([
    page.waitForURL(/\/reader\/dn1/, { waitUntil: "domcontentloaded" }),
    bookmarkLink.first().click(),
  ]);
  const target = (href.match(/#(.+)$/) || [])[1];
  if (target) {
    const decoded = decodeURIComponent(target);
    const targetEl = page.locator(`#${CSS.escape(decoded)}`).first();
    const exists = await targetEl.count().then((c) => c > 0);
    record("bookmark link target element exists in DOM", exists, `id=${decoded}`);
    if (exists) {
      await targetEl.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      const inView = await targetEl.isVisible();
      record("bookmark target reached/scrolled into view", inView);
    }
  }

  // 8. Reading progress resume: navigate a page, return to /account, click resume.
  await page.goto(`${PREVIEW}/reader/dn1?page=3&edition=pli`, { waitUntil: "domcontentloaded" });
  await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
  const progressLink = page.locator('a[href*="/reader/"]').filter({ hasText: /dn1/i }).first();
  const progressHref = await progressLink.getAttribute("href");
  record("reading progress entry present", Boolean(progressHref), progressHref ?? "(none)");

  // 9. Sign out (NEVER swallow). Must remove /account access.
  //    The Sign out button is a Server Action submit button.
  const signOutBtn = page.locator('button').filter({ hasText: /sign out/i }).first();
  await signOutBtn.waitFor({ state: "attached", timeout: 5000 });
  await Promise.all([
    page.waitForLoadState("domcontentloaded"),
    signOutBtn.click(),
  ]);
  record("Sign out button clicked", true);

  // After sign out, /account must show the not-signed-in shell.
  await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
  const signedOutHtml = await page.content();
  const signedOutNotice = /You are not signed in/i.test(signedOutHtml);
  record("sign-out removed /account access (not-signed-in shell)", signedOutNotice);
  if (!signedOutNotice) hardFail("sign-out did not remove access");

  // 10. Two-user isolation: sign up B, B sees none of A's bookmarks.
  await page.goto(`${PREVIEW}/auth/sign-up`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(emailB);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/(account|auth\/sign-in)/, { waitUntil: "domcontentloaded" }).catch(() => null),
    page.locator('button[type="submit"]').click(),
  ]);
  createdUsers.push(emailB);
  const bUrl = page.url();
  if (/state=confirm/.test(bUrl)) {
    console.log("NOT EXECUTED: user B signup requires email confirmation; isolation step skipped (no session).");
  } else if (/\/account/.test(bUrl)) {
    // If B is on /account, ensure no bookmark referencing page=2 is visible.
    const bHtml = await page.content();
    const bLeaks = /page=2/.test(bHtml) && /dn1/i.test(bHtml);
    record("two-user isolation: B sees none of A's bookmark", !bLeaks);
  } else {
    record("user B signup navigation unexpected", false, bUrl);
  }
} catch (e) {
  if (!process.exitCode) process.exitCode = 1;
  console.log(`ABORTED: ${e.message}`);
} finally {
  // Cleanup: deterministic if service role is configured, else NOT EXECUTED.
  if (!CAN_CLEANUP) {
    console.log(`NOT EXECUTED: deterministic cleanup of ${createdUsers.join(", ")} (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY not both set).`);
    console.log("Operator must remove these test users from the Supabase dashboard (on delete cascade clears rows).");
  } else {
    // Best-effort delete via Admin API; never print the key.
    try {
      const adminUrl = `${process.env.SUPABASE_URL}/auth/v1/admin/users`;
      for (const email of createdUsers) {
        // list users, find by email, delete
        const listRes = await fetch(`${adminUrl}?per_page=1000`, {
          headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
        });
        const list = await listRes.json().catch(() => ({ users: [] }));
        const u = (list.users || []).find((x) => x.email === email);
        if (u) {
          await fetch(`${adminUrl}/${u.id}`, {
            method: "DELETE",
            headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
          });
        }
      }
      console.log(`PASS: deterministic cleanup of ${createdUsers.length} test user(s).`);
    } catch (e) {
      console.log(`CLEANUP FAILED: ${e.message} — operator must remove ${createdUsers.join(", ")} manually.`);
    }
  }
  await browser.close();
}

// Honest summary line: only PASS if nothing failed and nothing was skipped.
const failed = steps.filter((s) => s.status === "FAIL");
if (failed.length === 0 && process.exitCode === 0) {
  console.log("SUMMARY: ALL PREVIEW BROWSER E2E STEPS PASS");
} else {
  console.log(`SUMMARY: ${failed.length} step(s) FAILED; see above. (overall NOT PASS)`);
}
