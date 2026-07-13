import "server-only";

import { headers } from "next/headers";
import { CorpusAssetError, trustedAssetUrl } from "./trusted-origin";

export { CorpusAssetError } from "./trusted-origin";

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 40 * 1024 * 1024;

export async function fetchTrustedJson<T>(
  asset: string,
  options: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<T> {
  const url = trustedAssetUrl(asset);
  const requestHeaders = await headers();
  const forwarded: Record<string, string> = { accept: "application/json" };
  const cookie = requestHeaders.get("cookie");
  const protectionBypass = requestHeaders.get("x-vercel-protection-bypass");
  if (cookie) forwarded.cookie = cookie;
  if (protectionBypass) forwarded["x-vercel-protection-bypass"] = protectionBypass;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: "force-cache",
      headers: forwarded,
      redirect: "manual",
      signal: controller.signal,
    });
    if (response.status >= 300 && response.status < 400) throw new CorpusAssetError(`Corpus asset redirected (${response.status})`);
    if (!response.ok) throw new CorpusAssetError(`Corpus asset unavailable (${response.status})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > (options.maxBytes ?? DEFAULT_MAX_BYTES)) throw new CorpusAssetError("Corpus asset exceeds decoded size bound");
    const text = bytes.toString("utf8");
    if (/^\s*</.test(text)) throw new CorpusAssetError("Corpus asset returned HTML instead of JSON");
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new CorpusAssetError("Corpus asset contains invalid JSON");
    }
  } catch (error) {
    if (error instanceof CorpusAssetError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new CorpusAssetError("Corpus asset request timed out");
    throw new CorpusAssetError("Corpus asset request failed");
  } finally {
    clearTimeout(timeout);
  }
}
