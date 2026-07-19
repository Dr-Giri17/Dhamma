/**
 * Resolve the site origin used in the Supabase Auth email-confirmation
 * callback URL (`emailRedirectTo`).
 *
 * This is DIFFERENT from the trusted production corpus-asset origin in
 * src/lib/corpus/trusted-origin.ts. The corpus origin points at where the
 * app should self-fetch its immutable `/corpus/*` files; the auth callback
 * origin points at where the user's browser should land after clicking the
 * confirmation link in the email.
 *
 * The critical correctness rule: a Preview deployment's confirmation email
 * must route back to THAT PREVIEW, not to production. `VERCEL_PROJECT_PRODUCTION_URL`
 * is the same production domain in every deployment (including Preview), so
 * preferring it for the callback origin in Preview would route the operator's
 * test confirmation to the wrong environment.
 *
 * Priority (first non-empty, valid value wins):
 *   1. AUTH_SITE_URL              - explicit, environment-scoped override
 *                                   (operator can set this per environment in
 *                                   Vercel to pin the callback origin).
 *   2. VERCEL_BRANCH_URL          - Preview deployment branch URL (Preview).
 *   3. VERCEL_URL                 - current deployment URL (Preview fallback).
 *   4. VERCEL_PROJECT_PRODUCTION_URL - production apex (production only).
 *   5. local loopback             - http://127.0.0.1:<PORT> (default 3000).
 *
 * All Vercel-derived values must be https on a vercel.app host with no embedded
 * credentials and no path/query/fragment; otherwise they are rejected and the
 * resolver falls through to the next candidate.
 */

export class AuthCallbackOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthCallbackOriginError";
  }
}

type Env = Readonly<Record<string, string | undefined>>;

function normalizeHttpsVercel(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.pathname !== "/" || url.search || url.hash) return null;
  if (!url.hostname.endsWith(".vercel.app") || url.port) return null;
  return url.origin;
}

/**
 * Return the resolved origin string. Throws AuthCallbackOriginError only if an
 * explicit AUTH_SITE_URL is set but malformed (fail loud on operator error).
 */
export function authCallbackOrigin(env: Env = process.env): string {
  // 1. Explicit environment-scoped override. If the operator set this, it must
  //    be a real absolute URL (any host), or we fail loudly so they notice.
  const explicit = env.AUTH_SITE_URL?.trim();
  if (explicit) {
    try {
      const u = new URL(explicit.startsWith("https://") || explicit.startsWith("http://") ? explicit : `https://${explicit}`);
      if (u.username || u.password || u.search || u.hash) {
        throw new AuthCallbackOriginError("AUTH_SITE_URL must not carry credentials, query, or fragment");
      }
      return u.origin;
    } catch (e) {
      if (e instanceof AuthCallbackOriginError) throw e;
      throw new AuthCallbackOriginError(`Malformed AUTH_SITE_URL: ${explicit}`);
    }
  }

  // 2. Preview branch URL (preferred for Preview deploys).
  const branch = normalizeHttpsVercel(env.VERCEL_BRANCH_URL ?? "");
  if (branch) return branch;

  // 3. Current deployment URL (Preview fallback).
  const deployment = normalizeHttpsVercel(env.VERCEL_URL ?? "");
  if (deployment) return deployment;

  // 4. Production apex (production only - this var is set to the SAME value in
  //    Preview, which is exactly why it must come AFTER the Preview vars).
  const production = normalizeHttpsVercel(env.VERCEL_PROJECT_PRODUCTION_URL ?? "");
  if (production) return production;

  // 5. Local loopback fallback.
  const port = /^\d{2,5}$/.test(env.PORT ?? "") ? env.PORT : "3000";
  return `http://127.0.0.1:${port}`;
}
