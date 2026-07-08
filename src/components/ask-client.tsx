"use client";

import { useState, useTransition } from "react";
import type { DhammaAnswer } from "@/lib/corpus/types";
import type { SupportedLanguage } from "@/lib/i18n/language";
import type { UiStrings } from "@/lib/ui";

interface Props {
  language: SupportedLanguage;
  ui: UiStrings["ask"];
}

export default function AskClient({ language, ui }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<DhammaAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setError(null);
    setAnswer(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question, language }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as DhammaAnswer;
        setAnswer(data);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  const confidenceColor =
    answer?.confidence === "high"
      ? "text-action"
      : answer?.confidence === "medium"
        ? "text-accent-strong"
        : "text-warn";

  return (
    <div className="space-y-6">
      <form onSubmit={ask} className="space-y-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={ui.placeholder}
          rows={3}
          className="w-full px-4 py-3 rounded-md border border-line bg-surface text-ink focus:outline-none focus:border-accent-strong"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded-md bg-action text-white disabled:opacity-50 hover:bg-action-soft"
        >
          {pending ? ui.pending : ui.button}
        </button>
      </form>

      {error ? (
        <p className="text-warn text-sm">{ui.error} {error}</p>
      ) : null}

      {answer ? (
        <div className="space-y-4">
          <div className="card-dhamma whitespace-pre-wrap prose-dhamma">
            {answer.answer}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span>{ui.confidence}</span>
            <span className={`font-semibold uppercase ${confidenceColor}`}>
              {answer.confidence}
            </span>
            {answer.warnings.length > 0 ? (
              <span className="text-ink-faint">
                {ui.warnings} {answer.warnings.join(", ")}
              </span>
            ) : null}
          </div>

          <details className="card-dhamma">
            <summary className="cursor-pointer text-sm text-ink-soft">
              {ui.retrievedPassages} ({answer.sources.length})
            </summary>
            <ul className="mt-3 space-y-3">
              {answer.sources.map((s) => (
                <li key={s.id}>
                  <div className="text-xs text-accent-strong mb-1">
                    {s.sourceRef} · {s.reason} · score {s.score}
                  </div>
                  <p className="prose-dhamma text-sm">{s.translationText}</p>
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
    </div>
  );
}
