# Corpus architecture (seed retrieval layer)

> Historical seed-retrieval architecture. The full static corpus layer is
> documented in [FULL_CORPUS_ARCHITECTURE.md](./FULL_CORPUS_ARCHITECTURE.md).
> Ask/Guide intentionally continue to use this validated seed layer so their
> fail-closed behavior is unchanged.

The repository separates catalog structure, imported editions, normalized segments, and the generated search index. A catalog entry does not imply that its text exists locally.

## Data flow

```text
audited upstream edition
  -> edition registry + SHA-256
  -> checksum-gated ingestion
  -> data/corpus/{works,texts,segments}.json
  -> data/corpus/search-index.json
  -> deterministic retrieval
  -> citation-safe reader and guide
```

`src/lib/corpus/registry.ts` is the source of truth for imported editions. `npm run corpus:metadata` validates it and generates:

- `data/corpus/manifest.json` — full edition provenance;
- `data/corpus/catalog.json` — Tipiṭaka and post-canonical navigation;
- `data/corpus/coverage.json` — exact counts and source-gated gaps.

`npm run build:index` produces a 1,437-document, language-aware static index. The app uses no database, vector database, or embeddings. Corpus text is server-loaded; it is not copied into client JavaScript.

## Availability semantics

- `structure_available`: navigation only.
- `source_link_available`: metadata/source link exists.
- `root_text_available`: a local Pāli root is imported.
- `translation_available`: a local licensed translation is imported.
- `parallel_text_available`: aligned root and translation can be shown together.

## Canonical boundary

Canonical editions use `canonicalStatus=canonical`. Visuddhimagga is cataloged separately as `post-canonical`; it is never placed inside Tipiṭaka and contributes no local segments.

## Runtime boundaries

- `src/lib/corpus/seed.ts` rejects invalid segment linkage, missing provenance, disallowed licenses, and any Visuddhimagga segment.
- `src/lib/corpus/integrity.ts` rejects source-gated editions, redistribution blocks, missing license evidence, and checksum mismatch.
- Reader edition selection is independent from the interface language.
- Every guide citation targets a real `segmentUid` and reader fragment.
