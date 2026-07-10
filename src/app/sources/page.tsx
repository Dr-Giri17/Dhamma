import Link from "next/link";
import { fullCorpusSummary } from "@/lib/corpus/full-corpus";

export default function SourcesPage() {
  const corpus = fullCorpusSummary();
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl">Sources and licenses</h1>
        <p className="text-ink-soft">Software and corpus contents have separate license terms. The MIT software license does not apply to every text distributed with the app.</p>
      </header>

      <SourceCard title="Chaṭṭha Saṅgāyana Pāli texts">
        <p>Source: Vipassana Research Institute / Tipitaka.org, obtained from VipassanaTech/tipitaka-xml.</p>
        <p>Use: non-commercial with attribution to Vipassana Research Institute.</p>
        <p>Coverage: {corpus.importedWorks} canonical volumes and {corpus.canonicalSegmentCount.toLocaleString()} canonical segments.</p>
        <a className="link-dhamma" href="https://github.com/VipassanaTech/tipitaka-xml/tree/77b57a6daca231b3ca265400fb8a411822f025f4">Pinned source revision ↗</a>
      </SourceCard>

      <SourceCard title="English translations">
        <p>Source: SuttaCentral Bilara.</p>
        <p>License: CC0 only where the imported edition is verified in the corpus manifest.</p>
        <a className="link-dhamma" href="https://github.com/suttacentral/bilara-data/tree/published">Bilara published branch ↗</a>
      </SourceCard>

      <SourceCard title="Russian translations">
        <p>Source: Theravada.ru.</p>
        <p>Condition: every imported edition retains its translator metadata and a direct source-page link; copying requires a direct link to the site.</p>
        <a className="link-dhamma" href="https://theravada.ru/">Theravada.ru ↗</a>
      </SourceCard>

      <div className="card-dhamma border-dashed space-y-2">
        <h2 className="font-serif text-xl">Visuddhimagga boundary</h2>
        <p>The VRI Pāli text is distributed as post-canonical literature. The protected Ñāṇamoli/BPS English translation is not included.</p>
        <Link href="/reader/visuddhimagga" className="link-dhamma">Read the Pāli text →</Link>
      </div>
    </div>
  );
}

function SourceCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-dhamma space-y-2">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="space-y-2 text-sm text-ink-soft">{children}</div>
    </section>
  );
}

