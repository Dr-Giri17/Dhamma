import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-only Supabase client (App Router) following the current
 * @supabase/ssr guidance. Auth state is carried in cookies so that
 * Server Components, Route Handlers, Server Actions, and middleware share
 * one session. NEVER use this module from client code, and NEVER read the
 * service_role key here — clients use the publishable (anon) key only.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // `set` can only be called from a Server Action or Route Handler.
            // When invoked from a Server Component the cookie is refreshed by
            // middleware instead, so this is expected and safe to ignore.
          }
        },
      },
    }
  );
}

/**
 * Resolve the authenticated user's identity for an authorization decision.
 *
 * Per current Supabase guidance, `getSession()` reads from cookies that can be
 * tampered with and must NOT be trusted as proof of identity. `getClaims()`
 * validates the access token server-side and refreshes it if needed. For
 * user-data row-level-security decisions we therefore use claims (and, when a
 * full user record is required, `getUser()`).
 *
 * Returns `{ user: null }` when no valid session exists; never throws on auth
 * failure so callers can degrade gracefully (Supabase failure must not break
 * public scripture reading).
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsResult, error } = await supabase.auth.getClaims();
    if (error || !claimsResult?.claims?.sub) {
      return { supabase, user: null, userId: null as string | null };
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user, userId: user?.id ?? null };
  } catch {
    return { supabase: null, user: null, userId: null as string | null };
  }
}
