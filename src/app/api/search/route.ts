import { NextResponse } from "next/server";
import { MAX_QUERY_CHARS, searchFullCorpus } from "@/lib/corpus/full-search";
import { CorpusAssetError } from "@/lib/corpus/trusted-assets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ results: [], query: q, status: "unsupported" });
  }
  const language = searchParams.get("language") ?? undefined;
  if (language && !["pli", "en", "ru"].includes(language)) {
    return NextResponse.json({ results: [], query: q, status: "invalid-language" }, { status: 400 });
  }
  if (q.length > MAX_QUERY_CHARS) {
    return NextResponse.json({ results: [], query: q, status: "query-too-long" }, { status: 400 });
  }
  const collection = searchParams.get("collection") ?? undefined;
  const canonicalOnly = searchParams.get("canonical") === "1";
  const canonicalStatus = searchParams.get("status");
  if (canonicalStatus && !["canonical", "tradition-dependent", "post-canonical"].includes(canonicalStatus)) {
    return NextResponse.json({ results: [], query: q, status: "invalid-status" }, { status: 400 });
  }
  try {
    const results = await searchFullCorpus(q, {
      language,
      collection,
      canonicalOnly,
      canonicalStatus: canonicalStatus as "canonical" | "tradition-dependent" | "post-canonical" | undefined,
      limit: 20,
    });
    return NextResponse.json({ results, query: q, status: results.length ? "ok" : "unsupported" });
  } catch (error) {
    if (error instanceof CorpusAssetError) {
      return NextResponse.json({ results: [], query: q, status: "corpus-unavailable" }, { status: error.status });
    }
    throw error;
  }
}
