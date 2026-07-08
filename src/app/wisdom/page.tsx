import { getCorpus } from "@/lib/server";
import { getDailyWisdom } from "@/lib/corpus/wisdom";
import { UI } from "@/lib/ui";

export default async function WisdomPage() {
  const corpus = await getCorpus();
  let wisdom;
  try {
    wisdom = getDailyWisdom(corpus, { language: "en" });
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">{UI.wisdom.title}</h1>
        <p className="text-ink-soft">
          {UI.wisdom.notAvailable}
        </p>
      </div>
    );
  }

  const seg = wisdom.segment;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">{UI.wisdom.title}</h1>

      <blockquote className="card-dhamma prose-dhamma italic">
        {seg.translationText}
      </blockquote>

      <div className="text-sm space-y-1">
        <p className="text-gold">{seg.sourceRef}</p>
        <p className="text-ink-faint">
          {seg.license} · {seg.translator || seg.provider}
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-xl">{UI.wisdom.reflection}</h2>
        <p className="prose-dhamma text-ink-soft">{wisdom.shortReflection}</p>
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-xl">{UI.wisdom.practice}</h2>
        <p className="prose-dhamma">{wisdom.practicePrompt}</p>
      </div>

      <p className="text-xs text-ink-faint">
        {UI.wisdom.createdByNote} ({UI.wisdom.createdByManual}).
      </p>
    </div>
  );
}
