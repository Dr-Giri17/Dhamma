import Link from "next/link";
import { notFound } from "next/navigation";
import EditionControls from "@/components/edition-controls";
import { getCorpus } from "@/lib/server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";
import { manifestEdition } from "@/lib/corpus/manifest";
import {
  selectTranslation,
  translationLanguages,
  type SelectedTranslation,
} from "@/lib/corpus/translations";
import {
  buildEditionHref,
  normalizeTextEdition,
  type TextEditionLanguage,
} from "@/lib/reader/navigation";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ edition?: string; parallel?: string }>;
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
  if (requestedSlug === "visuddhimagga") {
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
  if (!text) notFound();
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
        {requestedEdition !== "pli" && selectedCount === 0 ? <p>{ui.reader.selectedMissing}</p> : null}
        {requestedEdition !== "pli" && selectedCount > 0 && fallbackCount > 0 ? (
          <p>{ui.reader.partialTranslation}</p>
        ) : null}
        {fallbackCount > 0 ? <p>{ui.reader.fallbackEnglish}</p> : null}
        {requestedEdition === "pli" && !availability.pli ? <p>{ui.reader.selectedMissing}</p> : null}
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
                  language="pli"
                  edition={rootEdition}
                  sourceLabel={ui.reader.sourceAndLicense}
                />
              ) : null}
              {requestedEdition !== "pli" && selection.translation ? (
                <EditionBlock
                  label={ui.reader.translation}
                  text={selection.translation.text}
                  language={selection.isFallback ? ui.reader.fallbackBadge : selection.translation.language.toUpperCase()}
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

function EditionBlock({
  label,
  text,
  language,
  edition,
  fallback = false,
  sourceLabel,
}: {
  label: string;
  text: string;
  language: string;
  edition?: ReturnType<typeof manifestEdition>;
  fallback?: boolean;
  sourceLabel: string;
}) {
  return (
    <div className="mb-4" data-edition-language={language.toLowerCase()}>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
        <Badge muted={fallback}>{language}</Badge>
      </div>
      <p className={language === "pli" ? "pali" : undefined}>{text}</p>
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
