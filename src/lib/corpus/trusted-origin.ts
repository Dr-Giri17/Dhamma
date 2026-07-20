export class CorpusAssetError extends Error {
  constructor(message: string, readonly status = 503) {
    super(message);
    this.name = "CorpusAssetError";
  }
}

type Environment = Readonly<Record<string, string | undefined>>;

/**
 * Strictly validate an https origin on a *.vercel.app host. Returns the
 * normalized origin string or throws CorpusAssetError. Rejects credentials
 * embedded in the URL, non-https protocols, and non-vercel.app hostnames.
 *
 * Never derives the origin from Host / X-Forwarded-Host / X-Forwarded-Proto —
 * only from validated environment variables.
 */
function normalizeVercelOrigin(raw: string, label: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new CorpusAssetError(`Empty ${label} origin`);
  const normalized = trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new CorpusAssetError(`Malformed ${label} origin`);
  }
  if (url.protocol !== "https:") throw new CorpusAssetError(`Insecure ${label} origin`);
  if (url.username || url.password) throw new CorpusAssetError(`Credentials in ${label} origin`);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new CorpusAssetError(`${label} origin must not carry a path/query/fragment`);
  }
  if (!url.hostname.endsWith(".vercel.app") || url.port) {
    throw new CorpusAssetError(`Untrusted ${label} origin`);
  }
  return url.origin;
}

/**
 * Resolve the trusted origin used to self-fetch corpus assets.
 *
 * Priority:
 *   1. Production: a strictly validated VERCEL_PROJECT_PRODUCTION_URL
 *      (the stable production apex, e.g. https://dhamma-tau.vercel.app).
 *      This takes precedence over VERCEL_URL because VERCEL_URL is a
 *      per-deployment preview/branch URL, not the stable apex that serves
 *      the immutable /corpus/* static assets in production.
 *   2. Preview: a strictly validated VERCEL_URL (the exact deployment URL of
 *      the running function). Authenticated-preview handling remains in the
 *      fetch helper, which forwards protection-bypass / cookie headers.
 *   3. Local: a fixed loopback origin (http://127.0.0.1:<port>).
 *
 * Host, X-Forwarded-Host and X-Forwarded-Proto are never read here.
 */
export function trustedAssetOrigin(environment: Environment = process.env): string {
  const productionUrl = environment.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return normalizeVercelOrigin(productionUrl, "production");
  }
  const vercelUrl = environment.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeVercelOrigin(vercelUrl, "preview");
  }
  const port = /^\d{2,5}$/.test(environment.PORT ?? "") ? environment.PORT : "3000";
  return `http://127.0.0.1:${port}`;
}

export function trustedAssetUrl(asset: string, environment: Environment = process.env): URL {
  if (!asset.startsWith("/corpus/") || asset.includes("\\") || asset.split("/").includes("..")) {
    throw new CorpusAssetError("Invalid corpus asset path", 400);
  }
  const origin = trustedAssetOrigin(environment);
  const url = new URL(asset, `${origin}/`);
  if (url.origin !== origin) throw new CorpusAssetError("Corpus asset origin mismatch", 400);
  return url;
}
