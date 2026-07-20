-- Constrain account-table edition columns to the known set of scripture
-- editions so that malformed edition values cannot be persisted. This
-- complements the existing CHECK constraints on user_preferences.
--
-- Allowed editions: pli (Pali root), en (English), ru (Russian), id (Indonesian).

alter table public.bookmarks
  drop constraint if exists bookmarks_edition_check;
alter table public.bookmarks
  add constraint bookmarks_edition_check check (edition in ('pli', 'en', 'ru', 'id'));

alter table public.reading_progress
  drop constraint if exists reading_progress_edition_check;
alter table public.reading_progress
  add constraint reading_progress_edition_check check (edition in ('pli', 'en', 'ru', 'id'));
