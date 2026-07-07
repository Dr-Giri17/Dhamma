import { NextResponse } from "next/server";
import { getCorpus } from "@/lib/server";
import { search } from "@/lib/corpus/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ results: [], query: q });
  }
  const corpus = await getCorpus();
  const results = search(corpus, q, { limit: 20 });
  return NextResponse.json({ results, query: q });
}
