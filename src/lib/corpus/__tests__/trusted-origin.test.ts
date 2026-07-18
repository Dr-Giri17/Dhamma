import { describe, expect, it } from "vitest";
import { CorpusAssetError, trustedAssetOrigin, trustedAssetUrl } from "../trusted-origin";

describe("trusted corpus asset origin", () => {
  it("prefers a validated production URL over VERCEL_URL in production", () => {
    expect(
      trustedAssetOrigin({
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
        VERCEL_URL: "some-preview-abc.vercel.app",
      })
    ).toBe("https://dhamma-tau.vercel.app");
  });

  it("accepts a bare production hostname and normalizes to https", () => {
    expect(trustedAssetOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "dhamma-tau.vercel.app" })).toBe(
      "https://dhamma-tau.vercel.app"
    );
  });

  it("falls back to VERCEL_URL only when no production URL is set (preview)", () => {
    expect(trustedAssetOrigin({ VERCEL_URL: "trusted-deployment.vercel.app" })).toBe(
      "https://trusted-deployment.vercel.app"
    );
  });

  it("uses a fixed loopback origin locally", () => {
    expect(trustedAssetOrigin({ PORT: "4310" })).toBe("http://127.0.0.1:4310");
  });

  it("defaults to port 3000 when no env is set", () => {
    expect(trustedAssetOrigin({})).toBe("http://127.0.0.1:3000");
  });

  it("cannot be influenced by hostile Host or forwarded-host values", () => {
    const environment = {
      VERCEL_PROJECT_PRODUCTION_URL: "dhamma-tau.vercel.app",
      HOST: "127.0.0.1:9",
      X_FORWARDED_HOST: "attacker.example",
      X_FORWARDED_PROTO: "http",
    };
    expect(trustedAssetUrl("/corpus/pli/sutta/index.json.gz", environment).origin).toBe(
      "https://dhamma-tau.vercel.app"
    );
  });

  it("rejects credentials embedded in a production origin", () => {
    expect(() =>
      trustedAssetOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "https://user:pass@dhamma-tau.vercel.app" })
    ).toThrow(CorpusAssetError);
  });

  it("rejects credentials embedded in a preview origin", () => {
    expect(() => trustedAssetOrigin({ VERCEL_URL: "https://user:pass@preview.vercel.app" })).toThrow(
      CorpusAssetError
    );
  });

  it("rejects a non-vercel.app production hostname", () => {
    expect(() =>
      trustedAssetOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "https://attacker.example" })
    ).toThrow(CorpusAssetError);
  });

  it("rejects an insecure (http) production origin", () => {
    expect(() =>
      trustedAssetOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "http://dhamma-tau.vercel.app" })
    ).toThrow(CorpusAssetError);
  });

  it("rejects a malformed production origin", () => {
    expect(() => trustedAssetOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "https://not a url" })).toThrow(
      CorpusAssetError
    );
  });

  it("rejects an origin carrying a path or query", () => {
    expect(() =>
      trustedAssetOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app/corpus" })
    ).toThrow(CorpusAssetError);
    expect(() =>
      trustedAssetOrigin({ VERCEL_URL: "https://preview.vercel.app?x=1" })
    ).toThrow(CorpusAssetError);
  });

  it("rejects traversal and non-corpus paths", () => {
    expect(() => trustedAssetUrl("/corpus/../secret", {})).toThrow(/Invalid corpus asset path/);
    expect(() => trustedAssetUrl("https://attacker.example/corpus/x", {})).toThrow(
      /Invalid corpus asset path/
    );
  });

  it("builds the expected asset URL in production", () => {
    const url = trustedAssetUrl("/corpus/pli/sutta/s0101m/index.json.gz", {
      VERCEL_PROJECT_PRODUCTION_URL: "dhamma-tau.vercel.app",
    });
    expect(url.origin).toBe("https://dhamma-tau.vercel.app");
    expect(url.pathname).toBe("/corpus/pli/sutta/s0101m/index.json.gz");
  });
});
