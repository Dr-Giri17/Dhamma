# DHAMMA_AUDIT.md — Phase A Audit Report

> Produced by the audit-first workflow mandated in ТЗ §9 Phase A and §18.
> **No functional code was written in this phase.** This is audit + plan only.

## 1. Confirmed repository facts

| Item | Value |
|---|---|
| Remote | `https://github.com/Dr-Giri17/Dhamma` |
| Local path | `D:\Work\Dhamma` |
| Branch | `main` (only branch; tracks `origin/main`) |
| HEAD before audit | `4b77644785701b50fecce165d62bd7a7c0b8c596` |
| Commit | `Initial commit` |
| License | MIT (Copyright (c) 2026 Dr-Giri17) |
| `git status` | clean, up to date with `origin/main` |

## 2. Current repository structure

The repository contains **exactly two tracked entries**:

```
D:\Work\Dhamma\
├── .git/
└── LICENSE          (MIT, 1087 bytes)
```

There is **no application code whatsoever**:

- No `package.json`, no lockfile, no `tsconfig.json`, no framework config.
- No `README.md`, no `docs/`, no guide.
- No `src/`, `app/`, `pages/`, `components/`, `lib/`, `db/`, `scripts/`.
- No corpus data, no ingestion scripts.
- No `.gitignore`, no `.env.example`.
- No CI config.

## 3. Is it empty or already scaffolded?

**Effectively empty.** It is a greenfield project with only a license file and an initial commit.
There is no existing stack to discover, no entrypoints to preserve, and no architecture to avoid breaking.

> This means the ТЗ constraints *"don't rewrite from scratch"* (§1.2) and *"match the existing repo stack"* (§9 Phase B) have **nothing to act on** — there is nothing to rewrite and nothing to match. The project must be **initialized**, not extended. Per the human's decision, initialization will use the chosen MVP stack (§5 below).

## 4. Current app stack

**None.** No framework, runtime, or tooling is present.

## 5. Chosen MVP stack (decision)

Next.js App Router + TypeScript, per human direction. Rationale and constraints:

- **Framework:** Next.js (App Router). Provides server components + route handlers for RAG/LLM calls.
- **Language:** TypeScript (matches all ТЗ file contracts in §10, §13).
- **Styling:** Tailwind CSS — minimal, typography-first (ТЗ §8.2).
- **Corpus storage:** Local JSON seed files first; in-memory/JSON search index. SQLite is *optional* and deferred unless it speeds things up (per human: "JSON index first").
- **Search:** Lexical + term-aware + Pāli-diacritic-insensitive first. **No embeddings required for MVP** (ТЗ §13: "MVP can work without embeddings").
- **LLM:** **No external LLM dependency in the first scaffold.** Implement the provider abstraction, but the default `askDhamma` path uses a **fail-closed, source-grounded, local extractive RAG** (no fabrication). A real provider is plugged in later via the same interface.
- **Portability:** The `src/lib/corpus` and `src/lib/ai` layers stay framework-agnostic so they can be reused by an Expo or Telegram Mini App later.

## 6. What can be reused

- `.git/` history (preserve it — no force-pushes, no history rewrite).
- `LICENSE` (MIT) — keep as the *project* license. Note: this is the license of the **software**, which is **independent** of the licenses of imported *corpus texts* (see §9 of this report and ТЗ §4).

## 7. What is missing (gap analysis vs. ТЗ acceptance criteria §15)

| ТЗ requirement | Status | Notes |
|---|---|---|
| App starts | ❌ | No app exists |
| Dhammapada readable | ❌ | No corpus |
| 5–10 seed suttas searchable | ❌ | No corpus |
| Pāli/English term search | ❌ | No search |
| Ask Dhamma w/ citations | ❌ | No RAG |
| Fail-closed "no source" | ❌ | No contract |
| Daily wisdom, sourced | ❌ | No corpus |
| License metadata per segment | ❌ | No corpus |
| Canonical/commentarial separation | ❌ | No model |
| Docs (corpus/RAG policy) | ❌ | None |

**Everything must be built.** There is no incremental path that avoids initialization.

## 8. Corpus sourcing plan (critical — license-gated)

This is the highest-risk area. ТЗ §4 is strict: no copyrighted corpus, no sources without license metadata, no pirated/scanned dumps.

**MVP seed corpus (all clearly licensed):**

1. **Dhammapada**
   - Pāli root — **public domain** (ancient text).
   - English translation — **F. Max Müller, 1881 (Oxford / Sacred Books of the East)**, **public domain** (pre-1900; copyright long expired). Documented per-segment.
   - Alternative/additional: Sujato's CC0 translation from SuttaCentral/Bilara, ingested via the Bilara script (CC0 verified) — phase G of ingestion, after the script is built.

2. **Seed suttas (SN 56.11, MN 10, MN 118, DN 31, AN 3.65, Snp 1.8/2.1/2.4)**
   - Pāli root — public domain.
   - English — **Sujato translations (CC0)** from SuttaCentral/Bilara, fetched via the ingestion script, not hand-copied. Each segment keeps Bilara's stable segment UID.
   - If Bilara fetch is unavailable offline at scaffold time, the scaffold ships with a **tiny hand-entered public-domain sample** (a few Dhammapada verses, Müller 1881) to prove the pipeline end-to-end, and full ingestion runs as the documented next step.

3. **Visuddhimagga** — **MVP does NOT ingest it.** ТЗ §4.3: schema/interface only; ingestion only after license review (Ñāṇamoli/BPS edition has distribution restrictions).

**Every imported segment will carry:** `source_ref`, `license`, `provider`, `translator/author`. No exceptions (ТЗ §15.8).

## 9. License-policy note (important distinction)

- `LICENSE` (MIT) governs the **software**.
- Corpus **texts** carry their own per-segment licenses (public domain, CC0, etc.), stored in `source_works.license` / `segments.license`.
- These two layers must never be conflated. Documented in `docs/CORPUS_POLICY.md`.

## 10. Proposed implementation plan (patch plan)

Phased, ТЗ-aligned. Each phase is independently committable.

### Phase B — Project foundation & corpus model
- `git checkout -b feat/dhamma-mvp`
- Initialize Next.js (App Router) + TypeScript + Tailwind + Vitest.
- `.gitignore`, `.env.example`, `tsconfig`, `package.json`.
- `src/lib/corpus/types.ts` — entities from ТЗ §10 (SourceWork, DhammaText, DhammaSegment, RetrievedSegment, DhammaAnswer, etc.).
- `src/lib/corpus/normalize.ts` — Pāli diacritic-insensitive normalization (`anattā` ≡ `anatta`).
- `src/lib/corpus/references.ts` — source-ref formatting (Dhp / MN / SN / AN / DN / Snp / Vism).
- `src/lib/corpus/licenses.ts` — license metadata helpers + allow-list.

### Phase C — Seed corpus (license-clean)
- `data/corpus/dhammapada/` — Pāli root + Müller-1881 English, with metadata.
- `data/corpus/suttas/` — small CC0 seed (fetched via script or tiny hand-entered PD sample).
- `src/lib/corpus/seed.ts` — loads + validates (every segment has source_ref/license/provider).
- `scripts/ingest-dhammapada.ts`, `scripts/ingest-bilara.ts` (skeleton, CC0-fetching), `scripts/build-search-index.ts`.

### Phase D — Search
- `src/lib/corpus/search.ts` — lexical + term-aware + Pāli-normalized hybrid search; re-rank canonical > commentarial, exact Pāli > loose semantic.
- API route `src/app/api/search/route.ts`.
- `src/app/search/page.tsx` — filters per ТЗ §8.1 (Canonical, Dhammapada, Sutta, Vinaya, Abhidhamma, Commentarial, language).

### Phase E — Ask Dhamma (fail-closed RAG)
- `src/lib/ai/provider.ts` — `LlmProvider`, `EmbeddingProvider` interfaces.
- `src/lib/ai/dhamma-system-prompt.ts` — ТЗ §7 content.
- `src/lib/ai/ask-dhamma.ts` — `askDhamma()` → `{answer, sources, confidence, warnings}`. **Fails closed** when no sources retrieved (ТЗ §6.3, §6.4). Default provider is a local extractive summarizer (no external LLM) — real LLM plugs in later via the same interface.
- `src/app/ask/page.tsx` + route handler.

### Phase F — Daily wisdom
- `src/lib/corpus/wisdom.ts` — `getDailyWisdom(date, language, theme?)`; prefers short standalone segments, always sourced (ТЗ §9 Phase F).
- `src/app/wisdom/page.tsx`.

### Phase G — Reading surfaces
- `src/app/page.tsx` (Home), `src/app/reader/...`, `src/app/terms/...`.
- Dhammapada as first-class section; Tipiṭaka by collection; Terms glossary.

### Phase H — Tests (ТЗ §9 Phase G)
Vitest: normalization, segment-ID preservation, Dhammapada import, Pāli/English search, no-answer-without-sources, answer-includes-citations, commentarial-not-as-Buddha, daily-wisdom-always-sourced, license-metadata-present.

### Phase I — Docs & report
- `README.md`, `docs/DHAMMA_APP.md`, `docs/CORPUS_POLICY.md`, `docs/RAG_POLICY.md`, `docs/IMPLEMENTATION_REPORT.md`.

### Phase J — Validation (ТЗ §14)
`typecheck`, `lint`, `test`, `build`, app-start smoke. Report honestly if any is unavailable.

## 11. Proposed file tree (final, after scaffold)

```
D:\Work\Dhamma\
├── .git/                                  (preserved)
├── LICENSE                                (preserved — MIT)
├── .gitignore
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── vitest.config.ts
├── README.md
├── DHAMMA_AUDIT.md                        (this file)
├── docs/
│   ├── DHAMMA_APP.md
│   ├── CORPUS_POLICY.md
│   ├── RAG_POLICY.md
│   └── IMPLEMENTATION_REPORT.md
├── data/
│   └── corpus/
│       ├── dhammapada/  (pali + müller-1881 en, PD)
│       └── suttas/      (CC0 seed)
├── scripts/
│   ├── ingest-dhammapada.ts
│   ├── ingest-bilara.ts
│   └── build-search-index.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                       (Home)
    │   ├── reader/[[...slug]]/page.tsx
    │   ├── search/page.tsx
    │   ├── ask/page.tsx
    │   ├── wisdom/page.tsx
    │   ├── terms/page.tsx
    │   └── api/
    │       ├── search/route.ts
    │       └── ask/route.ts
    ├── lib/
    │   ├── corpus/
    │   │   ├── types.ts
    │   │   ├── normalize.ts
    │   │   ├── references.ts
    │   │   ├── licenses.ts
    │   │   ├── search.ts
    │   │   ├── wisdom.ts
    │   │   └── seed.ts
    │   └── ai/
    │       ├── provider.ts
    │       ├── embeddings.ts
    │       ├── ask-dhamma.ts
    │       ├── prompts.ts
    │       └── dhamma-system-prompt.ts
    └── components/
        └── (reader, search, citation-card, wisdom-card …)
```

## 12. Decision points pending human approval (gate before Phase B)

1. **Approve scaffolding a fresh Next.js + TS app** in this empty repo (since no base exists).
2. **Approve the seed-corpus license choice** (Müller 1881 PD for Dhammapada; CC0 Sujato via Bilara script for seed suttas; Visuddhimagga excluded from MVP).
3. **Approve fail-closed local RAG as the default Ask path** (no external LLM in scaffold; provider interface ready for later).
4. **Branch name** `feat/dhamma-mvp` (or alternative).

No code will be written until these are confirmed.
