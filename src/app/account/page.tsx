import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";
import { listBookmarks, listReadingProgress } from "@/lib/account/queries";
import SignOutButton from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const language = await getRequestLanguage();
  const ui = getUi(language);
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="font-serif text-3xl">{ui.account.title}</h1>
        <p className="text-ink-soft">{ui.account.notSignedIn}</p>
        <p className="text-ink-soft">{ui.account.signInPrompt}</p>
        <div className="flex gap-3">
          <Link href="/auth/sign-in" className="btn-dhamma">
            {ui.nav.signIn}
          </Link>
          <Link href="/auth/sign-up" className="btn-dhamma">
            {ui.auth.signUpButton}
          </Link>
        </div>
        <p className="text-sm">
          <Link href="/reader" className="link-dhamma">
            ← {ui.auth.backToReader}
          </Link>
        </p>
      </div>
    );
  }

  // Supabase failure must not break the account shell: if persistence tables
  // are unreachable, show an empty-but-rendered account rather than throwing.
  const [bookmarks, progress] = await Promise.all([
    listBookmarks(user.id).catch(() => []),
    listReadingProgress(user.id).catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl">{ui.account.title}</h1>
        <p className="text-sm text-ink-soft">{ui.account.description}</p>
        <p className="text-sm text-ink-faint">
          {ui.account.signedInAs}: <span className="font-mono">{user.email}</span>
        </p>
        <SignOutButton label={ui.auth.signOutButton} />
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">{ui.account.bookmarksTitle}</h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-ink-soft">{ui.account.noBookmarks}</p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((b) => (
              <li key={b.id} className="card-dhamma text-sm space-y-1">
                <Link
                  href={`/reader/${encodeURIComponent(b.reader_slug)}?edition=${b.edition}&page=1#seg-${b.segment_id}`}
                  className="link-dhamma font-mono"
                >
                  {b.source_ref}
                </Link>
                <p className="text-xs text-ink-faint">
                  {b.edition} · {new Date(b.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">{ui.account.progressTitle}</h2>
        {progress.length === 0 ? (
          <p className="text-sm text-ink-soft">{ui.account.noProgress}</p>
        ) : (
          <ul className="space-y-2">
            {progress.map((p) => (
              <li key={`${p.reader_slug}-${p.edition}`} className="card-dhamma text-sm space-y-1">
                <Link
                  href={`/reader/${encodeURIComponent(p.reader_slug)}?edition=${p.edition}&page=${p.page}`}
                  className="link-dhamma font-mono"
                >
                  {p.reader_slug} · {p.edition}
                </Link>
                <p className="text-xs text-ink-faint">
                  {ui.account.pageLabel} {p.page}
                  {p.segment_id ? ` · ${p.segment_id}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
