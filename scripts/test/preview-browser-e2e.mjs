// Preview browser E2E for the Dhamma account layer.
//
// Truthful Playwright test against the deployed Vercel Preview. Every required
// condition ASSERTS (mandatory). Outcomes are reported with an explicit final
// status and exit code:
//
//   exit 0  PASS          - every mandatory step asserted successfully.
//   exit 1  FAIL          - a mandatory assertion failed.
//   exit 2  NOT EXECUTED  - one or more mandatory steps could not run
//                            (e.g. missing secret, Playwright not installed,
//                            browser binary missing, or signup required email
//                            confirmation and no authenticated session could
//                            be established).
//
// Hard rules enforced by this file:
//   - No service_role / Admin API logic whatsoever. Cleanup of test users is
//     MANUAL via the Supabase Dashboard (documented in the runbook).
//   - process.exit() is NEVER called inside try/finally. Exit decisions are
//     computed in plain control flow after the finally closes the browser.
//   - browser.close() always runs in finally (when a browser was launched).
//   - reader status, search API, DOM anchor existence, visibility,
//     reading-progress entry, sign-out removal, and two-user isolation are all
//     MANDATORY assertions (not just logged).
//   - Production email confirmation is NOT weakened.
//   - No use of browser-only globals (e.g. CSS.escape) from Node context.
//
// Environment requirements (never printed / logged / URL-embedded):
//   PREVIEW_URL                       - the Preview deployment origin.
//   VERCEL_AUTOMATION_BYPASS_SECRET   - Vercel automation bypass secret.
//
// The bypass secret is sent ONLY as the x-vercel-protection-bypass header.
//
// Playwright is loaded via createRequire(import.meta.url) so that an isolated
// install (pointed at via NODE_PATH) is honored for BOTH CJS and ESM. See
// docs/PREVIEW_E2E_RUNBOOK.md for the reproduceable install commands.

import { createRequire } from "node:module";

const REQUIRED_ENV = ["PREVIEW_URL", "VERCEL_AUTOMATION_BYPASS_SECRET"];

// Outcome is captured here and resolved to an exit code after the finally
// block closes the browser. Values: "PASS" | "FAIL" | "NOT_EXECUTED".
let outcome = "NOT_EXECUTED";
let outcomeReason = "";
let createdUsers = [];

function markNotExecuted(reason) {
  if (outcome !== "FAIL") {
    outcome = "NOT_EXECUTED";
    outcomeReason = reason;
  }
  console.log(`NOT EXECUTED: ${reason}`);
}

function markFail(reason) {
  // FAIL takes priority over NOT_EXECUTED once a real assertion has failed.
  outcome = "FAIL";
  outcomeReason = reason;
  console.log(`FAIL: ${reason}`);
}

function markPass(step, detail = "") {
  console.log(`PASS: ${step}${detail ? ` — ${detail}` : ""}`);
}

// --- Playwright loader (NODE_PATH-aware via createRequire) --------------
// `import("playwright")` does NOT honor NODE_PATH for ESM resolution, which
// breaks the isolated-install workflow. createRequire() builds a CJS require
// rooted at this file, and CJS require DOES consult NODE_PATH, so an isolated
// Playwright install works regardless of module style.
let playwrightMod = null;
function loadPlaywrightSync() {
  if (playwrightMod) return playwrightMod;
  const require = createRequire(import.meta.url);
  playwrightMod = require("playwright");
  return playwrightMod;
}

function canLoadPlaywright() {
  try {
    loadPlaywrightSync();
    return true;
  } catch {
    return false;
  }
}

// --- Pre-flight: required env (no secrets printed) ----------------------
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  markNotExecuted(`missing required env (values never printed): ${missingEnv.join(", ")}.`);
  console.log("This test must run where the operator's Vercel automation bypass secret and Preview URL are available.");
} else if (!canLoadPlaywright()) {
  markNotExecuted("playwright is not installed; see docs/PREVIEW_E2E_RUNBOOK.md for the reproduceable install.");
} else {
  await runScenario();
}

async function runScenario() {
  const PREVIEW = process.env.PREVIEW_URL.replace(/\/$/, "");
  const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET; // header-only, never logged
  const { chromium } = loadPlaywrightSync();

  // Launch can fail if the Chromium binary is not installed. Treat that as
  // NOT_EXECUTED (exit 2) with a clear reason, not an unhandled exception.
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    markNotExecuted(
      `Chromium browser binary not available: ${(e && e.message ? e.message : String(e)).split("\n")[0]} — run \`npx playwright install chromium\` (see docs/PREVIEW_E2E_RUNBOOK.md).`
    );
    return;
  }

  // We use a single try/finally so browser.close() is guaranteed.
  try {
    const context = await browser.newContext({
      extraHTTPHeaders: { "x-vercel-protection-bypass": BYPASS, "x-vercel-set-bypass-cookie": "true" },
    });
    // Pin interface language to English so assertions target stable strings.
    await context.addCookies([{ name: "dhamma_lang", value: "en", url: PREVIEW }]);
    const page = await context.newPage();

    const stamp = Date.now();
    const emailA = `preview-e2e-a-${stamp}@example.test`;
    const emailB = `preview-e2e-b-${stamp}@example.test`;
    const password = "Test-pass-12345!";
    createdUsers = [emailA, emailB];

    // 1. Anonymous reader is MANDATORY.
    const readerRes = await page.goto(`${PREVIEW}/reader/dn1`, { waitUntil: "domcontentloaded" });
    const readerStatus = readerRes ? readerRes.status() : 0;
    if (readerStatus !== 200) {
      markFail(`anonymous /reader/dn1 status=${readerStatus}`);
      return;
    }
    markPass("anonymous /reader/dn1 returns 200");

    // 2. /api/search?q=dukkha&language=en is MANDATORY:
    //    HTTP 200, valid JSON, non-empty results array. FAIL on 503, empty,
    //    or malformed. (Production currently returns 503 corpus-unavailable
    //    for this route; this step proves the Preview has the corpus fix.)
    const searchApi = `${PREVIEW}/api/search?q=dukkha&language=en`;
    const searchRes = await page.goto(searchApi, { waitUntil: "domcontentloaded" });
    const searchStatus = searchRes ? searchRes.status() : 0;
    if (searchStatus !== 200) {
      markFail(`/api/search?q=dukkha&language=en status=${searchStatus} (expected 200; 503 = corpus-unavailable)`);
      return;
    }
    let searchBody;
    try {
      searchBody = await searchRes.json();
    } catch (e) {
      markFail(`/api/search did not return valid JSON: ${(e && e.message) || e}`);
      return;
    }
    if (!searchBody || !Array.isArray(searchBody.results)) {
      markFail(`/api/search JSON missing 'results' array: ${JSON.stringify(searchBody).slice(0, 120)}`);
      return;
    }
    if (searchBody.results.length === 0) {
      markFail(`/api/search returned an empty results array for 'dukkha'`);
      return;
    }
    markPass(`/api/search?q=dukkha&language=en 200 + non-empty results`, `count>=${searchBody.results.length}`);

    // 3. Sign-up user A. We do NOT weaken email confirmation; we report the
    //    resulting state honestly. If confirmation is required, the dependent
    //    mandatory steps cannot run -> overall NOT EXECUTED.
    await page.goto(`${PREVIEW}/auth/sign-up`, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill(emailA);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForURL(/\/(account|auth\/sign-in)/, { waitUntil: "domcontentloaded" }).catch(() => null),
      page.locator('button[type="submit"]').click(),
    ]);
    const afterSignupUrl = page.url();
    if (/state=confirm/.test(afterSignupUrl)) {
      markNotExecuted("signup required email confirmation; no authenticated session could be established");
      return;
    }
    if (!/\/account/.test(afterSignupUrl)) {
      markFail(`signup A navigation unexpected: ${afterSignupUrl}`);
      return;
    }
    markPass("signup A established a session (no confirmation required)");

    // 4. Authenticated /account shell is MANDATORY (no not-signed-in notice).
    if (await showsNotSignedIn(page)) {
      markFail("post-signup /account rendered the not-signed-in shell");
      return;
    }
    markPass("authenticated /account shell renders");

    // 5. SSR session persists across navigation is MANDATORY.
    await page.goto(`${PREVIEW}/library`, { waitUntil: "domcontentloaded" });
    await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
    if (await showsNotSignedIn(page)) {
      markFail("SSR session did not persist across navigation");
      return;
    }
    markPass("SSR session persists across navigation");

    // 6. BookmarkButton aria-pressed false -> true is MANDATORY.
    await page.goto(`${PREVIEW}/reader/dn1?page=2&edition=pli`, { waitUntil: "domcontentloaded" });
    const offBtn = page.locator('button[aria-pressed="false"]').first();
    if (!(await offBtn.count())) {
      markFail("BookmarkButton with aria-pressed=false not found");
      return;
    }
    await offBtn.click();
    const onBtn = page.locator('button[aria-pressed="true"]').first();
    if (!(await onBtn.count())) {
      markFail("BookmarkButton did not flip aria-pressed to true");
      return;
    }
    markPass("BookmarkButton toggles aria-pressed false -> true");

    // 7. Bookmark page + anchor persistence is MANDATORY. Scope the search to
    //    the Bookmarks section so we do not match the reading-progress link.
    await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
    const bookmarksSection = sectionByHeading(page, "Bookmarks");
    const bookmarkLink = bookmarksSection.locator('a[href*="/reader/"]').filter({ hasText: /dn1/i }).first();
    if (!(await bookmarkLink.count())) {
      markFail("bookmark link not present in Bookmarks section on /account");
      return;
    }
    const href = await bookmarkLink.getAttribute("href");
    if (!href || !/edition=pli/.test(href) || !/page=2/.test(href) || !/#/.test(href)) {
      markFail(`bookmark href did not preserve edition=pli, page=2, and an anchor: ${href}`);
      return;
    }
    markPass("bookmark edition=pli + page=2 + anchor persistence", href);

    // 8. Click the bookmark link and confirm the actual target element EXISTS
    //    and is reached/scrolled into view — MANDATORY. Build the locator via
    //    an attribute selector with the already-URL-encoded fragment so we
    //    never call the browser-only CSS.escape from Node context.
    await Promise.all([
      page.waitForURL(/\/reader\/dn1/, { waitUntil: "domcontentloaded" }),
      bookmarkLink.click(),
    ]);
    const anchorEnc = (href.match(/#(.+)$/) || [])[1];
    if (!anchorEnc) {
      markFail("bookmark href has no anchor fragment");
      return;
    }
    // Use a Playwright attribute-locator with the encoded id verbatim. This is
    // safe in Node (no CSS.escape) and matches the reader's id attribute as it
    // appears in the DOM (ids are emitted verbatim, not re-encoded).
    const targetEl = page.locator(`[id="${anchorEnc}"]`).first();
    let exists = await targetEl.count();
    if (!exists) {
      // Fall back: some ids are emitted decoded while the href is encoded.
      // Resolve via the browser context (CSS.escape is available there).
      const decoded = await page.evaluate((enc) => {
        try {
          return decodeURIComponent(enc);
        } catch {
          return enc;
        }
      }, anchorEnc);
      const escapedSel = await page.evaluate((raw) => `#${CSS.escape(raw)}`, decoded);
      const alt = page.locator(escapedSel).first();
      if (await alt.count()) {
        exists = true;
      }
    }
    if (!exists) {
      markFail(`bookmark target DOM element not found for anchor: ${anchorEnc}`);
      return;
    }
    markPass("bookmark target DOM element exists", `anchor=${anchorEnc}`);
    // Re-derive the locator for the visibility check.
    const visibleTarget = (await targetEl.count()) ? targetEl : page.locator(`[id="${anchorEnc}"]`).first();
    await visibleTarget.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    if (!(await visibleTarget.isVisible())) {
      markFail(`bookmark target not visible after scroll: anchor=${anchorEnc}`);
      return;
    }
    markPass("bookmark target reached/scrolled into view");

    // 9. Reading-progress entry is MANDATORY. Scope to the "Reading progress"
    //    section so the existing bookmark link cannot satisfy this check, and
    //    wait for the save round-trip before asserting the resume href.
    await page.goto(`${PREVIEW}/reader/dn1?page=3&edition=pli`, { waitUntil: "domcontentloaded" });
    // Give the silent ReadingProgressSaver Server Action time to upsert.
    await page.waitForTimeout(1500);
    await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
    const progressSection = sectionByHeading(page, "Reading progress");
    const progressLink = progressSection.locator('a[href*="/reader/"]').filter({ hasText: /dn1/i }).first();
    if (!(await progressLink.count())) {
      markFail("reading-progress link not present in Reading progress section on /account");
      return;
    }
    const progressHref = await progressLink.getAttribute("href");
    if (!progressHref || !/edition=pli/.test(progressHref) || !/page=3/.test(progressHref)) {
      markFail(`reading-progress href did not contain edition=pli and page=3: ${progressHref}`);
      return;
    }
    markPass("reading-progress entry in its section with edition=pli & page=3", progressHref);

    // 10. Sign-out is MANDATORY; a failed sign-out is a FAIL (never swallowed).
    const signOutBtn = page.locator("button").filter({ hasText: /sign out/i }).first();
    if (!(await signOutBtn.count())) {
      markFail("Sign out button not found");
      return;
    }
    await Promise.all([
      page.waitForLoadState("domcontentloaded"),
      signOutBtn.click(),
    ]);
    await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
    if (!(await showsNotSignedIn(page))) {
      markFail("sign-out did not remove /account access");
      return;
    }
    markPass("sign-out removed /account access");

    // 11. Two-user isolation is MANDATORY: sign up B, B must see none of A's data.
    await page.goto(`${PREVIEW}/auth/sign-up`, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill(emailB);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForURL(/\/(account|auth\/sign-in)/, { waitUntil: "domcontentloaded" }).catch(() => null),
      page.locator('button[type="submit"]').click(),
    ]);
    const bUrl = page.url();
    if (/state=confirm/.test(bUrl)) {
      markNotExecuted("user B signup required email confirmation; isolation step could not run");
      return;
    }
    if (!/\/account/.test(bUrl)) {
      markFail(`user B signup navigation unexpected: ${bUrl}`);
      return;
    }
    // B's Bookmarks section must be empty (must NOT show A's page=2 bookmark).
    const bBookmarksSection = sectionByHeading(page, "Bookmarks");
    const bBookmarkLinks = bBookmarksSection.locator('a[href*="/reader/"]');
    const bLinkCount = await bBookmarkLinks.count();
    if (bLinkCount > 0) {
      const firstHref = await bBookmarkLinks.first().getAttribute("href");
      markFail(`user B sees bookmarks in /account Bookmarks section (isolation broken): first=${firstHref}`);
      return;
    }
    markPass("two-user isolation: B's Bookmarks section is empty");

    // All mandatory steps asserted successfully.
    outcome = "PASS";
    outcomeReason = "";
  } catch (e) {
    markFail(`unexpected exception: ${e && e.message ? e.message : String(e)}`);
  } finally {
    // Guaranteed cleanup of the browser process. No process.exit() here.
    try {
      await browser.close();
    } catch {
      // ignore — best effort, never mask the real outcome.
    }
  }
}

/**
 * Return a Playwright locator scoped to the <section> whose heading text
 * matches `headingText` (e.g. "Bookmarks", "Reading progress"). Falls back to
 * the whole page if no such section is found, so the caller's count() check
 * fails loudly rather than throwing.
 */
function sectionByHeading(page, headingText) {
  // h2 inside a section, matching the /account markup.
  const section = page.locator("section", { has: page.locator(`h2`, { hasText: headingText }) }).first();
  return section;
}

async function showsNotSignedIn(page) {
  const html = await page.content();
  return /You are not signed in/i.test(html);
}

// --- Final resolution (after browser is guaranteed closed) --------------
console.log(`---`);
console.log(`RESULT: ${outcome}${outcomeReason ? ` — ${outcomeReason}` : ""}`);
if (createdUsers.length > 0) {
  console.log(
    `CLEANUP: manually delete these test users from the Supabase Dashboard (on delete cascade clears their rows): ${createdUsers.join(", ")}`
  );
}

if (outcome === "PASS") {
  process.exitCode = 0;
} else if (outcome === "FAIL") {
  process.exitCode = 1;
} else {
  // NOT_EXECUTED
  process.exitCode = 2;
}
