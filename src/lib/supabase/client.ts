"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for Client Components. Uses the publishable (anon)
 * key only — the service_role key is never present in client bundles.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
