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
 * saved segment anchor. The anchor is the exact in-page id emitted by the
 * reader (segmentUid for the Pali column, `en-<segmentUid>` for the English
 * column). For legacy rows without an anchor, fall back to a stable id derived
 * from segment_id.
 */
export function bookmarkHref(input: BookmarkLinkInput): string {
  const slug = encodeURIComponent(input.reader_slug);
  const anchor = encodeURIComponent(input.segment_anchor ?? `seg-${input.segment_id}`);
  return `/reader/${slug}?edition=${input.edition}&page=${input.page}#${anchor}`;
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
