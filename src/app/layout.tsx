import type { Metadata } from "next";
import LanguageSwitcher from "@/components/language-switcher";
import AccountNav from "@/components/account-nav";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getUi } from "@/lib/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dhamma",
  description: "A source-grounded Theravada Buddhist teaching companion.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await getRequestLanguage();
  const ui = getUi(language);
  // Supabase failure must not break scripture reading: if getAuthenticatedUser
  // throws (e.g. Supabase misconfigured or unreachable), treat as signed-out.
  const { user } = await getAuthenticatedUser().catch(() => ({ user: null }));
  const navItems = [
    { href: "/", label: ui.nav.home },
    { href: "/library", label: ui.nav.library },
    { href: "/reader", label: ui.nav.read },
    { href: "/search", label: ui.nav.search },
    { href: "/ask", label: ui.nav.ask },
    { href: "/voice", label: ui.nav.voice },
    { href: "/wisdom", label: ui.nav.wisdom },
    { href: "/terms", label: ui.nav.terms },
  ];

  return (
    <html lang={language}>
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-line bg-surface/90 backdrop-blur sticky top-0 z-10">
            <nav className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="/" className="font-serif text-xl tracking-wide text-ink">
                Dhamma
              </a>
              <span className="text-ink-faint text-sm hidden sm:inline">
                {ui.subtitle}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {navItems.map((n) => (
                  <a key={n.href} href={n.href} className="link-dhamma">
                    {n.label}
                  </a>
                ))}
                <AccountNav
                  signedIn={Boolean(user)}
                  signInLabel={ui.nav.signIn}
                  accountLabel={ui.nav.account}
                />
                <LanguageSwitcher
                  currentLanguage={language}
                  label={ui.language.label}
                />
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-4xl w-full min-w-0 mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-line text-xs text-ink-faint py-6">
            <div className="max-w-4xl mx-auto px-4 space-y-1">
              <p>{ui.footer.corpus}</p>
              <p>{ui.footer.disclaimer}</p>
              <p><a href="/sources" className="link-dhamma">Источники и лицензии · Sources and licenses</a></p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
