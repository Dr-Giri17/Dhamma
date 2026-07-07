import { NextResponse } from "next/server";
import { getCorpus } from "@/lib/server";
import { askDhamma } from "@/lib/ai/ask-dhamma";

export async function POST(request: Request) {
  let body: { question?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "missing-question" }, { status: 400 });
  }

  const corpus = await getCorpus();
  // No provider in MVP → local, deterministic, fail-closed extractive RAG.
  const answer = await askDhamma(corpus, question, {
    language: body.language,
  });

  return NextResponse.json(answer);
}
