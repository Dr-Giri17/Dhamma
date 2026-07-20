/**
 * Pure helpers for building deep-link URLs from persisted bookmark / progress
 * rows. Kept dependency-free so they can be unit-tested in isolation.
 */

export interface BookmarkLinkInput {
  reader_slug: string;
  edition: string;
  page: number;
  segment_id: string;
  segment_anchor: string | null;
}

/**
 * Build a reader deep-link URL that opens the exact page and scrolls to the
 * saved segment anchor.
 *
 * The reader emits these in-page ids:
 *   - Pali / static-text column: `id={segmentUid}` (the segment UID itself).
 *   - English translation column: `id={`en-${segmentUid}`}`.
 *
 * `segment_anchor` is stored at bookmark time to match exactly (e.g.
 * `dn1:1.1` for Pali, `en-dn1:1.1` for English). For legacy rows written
 * before `segment_anchor` existed we synthesize an anchor that matches the
 * DOM id of the column the bookmark was on, using the stored `segment_id`
 * (which for legacy rows IS the segment UID):
 *   - edition "en" -> `en-${segment_id}` (English column DOM id).
 *   - any other edition -> `${segment_id}` (Pali / static column DOM id).
 *
 * We deliberately do NOT synthesize a `seg-` prefix: no reader column ever
 * emits an id of that shape, so it would never scroll.
 */
export function bookmarkHref(input: BookmarkLinkInput): string {
  const slug = encodeURIComponent(input.reader_slug);
  const anchor = encodeURIComponent(legacyAnchor(input));
  return `/reader/${slug}?edition=${input.edition}&page=${input.page}#${anchor}`;
}

/**
 * Resolve the in-page anchor, including the legacy fallback. Exported so the
 * legacy behavior can be unit-tested directly.
 */
export function legacyAnchor(input: BookmarkLinkInput): string {
  if (input.segment_anchor) return input.segment_anchor;
  // Legacy rows: rebuild the DOM id the reader emits for this edition.
  return input.edition === "en" ? `en-${input.segment_id}` : input.segment_id;
}

export interface ProgressLinkInput {
  reader_slug: string;
  edition: string;
  page: number;
  segment_id: string | null;
}

export function progressHref(input: ProgressLinkInput): string {
  const slug = encodeURIComponent(input.reader_slug);
  const base = `/reader/${slug}?edition=${input.edition}&page=${input.page}`;
  return input.segment_id ? `${base}#${encodeURIComponent(input.segment_id)}` : base;
}
