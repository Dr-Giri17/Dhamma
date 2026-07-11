export class CorpusAssetError extends Error {
  constructor(message: string, readonly status = 503) {
    super(message);
    this.name = "CorpusAssetError";
  }
}

type Environment = Readonly<Record<string, string | undefined>>;

export function trustedAssetOrigin(environment: Environment = process.env): string {
  const vercelUrl = environment.VERCEL_URL?.trim();
  if (vercelUrl) {
    const normalized = vercelUrl.startsWith("https://") ? vercelUrl : `https://${vercelUrl}`;
    const url = new URL(normalized);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app") || url.username || url.password) {
      throw new CorpusAssetError("Invalid trusted Vercel asset origin");
    }
    return url.origin;
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
