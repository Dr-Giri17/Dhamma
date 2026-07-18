import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Match all routes except static assets, corpus files reads, and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|corpus/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
