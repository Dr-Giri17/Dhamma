import Link from "next/link";
import { getCorpus } from "@/lib/server";
import { getDailyWisdom } from "@/lib/corpus/wisdom";
import { UI } from "@/lib/ui";

export default async function HomePage() {
  const corpus = await getCorpus();
  let wisdom = null;
  try {
    wisdom = getDailyWisdom(corpus, { language: "en" });
  } catch {
    wisdom = null;
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-8">
        <h1 className="font-serif text-4xl text-ink mb-3">{UI.home.hero}</h1>
        <p className="prose-dhamma mx-auto text-ink-soft">
          {UI.home.tagline}
        </p>
      </section>

      {/* Daily Wisdom — prominent, near top */}
      {wisdom ? (
        <section className="card-dhamma bg-ivory-deep/50">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-serif text-xl">{UI.wisdom.title}</h2>
            <Link href="/wisdom" className="text-sm link-dhamma">
              {UI.wisdom.seeMore}
            </Link>
          </div>
          <blockquote className="prose-dhamma italic text-ink mb-2">
            {wisdom.segment.translationText}
          </blockquote>
          <p className="text-sm text-gold">
            — {wisdom.segment.sourceRef} · {wisdom.segment.license}
          </p>
          <p className="text-sm text-ink-soft mt-2">
            {wisdom.practicePrompt}
          </p>
        </section>
      ) : null}

      {/* Tipiṭaka / Canon section */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-ink">{UI.tipitaka.title}</h2>
        <p className="text-sm text-ink-soft">{UI.tipitaka.partialNote}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Vinaya */}
          <div className="card-dhamma opacity-70">
            <h3 className="font-serif text-lg mb-1">{UI.tipitaka.vinaya}</h3>
            <p className="text-sm text-ink-faint">{UI.tipitaka.vinayaDesc}</p>
          </div>
          {/* Sutta */}
          <div className="card-dhamma">
            <h3 className="font-serif text-lg mb-1">{UI.tipitaka.sutta}</h3>
            <p className="text-sm text-ink-soft mb-2">{UI.tipitaka.suttaDesc}</p>
            <ul className="text-xs text-ink-soft space-y-1">
              <li>
                <Link href="/reader/dhammapada" className="link-dhamma">
                  Дхаммапада
                </Link>{" "}
                — {UI.tipitaka.available}
              </li>
              <li>
                <Link href="/search?q=MN%2010" className="link-dhamma">
                  MN 10
                </Link>
              </li>
              <li>
                <Link href="/search?q=MN%20118" className="link-dhamma">
                  MN 118
                </Link>
              </li>
              <li>
                <Link href="/search?q=DN%2031" className="link-dhamma">
                  DN 31
                </Link>
              </li>
              <li>
                <Link href="/search?q=AN%203.65" className="link-dhamma">
                  AN 3.65
                </Link>
              </li>
              <li>
                <Link href="/search?q=SN%2056.11" className="link-dhamma">
                  SN 56.11
                </Link>
              </li>
              <li>
                <Link href="/search?q=Snp%201.8" className="link-dhamma">
                  Snp 1.8
                </Link>
              </li>
              <li>
                <Link href="/search?q=Snp%202.1" className="link-dhamma">
                  Snp 2.1
                </Link>
              </li>
              <li>
                <Link href="/search?q=Snp%202.4" className="link-dhamma">
                  Snp 2.4
                </Link>
              </li>
            </ul>
          </div>
          {/* Abhidhamma */}
          <div className="card-dhamma opacity-70">
            <h3 className="font-serif text-lg mb-1">{UI.tipitaka.abhidhamma}</h3>
            <p className="text-sm text-ink-faint">{UI.tipitaka.abhidhammaDesc}</p>
          </div>
        </div>
      </section>

      {/* Visuddhimagga — planned / source-required */}
      <section className="card-dhamma border-dashed border-gold/30">
        <h2 className="font-serif text-lg mb-1">{UI.visuddhimagga.title}</h2>
        <p className="text-sm text-ink-faint">{UI.visuddhimagga.status}</p>
      </section>

      {/* Action cards */}
      <section className="grid sm:grid-cols-2 gap-4">
        <Link href="/search" className="card-dhamma hover:border-gold transition-colors block">
          <h2 className="font-serif text-xl mb-1">{UI.home.cardSearch}</h2>
          <p className="text-sm text-ink-soft">
            {UI.home.cardSearchDesc.replace(/<paliTerm>/g, '<span className="pali">').replace(/<\/paliTerm>/g, "</span>")}
          </p>
        </Link>
        <Link href="/ask" className="card-dhamma hover:border-gold transition-colors block">
          <h2 className="font-serif text-xl mb-1">{UI.home.cardAsk}</h2>
          <p className="text-sm text-ink-soft">{UI.home.cardAskDesc}</p>
        </Link>
        <Link href="/reader/dhammapada" className="card-dhamma hover:border-gold transition-colors block">
          <h2 className="font-serif text-xl mb-1">{UI.home.cardDhammapada}</h2>
          <p className="text-sm text-ink-soft">{UI.home.cardDhammapadaDesc}</p>
        </Link>
        <Link href="/terms" className="card-dhamma hover:border-gold transition-colors block">
          <h2 className="font-serif text-xl mb-1">{UI.home.cardTerms}</h2>
          <p className="text-sm text-ink-soft">{UI.home.cardTermsDesc}</p>
        </Link>
      </section>
    </div>
  );
}
