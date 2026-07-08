import { getCorpus } from "@/lib/server";
import { search } from "@/lib/corpus/search";
import SearchClient from "@/components/search-client";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getUi } from "@/lib/ui";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const language = await getRequestLanguage();
  const ui = getUi(language);
  const corpus = await getCorpus();
  const results = q ? search(corpus, q, { limit: 20 }) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{ui.search.title}</h1>
        <p className="prose-dhamma text-ink-soft">
          {ui.search.description}
        </p>
      </div>
      <SearchClient initialQuery={q ?? ""} initialResults={results} ui={ui.search} />
    </div>
  );
}
