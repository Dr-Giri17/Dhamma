import Link from "next/link";
import { getCorpus } from "@/lib/server";
import { getDailyWisdom } from "@/lib/corpus/wisdom";

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
      <section className="text-center py-8">
        <h1 className="font-serif text-4xl text-ink mb-3">Dhamma</h1>
        <p className="prose-dhamma mx-auto text-ink-soft">
          Read, search, and reflect on Theravāda Buddhist texts — with
          source-grounded explanations that always cite their evidence.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <Link href="/search" className="card-dhamma hover:border-gold transition-colors block">
          <h2 className="font-serif text-xl mb-1">Search the corpus</h2>
          <p className="text-sm text-ink-soft">
            Find passages by Pāli term (<span className="pali">dukkha</span>,{" "}
            <span className="pali">anattā</span>) or English word.
          </p>
        </Link>
        <Link href="/ask" className="card-dhamma hover:border-gold transition-colors block">
          <h2 className="font-serif text-xl mb-1">Ask Dhamma</h2>
          <p className="text-sm text-ink-soft">
            Ask a question and get a citation-first answer. If the corpus has
            no support, it says so — it never fabricates.
          </p>
        </Link>
        <Link href="/reader/dhammapada" className="card-dhamma hover:border-gold transition-colors block">
          <h2 className="font-serif text-xl mb-1">Dhammapada</h2>
          <p className="text-sm text-ink-soft">
            Read the opening verses — Pāli root and English side by side.
          </p>
        </Link>
        <Link href="/terms" className="card-dhamma hover:border-gold transition-colors block">
          <h2 className="font-serif text-xl mb-1">Terms</h2>
          <p className="text-sm text-ink-soft">
            A short Pāli glossary with canonical references.
          </p>
        </Link>
      </section>

      {wisdom ? (
        <section className="card-dhamma">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-serif text-xl">Wisdom of the day</h2>
            <Link href="/wisdom" className="text-sm link-dhamma">
              see more
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
    </div>
  );
}
