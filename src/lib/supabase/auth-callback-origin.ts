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
 * in Preview we must NOT prefer it.
 *
 * Resolution is driven by Vercel's `VERCEL_ENV` (which Vercel sets to
 * "production", "preview", or "development" for the running deployment),
 * with `AUTH_SITE_URL` as an explicit per-environment override that wins
 * regardless of `VERCEL_ENV`.
 *
 * Priority:
 *   1. AUTH_SITE_URL                   - explicit override (any environment).
 *   2. If VERCEL_ENV === "production": VERCEL_PROJECT_PRODUCTION_URL, even
 *      when branch/deployment URLs are also set (production deploys must
 *      email the production apex, not a transient deployment URL).
 *   3. If VERCEL_ENV === "preview":    VERCEL_BRANCH_URL, then VERCEL_URL.
 *   4. If VERCEL_ENV === "development" (or unset, e.g. local without Vercel):
 *      local loopback fallback.
 *
 * All Vercel-derived values must be https on a vercel.app host with no embedded
 * credentials and no path/query/fragment; otherwise they are rejected and the
 * resolver falls through to the next candidate for that environment.
 */

export class AuthCallbackOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthCallbackOriginError";
  }
}

type Env = Readonly<Record<string, string | undefined>>;

function normalizeHttpsVercel(raw: string | undefined): string | null {
  const trimmed = (raw ?? "").trim();
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

function normalizeExplicit(raw: string): string {
  const trimmed = raw.trim();
  const withScheme = trimmed.startsWith("https://") || trimmed.startsWith("http://") ? trimmed : `https://${trimmed}`;
  const u = new URL(withScheme);
  if (u.username || u.password || u.search || u.hash) {
    throw new AuthCallbackOriginError("AUTH_SITE_URL must not carry credentials, query, or fragment");
  }
  return u.origin;
}

function localLoopback(env: Env): string {
  const port = /^\d{2,5}$/.test(env.PORT ?? "") ? env.PORT : "3000";
  return `http://127.0.0.1:${port}`;
}

/**
 * Return the resolved origin string. Throws AuthCallbackOriginError only if an
 * explicit AUTH_SITE_URL is set but malformed (fail loud on operator error).
 */
export function authCallbackOrigin(env: Env = process.env): string {
  // 1. Explicit environment-scoped override wins in every environment.
  const explicit = env.AUTH_SITE_URL?.trim();
  if (explicit) {
    try {
      return normalizeExplicit(explicit);
    } catch (e) {
      if (e instanceof AuthCallbackOriginError) throw e;
      throw new AuthCallbackOriginError(`Malformed AUTH_SITE_URL: ${explicit}`);
    }
  }

  const vercelEnv = (env.VERCEL_ENV ?? "").trim();

  // 2. Production: prefer the production apex even if branch/deployment URLs
  //    are present (they should not be on a production build, but be safe).
  if (vercelEnv === "production") {
    return normalizeHttpsVercel(env.VERCEL_PROJECT_PRODUCTION_URL) ?? localLoopback(env);
  }

  // 3. Preview: prefer the branch URL, then the deployment URL. The production
  //    apex is deliberately NOT considered here.
  if (vercelEnv === "preview") {
    return (
      normalizeHttpsVercel(env.VERCEL_BRANCH_URL) ??
      normalizeHttpsVercel(env.VERCEL_URL) ??
      localLoopback(env)
    );
  }

  // 4. development, or VERCEL_ENV unset (local without Vercel): loopback.
  return localLoopback(env);
}
