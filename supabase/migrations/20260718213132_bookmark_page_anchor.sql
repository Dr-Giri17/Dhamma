-- Forward-only migration: add page and segment anchor to bookmarks so a
-- saved bookmark can deep-link straight to the exact page and segment the
-- reader was viewing.
--
-- Additive only: nullable columns with safe defaults, no data loss, no DROP.
-- Existing bookmarks back-fill to page 1 and a NULL anchor (resolved from
-- segment_id at read time by the /account page for legacy rows).

alter table public.bookmarks
  add column if not exists page integer not null default 1 check (page > 0);

alter table public.bookmarks
  add column if not exists segment_anchor text;

-- Index for the /account listing by user + most-recent bookmark.
create index if not exists bookmarks_user_page_idx
  on public.bookmarks(user_id, page);

comment on column public.bookmarks.page is 'Reader page number (1-based) at which the bookmark was created.';
comment on column public.bookmarks.segment_anchor is 'In-page anchor (segment UID) to scroll to; e.g. dn1:1.1. May be NULL for legacy rows.';
