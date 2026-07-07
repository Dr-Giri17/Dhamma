import Link from "next/link";
import { notFound } from "next/navigation";
import { getCorpus } from "@/lib/server";
import { isVisuddhimaggaSlug } from "@/lib/corpus/licenses";

/**
 * Reader. Two modes:
 *   /reader            — list of readable texts grouped by collection
 *   /reader/{slug}     — the full text with Pāli + English
 * Visuddhimagga appears in the index as "schema only — pending license
 * review" and cannot be read (ТЗ §4.3).
 */
export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const corpus = await getCorpus();

  // Index view
  if (!slug || slug.length === 0) {
    const textsByWork = corpus.texts.map((t) => ({
      text: t,
      work: corpus.works.find((w) => w.id === t.workId)!,
      segmentCount: corpus.segments.filter((s) => s.textId === t.id).length,
    }));

    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl">Read</h1>
        <p className="prose-dhamma text-ink-soft">
          Browse the corpus by collection. Each text shows its source,
          translator, and license.
        </p>
        <ul className="space-y-3">
          {textsByWork.map(({ text, work, segmentCount }) => {
            const blocked = isVisuddhimaggaSlug(work.slug);
            return (
              <li key={text.id} className="card-dhamma">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-serif text-xl">
                    {blocked ? (
                      <span className="text-ink-faint">{text.title}</span>
                    ) : (
                      <Link href={`/reader/${text.slug}`} className="link-dhamma">
                        {text.title}
                      </Link>
                    )}
                  </h2>
                  <span className="text-xs text-ink-faint uppercase tracking-wide">
                    {work.pitaka}
                    {work.nikaya ? ` · ${work.nikaya}` : ""}
                  </span>
                </div>
                {text.titlePali ? (
                  <p className="pali text-sm">{text.titlePali}</p>
                ) : null}
                <p className="text-sm text-ink-soft mt-1">
                  {blocked ? (
                    <em>
                      Post-canonical commentary (Buddhaghosa). Schema/interface
                      only — ingestion pending license review.
                    </em>
                  ) : (
                    <>
                      {segmentCount} segments · {work.translator || work.author || "—"} ·{" "}
                      <span className="text-gold">{work.license}</span>
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // Text view
  const requestedSlug = slug[0];
  const text = corpus.texts.find((t) => t.slug === requestedSlug);
  if (!text) notFound();

  const work = corpus.works.find((w) => w.id === text.workId);
  if (work && isVisuddhimaggaSlug(work.slug)) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">{text.title}</h1>
        <p className="card-dhamma text-ink-soft">
          This text is the Visuddhimagga — a post-canonical commentary by
          Buddhaghosa. It is <strong>not</strong> part of the Tipiṭaka and is
          not words attributed to the Buddha. Content ingestion is pending
          license review (see{" "}
          <Link href="/" className="link-dhamma">
            docs/CORPUS_POLICY.md
          </Link>
          ).
        </p>
      </div>
    );
  }

  const segments = corpus.segments
    .filter((s) => s.textId === text.id)
    .sort((a, b) => a.segmentOrder - b.segmentOrder);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{text.title}</h1>
        {text.titlePali ? <p className="pali text-lg">{text.titlePali}</p> : null}
        <p className="text-sm text-ink-faint mt-1">
          {work?.title} · {work?.translator || work?.author || "—"} ·{" "}
          <span className="text-gold">{work?.license}</span>
        </p>
      </div>

      <article className="space-y-5">
        {segments.map((s) => (
          <section key={s.id} className="prose-dhamma">
            {s.sectionTitle ? (
              <h2 className="font-serif text-xl mb-1">{s.sectionTitle}</h2>
            ) : null}
            {s.rootText ? (
              <p className="pali mb-1">{s.rootText}</p>
            ) : null}
            <p>{s.translationText}</p>
            <p className="text-xs text-gold mt-1">
              {s.sourceRef}
              {s.verseNumber ? ` · verse ${s.verseNumber}` : ""}
            </p>
          </section>
        ))}
      </article>
    </div>
  );
}
