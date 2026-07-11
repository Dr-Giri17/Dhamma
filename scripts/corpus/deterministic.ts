import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

export const GZIP_LEVEL = 9;
export const GZIP_OS_UNKNOWN = 255;

export function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Produce platform-independent gzip bytes (RFC 1952 OS=unknown, mtime=0). */
export function deterministicGzip(value: Buffer | string): Buffer {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  const bytes = gzipSync(input, { level: GZIP_LEVEL });
  bytes.writeUInt32LE(0, 4);
  bytes[9] = GZIP_OS_UNKNOWN;
  return bytes;
}

export function canonicalJson(value: unknown, pretty = false): string {
  return `${JSON.stringify(value, null, pretty ? 2 : undefined)}\n`;
}

export function normalizedRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "");
}
