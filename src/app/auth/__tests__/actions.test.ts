import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the Supabase server client so we can exercise signUpAction's routing
// without a network or database. We pin the two framework guarantees the UI
// depends on:
//   (a) when signUp returns a session, the action redirects to /account;
//   (b) when signUp returns a user but no session (email confirmation required),
//       the action redirects to /auth/sign-in?state=confirm.
//
// Both guarantees are broken by a naive try/catch that wraps redirect(): in
// Next.js, redirect() throws a NEXT_REDIRECT error, and a catch-all swallows
// it (returning a structured error instead of navigating). These tests
// reproduce that bug and pin the fix.

const supabaseMock = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue(supabaseMock),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Capture redirect() invocations. In Next.js, redirect() throws an error whose
// `digest` is `NEXT_REDIRECT;<status>;<destination>;<type>`. We throw a
// matching error so the action's control flow is identical to production.
let lastRedirect: string | null = null;
vi.mock("next/navigation", () => ({
  redirect: vi.fn((destination: string) => {
    lastRedirect = destination;
    const err = new Error(`NEXT_REDIRECT: redirect to ${destination}`);
    (err as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${destination};replace`;
    throw err;
  }),
}));

const { signUpAction } = await import("../actions");

function fd(email?: string, password?: string): FormData {
  const f = new FormData();
  if (email !== undefined) f.append("email", email);
  if (password !== undefined) f.append("password", password);
  return f;
}

afterEach(() => {
  vi.clearAllMocks();
  lastRedirect = null;
});

/** Invoke signUpAction and assert it triggers a redirect to `expectedDest`. */
async function expectRedirectsTo(expectedDest: string, formData: FormData) {
  let threw: unknown = null;
  let returned: unknown = undefined;
  try {
    returned = await signUpAction(undefined, formData);
  } catch (e) {
    threw = e;
  }
  if (threw === null) {
    throw new Error(
      `Expected signUpAction to redirect to ${expectedDest}, but it returned ${JSON.stringify(returned)} instead of throwing NEXT_REDIRECT.`
    );
  }
  if (!(threw instanceof Error)) {
    throw new Error(`Expected Error from redirect(), got: ${String(threw)}`);
  }
  const digest = (threw as Error & { digest?: string }).digest ?? "";
  if (digest !== `NEXT_REDIRECT;replace;${expectedDest};replace`) {
    throw new Error(
      `Expected redirect digest to target ${expectedDest}, got digest="${digest}".`
    );
  }
}

describe("signUpAction routing", () => {
  it("redirects to /account when signUp returns a session", async () => {
    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: { id: "u-1" }, session: { access_token: "tok" } },
      error: null,
    });
    await expectRedirectsTo("/account", fd("a@b.c", "secret123"));
    expect(supabaseMock.auth.signUp).toHaveBeenCalled();
  });

  it("redirects to /auth/sign-in?state=confirm when no session is returned (email confirmation)", async () => {
    supabaseMock.auth.signUp.mockResolvedValue({
      // Email confirmation required: user present, session null.
      data: { user: { id: "u-2" }, session: null },
      error: null,
    });
    await expectRedirectsTo("/auth/sign-in?state=confirm", fd("a@b.c", "secret123"));
  });

  it("returns a structured error (no redirect) when Supabase reports a signup error", async () => {
    supabaseMock.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });
    const result = await signUpAction(undefined, fd("a@b.c", "secret123"));
    expect(result).toEqual({ error: "signup-failed" });
    expect(lastRedirect).toBeNull();
  });

  it("returns missing-field error without calling Supabase when fields are blank", async () => {
    const result = await signUpAction(undefined, fd());
    expect(result).toEqual({ error: "missing" });
    expect(supabaseMock.auth.signUp).not.toHaveBeenCalled();
    expect(lastRedirect).toBeNull();
  });
});
