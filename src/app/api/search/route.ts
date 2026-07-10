import { NextResponse } from "next/server";
import { getCorpus } from "@/lib/server";
import { search } from "@/lib/corpus/search";
import { searchFullCorpus } from "@/lib/corpus/full-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ results: [], query: q });
  }
  const language = searchParams.get("language") ?? undefined;
  const collection = searchParams.get("collection") ?? undefined;
  const canonicalOnly = searchParams.get("canonical") === "1";
  const fullResults = await searchFullCorpus(q, { language, collection, canonicalOnly, limit: 20 });
  const corpus = await getCorpus();
  const results = fullResults.length ? fullResults : search(corpus, q, { limit: 20 });
  return NextResponse.json({ results, query: q });
}
