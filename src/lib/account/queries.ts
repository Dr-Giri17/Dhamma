import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Persistence queries for account features (bookmarks, reading progress,
 * preferences). All access is owner-scoped by RLS policies: the authenticated
 * client can only read/write rows where `user_id` equals the JWT `sub`.
 *
 * Every function resolves to an empty array / null on any Supabase error so
 * that an outage or unreachable persistence table can never break public
 * scripture reading.
 */

export interface BookmarkRow {
  id: string;
  user_id: string;
  segment_id: string;
  source_ref: string;
  reader_slug: string;
  edition: string;
  page: number;
  segment_anchor: string | null;
  created_at: string;
}

export interface ReadingProgressRow {
  user_id: string;
  reader_slug: string;
  edition: string;
  page: number;
  segment_id: string | null;
  updated_at: string;
}

const BOOKMARK_COLUMNS =
  "id, user_id, segment_id, source_ref, reader_slug, edition, page, segment_anchor, created_at";

export async function listBookmarks(userId: string): Promise<BookmarkRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select(BOOKMARK_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BookmarkRow[];
}

export async function listReadingProgress(userId: string): Promise<ReadingProgressRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reading_progress")
    .select("user_id, reader_slug, edition, page, segment_id, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReadingProgressRow[];
}

export async function getBookmark(
  userId: string,
  segmentId: string,
  edition: string
): Promise<BookmarkRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select(BOOKMARK_COLUMNS)
    .eq("user_id", userId)
    .eq("segment_id", segmentId)
    .eq("edition", edition)
    .maybeSingle();
  if (error) throw error;
  return (data as BookmarkRow | null) ?? null;
}

export async function addBookmark(input: {
  userId: string;
  segmentId: string;
  sourceRef: string;
  readerSlug: string;
  edition: string;
  page: number;
  segmentAnchor?: string | null;
}): Promise<BookmarkRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: input.userId,
      segment_id: input.segmentId,
      source_ref: input.sourceRef,
      reader_slug: input.readerSlug,
      edition: input.edition,
      page: input.page,
      segment_anchor: input.segmentAnchor ?? null,
    })
    .select(BOOKMARK_COLUMNS)
    .single();
  if (error) throw error;
  return data as BookmarkRow;
}

export async function removeBookmark(
  userId: string,
  segmentId: string,
  edition: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("segment_id", segmentId)
    .eq("edition", edition);
  if (error) throw error;
}

export async function upsertReadingProgress(input: {
  userId: string;
  readerSlug: string;
  edition: string;
  page: number;
  segmentId?: string | null;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: input.userId,
      reader_slug: input.readerSlug,
      edition: input.edition,
      page: input.page,
      segment_id: input.segmentId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,reader_slug,edition" }
  );
  if (error) throw error;
}
