import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dhamma — a source-grounded Theravāda companion",
  description:
    "Read, search, and reflect on Theravāda Buddhist texts with source-grounded, citation-first explanations.",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/reader", label: "Read" },
  { href: "/search", label: "Search" },
  { href: "/ask", label: "Ask Dhamma" },
  { href: "/wisdom", label: "Daily Wisdom" },
  { href: "/terms", label: "Terms" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-gold/20 bg-ivory-soft/80 backdrop-blur sticky top-0 z-10">
            <nav className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="/" className="font-serif text-xl tracking-wide text-ink">
                Dhamma
              </a>
              <span className="text-ink-faint text-sm hidden sm:inline">
                a source-grounded Theravāda companion
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
              <p>
                Corpus: Pāli roots (public domain) · Dhammapada English by F. Max
                Müller, 1881 (public domain) · Sutta translations via Sujato
                (CC0, SuttaCentral/Bilara) as the corpus grows.
              </p>
              <p>
                Dhamma App does not give medical, psychiatric, legal, or financial
                advice. For crisis or self-harm, contact local emergency services.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
