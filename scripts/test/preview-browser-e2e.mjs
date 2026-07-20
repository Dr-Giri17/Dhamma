// Preview browser E2E for the Dhamma account layer.
//
// Truthful Playwright test against the deployed Vercel Preview. Every required
// condition ASSERTS (mandatory). Outcomes are reported with an explicit final
// status and exit code:
//
//   exit 0  PASS          - every mandatory step asserted successfully.
//   exit 1  FAIL          - a mandatory assertion failed.
//   exit 2  NOT EXECUTED  - one or more mandatory steps could not run
//                            (e.g. missing secret, playwright not installed,
//                            or signup required email confirmation and no
//                            authenticated session could be established).
//
// Hard rules enforced by this file:
//   - No service_role / Admin API logic whatsoever. Cleanup of test users is
//     MANUAL via the Supabase Dashboard (documented in the runbook and in the
//     final report line).
//   - process.exit() is NEVER called inside try/finally. Exit decisions are
//     computed in plain control flow after the finally closes the browser.
//   - browser.close() always runs in finally.
//   - reader status, DOM anchor existence, visibility, reading-progress
//     presence, and two-user isolation are all MANDATORY assertions (not just
//     logged).
//   - Production email confirmation is NOT weakened.
//
// Environment requirements (never printed / logged / URL-embedded):
//   PREVIEW_URL                       - the Preview deployment origin.
//   VERCEL_AUTOMATION_BYPASS_SECRET   - Vercel automation bypass secret.
//
// The bypass secret is sent ONLY as the x-vercel-protection-bypass header.

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

// --- Pre-flight: required env (no secrets printed) ----------------------
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  markNotExecuted(`missing required env (values never printed): ${missingEnv.join(", ")}.`);
  console.log("This test must run where the operator's Vercel automation bypass secret and Preview URL are available.");
} else if (!await canLoadPlaywright()) {
  markNotExecuted("playwright is not installed; see docs/PREVIEW_E2E_RUNBOOK.md for the reproduceable install.");
} else {
  await runScenario();
}

async function canLoadPlaywright() {
  try {
    await import("playwright");
    return true;
  } catch {
    return false;
  }
}

async function runScenario() {
  const PREVIEW = process.env.PREVIEW_URL.replace(/\/$/, "");
  const BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET; // header-only, never logged
  const { chromium } = await import("playwright");

  const browser = await chromium.launch();
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

    // 2. Sign-up user A. We do NOT weaken email confirmation; we report the
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
      // Email confirmation required and we cannot receive it here: the
      // remaining mandatory steps depend on a session, so this is NOT
      // EXECUTED, not a PASS.
      markNotExecuted("signup required email confirmation; no authenticated session could be established");
      return;
    }
    if (!/\/account/.test(afterSignupUrl)) {
      markFail(`signup A navigation unexpected: ${afterSignupUrl}`);
      return;
    }
    markPass("signup A established a session (no confirmation required)");

    // 3. Authenticated /account shell is MANDATORY (no not-signed-in notice).
    if (await showsNotSignedIn(page)) {
      markFail("post-signup /account rendered the not-signed-in shell");
      return;
    }
    markPass("authenticated /account shell renders");

    // 4. SSR session persists across navigation is MANDATORY.
    await page.goto(`${PREVIEW}/library`, { waitUntil: "domcontentloaded" });
    await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
    if (await showsNotSignedIn(page)) {
      markFail("SSR session did not persist across navigation");
      return;
    }
    markPass("SSR session persists across navigation");

    // 5. BookmarkButton aria-pressed false -> true is MANDATORY.
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

    // 6. Bookmark page + anchor persistence is MANDATORY.
    await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
    const bookmarkLink = page.locator('a[href*="/reader/"]').filter({ hasText: /dn1/i }).first();
    if (!(await bookmarkLink.count())) {
      markFail("bookmark link not present on /account");
      return;
    }
    const href = await bookmarkLink.getAttribute("href");
    if (!href || !/page=2/.test(href) || !/#/.test(href)) {
      markFail(`bookmark href did not preserve page/anchor: ${href}`);
      return;
    }
    markPass("bookmark page + anchor persistence", href);

    // 7. Click the bookmark link and confirm the actual target element EXISTS
    //    and is reached/scrolled into view — MANDATORY.
    await Promise.all([
      page.waitForURL(/\/reader\/dn1/, { waitUntil: "domcontentloaded" }),
      bookmarkLink.click(),
    ]);
    const anchorEnc = (href.match(/#(.+)$/) || [])[1];
    if (!anchorEnc) {
      markFail("bookmark href has no anchor fragment");
      return;
    }
    const anchorId = decodeURIComponent(anchorEnc);
    const targetEl = page.locator(`#${CSS.escape(anchorId)}`).first();
    if (!(await targetEl.count())) {
      markFail(`bookmark target DOM element not found: id=${anchorId}`);
      return;
    }
    markPass("bookmark target DOM element exists", `id=${anchorId}`);
    await targetEl.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    if (!(await targetEl.isVisible())) {
      markFail(`bookmark target not visible after scroll: id=${anchorId}`);
      return;
    }
    markPass("bookmark target reached/scrolled into view");

    // 8. Reading-progress entry is MANDATORY.
    await page.goto(`${PREVIEW}/reader/dn1?page=3&edition=pli`, { waitUntil: "domcontentloaded" });
    await page.goto(`${PREVIEW}/account`, { waitUntil: "domcontentloaded" });
    const progressLink = page.locator('a[href*="/reader/"]').filter({ hasText: /dn1/i }).first();
    const progressHref = await progressLink.getAttribute("href").catch(() => null);
    if (!progressHref) {
      markFail("reading-progress entry not present on /account");
      return;
    }
    markPass("reading-progress entry present", progressHref);

    // 9. Sign-out is MANDATORY; a failed sign-out is a FAIL (never swallowed).
    const signOutBtn = page.locator('button').filter({ hasText: /sign out/i }).first();
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

    // 10. Two-user isolation is MANDATORY: sign up B, B must see none of A's data.
    await page.goto(`${PREVIEW}/auth/sign-up`, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill(emailB);
    await page.locator('input[name="password"]').fill(password);
    await Promise.all([
      page.waitForURL(/\/(account|auth\/sign-in)/, { waitUntil: "domcontentloaded" }).catch(() => null),
      page.locator('button[type="submit"]').click(),
    ]);
    const bUrl = page.url();
    if (/state=confirm/.test(bUrl)) {
      // Cannot establish B's session without email; isolation step is mandatory
      // and not satisfiable -> NOT EXECUTED (not a silent PASS).
      markNotExecuted("user B signup required email confirmation; isolation step could not run");
      return;
    }
    if (!/\/account/.test(bUrl)) {
      markFail(`user B signup navigation unexpected: ${bUrl}`);
      return;
    }
    const bHtml = await page.content();
    const bLeaksA = /dn1/i.test(bHtml) && /page=2/.test(bHtml);
    if (bLeaksA) {
      markFail("user B can see user A's bookmark (isolation broken)");
      return;
    }
    markPass("two-user isolation: B sees none of A's bookmark");

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
