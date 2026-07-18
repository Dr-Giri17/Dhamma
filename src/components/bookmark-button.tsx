"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleBookmarkAction } from "@/lib/account/actions";
import { useUi } from "@/lib/i18n/client";

/**
 * Per-segment bookmark toggle.
 *
 * - Initial server-rendered state is passed in (true if this segment is
 *   already bookmarked by the current user, false otherwise).
 * - If the user is not signed in, clicking shows a localized sign-in
 *   invitation instead of persisting anything.
 * - Supabase failure degrades gracefully: the button stays clickable but the
 *   error state surfaces a small inline message.
 */
export default function BookmarkButton({
  segmentId,
  sourceRef,
  readerSlug,
  edition,
  initialBookmarked,
  signedIn,
}: {
  segmentId: string;
  sourceRef: string;
  readerSlug: string;
  edition: string;
  initialBookmarked: boolean;
  signedIn: boolean;
}) {
  const ui = useUi();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    // Anonymous users continue reading normally; only a gentle, localized
    // invitation to sign in is shown when they hover a persistence control.
    return (
      <span className="text-xs text-ink-faint">
        <Link href="/auth/sign-in" className="link-dhamma">
          {ui.account.persistenceSignInPrompt}
        </Link>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={bookmarked}
      onClick={() => {
        setError(false);
        startTransition(async () => {
          const result = await toggleBookmarkAction({ segmentId, sourceRef, readerSlug, edition });
          if (result.ok) setBookmarked(result.bookmarked);
          else setError(true);
        });
      }}
      className="text-xs link-dhamma disabled:opacity-60"
    >
      {bookmarked ? `★ ${ui.account.bookmarkAdded}` : `☆ ${ui.account.bookmarkAddLabel}`}
      {error ? <span className="ml-2 text-red-700">·</span> : null}
    </button>
  );
}
