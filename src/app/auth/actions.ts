"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authCallbackOrigin } from "@/lib/supabase/auth-callback-origin";

/**
 * Email/password sign-up, sign-in, and sign-out Server Actions.
 *
 * The publishable (anon) key is used here; the service_role key is never
 * present in client bundles or reachable from these actions. Auth state is
 * stored in secure, httpOnly cookies via @supabase/ssr.
 *
 * IMPORTANT control-flow note: Next's redirect() throws a NEXT_REDIRECT error.
 * A catch-all try/catch around it would swallow the redirect and the user
 * would never navigate. Every redirect() here is therefore OUTSIDE any
 * try/catch, and the catch blocks explicitly rethrow any error whose digest
 * starts with NEXT_REDIRECT (defensive belt-and-suspenders).
 */

export type AuthFormState = { error?: string } | undefined;

/** True if `error` is a Next.js framework redirect that must propagate. */
function isNextRedirect(error: unknown): boolean {
  return (
    error instanceof Error &&
    typeof (error as Error & { digest?: string }).digest === "string" &&
    ((error as Error & { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      error.message.includes("NEXT_REDIRECT"))
  );
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "missing" };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "invalid" };
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: "invalid" };
  }
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "missing" };

  // Resolve the redirect destination BEFORE any redirect() call, and keep the
  // routing decision OUTSIDE the try/catch below. Next's redirect() throws a
  // NEXT_REDIRECT error; if it were inside a catch-all, the catch would
  // swallow it and the user would never be navigated.
  let hasSession = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${authCallbackOrigin()}/auth/callback` },
    });
    if (error) return { error: "signup-failed" };
    // If email confirmation is required, data.user exists but data.session is
    // null. We surface that to the routing decision below.
    hasSession = Boolean(data.session);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: "signup-failed" };
  }

  revalidatePath("/", "layout");
  // Session present -> account; otherwise email confirmation is pending.
  redirect(hasSession ? "/account" : "/auth/sign-in?state=confirm");
}

export async function signOutAction() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    // Best-effort; signed-out cookies are cleared regardless.
  }
  revalidatePath("/", "layout");
  redirect("/");
}
