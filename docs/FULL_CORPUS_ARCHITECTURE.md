# Full corpus architecture

## Boundaries

- Pāli canonical boundary: the 59 explicitly enumerated Chaṭṭha Saṅgāyana
  `.mul.xml` root volumes at the pinned VipassanaTech revision.
- Pāli Visuddhimagga: two separately enumerated volumes, always
  `post-canonical`.
- English: Bilara published-branch editions with an exact local Pāli root and
  complete segment-key alignment.
- Russian: HTML text pages discovered from Theravada.ru's canonical navigation,
  fetched only when robots permits, mapped to an existing Pāli root, and free
  of a conflicting page-level notice.

The ingestion does not use machine translation, a database, embeddings, a
vector store, or an LLM.

## Storage

Generated corpus text lives under `public/corpus/<language>/`. Assets are
gzip-compressed JSON and are split at no more than 200 decoded segments. Small
English and Russian editions store metadata and segments in one compressed
index file; larger works use an index plus numbered pages.

Metadata, coverage, route maps, and lightweight indexes live under
`data/corpus/`. Source clones and the Theravada.ru byte cache live outside the
application repository in `D:\Work\Dhamma-corpus-inbox`.

The reader returns no more than 80 segments at a time. Server components fetch
compressed corpus pages from the deployment's static origin, so the full
corpus is not traced into a Vercel Function and is not included in client
JavaScript.

## Search

`npm run build:index` generates gzip-compressed, language/collection shards.
Each shard contains bounded postings and short excerpts rather than a second
copy of the full text. Query language is explicit when provided, otherwise
Cyrillic selects Russian, Pāli diacritics select Pāli, and Latin text defaults
to English. Canonical-only search filters out Visuddhimagga.

Ask and Guide continue to use the existing small, validated retrieval corpus.
Their fail-closed behavior is unchanged; full-corpus search is not silently
wired into answer generation.

## Deterministic commands

```text
npm run corpus:inventory:vri
npm run corpus:ingest:pali
npm run corpus:inventory:bilara
npm run corpus:ingest:en
npm run corpus:inventory:theravada
npm run corpus:ingest:ru
npm run corpus:coverage
npm run corpus:validate:full
npm run build:index
```

VRI and Bilara output dates derive from pinned revisions rather than wall-clock
time. Theravada.ru has no repository revision, so the inventory records the
retrieval time and SHA-256 of each cached HTML response.

## Vercel constraints

The packaging is designed around Vercel's documented limits as checked on
2026-07-10:

- CLI deployment source uploads: 100 MB on Hobby and 1 GB on Pro.
- Source files per CLI deployment: 15,000.
- Build duration: 45 minutes.
- Standard uncompressed Vercel Function bundle: 250 MB.
- Function request/response body: 4.5 MB.

References: [Vercel limits](https://vercel.com/docs/limits),
[250 MB Function troubleshooting](https://vercel.com/kb/guide/troubleshooting-function-250mb-limit),
and [Function body-size guidance](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions).

The validation report records total corpus bytes, file count, largest decoded
reader response input, and search-shard sizes. No production deployment is
performed by the ingestion workflow.

