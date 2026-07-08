import { getCorpus } from "@/lib/server";
import { getDailyWisdom } from "@/lib/corpus/wisdom";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";

export default async function WisdomPage() {
  const language = await getRequestLanguage();
  const ui = getUi(language);
  const corpus = await getCorpus();
  let wisdom;
  try {
    wisdom = getDailyWisdom(corpus, { language });
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">{ui.wisdom.title}</h1>
        <p className="text-ink-soft">{ui.wisdom.notAvailable}</p>
      </div>
    );
  }

  const seg = wisdom.segment;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">{ui.wisdom.title}</h1>

      <section className="card-dhamma bg-accent-soft/45">
        <p className="text-xs uppercase tracking-wide text-accent-strong mb-2">
          {wisdom.disclaimer}
        </p>
        <blockquote className="prose-dhamma text-ink">
          {wisdom.displayText}
        </blockquote>
      </section>

      <div className="text-sm space-y-1">
        <p className="text-accent-strong">
          {ui.wisdom.sourceRef}: {wisdom.item.sourceRef}
        </p>
        <p className="text-ink-faint">
          {ui.wisdom.license}: {seg.license} · {seg.translator || seg.provider}
        </p>
      </div>

      <details className="card-dhamma">
        <summary className="cursor-pointer text-sm text-ink-soft">
          {ui.wisdom.sourceExcerptSummary}
        </summary>
        <div className="mt-3 space-y-2">
          <h2 className="font-serif text-xl">{ui.wisdom.sourceExcerpt}</h2>
          {seg.rootText ? <p className="pali">{seg.rootText}</p> : null}
          <p className="prose-dhamma">{wisdom.item.sourceText}</p>
        </div>
      </details>

      <div className="space-y-2">
        <h2 className="font-serif text-xl">{ui.wisdom.reflection}</h2>
        <p className="prose-dhamma text-ink-soft">{wisdom.shortReflection}</p>
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-xl">{ui.wisdom.practice}</h2>
        <p className="prose-dhamma">{wisdom.practicePrompt}</p>
      </div>
    </div>
  );
}
