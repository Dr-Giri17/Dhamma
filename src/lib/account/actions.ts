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
 * getAuthenticatedUser() before any write. If the user is not signed in, the
 * action returns a localized state instead of mutating data, so the public
 * reading experience never breaks and never silently persists without an
 * account.
 */

export type BookmarkToggleState =
  | { ok: true; bookmarked: boolean; signedOut?: false }
  | { ok: false; signedOut: true };

export async function toggleBookmarkAction(input: {
  segmentId: string;
  sourceRef: string;
  readerSlug: string;
  edition: string;
}): Promise<BookmarkToggleState> {
  const { userId } = await getAuthenticatedUser();
  if (!userId) return { ok: false, signedOut: true };

  const existing = await getBookmark(userId, input.segmentId, input.edition).catch(() => null);
  if (existing) {
    await removeBookmark(userId, input.segmentId, input.edition);
    revalidatePath("/account");
    return { ok: true, bookmarked: false };
  }
  await addBookmark({ ...input, userId });
  revalidatePath("/account");
  return { ok: true, bookmarked: true };
}

export async function saveReadingProgressAction(input: {
  readerSlug: string;
  edition: string;
  page: number;
  segmentId?: string | null;
}): Promise<{ ok: boolean; signedOut?: boolean }> {
  const { userId } = await getAuthenticatedUser();
  if (!userId) return { ok: false, signedOut: true };
  await upsertReadingProgress({ ...input, userId });
  revalidatePath("/account");
  return { ok: true };
}
