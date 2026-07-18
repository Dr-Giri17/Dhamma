import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh the Supabase Auth session on every request and sync the cookies back
 * onto the response (current @supabase/ssr proxy pattern). Auth cookies are
 * httpOnly + secure + sameSite and are refreshed here, not via getSession().
 *
 * This middleware never blocks public corpus routes: signed-out users continue
 * to read and search scripture. It only ensures session cookies stay fresh for
 * authenticated users. Any auth failure is swallowed so that a Supabase outage
 * cannot break public reading.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // If Supabase is not configured at all, do not attempt to build a client;
  // the app must keep working in public-only mode.
  if (!supabaseUrl || !supabaseKey) return response;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    // Do NOT use getSession() here. Touching the user forces token validation /
    // refresh via the cookie-backed client; the refreshed cookies are returned
    // on the response by the setAll() above.
    await supabase.auth.getUser();
  } catch {
    // Swallow: public scripture access must survive a Supabase failure.
  }

  return response;
}
