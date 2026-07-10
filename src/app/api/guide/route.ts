import { NextResponse } from "next/server";
import { getCorpus } from "@/lib/server";
import { answerGuide } from "@/lib/guide/respond";
import { NO_SYNTHESIS_ADAPTER } from "@/lib/guide/adapter";
import type { TeacherMode } from "@/lib/teacher/types";

const MODES = new Set<TeacherMode>(["strict_source", "explain_simple", "dhamma_voice"]);

export async function POST(request: Request) {
  let body: { question?: string; language?: string; mode?: TeacherMode };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }
  const question = body.question?.trim() ?? "";
  const mode = body.mode ?? "dhamma_voice";
  if (!question) return NextResponse.json({ error: "missing-question" }, { status: 400 });
  if (!MODES.has(mode)) return NextResponse.json({ error: "invalid-mode" }, { status: 400 });

  const answer = await answerGuide(getCorpus(), {
    question,
    language: body.language,
    mode,
    adapter: NO_SYNTHESIS_ADAPTER,
  });
  return NextResponse.json(answer);
}
