# DHAMMA APP IMPLEMENTATION REPORT

> ⚠️ **HISTORICAL DOCUMENT.** This report records the original MVP scaffold
> (the `feat/dhamma-mvp` branch) and is preserved for provenance. Two of its
> claims no longer reflect the verified current state of the project and must
> not be read as live status:
>
> - **"12 Pāli segments"** — the corpus now contains the full Tipiṭaka +
>   Visuddhimagga (155,918 canonical Pāli segments, 3,090 tradition-dependent
>   segments, 4,068 Visuddhimagga segments, 4,425 English editions). See
>   `docs/FULL_TIPITAKA_COVERAGE.md` and `docs/CORPUS_COVERAGE.md`.
> - **"head after: uncommitted working tree"** — the tree is committed and
>   merged; the current verified baseline is on `main` (see `README.md` and the
>   git log). Subsequent work (full corpus, production corpus-asset origin fix,
>   and the optional Supabase account layer) is tracked in later branches and
>   the git history.
>
> Treat everything below as a point-in-time snapshot of the MVP only.

## Verdict

**PASS** — MVP scaffold complete and validated end-to-end.

## Repository

- **path:** `D:\Work\Dhamma`
- **remote:** `https://github.com/Dr-Giri17/Dhamma`
- **branch:** `feat/dhamma-mvp` (created from `main`)
- **head before:** `4b77644785701b50fecce165d62bd7a7c0b8c596` (Initial commit, only LICENSE)
- **head after:** uncommitted working tree on `feat/dhamma-mvp` — see "Commit-ready status" below
- **base preserved:** `.git` history and MIT `LICENSE` untouched

## What was implemented

A brand-new Next.js (App Router) + TypeScript application, built in this order per the approved patch plan:

| Phase | Deliverable | Status |
|---|---|---|
| B | Project foundation — `package.json`, `tsconfig.json`, `next.config.mjs`, Tailwind, PostCSS, Vitest, `.gitignore`, `.env.example`, `.eslintrc.json` | ✅ |
| B | Corpus helpers — `types.ts`, `normalize.ts`, `references.ts`, `licenses.ts` | ✅ |
| C | Seed corpus — `data/corpus/{works,texts,segments}.json` (license-clean) + loader/validator `seed.ts` + ingestion scripts `scripts/ingest-{dhammapada,bilara}.ts`, `build-search-index.ts` | ✅ |
| D | Search — `search.ts` (lexical + Pāli-normalized + term-aware + re-rank) + `/api/search` route + `/search` page | ✅ |
| E | Ask Dhamma — `ask-dhamma.ts` (fail-closed local RAG) + `provider.ts` (interfaces) + `dhamma-system-prompt.ts` + `prompts.ts` + `embeddings.ts` (stub) + `/api/ask` + `/ask` page | ✅ |
| F | Daily wisdom — `wisdom.ts` (always sourced, deterministic) + `/wisdom` page | ✅ |
| G | UI — Home, Reader (`reader/[[...slug]]`), Search, Ask, Wisdom, Terms + layout + `glossary.ts` | ✅ |
| H | Tests — 7 suites, 40 tests covering all 10 ТЗ §9 Phase G requirements | ✅ |
| I | Docs — `README.md`, `docs/CORPUS_POLICY.md`, `docs/RAG_POLICY.md`, this report | ✅ |
| J | Validation — typecheck, lint, test, build, smoke all green | ✅ |

## Corpus

- **sources:** Pāli roots (public domain); Dhammapada English by F. Max Müller, 1881 (public domain). Sujato CC0 (SuttaCentral/Bilara) is the documented next-pass path.
- **number of works:** 3 declared — `dhammapada` (canonical), `samyutta-nikaya` (canonical), `visuddhimagga` (commentarial, **schema-only, no segments**).
- **number of texts:** 2 (`dhp`, `sn56.11`). Visuddhimagga has a text record but contributes no segments.
- **number of segments:** 12 (8 Dhammapada verses + 4 SN 56.11 Noble-Truths segments).
- **licenses:** `Public Domain` for all 12 segments. Each segment carries `sourceRef`, `license`, `provider`, `translator`. Validated by `validateCorpus()` at load time.

## AI / RAG behavior

- **Default path:** local, deterministic, source-grounded extractive RAG. **No external LLM dependency** in the scaffold.
- **Fail-closed:** confirmed live — a question with no corpus support (`"quantum teleportation physics"`) returns the canonical refusal with `confidence: "low"` and `warnings: ["no-retrieved-sources","refused-to-fabricate"]`.
- **Citations:** every doctrinal answer includes a `Sources:` block with `[ref]` citations. Enforced by tests.
- **Commentarial separation:** Visuddhimagga is excluded from retrieval (`searchableSegments` blocks it by slug *and* by license); the Ask layer additionally passes `includeCommentarial: false`. A "what did the Buddha say" question never surfaces commentary as Buddha's words.
- **Provider interface:** `LlmProvider` / `EmbeddingProvider` are defined and ready; `embeddings.ts` is a throwing stub so callers fail loudly if they reach for unavailable embeddings.

## UI changes

6 screens + 2 API routes, all rendering against the loaded corpus:

| Route | Type | Purpose |
|---|---|---|
| `/` | Static | Home — search bar, quick links, wisdom of the day |
| `/reader`, `/reader/[slug]` | Dynamic | Corpus index + per-text reader (Pāli + English) |
| `/search` | Dynamic | Search UI (client + server results) |
| `/ask` | Static | Ask Dhamma form + answer + retrieved passages |
| `/wisdom` | Static | Daily wisdom with sourced passage + reflection |
| `/terms` | Static | Pāli glossary with canonical refs |
| `/api/search` | Dynamic | Search JSON endpoint |
| `/api/ask` | Dynamic | Ask Dhamma JSON endpoint |

Visual style matches ТЗ §8.2: minimal, typography-first, warm-ivory/dark-brown/gold palette, no gamification, dark-mode support.

## Tests / validation

All gates run against Next.js **15.5.4** (upgraded from 15.1.6 to address CVE-2025-66478).

```
typecheck:  tsc --noEmit          → clean
lint:       next lint             → ✔ No ESLint warnings or errors
test:       vitest run            → 7 files, 40 tests, all passing
build:      next build            → ✓ Compiled successfully, 9 routes
smoke:      next start + curl     → all routes HTTP 200;
                                     search API returns sourced results;
                                     ask API fails closed correctly
```

Test coverage of the 10 ТЗ §9 Phase G requirements:

1. corpus normalization — `normalize.test.ts` (6 tests)
2. segment ID preservation — `seed.test.ts` (duplicate-uid rejection)
3. Dhammapada import — `seed.test.ts` + `references.test.ts`
4. search by Pāli term — `search.test.ts`
5. search by English term — `search.test.ts`
6. no answer without sources — `ask-dhamma.test.ts` (fail-closed)
7. answer includes citations — `ask-dhamma.test.ts`
8. commentarial not as Buddha quote — `ask-dhamma.test.ts`
9. daily wisdom always has source — `wisdom.test.ts`
10. license metadata for every work — `licenses.test.ts` + `seed.test.ts`

## Known limitations

- **Corpus size:** 12 segments is a seed, not a library. The architecture scales to the full Tipiṭaka, but the MVP does not ingest it (per approved scope).
- **No external LLM:** the local extractive RAG composes answers from retrieved segments. A real LLM plugs in via `LlmProvider` later — same contract.
- **No embeddings / vector DB:** lexical + term-aware search only (ТЗ §13 step 1–2). Steps 3–4 are documented future work.
- **No persistence layer:** corpus loads from JSON at request time (memoized per-process). A DB is intentionally out of scope for this pass.
- **SN 56.11 English** is a clearly-labelled "working explanation" over the public-domain Pāli root, not a published translation; the Sujato CC0 translation arrives in the next Bilara ingestion pass.
- **7 npm vulnerabilities** remain in transitive deps; `npm audit fix --force` was not run because it can break peer deps. Recommend a dedicated dependency-hardening pass.

## Commit-ready status

**Working tree is uncommitted** on `feat/dhamma-mvp`. Nothing has been pushed. The branch is ready for review and commit when you approve.

## Next steps (recommended next pass)

1. **Bilara ingestion** — implement the online fetch in `scripts/ingest-bilara.ts` for Sujato CC0 translations of the seed suttas (MN 10, MN 118, DN 31, AN 3.65, Snp 1.8/2.1/2.4), preserving stable segment UIDs and CC0 metadata.
2. **Full Dhammapada** — extend the seed to all 423 Müller-1881 verses (public domain), keeping segment UIDs stable.
3. **Russian/Indonesian answers** — wire `detectLanguage` more deeply into the answer-composition path (ТЗ §12); the refusal message already has a Russian variant.
4. **Optional LLM provider** — implement one `LlmProvider` and gate it behind `DHAMMA_LLM_PROVIDER`, reusing the existing fail-closed contract.
5. **Dependency hardening** — resolve the 7 transitive vulnerabilities via a targeted `npm audit fix`.
6. **Visuddhimagga license review** — only after a documented license decision (ТЗ §4.3); the schema already supports it.
