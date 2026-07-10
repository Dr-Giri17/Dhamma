"use client";

import { useState } from "react";
import type { SupportedLanguage } from "@/lib/i18n/language";
import { respondTeacher } from "@/lib/teacher/respond";
import type { TeacherAnswer, TeacherMode } from "@/lib/teacher/types";
import { MODE_LABELS, WARNING_LABELS } from "@/lib/teacher/voice";

interface Props {
  language: SupportedLanguage;
}

const copy = {
  en: {
    placeholder: "What is anicca?  ·  Explain dukkha simply",
    button: "Teach",
    answer: "Answer",
    concepts: "Concepts",
    sources: "Source refs",
    warnings: "Warnings",
    noSources: "No mapped source refs.",
    notQuote: "This is an app explanation, not a canonical quotation.",
  },
  ru: {
    placeholder: "Что такое anicca?  ·  Объясни dukkha простыми словами",
    button: "Объяснить",
    answer: "Ответ",
    concepts: "Понятия",
    sources: "Источники",
    warnings: "Предупреждения",
    noSources: "Нет сопоставленных источников.",
    notQuote: "Это объяснение приложения, не каноническая цитата.",
  },
  id: {
    placeholder: "Apa itu mettā?  ·  Jelaskan dukkha dengan sederhana",
    button: "Jelaskan",
    answer: "Jawaban",
    concepts: "Konsep",
    sources: "Rujukan sumber",
    warnings: "Peringatan",
    noSources: "Tidak ada rujukan sumber yang dipetakan.",
    notQuote: "Ini adalah penjelasan aplikasi, bukan kutipan kanonis.",
  },
} as const;

const modes: TeacherMode[] = [
  "strict_source",
  "explain_simple",
  "dhamma_voice",
];

export default function VoiceClient({ language }: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<TeacherMode>("dhamma_voice");
  const [answer, setAnswer] = useState<TeacherAnswer | null>(null);
  const t = copy[language];

  function teach(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setAnswer(respondTeacher({ query, mode, language }));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={teach} className="space-y-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          rows={4}
          className="w-full px-4 py-3 rounded-md border border-line bg-surface text-ink focus:outline-none focus:border-accent-strong"
        />

        <div className="flex flex-wrap items-center gap-2">
          {modes.map((item) => {
            const selected = item === mode;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={selected}
                onClick={() => setMode(item)}
                className={
                  selected
                    ? "px-3 py-2 rounded-md bg-action text-white text-sm"
                    : "px-3 py-2 rounded-md border border-line bg-surface text-sm text-ink-soft hover:bg-accent-soft"
                }
              >
                {MODE_LABELS[language][item]}
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          className="px-5 py-2 rounded-md bg-action text-white hover:bg-action-soft"
        >
          {t.button}
        </button>
      </form>

      {answer ? (
        <section className="space-y-4">
          <div className="card-dhamma space-y-3">
            <div className="flex flex-wrap gap-3 text-xs text-accent-strong">
              <span>{MODE_LABELS[language][answer.mode]}</span>
              <span>{answer.interpretationLevel}</span>
            </div>
            <h2 className="font-serif text-xl">{t.answer}</h2>
            <p className="prose-dhamma whitespace-pre-wrap">{answer.answer}</p>
            <p className="text-sm text-ink-faint">{t.notQuote}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card-dhamma">
              <h3 className="font-serif text-lg mb-2">{t.concepts}</h3>
              <ul className="text-sm text-ink-soft space-y-1">
                {answer.concepts.map((concept) => (
                  <li key={concept}>{concept}</li>
                ))}
              </ul>
            </div>

            <div className="card-dhamma">
              <h3 className="font-serif text-lg mb-2">{t.sources}</h3>
              {answer.sourceRefs.length > 0 ? (
                <ul className="text-sm text-ink-soft space-y-1">
                  {answer.sourceRefs.map((source) => (
                    <li key={source}>{source}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-faint">{t.noSources}</p>
              )}
            </div>

            <div className="card-dhamma">
              <h3 className="font-serif text-lg mb-2">{t.warnings}</h3>
              <ul className="text-sm text-ink-soft space-y-1">
                {answer.warnings.map((warning) => (
                  <li key={warning}>{WARNING_LABELS[language][warning]}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
