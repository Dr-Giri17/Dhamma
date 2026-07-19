import { describe, expect, it } from "vitest";
import { authCallbackOrigin, AuthCallbackOriginError } from "../auth-callback-origin";

describe("authCallbackOrigin", () => {
  it("prefers an explicit AUTH_SITE_URL when set", () => {
    expect(
      authCallbackOrigin({
        AUTH_SITE_URL: "https://staging.dhamma.example",
        VERCEL_BRANCH_URL: "https://dhamma-preview.vercel.app",
        VERCEL_URL: "https://dhamma-deploy.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://staging.dhamma.example");
  });

  it("accepts a bare AUTH_SITE_URL hostname and normalizes to https", () => {
    expect(authCallbackOrigin({ AUTH_SITE_URL: "staging.dhamma.example" })).toBe(
      "https://staging.dhamma.example"
    );
  });

  it("uses VERCEL_BRANCH_URL in Preview (not the production apex)", () => {
    // The whole point: a Preview deploy's confirmation email must route back
    // to THAT preview, not to the production domain.
    expect(
      authCallbackOrigin({
        VERCEL_BRANCH_URL: "https://dhamma-fix-xyz-dr-giri17s-projects.vercel.app",
        VERCEL_URL: "https://dhamma-other.vercel.app",
        // Production apex is the same in every deploy - it must NOT win here.
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-fix-xyz-dr-giri17s-projects.vercel.app");
  });

  it("falls back to VERCEL_URL when VERCEL_BRANCH_URL is absent (Preview)", () => {
    expect(
      authCallbackOrigin({
        VERCEL_URL: "https://dhamma-deploy.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-deploy.vercel.app");
  });

  it("uses VERCEL_PROJECT_PRODUCTION_URL only in production (no branch/deploy URL set)", () => {
    expect(
      authCallbackOrigin({
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-tau.vercel.app");
  });

  it("accepts a bare VERCEL_PROJECT_PRODUCTION_URL and normalizes to https", () => {
    expect(authCallbackOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "dhamma-tau.vercel.app" })).toBe(
      "https://dhamma-tau.vercel.app"
    );
  });

  it("uses local loopback when nothing is configured", () => {
    expect(authCallbackOrigin({})).toBe("http://127.0.0.1:3000");
    expect(authCallbackOrigin({ PORT: "4310" })).toBe("http://127.0.0.1:4310");
  });

  it("rejects an insecure Vercel URL and falls through to the next candidate", () => {
    expect(
      authCallbackOrigin({
        VERCEL_BRANCH_URL: "http://insecure.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-tau.vercel.app");
  });

  it("rejects a Vercel URL with embedded credentials and falls through", () => {
    expect(
      authCallbackOrigin({
        VERCEL_BRANCH_URL: "https://user:pass@dhamma.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-tau.vercel.app");
  });

  it("rejects a non-vercel.app Vercel URL and falls through", () => {
    expect(
      authCallbackOrigin({
        VERCEL_BRANCH_URL: "https://attacker.example.com",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-tau.vercel.app");
  });

  it("throws AuthCallbackOriginError when AUTH_SITE_URL is malformed", () => {
    expect(() => authCallbackOrigin({ AUTH_SITE_URL: "https://not a url" })).toThrow(AuthCallbackOriginError);
  });

  it("does not prefer VERCEL_PROJECT_PRODUCTION_URL when a Preview URL is present", () => {
    // Regression guard for the bug where Preview email callbacks routed to prod.
    const out = authCallbackOrigin({
      VERCEL_BRANCH_URL: "https://dhamma-fix.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
    });
    expect(out).toBe("https://dhamma-fix.vercel.app");
    expect(out).not.toContain("dhamma-tau.vercel.app");
  });
});
