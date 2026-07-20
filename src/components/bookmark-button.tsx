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
 * - If the user is not signed in, a localized sign-in invitation is shown
 *   instead of attempting to persist anything.
 * - Any Server Action failure (Supabase outage, RLS rejection, network error)
 *   is reported via a localized inline message; the reader stays fully usable
 *   and never crashes.
 */
export default function BookmarkButton({
  segmentId,
  sourceRef,
  readerSlug,
  edition,
  page,
  segmentAnchor,
  initialBookmarked,
  signedIn,
}: {
  segmentId: string;
  sourceRef: string;
  readerSlug: string;
  edition: string;
  page: number;
  segmentAnchor?: string | null;
  initialBookmarked: boolean;
  signedIn: boolean;
}) {
  const ui = useUi();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    // Anonymous readers continue reading normally; only a gentle, localized
    // invitation to sign in is shown on persistence controls.
    return (
      <span className="text-xs text-ink-faint">
        <Link href="/auth/sign-in" className="link-dhamma">
          {ui.account.persistenceSignInPrompt}
        </Link>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        aria-pressed={bookmarked}
        onClick={() => {
          setError(false);
          startTransition(async () => {
            const result = await toggleBookmarkAction({
              segmentId,
              sourceRef,
              readerSlug,
              edition,
              page,
              segmentAnchor,
            });
            if (result.ok) setBookmarked(result.bookmarked);
            else if ("signedOut" in result && result.signedOut) setError(true);
            else setError(true);
          });
        }}
        className="text-xs link-dhamma disabled:opacity-60"
      >
        {bookmarked ? `★ ${ui.account.bookmarkAdded}` : `☆ ${ui.account.bookmarkAddLabel}`}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-red-700">
          {ui.account.bookmarkError}
        </span>
      ) : null}
    </div>
  );
}
