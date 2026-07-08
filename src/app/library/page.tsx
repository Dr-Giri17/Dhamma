import Link from "next/link";
import { getCorpus } from "@/lib/server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";
import { translationLanguages } from "@/lib/corpus/translations";

export default async function LibraryPage() {
  const language = await getRequestLanguage();
  const ui = getUi(language);
  const corpus = await getCorpus();
  const availableTexts = corpus.texts.map((text) => {
    const segments = corpus.segments.filter((segment) => segment.textId === text.id);
    return { text, segments, languages: translationLanguages(segments) };
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl">{ui.tipitaka.title}</h1>
        <p className="text-ink-soft">{ui.tipitaka.partialNote}</p>
        <p className="font-medium text-accent-strong">{ui.tipitaka.fullCanonMissing}</p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Basket title={ui.tipitaka.vinaya} description={ui.tipitaka.vinayaDesc} unavailable={ui.tipitaka.unavailable} />
        <section className="card-dhamma">
          <h2 className="font-serif text-xl">{ui.tipitaka.sutta}</h2>
          <p className="text-sm text-ink-soft mt-1">{ui.tipitaka.suttaDesc}</p>
          <p className="text-xs uppercase tracking-wide text-accent-strong mt-4">
            {ui.tipitaka.currentCoverage}
          </p>
          <ul className="space-y-4 mt-3">
            {availableTexts.map(({ text, segments, languages }) => (
              <li key={text.id}>
                <Link href={`/reader/${text.slug}`} className="link-dhamma font-medium">
                  {text.title}
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-1 text-[11px]">
                  <Badge active={segments.some((segment) => Boolean(segment.rootText))}>Pāli</Badge>
                  <Badge active={languages.has("en")}>EN</Badge>
                  <Badge active={languages.has("ru")}>RU</Badge>
                  <Badge active={languages.has("id")}>ID</Badge>
                  {language !== "en" && !languages.has(language) && languages.has("en") ? (
                    <Badge active>{ui.tipitaka.fallbackEnglish}</Badge>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <Basket title={ui.tipitaka.abhidhamma} description={ui.tipitaka.abhidhammaDesc} unavailable={ui.tipitaka.unavailable} />
      </div>

      <section className="card-dhamma border-dashed border-accent/60 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-xl">{ui.visuddhimagga.title}</h2>
          <span className="text-xs uppercase tracking-wide text-accent-strong">
            {ui.visuddhimagga.classification}
          </span>
        </div>
        <p className="text-sm text-ink-soft">{ui.visuddhimagga.status}</p>
        <p className="text-sm text-ink-faint">{ui.visuddhimagga.notBuddhaQuote}</p>
        <Link href="/reader/visuddhimagga" className="link-dhamma text-sm inline-block">
          {ui.visuddhimagga.title} →
        </Link>
      </section>
    </div>
  );
}

function Basket({ title, description, unavailable }: { title: string; description: string; unavailable: string }) {
  return (
    <section className="card-dhamma opacity-75">
      <h2 className="font-serif text-xl">{title}</h2>
      <p className="text-sm text-ink-faint mt-1">{description}</p>
      <p className="text-xs uppercase tracking-wide text-ink-faint mt-4">{unavailable}</p>
    </section>
  );
}

function Badge({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 ${active ? "border-accent/60 text-accent-strong" : "border-line text-ink-faint opacity-50"}`}>
      {children}
    </span>
  );
}
