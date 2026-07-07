# Dhamma

> A source-grounded Theravāda Buddhist teaching companion.

Dhamma helps you **read, search, and reflect on Theravāda Buddhist texts** with
AI explanations that **always cite their sources**. If the corpus has no
support for a claim, the app says so — it never fabricates a quotation, a Pāli
term, or a "Buddha said…" attribution.

This is **not** an "AI guru" or a generator of spiritual fantasy. It is a
canonical companion: source first, then quote, then a short explanation, then
an honest confidence level.

## What works in this MVP

- **Read** the Dhammapada (Pāli root + Müller 1881 English, public domain) and
  the four Noble Truths from SN 56.11.
- **Search** the corpus by Pāli or English — diacritic-insensitive
  (`anatta` matches `anattā`), with canonical texts ranked above commentarial.
- **Ask Dhamma** — ask a question and get a citation-first answer. **Fails
  closed** when no source is found; never invents citations.
- **Daily Wisdom** — one sourced passage per day, with a clearly-labelled
  (non-scriptural) reflection.
- **Terms** — a short Pāli glossary where every definition carries canonical
  references.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

### Validation

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run test         # vitest run
npm run build        # next build
```

## Corpus policy (summary)

See [`docs/CORPUS_POLICY.md`](docs/CORPUS_POLICY.md) for the full policy.

- **Dhammapada**: Pāli root (public domain) + F. Max Müller 1881 English
  translation (public domain, pre-1900).
- **Seed suttas**: Sujato's CC0 translations via SuttaCentral/Bilara — added
  by the `scripts/ingest-bilara.ts` ingestion path in the next pass.
- **Visuddhimagga**: **not ingested**. Schema/interface only, pending license
  review (Ñāṇamoli/BPS distribution restrictions). It is a post-canonical
  commentary by Buddhaghosa, never presented as words of the Buddha.

The MIT `LICENSE` governs the **software**. Corpus **texts** carry their own
per-segment licenses stored in `source_works.license` / `segments.license`.
These two layers are never conflated.

## RAG policy (summary)

See [`docs/RAG_POLICY.md`](docs/RAG_POLICY.md) for the full policy.

- Every doctrinal answer must include citations.
- No source → no answer (the app refuses to fabricate).
- Canonical sources rank above commentarial; exact Pāli terms above loose
  matches.
- The MVP runs a **local, deterministic, fail-closed extractive RAG** — no
  external LLM dependency. A `LlmProvider` interface is ready for a later pass.

## Project layout

```
src/
  app/                       Next.js App Router screens
    reader/[[...slug]]/      Reader (index + per-text)
    search/                  Search UI
    ask/                     Ask Dhamma UI
    wisdom/                  Daily Wisdom
    terms/                   Pāli glossary
    api/search/              Search JSON endpoint
    api/ask/                 Ask Dhamma JSON endpoint
  lib/
    corpus/
      types.ts               Corpus data model (ТЗ §10)
      normalize.ts           Pāli diacritic-insensitive normalization
      references.ts          Source-ref formatting (ТЗ §11)
      licenses.ts            License allow-list & policy
      seed.ts                Loader + invariant validator
      search.ts              Hybrid search + re-ranking
      wisdom.ts              Daily wisdom selector
      glossary.ts            Curated Pāli terms
    ai/
      provider.ts            LlmProvider / EmbeddingProvider interfaces
      embeddings.ts          Stub (MVP: no embeddings)
      ask-dhamma.ts          Fail-closed RAG entry point
      prompts.ts             Context rendering for providers
      dhamma-system-prompt.ts
data/corpus/                 Seed JSON (works / texts / segments)
scripts/                     Ingestion entry points
docs/                        CORPUS_POLICY, RAG_POLICY, etc.
```

## Positioning

Dhamma App is **not** marketed as an enlightenment app, a guru AI, a spiritual
authority, or a replacement for a teacher, community, or practice.

It does not give medical, psychiatric, legal, or financial advice. For crisis
or self-harm content it responds safely and directs to immediate human support.

## License

MIT — see [`LICENSE`](LICENSE).
