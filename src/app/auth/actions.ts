"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Email/password sign-up, sign-in, and sign-out Server Actions.
 *
 * The publishable (anon) key is used here; the service_role key is never
 * present in client bundles or reachable from these actions. Auth state is
 * stored in secure, httpOnly cookies via @supabase/ssr.
 */

export type AuthFormState = { error?: string } | undefined;

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "missing" };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "invalid" };
  } catch {
    return { error: "invalid" };
  }
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "missing" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin()}/auth/callback` },
    });
    if (error) return { error: "signup-failed" };
    // If email confirmation is required, data.user exists but data.session is
    // null. Redirect to a callback-friendly landing that confirms the flow.
    if (data.session) {
      revalidatePath("/", "layout");
      redirect("/account");
    }
    redirect("/auth/sign-in?state=confirm");
  } catch {
    return { error: "signup-failed" };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Best-effort; signed-out cookies are cleared regardless.
  }
  revalidatePath("/", "layout");
  redirect("/");
}

function origin() {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return production.startsWith("https://") ? production : `https://${production}`;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.startsWith("https://") ? vercel : `https://${vercel}`;
  const port = /^\d{2,5}$/.test(process.env.PORT ?? "") ? process.env.PORT : "3000";
  return `http://127.0.0.1:${port}`;
}
