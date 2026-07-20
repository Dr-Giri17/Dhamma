// Isolated regression probe for the bookmark-target locator resolution in
// scripts/test/preview-browser-e2e.mjs.
//
// Reproduces the exact bug: the href fragment is URL-encoded (`dn1%3A1.1`)
// while the DOM id is emitted decoded (`<div id="dn1:1.1">`). An attribute
// selector built from the encoded fragment does NOT match. The probe verifies
// that the resolver (encoded-attribute first, then decodeURIComponent +
// CSS.escape inside page.evaluate) yields a single locator with count=1 and
// isVisible=true.
//
// Run with the same isolated Playwright install as the E2E script:
//   NODE_PATH=/tmp/dhamma-e2e-deps/node_modules \
//   node scripts/test/regression-anchor-locator.mjs
//
// Exit codes: 0 = regression fixed (PASS), 1 = regression present (FAIL),
// 2 = NOT_EXECUTED (Playwright/binary unavailable).

import { createRequire } from "node:module";

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  return require("playwright");
}

function fail(msg) {
  console.log(`FAIL: ${msg}`);
  process.exitCode = 1;
}
function pass(msg) {
  console.log(`PASS: ${msg}`);
}

let pw;
try {
  pw = loadPlaywright();
} catch (e) {
  console.log(`NOT EXECUTED: playwright not loadable: ${(e && e.message || e).split("\n")[0]}`);
  process.exitCode = 2;
  process.exit(process.exitCode);
}

const browser = await pw.chromium.launch().catch((e) => {
  console.log(`NOT EXECUTED: chromium binary unavailable: ${(e && e.message || e).split("\n")[0]}`);
  process.exitCode = 2;
});
if (!browser) process.exit(2);

try {
  const page = await browser.newPage();
  // Simulate the reader DOM: the id is decoded; the href fragment is encoded.
  await page.setContent(`
    <html><body>
      <div id="dn1:1.1">target</div>
    </body></html>
  `);
  const href = "/reader/dn1?edition=pli&page=2#dn1%3A1.1";
  const anchorEnc = (href.match(/#(.+)$/) || [])[1];

  // Mirror the resolver from preview-browser-e2e.mjs exactly.
  const encodedLocator = page.locator(`[id="${anchorEnc}"]`).first();
  let resolvedTarget;
  if (await encodedLocator.count()) {
    resolvedTarget = encodedLocator;
  } else {
    const sel = await page.evaluate((enc) => {
      let decoded;
      try {
        decoded = decodeURIComponent(enc);
      } catch {
        decoded = enc;
      }
      return `#${CSS.escape(decoded)}`;
    }, anchorEnc);
    resolvedTarget = page.locator(sel).first();
  }

  const count = await resolvedTarget.count();
  if (count !== 1) {
    fail(`resolved locator count=${count}, expected 1`);
  } else {
    pass("resolved locator count=1");
  }

  const visible = await resolvedTarget.isVisible();
  if (!visible) {
    fail("resolved locator is not visible");
  } else {
    pass("resolved locator isVisible=true");
  }

  if (count === 1 && visible) {
    console.log("REGRESSION RESULT: PASS (encoded href -> decoded DOM id resolves correctly)");
  } else {
    console.log("REGRESSION RESULT: FAIL");
  }
} catch (e) {
  fail(`unexpected: ${(e && e.message) || e}`);
} finally {
  try {
    await browser.close();
  } catch {}
}
