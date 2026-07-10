import Link from "next/link";
import { getCorpus } from "@/lib/server";
import { getDailyWisdom } from "@/lib/corpus/wisdom";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";

export default async function HomePage() {
  const language = await getRequestLanguage();
  const ui = getUi(language);
  const corpus = await getCorpus();
  let wisdom = null;
  try {
    wisdom = getDailyWisdom(corpus, { language });
  } catch {
    wisdom = null;
  }

  return (
    <div className="space-y-10">
      <section className="text-center py-8">
        <h1 className="font-serif text-4xl text-ink mb-3">{ui.home.hero}</h1>
        <p className="prose-dhamma mx-auto text-ink-soft">
          {ui.home.tagline}
        </p>
      </section>

      {wisdom ? (
        <section className="card-dhamma bg-accent-soft/45">
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <h2 className="font-serif text-xl">{ui.wisdom.title}</h2>
            <Link href="/wisdom" className="text-sm link-dhamma">
              {ui.wisdom.seeMore}
            </Link>
          </div>
          <p className="text-xs uppercase tracking-wide text-accent-strong mb-2">
            {wisdom.disclaimer}
          </p>
          <blockquote className="prose-dhamma text-ink mb-2">
            {wisdom.displayText}
          </blockquote>
          <p className="text-sm text-accent-strong">
            {wisdom.item.sourceRef} · {wisdom.segment.license}
          </p>
          <p className="text-sm text-ink-soft mt-2">
            {wisdom.practicePrompt}
          </p>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl text-ink">{ui.tipitaka.title}</h2>
          <Link href="/library" className="link-dhamma text-sm">{ui.nav.library} →</Link>
        </div>
        <p className="text-sm text-ink-soft">{ui.tipitaka.partialNote}</p>
        <p className="text-sm font-medium text-accent-strong">{ui.tipitaka.fullCanonMissing}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card-dhamma opacity-70">
            <h3 className="font-serif text-lg mb-1">{ui.tipitaka.vinaya}</h3>
            <p className="text-sm text-ink-faint">{ui.tipitaka.vinayaDesc}</p>
          </div>
          <div className="card-dhamma">
            <h3 className="font-serif text-lg mb-1">{ui.tipitaka.sutta}</h3>
            <p className="text-sm text-ink-soft mb-2">{ui.tipitaka.suttaDesc}</p>
            <ul className="text-xs text-ink-soft space-y-1">
              <li>
                <Link href="/reader/dhammapada" className="link-dhamma">
                  Dhammapada
                </Link>{" "}
                · {ui.tipitaka.available}
              </li>
              {["MN 10", "MN 118", "DN 31", "AN 3.65", "SN 56.11", "Snp 1.8", "Snp 2.1", "Snp 2.4"].map((ref) => (
                <li key={ref}>
                  <Link href={`/reader/${ref.toLowerCase().replace(/\s+/g, "")}`} className="link-dhamma">
                    {ref}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-dhamma opacity-70">
            <h3 className="font-serif text-lg mb-1">{ui.tipitaka.abhidhamma}</h3>
            <p className="text-sm text-ink-faint">{ui.tipitaka.abhidhammaDesc}</p>
          </div>
        </div>
      </section>

      <section className="card-dhamma border-dashed border-accent/60">
        <h2 className="font-serif text-lg mb-1">
          <Link href="/reader/visuddhimagga" className="link-dhamma">{ui.visuddhimagga.title}</Link>
        </h2>
        <p className="text-sm text-ink-faint">{ui.visuddhimagga.status}</p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Link href="/search" className="card-dhamma hover:border-accent transition-colors block">
          <h2 className="font-serif text-xl mb-1">{ui.home.cardSearch}</h2>
          <p className="text-sm text-ink-soft">{ui.home.cardSearchDesc}</p>
        </Link>
        <Link href="/ask" className="card-dhamma hover:border-accent transition-colors block">
          <h2 className="font-serif text-xl mb-1">{ui.home.cardAsk}</h2>
          <p className="text-sm text-ink-soft">{ui.home.cardAskDesc}</p>
        </Link>
        <Link href="/reader/dhammapada" className="card-dhamma hover:border-accent transition-colors block">
          <h2 className="font-serif text-xl mb-1">{ui.home.cardDhammapada}</h2>
          <p className="text-sm text-ink-soft">{ui.home.cardDhammapadaDesc}</p>
        </Link>
        <Link href="/terms" className="card-dhamma hover:border-accent transition-colors block">
          <h2 className="font-serif text-xl mb-1">{ui.home.cardTerms}</h2>
          <p className="text-sm text-ink-soft">{ui.home.cardTermsDesc}</p>
        </Link>
      </section>
    </div>
  );
}
