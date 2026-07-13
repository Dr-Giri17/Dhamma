import Link from "next/link";
import { getCorpus } from "@/lib/server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";
import { POST_CANONICAL_CATALOG, TIPITAKA_CATALOG } from "@/lib/corpus/catalog";
import { translationLanguages } from "@/lib/corpus/translations";
import type { CatalogNode } from "@/lib/corpus/types";
import { fullCorpusEditions, fullCorpusSummary } from "@/lib/corpus/full-corpus";

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
  const full = fullCorpusSummary();
  const fullEditions = fullCorpusEditions();
  const canonicalVolumes = fullEditions.filter((edition) => edition.canonicalStatus === "canonical");
  const traditionDependentVolumes = fullEditions.filter((edition) => edition.canonicalStatus === "tradition-dependent");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl">{ui.tipitaka.title}</h1>
        <p className="text-ink-soft">Machine-verified coverage of the pinned VRI Mūla navigation. This is not a universal claim about every traditional definition of the Tipiṭaka.</p>
        <p className="font-medium text-accent-strong">All expected VRI Mūla sources are adjudicated; tradition-dependent works are labelled separately.</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge active>{t.structure}</Badge>
          <Badge active>Pāli canonical volumes: {full.paliCanonicalWorks}</Badge>
          <Badge active>Pāli tradition-dependent volumes: {full.paliTraditionDependentWorks}</Badge>
          <Badge active>Pāli post-canonical volumes: {full.paliPostCanonicalWorks}</Badge>
          <Badge active>English translated works: {full.englishTranslatedWorks.toLocaleString()}</Badge>
          <Badge active>Russian translated works: {full.russianTranslatedWorks.toLocaleString()}</Badge>
          <Badge active>Total Pāli segments: {full.totalSegments.toLocaleString()}</Badge>
          <Badge>ID: 0 imported editions</Badge>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        {TIPITAKA_CATALOG.map((basket) => (
          <Basket key={basket.id} node={basket} corpus={corpus} structureOnly={t.structureOnly} exactCoverage={t.exactCoverage} fullPali={full.fullVriMulaNavigationImported} />
        ))}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">VRI Pāli Mūla scope</h2>
          <p className="text-sm text-ink-soft">Volumes are loaded in bounded pages; corpus text is not included in the client JavaScript bundle.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(["vinaya", "sutta", "abhidhamma"] as const).map((pitaka) => (
            <div key={pitaka} className="card-dhamma space-y-3">
              <h3 className="font-serif text-xl capitalize">{pitaka} Piṭaka</h3>
              <ul className="space-y-2 text-sm">
                {canonicalVolumes.filter((edition) => edition.pitaka === pitaka).map((edition) => {
                  const slug = edition.sourceFile.split("/").pop()?.replace(/\.(?:mul|nrf)\.xml$/i, "") ?? edition.textId;
                  return (
                    <li key={edition.textId}>
                      <Link href={`/reader/${slug}`} className="link-dhamma font-medium">{edition.title}</Link>
                      <span className="block text-xs text-ink-faint">{edition.segmentCount.toLocaleString()} segments · {edition.collection}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Tradition-dependent classification</h2>
        <p className="text-sm text-ink-soft">These works occur in the pinned VRI Mūla navigation, but their canonical status differs between traditional editions and classification systems. They are excluded from canonical-only search.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {traditionDependentVolumes.map((edition) => {
            const slug = edition.sourceFile.split("/").pop()?.replace(/\.(?:mul|nrf)\.xml$/i, "") ?? edition.textId;
            return (
              <div key={edition.textId} className="card-dhamma space-y-2">
                <Link href={`/reader/${slug}`} className="link-dhamma font-serif text-xl">{edition.title}</Link>
                <p className="text-xs text-ink-faint">{edition.segmentCount.toLocaleString()} Pāli segments · VRI Mūla navigation · tradition-dependent</p>
              </div>
            );
          })}
        </div>
      </section>

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
            <p className="text-sm text-ink-soft">The complete two-volume VRI Pāli Visuddhimagga source is imported locally in paginated form.</p>
            <p className="text-sm text-ink-faint">{ui.visuddhimagga.notBuddhaQuote}</p>
            <Badge active>{full.visuddhimagga.segmentCount.toLocaleString()} Pāli segments</Badge>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/reader/visuddhimagga" className="link-dhamma">
                {ui.visuddhimagga.title} →
              </Link>
              {work.sourceUrl ? (
                <a href={work.sourceUrl} className="link-dhamma">
                  VRI Pāli source ↗
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
  fullPali,
}: {
  node: CatalogNode;
  corpus: ReturnType<typeof getCorpus>;
  structureOnly: string;
  exactCoverage: string;
  fullPali: boolean;
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
                <Badge active={texts.length > 0 || fullPali}>{texts.length > 0 ? exactCoverage : fullPali ? "full Pāli text" : structureOnly}</Badge>
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
