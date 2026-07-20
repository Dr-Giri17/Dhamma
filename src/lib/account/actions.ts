"use server";

import { revalidatePath } from "next/cache";
import {
  addBookmark,
  getBookmark,
  removeBookmark,
  upsertReadingProgress,
} from "./queries";
import { getAuthenticatedUser } from "@/lib/supabase/server";

/**
 * Server Actions for bookmark and reading-progress persistence.
 *
 * Each action verifies the authenticated identity via getClaims()-backed
 * getAuthenticatedUser() before any write. Every action returns a structured
 * state rather than throwing, so a Supabase outage, RLS rejection, or network
 * error degrades to a localized inline message on the reader — never an
 * unhandled exception that would break public scripture reading.
 */

export type BookmarkToggleState =
  | { ok: true; bookmarked: boolean }
  | { ok: false; signedOut: true }
  | { ok: false; signedOut?: false; error: true };

export async function toggleBookmarkAction(input: {
  segmentId: string;
  sourceRef: string;
  readerSlug: string;
  edition: string;
  page: number;
  segmentAnchor?: string | null;
}): Promise<BookmarkToggleState> {
  const { userId } = await getAuthenticatedUser();
  if (!userId) return { ok: false, signedOut: true };

  try {
    const existing = await getBookmark(userId, input.segmentId, input.edition);
    if (existing) {
      await removeBookmark(userId, input.segmentId, input.edition);
      revalidatePath("/account");
      return { ok: true, bookmarked: false };
    }
    await addBookmark({ ...input, userId });
    revalidatePath("/account");
    return { ok: true, bookmarked: true };
  } catch {
    // Any failure (RLS rejection, constraint violation, network) is reported
    // to the client as a recoverable error state; the reader stays usable.
    return { ok: false, error: true };
  }
}

export async function saveReadingProgressAction(input: {
  readerSlug: string;
  edition: string;
  page: number;
  segmentId?: string | null;
}): Promise<{ ok: boolean; signedOut?: boolean }> {
  const { userId } = await getAuthenticatedUser();
  if (!userId) return { ok: false, signedOut: true };
  try {
    await upsertReadingProgress({ ...input, userId });
    revalidatePath("/account");
    return { ok: true };
  } catch {
    // Persistence is best-effort; never break reading on failure.
    return { ok: false };
  }
}
