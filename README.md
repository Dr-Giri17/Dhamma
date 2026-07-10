# Dhamma

Source-grounded Theravāda reading and guidance with explicit licensing, multilingual editions, citation-safe retrieval, and browser-native voice controls.

## Current capabilities

- `/library`: complete three-basket Tipiṭaka navigation with exact local-coverage labels.
- `/reader`: independent interface/text language, Pāli/EN/RU/ID edition states, explicit English fallback, parallel Pāli reading, source metadata, and stable segment links.
- `/ask`: the original fail-closed cited Ask flow.
- `/voice`: grounded guide modes plus typed input, browser speech recognition, and stoppable TTS.
- Visuddhimagga: separate post-canonical, source-gated metadata page; no BPS text is stored.

The full Tipiṭaka is **not** imported. Local coverage is 9 texts / 22 editions / 1,437 segments:

- Pāli: eight seed suttas;
- English: those eight plus the 423-verse Max Müller Dhammapada;
- Russian: MN 10, MN 118, DN 31, SN 56.11, and Snp 1.8;
- Indonesian: no matching licensed seed edition, shown honestly as unavailable with explicit EN fallback.

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

The runtime uses no database, vector database, embeddings, external STT/TTS, or required LLM key.

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

The MIT `LICENSE` governs software only. Every corpus edition has separate provenance and license metadata.
