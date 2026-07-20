import { describe, expect, it } from "vitest";
import { authCallbackOrigin, AuthCallbackOriginError } from "../auth-callback-origin";

describe("authCallbackOrigin — AUTH_SITE_URL override", () => {
  it("AUTH_SITE_URL wins in every environment (here: preview)", () => {
    expect(
      authCallbackOrigin({
        AUTH_SITE_URL: "https://staging.dhamma.example",
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "https://dhamma-preview.vercel.app",
        VERCEL_URL: "https://dhamma-deploy.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://staging.dhamma.example");
  });

  it("AUTH_SITE_URL wins even in production", () => {
    expect(
      authCallbackOrigin({
        AUTH_SITE_URL: "https://custom.dhamma.example",
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://custom.dhamma.example");
  });

  it("accepts a bare AUTH_SITE_URL hostname and normalizes to https", () => {
    expect(authCallbackOrigin({ AUTH_SITE_URL: "staging.dhamma.example" })).toBe(
      "https://staging.dhamma.example"
    );
  });

  it("throws AuthCallbackOriginError when AUTH_SITE_URL is malformed", () => {
    expect(() => authCallbackOrigin({ AUTH_SITE_URL: "https://not a url" })).toThrow(AuthCallbackOriginError);
  });

  it("throws AuthCallbackOriginError when AUTH_SITE_URL carries credentials", () => {
    expect(() => authCallbackOrigin({ AUTH_SITE_URL: "https://u:p@host.example" })).toThrow(
      AuthCallbackOriginError
    );
  });
});

describe("authCallbackOrigin — VERCEL_ENV=production", () => {
  it("uses VERCEL_PROJECT_PRODUCTION_URL", () => {
    expect(
      authCallbackOrigin({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-tau.vercel.app");
  });

  it("accepts a bare VERCEL_PROJECT_PRODUCTION_URL and normalizes to https", () => {
    expect(
      authCallbackOrigin({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "dhamma-tau.vercel.app" })
    ).toBe("https://dhamma-tau.vercel.app");
  });

  it("REGRESSION: production wins even when ALL three Vercel URLs are set", () => {
    // The master fix: VERCEL_ENV=production MUST route the email callback to
    // the production apex, not to the transient branch/deployment URLs that
    // Vercel also injects on a production build.
    const out = authCallbackOrigin({
      VERCEL_ENV: "production",
      VERCEL_BRANCH_URL: "https://dhamma-some-branch.vercel.app",
      VERCEL_URL: "https://dhamma-some-deploy.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
    });
    expect(out).toBe("https://dhamma-tau.vercel.app");
    expect(out).not.toContain("dhamma-some-branch.vercel.app");
    expect(out).not.toContain("dhamma-some-deploy.vercel.app");
  });

  it("falls back to loopback when VERCEL_PROJECT_PRODUCTION_URL is missing/invalid in production", () => {
    expect(authCallbackOrigin({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "http://bad" })).toBe(
      "http://127.0.0.1:3000"
    );
  });
});

describe("authCallbackOrigin — VERCEL_ENV=preview", () => {
  it("prefers VERCEL_BRANCH_URL (not the production apex)", () => {
    expect(
      authCallbackOrigin({
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "https://dhamma-fix-xyz-dr-giri17s-projects.vercel.app",
        VERCEL_URL: "https://dhamma-other.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-fix-xyz-dr-giri17s-projects.vercel.app");
  });

  it("falls back to VERCEL_URL when VERCEL_BRANCH_URL is absent", () => {
    expect(
      authCallbackOrigin({
        VERCEL_ENV: "preview",
        VERCEL_URL: "https://dhamma-deploy.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("https://dhamma-deploy.vercel.app");
  });

  it("does NOT consider VERCEL_PROJECT_PRODUCTION_URL in preview", () => {
    const out = authCallbackOrigin({
      VERCEL_ENV: "preview",
      VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
    });
    expect(out).toBe("http://127.0.0.1:3000");
    expect(out).not.toContain("dhamma-tau.vercel.app");
  });

  it("rejects insecure/credential/non-vercel URLs and falls through to loopback", () => {
    expect(
      authCallbackOrigin({
        VERCEL_ENV: "preview",
        VERCEL_BRANCH_URL: "http://insecure.vercel.app",
        VERCEL_URL: "https://user:pass@dhamma.vercel.app",
      })
    ).toBe("http://127.0.0.1:3000");
  });
});

describe("authCallbackOrigin — development / unset VERCEL_ENV", () => {
  it("returns loopback when VERCEL_ENV is unset, even if Vercel URLs are present", () => {
    // Local without `vercel dev` has no VERCEL_ENV; we must never silently
    // route callbacks to a Vercel hostname the local machine cannot serve.
    expect(
      authCallbackOrigin({
        VERCEL_URL: "https://dhamma-something.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "https://dhamma-tau.vercel.app",
      })
    ).toBe("http://127.0.0.1:3000");
  });

  it("VERCEL_ENV=development returns loopback", () => {
    expect(authCallbackOrigin({ VERCEL_ENV: "development" })).toBe("http://127.0.0.1:3000");
    expect(authCallbackOrigin({ VERCEL_ENV: "development", PORT: "4310" })).toBe("http://127.0.0.1:4310");
  });

  it("returns loopback when nothing is configured", () => {
    expect(authCallbackOrigin({})).toBe("http://127.0.0.1:3000");
  });
});
