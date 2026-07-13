import { describe, expect, it } from "vitest";
import { gunzipSync } from "node:zlib";
import { deterministicGzip, normalizedRelativePath, sha256 } from "../../../../scripts/corpus/deterministic";
import { normalizeBilaraText } from "../../../../scripts/corpus/text-normalization";

describe("deterministic corpus output", () => {
  it("generates byte-identical gzip with a fixed header", () => {
    const content = '{"text":"Dhamma"}\n';
    const first = deterministicGzip(content);
    const second = deterministicGzip(content);
    expect(first.equals(second)).toBe(true);
    expect(first.readUInt32LE(4)).toBe(0);
    expect(first[9]).toBe(255);
    expect(gunzipSync(first).toString("utf8")).toBe(content);
    expect(sha256(first)).toBe(sha256(second));
  });

  it("normalizes Windows and Linux separators to one provenance path", () => {
    expect(normalizedRelativePath("root\\pli\\ms\\sutta\\dn\\dn1.json")).toBe("root/pli/ms/sutta/dn/dn1.json");
    expect(normalizedRelativePath("./root/pli/ms/sutta/dn/dn1.json")).toBe("root/pli/ms/sutta/dn/dn1.json");
  });

  it("removes literal inline HTML without splitting adjacent text", () => {
    expect(normalizeBilaraText('<a href="https://example.test">dependent</a> origination')).toBe("dependent origination");
    expect(normalizeBilaraText("Б</font><font>лагословенный")).toBe("Благословенный");
  });
});
