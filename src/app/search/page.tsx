import { getCorpus } from "@/lib/server";
import { search } from "@/lib/corpus/search";
import SearchClient from "@/components/search-client";

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
        <h1 className="font-serif text-3xl">Search</h1>
        <p className="prose-dhamma text-ink-soft">
          Search the canonical corpus by Pāli or English. Canonical texts rank
          above commentarial; exact Pāli terms rank above loose matches.
        </p>
      </div>
      <SearchClient initialQuery={q ?? ""} initialResults={results} />
    </div>
  );
}
