import { getCorpus } from "@/lib/server";
import { search } from "@/lib/corpus/search";
import SearchClient from "@/components/search-client";
import { UI } from "@/lib/ui";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const corpus = await getCorpus();
  const results = q ? search(corpus, q, { limit: 20 }) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">{UI.search.title}</h1>
        <p className="prose-dhamma text-ink-soft">
          {UI.search.description}
        </p>
      </div>
      <SearchClient initialQuery={q ?? ""} initialResults={results} />
    </div>
  );
}
