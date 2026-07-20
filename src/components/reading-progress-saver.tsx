"use client";

import { useEffect } from "react";
import { saveReadingProgressAction } from "@/lib/account/actions";

/**
 * Fire-and-forget reading-progress persistence for signed-in users. Renders
 * nothing. Anonymous users are ignored by the action itself. Failures are
 * swallowed so that persistence can never break public reading.
 */
export default function ReadingProgressSaver({
  signedIn,
  readerSlug,
  edition,
  page,
}: {
  signedIn: boolean;
  readerSlug: string;
  edition: string;
  page: number;
}) {
  useEffect(() => {
    if (!signedIn) return;
    void saveReadingProgressAction({ readerSlug, edition, page }).catch(() => undefined);
  }, [signedIn, readerSlug, edition, page]);
  return null;
}
