import Link from "next/link";
import { getCorpus } from "@/lib/server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";
import { POST_CANONICAL_CATALOG, TIPITAKA_CATALOG } from "@/lib/corpus/catalog";
import { translationLanguages } from "@/lib/corpus/translations";
import type { CatalogNode } from "@/lib/corpus/types";

const availabilityCopy = {
  en: {
    structure: "catalog structure",
    local: "local text coverage",
    structureOnly: "structure only — no local text",
    sourceGated: "source-gated — metadata link only",
    exactCoverage: "Exact imported coverage",
  },
  ru: {
    structure: "структура каталога",
    local: "локальное покрытие",
    structureOnly: "только структура — локального текста нет",
    sourceGated: "доступ только к источнику — локального текста нет",
    exactCoverage: "Точное импортированное покрытие",
  },
  id: {
    structure: "struktur katalog",
    local: "cakupan teks lokal",
    structureOnly: "hanya struktur — tidak ada teks lokal",
    sourceGated: "dibatasi sumber — hanya tautan metadata",
    exactCoverage: "Cakupan impor yang tepat",
  },
} as const;

export default async function LibraryPage() {
  const language = await getRequestLanguage();
  const ui = getUi(language);
  const corpus = getCorpus();
  const t = availabilityCopy[language];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl">{ui.tipitaka.title}</h1>
        <p className="text-ink-soft">{ui.tipitaka.partialNote}</p>
        <p className="font-medium text-accent-strong">{ui.tipitaka.fullCanonMissing}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge active>{t.structure}</Badge>
          <Badge active>{t.local}: 9 texts</Badge>
          <Badge>ID: 0 imported editions</Badge>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        {TIPITAKA_CATALOG.map((basket) => (
          <Basket key={basket.id} node={basket} corpus={corpus} structureOnly={t.structureOnly} exactCoverage={t.exactCoverage} />
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Post-canonical Theravāda literature</h2>
        {POST_CANONICAL_CATALOG.map((work) => (
          <div key={work.id} className="card-dhamma border-dashed border-accent/60 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-xl">{work.title}</h3>
              <span className="text-xs uppercase tracking-wide text-accent-strong">
                {ui.visuddhimagga.classification}
              </span>
            </div>
            <p className="text-sm text-ink-soft">{ui.visuddhimagga.status}</p>
            <p className="text-sm text-ink-faint">{ui.visuddhimagga.notBuddhaQuote}</p>
            <Badge>{t.sourceGated}</Badge>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/reader/visuddhimagga" className="link-dhamma">
                {ui.visuddhimagga.title} →
              </Link>
              {work.sourceUrl ? (
                <a href={work.sourceUrl} className="link-dhamma">
                  BPS metadata ↗
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Basket({
  node,
  corpus,
  structureOnly,
  exactCoverage,
}: {
  node: CatalogNode;
  corpus: ReturnType<typeof getCorpus>;
  structureOnly: string;
  exactCoverage: string;
}) {
  return (
    <section className="card-dhamma space-y-4">
      <div>
        <h2 className="font-serif text-xl">{node.title}</h2>
        <p className="text-xs uppercase tracking-wide text-ink-faint mt-1">
          {node.canonicalStatus}
        </p>
      </div>
      <ul className="space-y-4">
        {node.children?.map((collection) => {
          const work = corpus.works.find((candidate) => candidate.nikaya === collection.id);
          const texts = collection.id === "kn"
            ? corpus.texts.filter((text) => {
                const owner = corpus.works.find((candidate) => candidate.id === text.workId);
                return owner?.nikaya === "kn";
              })
            : work
              ? corpus.texts.filter((text) => text.workId === work.id)
              : [];
          return (
            <li key={collection.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{collection.title}</h3>
                <Badge active={texts.length > 0}>{texts.length > 0 ? exactCoverage : structureOnly}</Badge>
              </div>
              {texts.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {texts.map((text) => {
                    const segments = corpus.segments.filter((segment) => segment.textId === text.id);
                    const languages = translationLanguages(segments);
                    return (
                      <li key={text.id}>
                        <Link href={`/reader/${text.slug}`} className="link-dhamma text-sm font-medium">
                          {text.title}
                        </Link>
                        <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                          <Badge active={segments.some((segment) => Boolean(segment.rootText))}>Pāli</Badge>
                          <Badge active={languages.has("en")}>EN</Badge>
                          <Badge active={languages.has("ru")}>RU</Badge>
                          <Badge active={languages.has("id")}>ID</Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Badge({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${active ? "border-accent/60 text-accent-strong" : "border-line text-ink-faint"}`}>
      {children}
    </span>
  );
}
