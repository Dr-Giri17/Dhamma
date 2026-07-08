import type { Metadata } from "next";
import { UI } from "@/lib/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Дхамма — источниковедческое приложение к Тхераваде",
  description:
    "Читайте, ищите и размышляйте над текстами Тхеравады с источникамиедческими пояснениями и цитатами.",
};

const navItems = [
  { href: "/", label: UI.nav.home },
  { href: "/reader", label: UI.nav.read },
  { href: "/search", label: UI.nav.search },
  { href: "/ask", label: UI.nav.ask },
  { href: "/wisdom", label: UI.nav.wisdom },
  { href: "/terms", label: UI.nav.terms },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-gold/20 bg-ivory-soft/80 backdrop-blur sticky top-0 z-10">
            <nav className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="/" className="font-serif text-xl tracking-wide text-ink">
                Дхамма
              </a>
              <span className="text-ink-faint text-sm hidden sm:inline">
                {UI.subtitle}
              </span>
              <div className="ml-auto flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {navItems.map((n) => (
                  <a key={n.href} href={n.href} className="link-dhamma">
                    {n.label}
                  </a>
                ))}
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-gold/20 text-xs text-ink-faint py-6">
            <div className="max-w-4xl mx-auto px-4 space-y-1">
              <p>{UI.footer.corpus}</p>
              <p>{UI.footer.disclaimer}</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
