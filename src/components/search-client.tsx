"use client";

import { useState, useTransition } from "react";
import type { RetrievedSegment } from "@/lib/corpus/types";

interface Props {
  initialQuery?: string;
  initialResults?: RetrievedSegment[];
}

export default function SearchClient({ initialQuery = "", initialResults = [] }: Props) {
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
          placeholder="dukkha, anattā, suffering, mindfulness…"
          className="flex-1 px-4 py-2 rounded border border-gold/30 bg-ivory-soft text-ink focus:outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 rounded bg-forest text-ivory disabled:opacity-50 hover:bg-forest-soft"
        >
          {pending ? "Searching…" : "Search"}
        </button>
      </form>

      <p className="text-sm text-ink-faint">
        Search is diacritic-insensitive: <code>anatta</code> matches{" "}
        <span className="pali">anattā</span>.
      </p>

      <ul className="space-y-3">
        {results.length === 0 && !pending ? (
          <li className="text-ink-soft">No results yet — try a Pāli term.</li>
        ) : null}
        {results.map((r) => (
          <li key={r.id} className="card-dhamma">
            <div className="flex justify-between text-xs text-gold mb-1">
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
