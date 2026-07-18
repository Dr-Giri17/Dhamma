# Dhamma

Source-grounded Theravāda reading and guidance with explicit licensing, multilingual editions, citation-safe retrieval, and browser-native voice controls.

## Current capabilities

- `/library`: three-basket navigation with machine-derived local-coverage labels.
- `/reader`: independent interface/text language, Pāli/EN/RU/ID edition states, explicit English fallback, parallel Pāli reading, source metadata, and stable segment links.
- `/ask`: the original fail-closed cited Ask flow.
- `/voice`: grounded guide modes plus typed input, browser speech recognition, and stoppable TTS.
- Visuddhimagga: separate post-canonical, source-gated metadata page; no BPS text is stored.
- **Optional account layer** (`/auth/sign-in`, `/auth/sign-up`, `/account`): Supabase Auth with owner-scoped bookmarks and reading progress. Public reading and search work without any account; Supabase failure degrades gracefully to the anonymous experience.

The application does not claim a universally complete Tipiṭaka. It imports the independently reviewed source scope of the pinned VRI Mūla navigation:

- Pāli: all adjudicated VRI Mūla navigation sources, with Milindapañha and Peṭakopadesa labelled `tradition-dependent` rather than universally canonical;
- Pāli Visuddhimagga: separate `post-canonical` content; no BPS/Ñāṇamoli translation;
- English: only aligned CC0 Bilara editions with matching roots;
- Russian: MN 10, MN 118, DN 31, SN 56.11, and Snp 1.8;
- Russian bulk import: excluded because Theravada.ru redistribution rights and immutable provenance are unresolved;
- Indonesian: no matching licensed local edition.

## Quick start

```bash
npm ci
npm run corpus:validate
npm run build:index
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

The runtime uses no database, vector database, embeddings, external STT/TTS, or required LLM key. The optional Supabase account layer stores only owner-scoped pointers (segment IDs, slugs, editions, pages) — never scripture text, hashes, provenance, licensing, classification, questions, doctrinal answers, or health-related text. The corpus itself is never migrated to Supabase.

## Grounding and safety

Retrieval uses a deterministic build-time index, language-aware normalization, canonical filters, a relevance floor, bounded context, and real segment IDs. No source means no doctrinal answer. Application explanations, direct excerpts, sources, and warnings are visually separate.

The optional `GuideSynthesisAdapter` is disabled by default. Any future provider must pass post-generation citation and exact-quote validation; invalid output is discarded.

Dhamma App does not impersonate the Buddha, claim monk status, fabricate scripture, or assert spiritual authority.

## Documentation

- [Corpus architecture](docs/CORPUS_ARCHITECTURE.md)
- [License audit](docs/CORPUS_LICENSE_AUDIT.md)
- [Exact coverage](docs/CORPUS_COVERAGE.md)
- [Corpus update runbook](docs/CORPUS_UPDATE_RUNBOOK.md)
- [Guide grounding](docs/DHAMMA_GUIDE_GROUNDING.md)
- [Voice mode](docs/VOICE_MODE.md)
- [Safety boundaries](docs/SAFETY_BOUNDARIES.md)
- [Account layer, Supabase, and RLS security model](docs/ACCOUNT_AND_DATABASE.md) — local Supabase setup, migration runbook, RLS two-user isolation proof, deployment and rollback procedures, and the corpus/Supabase boundary.

The MIT `LICENSE` governs software only. Every corpus edition has separate provenance and license metadata.
