"use client";

import { useState, useTransition } from "react";
import type { RetrievedSegment } from "@/lib/corpus/types";
import type { UiStrings } from "@/lib/ui";

interface Props {
  initialQuery?: string;
  initialResults?: RetrievedSegment[];
  ui: UiStrings["search"];
}

export default function SearchClient({
  initialQuery = "",
  initialResults = [],
  ui,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<RetrievedSegment[]>(initialResults);
  const [pending, startTransition] = useTransition();

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      ).then((r) => r.json());
      setResults(res.results ?? []);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={runSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ui.placeholder}
          className="flex-1 px-4 py-2 rounded-md border border-line bg-surface text-ink focus:outline-none focus:border-accent-strong"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded-md bg-action text-white disabled:opacity-50 hover:bg-action-soft"
        >
          {pending ? ui.pending : ui.button}
        </button>
      </form>

      <p className="text-sm text-ink-faint">{ui.diacriticNote}</p>

      <ul className="space-y-3">
        {results.length === 0 && !pending ? (
          <li className="text-ink-soft">{ui.noResults}</li>
        ) : null}
        {results.map((r) => (
          <li key={r.id} className="card-dhamma">
            <div className="flex justify-between text-xs text-accent-strong mb-1">
              <span>{r.sourceRef}</span>
              <span className="uppercase tracking-wide text-ink-faint">
                {r.reason} · score {r.score}
              </span>
            </div>
            {r.rootText ? <p className="pali text-sm mb-1">{r.rootText}</p> : null}
            <p className="prose-dhamma">{r.translationText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
