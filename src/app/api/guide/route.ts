import { NextResponse } from "next/server";
import { getCorpus } from "@/lib/server";
import { answerGuide } from "@/lib/guide/respond";
import { NO_SYNTHESIS_ADAPTER } from "@/lib/guide/adapter";
import type { TeacherMode } from "@/lib/teacher/types";

const MODES = new Set<TeacherMode>(["strict_source", "explain_simple", "dhamma_voice"]);
const LANGUAGES = new Set(["ru", "en", "id"]);
const MAX_QUESTION_CHARS = 2000;

export async function POST(request: Request) {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  }

  const body = parsed as Record<string, unknown>;
  if (typeof body.question !== "string") {
    return NextResponse.json({ error: "invalid-question" }, { status: 400 });
  }
  if (body.question.length > MAX_QUESTION_CHARS) {
    return NextResponse.json({ error: "question-too-long" }, { status: 413 });
  }

  const question = body.question.trim();
  const mode = body.mode ?? "dhamma_voice";
  if (!question) return NextResponse.json({ error: "missing-question" }, { status: 400 });
  if (typeof mode !== "string" || !MODES.has(mode as TeacherMode)) {
    return NextResponse.json({ error: "invalid-mode" }, { status: 400 });
  }
  if (body.language !== undefined &&
      (typeof body.language !== "string" || !LANGUAGES.has(body.language))) {
    return NextResponse.json({ error: "invalid-language" }, { status: 400 });
  }

  const answer = await answerGuide(getCorpus(), {
    question,
    language: body.language as string | undefined,
    mode: mode as TeacherMode,
    adapter: NO_SYNTHESIS_ADAPTER,
  });
  return NextResponse.json(answer);
}
