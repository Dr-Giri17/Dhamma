import Link from "next/link";
import { notFound } from "next/navigation";
import EditionControls from "@/components/edition-controls";
import { getCorpus } from "@/lib/server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";
import { manifestEdition } from "@/lib/corpus/manifest";
import {
  getBilaraEnglishReaderPage,
  getFullCorpusReaderPage,
  getTheravadaRussianReaderPage,
  type FullCorpusReaderPage,
  type TranslationReaderPage,
} from "@/lib/corpus/full-corpus";
import {
  selectTranslation,
  translationLanguages,
  type SelectedTranslation,
} from "@/lib/corpus/translations";
import {
  buildEditionHref,
  missingEditionMessage,
  normalizeTextEdition,
  type TextEditionLanguage,
} from "@/lib/reader/navigation";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ edition?: string; parallel?: string; page?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const language = await getRequestLanguage();
  const ui = getUi(language);
  const corpus = getCorpus();

  if (!slug || slug.length === 0) {
    const texts = corpus.texts.map((text) => {
      const segments = corpus.segments.filter((segment) => segment.textId === text.id);
      return {
        text,
        work: corpus.works.find((work) => work.id === text.workId)!,
        segments,
        languages: translationLanguages(segments),
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-serif text-3xl">{ui.reader.title}</h1>
          <Link href="/library" className="link-dhamma text-sm">
            {ui.reader.backToLibrary}
          </Link>
        </div>
        <p className="prose-dhamma text-ink-soft">{ui.reader.description}</p>
        <ul className="space-y-3">
          {texts.map(({ text, work, segments, languages }) => (
            <li key={text.id} className="card-dhamma">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-serif text-xl">
                  <Link href={`/reader/${text.slug}`} className="link-dhamma">
                    {text.title}
                  </Link>
                </h2>
                <span className="text-xs text-ink-faint uppercase tracking-wide">
                  {work.pitaka}{work.nikaya ? ` · ${work.nikaya}` : ""}
                </span>
              </div>
              <p className="text-sm text-ink-soft mt-1">
                {segments.length} {ui.reader.segments} · {work.translator || work.author || "-"}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                {segments.some((segment) => Boolean(segment.rootText)) ? <Badge>Pāli</Badge> : null}
                {languages.has("en") ? <Badge>EN</Badge> : null}
                {languages.has("ru") ? <Badge>RU</Badge> : null}
                {languages.has("id") ? <Badge>ID</Badge> : null}
                {language !== "en" && !languages.has(language) && languages.has("en") ? (
                  <Badge muted>{ui.reader.fallbackBadge}</Badge>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const requestedSlug = slug[0];
  if (requestedSlug === "__metadata-only-visuddhimagga") {
    return (
      <div className="space-y-4">
        <Link href="/library" className="link-dhamma text-sm">
          ← {ui.reader.backToLibrary}
        </Link>
        <h1 className="font-serif text-3xl">{ui.visuddhimagga.title}</h1>
        <p className="text-sm uppercase tracking-wide text-accent-strong">
          {ui.visuddhimagga.classification}
        </p>
        <div className="card-dhamma space-y-2 text-ink-soft">
          <p>{ui.visuddhimagga.status}</p>
          <p>{ui.visuddhimagga.notBuddhaQuote}</p>
          <a
            href="https://bps.lk/library-search-select.php?id=bp207h"
            className="link-dhamma text-sm"
          >
            Buddhist Publication Society metadata ↗
          </a>
          <p className="text-xs text-ink-faint">
            Ñāṇamoli/BPS edition: all rights reserved; text not stored locally.
          </p>
        </div>
      </div>
    );
  }

  const text = corpus.texts.find((candidate) => candidate.slug === requestedSlug);
  if (!text || requestedSlug === "visuddhimagga") {
    const pageNumber = Number(query.page ?? 1);
    const [fullPage, englishPage, russianPage] = await Promise.all([
      getFullCorpusReaderPage(requestedSlug, pageNumber),
      getBilaraEnglishReaderPage(requestedSlug, pageNumber),
      getTheravadaRussianReaderPage(requestedSlug, pageNumber),
    ]);
    if (!fullPage) notFound();
    const edition = query.edition === "en" || query.edition === "ru" ? query.edition : "pli";
    const parallel = query.parallel === "1" && edition !== "pli";
    return <FullPaliReader page={fullPage} englishPage={englishPage} russianPage={russianPage} edition={edition} parallel={parallel} backLabel={ui.reader.backToLibrary} />;
  }
  const work = corpus.works.find((candidate) => candidate.id === text.workId);
  const segments = corpus.segments
    .filter((segment) => segment.textId === text.id)
    .sort((a, b) => a.segmentOrder - b.segmentOrder);
  const languages = translationLanguages(segments);
  const requestedEdition = normalizeTextEdition(query.edition ?? language);
  const parallel = query.parallel === "1" && requestedEdition !== "pli";
  const availability: Record<TextEditionLanguage, boolean> = {
    pli: segments.some((segment) => Boolean(segment.rootText)),
    en: languages.has("en"),
    ru: languages.has("ru"),
    id: languages.has("id"),
  };
  const selected = segments.map((segment) => ({
    segment,
    selection:
      requestedEdition === "pli"
        ? ({ isFallback: false, requestedLanguageAvailable: Boolean(segment.rootText) } satisfies SelectedTranslation)
        : selectTranslation(segment, requestedEdition),
  }));
  const selectedCount = selected.filter(({ selection }) => selection.requestedLanguageAvailable).length;
  const fallbackCount = selected.filter(({ selection }) => selection.isFallback && selection.translation).length;
  const missingEdition = missingEditionMessage(language, requestedEdition);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/library" className="link-dhamma text-sm">
          ← {ui.reader.backToLibrary}
        </Link>
        <h1 className="font-serif text-3xl mt-3">{text.title}</h1>
        {text.titlePali ? <p className="pali text-lg">{text.titlePali}</p> : null}
        <p className="text-sm text-ink-faint mt-1">
          {work?.title} · {work?.license}
        </p>
      </div>

      <EditionControls
        slug={text.slug}
        interfaceLanguage={language}
        selectedEdition={requestedEdition}
        parallel={parallel}
        availability={availability}
      />

      <div className="card-dhamma bg-accent-soft/35 text-sm space-y-1">
        {requestedEdition === "en" && availability.en ? <p>{ui.reader.englishAvailable}</p> : null}
        {requestedEdition !== "pli" && selectedCount === 0 ? <p>{missingEdition}</p> : null}
        {requestedEdition !== "pli" && selectedCount > 0 && fallbackCount > 0 ? (
          <p>{ui.reader.partialTranslation}</p>
        ) : null}
        {fallbackCount > 0 ? <p>{ui.reader.fallbackEnglish}</p> : null}
        {requestedEdition === "pli" && !availability.pli ? <p>{missingEdition}</p> : null}
      </div>

      <article className="space-y-7">
        {selected.map(({ segment, selection }) => {
          const translationEdition = selection.translation
            ? manifestEdition(text.id, selection.translation.language)
            : undefined;
          const rootEdition = manifestEdition(text.id, "pli");
          return (
            <section key={segment.id} id={segment.segmentUid} className="card-dhamma prose-dhamma scroll-mt-6">
              {segment.sectionTitle ? (
                <h2 className="font-serif text-xl mb-2">{segment.sectionTitle}</h2>
              ) : null}
              {(requestedEdition === "pli" || parallel) && segment.rootText ? (
                <EditionBlock
                  label={ui.reader.paliText}
                  text={segment.rootText}
                  languageCode="pli"
                  badgeLabel="Pāli"
                  edition={rootEdition}
                  sourceLabel={ui.reader.sourceAndLicense}
                />
              ) : null}
              {requestedEdition !== "pli" && selection.translation ? (
                <EditionBlock
                  label={ui.reader.translation}
                  text={selection.translation.text}
                  languageCode={selection.translation.language}
                  badgeLabel={selection.isFallback ? ui.reader.fallbackBadge : selection.translation.language.toUpperCase()}
                  edition={translationEdition}
                  fallback={selection.isFallback}
                  sourceLabel={ui.reader.sourceAndLicense}
                />
              ) : null}
              <p className="text-xs text-accent-strong mt-3">
                <Link
                  href={buildEditionHref({
                    slug: text.slug,
                    edition: requestedEdition,
                    parallel,
                    segmentUid: segment.segmentUid,
                  })}
                  className="link-dhamma"
                >
                  {segment.sourceRef} · {segment.segmentUid}
                </Link>
                {segment.verseNumber ? ` · ${ui.reader.verse} ${segment.verseNumber}` : ""}
              </p>
            </section>
          );
        })}
      </article>
    </div>
  );
}

function FullPaliReader({
  page,
  englishPage,
  russianPage,
  edition,
  parallel,
  backLabel,
}: {
  page: FullCorpusReaderPage;
  englishPage?: TranslationReaderPage;
  russianPage?: TranslationReaderPage;
  edition: "pli" | "en" | "ru";
  parallel: boolean;
  backLabel: string;
}) {
  const selectedTranslation = edition === "en" ? englishPage : edition === "ru" ? russianPage : undefined;
  const selectedPage = selectedTranslation?.page ?? page.page;
  const selectedPageCount = selectedTranslation?.pageCount ?? page.pageCount;
  const pageHref = (value: number) => `/reader/${encodeURIComponent(page.slug)}?page=${value}&edition=${edition}${parallel ? "&parallel=1" : ""}`;
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/library" className="link-dhamma text-sm">← {backLabel}</Link>
        <h1 className="font-serif text-3xl">{page.title}</h1>
        <p className="text-sm uppercase tracking-wide text-accent-strong">
          {page.canonicalStatus === "post-canonical" ? "Post-canonical Pāli text" : `${page.pitaka} · ${page.collection}`}
        </p>
        <div className="card-dhamma bg-accent-soft/35 text-sm space-y-1">
          <p>{page.totalSegments.toLocaleString()} Pāli segments · page {page.page} of {page.pageCount}</p>
          <p>Source: {page.attribution}</p>
          <p>{page.licenseName}</p>
          <a href={page.sourceUrl} className="link-dhamma break-all">{page.sourceFile} ↗</a>
          <p className="font-mono text-xs">revision {page.sourceRevision}</p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Text edition">
        <Link href={`/reader/${encodeURIComponent(page.slug)}?edition=pli&page=1`} className={`rounded-full border px-3 py-1 ${edition === "pli" ? "border-accent text-accent-strong" : "border-line"}`}>Pāli</Link>
        {englishPage ? (
          <>
            <Link href={`/reader/${encodeURIComponent(page.slug)}?edition=en&page=1`} className={`rounded-full border px-3 py-1 ${edition === "en" && !parallel ? "border-accent text-accent-strong" : "border-line"}`}>English</Link>
            <Link href={`/reader/${encodeURIComponent(page.slug)}?edition=en&parallel=1&page=1`} className={`rounded-full border px-3 py-1 ${edition === "en" && parallel ? "border-accent text-accent-strong" : "border-line"}`}>Pāli + EN</Link>
          </>
        ) : <span className="rounded-full border border-line px-3 py-1 text-ink-faint">English unavailable</span>}
        {russianPage ? (
          <>
            <Link href={`/reader/${encodeURIComponent(page.slug)}?edition=ru&page=1`} className={`rounded-full border px-3 py-1 ${edition === "ru" && !parallel ? "border-accent text-accent-strong" : "border-line"}`}>Русский</Link>
            <Link href={`/reader/${encodeURIComponent(page.slug)}?edition=ru&parallel=1&page=1`} className={`rounded-full border px-3 py-1 ${edition === "ru" && parallel ? "border-accent text-accent-strong" : "border-line"}`}>Pāli + RU</Link>
          </>
        ) : <span className="rounded-full border border-line px-3 py-1 text-ink-faint">Russian unavailable</span>}
      </nav>

      {edition === "en" && !englishPage ? <div className="card-dhamma">No verified English edition is available. No fallback has been substituted.</div> : null}
      {edition === "ru" && !russianPage ? <div className="card-dhamma">Русский перевод отсутствует. Другой язык не подставлен.</div> : null}
      {parallel ? <p className="text-xs text-ink-faint">The editions use independent segment systems; both retain their source segment IDs and are paginated independently.</p> : null}
      <ReaderPagination current={selectedPage} count={selectedPageCount} pageHref={pageHref} />
      <div className={parallel ? "grid lg:grid-cols-2 gap-5 items-start" : ""}>
        {(edition === "pli" || parallel) ? <PaliColumn page={page} /> : null}
        {selectedTranslation ? <TranslationColumn page={selectedTranslation} /> : null}
      </div>
      <ReaderPagination current={selectedPage} count={selectedPageCount} pageHref={pageHref} />
    </div>
  );
}

function PaliColumn({ page }: { page: FullCorpusReaderPage }) {
  return (
    <article className="space-y-5">
      {page.segments.map((segment) => (
        <section key={segment.id} id={segment.segmentUid} className="card-dhamma prose-dhamma scroll-mt-6">
          {segment.chapter ? <h2 className="font-serif text-lg mb-2">{segment.chapter}</h2> : null}
          <p className="pali">{segment.text}</p>
          {segment.notes.length ? (
            <details className="mt-3 text-xs text-ink-faint">
              <summary className="cursor-pointer text-accent-strong">Variant readings and source notes ({segment.notes.length})</summary>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {segment.notes.map((note) => <li key={note.id}>{note.text}</li>)}
              </ul>
            </details>
          ) : null}
          <p className="text-xs text-accent-strong mt-3"><a href={`#${segment.segmentUid}`} className="link-dhamma">{segment.segmentUid}</a> · {segment.sourceRef}</p>
        </section>
      ))}
    </article>
  );
}

function TranslationColumn({ page }: { page: TranslationReaderPage }) {
  return (
    <article className="space-y-5">
      <div className="card-dhamma bg-accent-soft/35 text-sm space-y-1">
        <p>{page.language === "ru" ? "Русский" : "English"} · {page.language === "ru" ? "Переводчик" : "translator identifier"}: {page.translator}</p>
        <p>{page.totalSegments.toLocaleString()} segments · {page.licenseName}</p>
        <p>Source: {page.attribution}</p>
        <a href={page.sourceUrl} className="link-dhamma break-all">{page.sourceFile} ↗</a>
        {page.language === "ru" ? <p>Основа перевода: {page.segments[0]?.translationBasisLanguage ?? "unknown"}</p> : null}
      </div>
      {page.segments.map((segment) => (
        <section key={segment.id} id={`en-${segment.segmentUid}`} className="card-dhamma prose-dhamma scroll-mt-6">
          <p>{segment.text}</p>
          <p className="text-xs text-accent-strong mt-3"><a href={`#en-${segment.segmentUid}`} className="link-dhamma">{segment.segmentUid}</a></p>
        </section>
      ))}
    </article>
  );
}

function ReaderPagination({ current, count, pageHref }: { current: number; count: number; pageHref: (page: number) => string }) {
  return (
    <nav className="flex items-center justify-between gap-4 text-sm" aria-label="Reader pages">
      {current > 1 ? <Link href={pageHref(current - 1)} className="link-dhamma">← Previous</Link> : <span />}
      <span className="text-ink-faint">{current} / {count}</span>
      {current < count ? <Link href={pageHref(current + 1)} className="link-dhamma">Next →</Link> : <span />}
    </nav>
  );
}

function EditionBlock({
  label,
  text,
  languageCode,
  badgeLabel,
  edition,
  fallback = false,
  sourceLabel,
}: {
  label: string;
  text: string;
  languageCode: string;
  badgeLabel: string;
  edition?: ReturnType<typeof manifestEdition>;
  fallback?: boolean;
  sourceLabel: string;
}) {
  return (
    <div className="mb-4" data-edition-language={languageCode.toLowerCase()}>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
        <Badge muted={fallback}>{badgeLabel}</Badge>
      </div>
      <p className={languageCode === "pli" ? "pali" : undefined}>{text}</p>
      {edition ? (
        <details className="mt-3 text-xs text-ink-faint">
          <summary className="cursor-pointer text-accent-strong">{sourceLabel}</summary>
          <p className="mt-1 break-words">
            {edition.translator} · {edition.publisher} · {edition.licenseName} · revision {edition.sourceRevision}
          </p>
          <a href={edition.sourceUrl} className="link-dhamma break-all">
            {edition.sourceFile} ↗
          </a>
          <p className="mt-1 font-mono">sha256:{edition.sha256.slice(0, 16)}…</p>
        </details>
      ) : null}
    </div>
  );
}


function Badge({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 ${
        muted ? "border-line text-ink-faint" : "border-accent/60 text-accent-strong"
      }`}
    >
      {children}
    </span>
  );
}
