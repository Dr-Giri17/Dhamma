import { describe, expect, it } from "vitest";
import { trustedAssetOrigin, trustedAssetUrl } from "../trusted-origin";

describe("trusted corpus asset origin", () => {
  it("uses only VERCEL_URL on Vercel", () => {
    expect(trustedAssetOrigin({ VERCEL_URL: "trusted-deployment.vercel.app" })).toBe("https://trusted-deployment.vercel.app");
  });

  it("uses a fixed loopback origin locally", () => {
    expect(trustedAssetOrigin({ PORT: "4310" })).toBe("http://127.0.0.1:4310");
  });

  it("cannot be influenced by hostile Host or forwarded-host values", () => {
    const environment = {
      VERCEL_URL: "trusted-deployment.vercel.app",
      HOST: "127.0.0.1:9",
      X_FORWARDED_HOST: "attacker.example",
      X_FORWARDED_PROTO: "http",
    };
    expect(trustedAssetUrl("/corpus/pli/sutta/index.json.gz", environment).origin).toBe("https://trusted-deployment.vercel.app");
  });

  it("rejects traversal and non-corpus paths", () => {
    expect(() => trustedAssetUrl("/corpus/../secret", {})).toThrow(/Invalid corpus asset path/);
    expect(() => trustedAssetUrl("https://attacker.example/corpus/x", {})).toThrow(/Invalid corpus asset path/);
  });
});
