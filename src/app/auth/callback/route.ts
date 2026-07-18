import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase Auth email/SSO redirect callback. Exchanges the `code` for a
 * session, then redirects to /account. Any failure redirects to /auth/sign-in
 * so public scripture reading is never broken by an auth edge case.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // fall through to sign-in redirect below
    }
  }
  return NextResponse.redirect(`${origin}/auth/sign-in`);
}
