# Full corpus architecture

## Boundaries

- Pāli: 61 reviewed sources from the pinned VRI Mūla navigation inventory.
- 59 roots are represented as canonical within the reviewed VRI scope.
- Milindapañha and Peṭakopadesa are imported as `tradition-dependent` and are excluded from canonical-only filtering.
- Pāli Visuddhimagga is two separately enumerated `post-canonical` volumes.
- English: published Bilara CC0 translations with a matching local Pāli root and complete segment-key alignment.
- Russian: five verified Bilara seed editions only. The Theravada.ru bulk crawl is excluded because redistribution permission and immutable provenance are unresolved.
- Indonesian: no local text coverage.

The ingestion uses no machine translation, database, embeddings, vector store, external LLM, or external speech service.

## Storage and runtime

Generated corpus text lives under `public/corpus/<language>/` as deterministic gzip JSON. Pages contain no more than 200 decoded segments. Metadata, coverage, route maps, and search manifests live under `data/corpus/`.

Server components fetch static assets only from the trusted `VERCEL_URL` deployment origin. Local production smoke uses fixed `127.0.0.1`. Request `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto` values never select the destination. Same-origin preview-authentication credentials may be forwarded without being logged; redirects, oversized bodies, timeouts, HTML responses, and invalid JSON are rejected.

## Search

`npm run build:index` produces immutable language/collection shards. Explicit language and classification filters are preserved. There is no unfiltered seed fallback. Unsupported and unrelated queries return an empty result, Pāli diacritics are normalized, and shard loading uses bounded concurrency and decoded-size limits.

The five retained Russian seed editions are indexed directly from the checked-in seed corpus. Ask and Guide retain their separate fail-closed retrieval contract.

## Deterministic commands

```text
npm run corpus:inventory:vri
npm run corpus:ingest:pali
npm run corpus:inventory:bilara
npm run corpus:ingest:en
npm run corpus:coverage
npm run corpus:validate:full
npm run build:index
```

JSON uses UTF-8, stable ordering and one final LF. Gzip uses level 9, `mtime=0`, no filename/comment, and OS byte 255. Manifests store hashes of both canonical uncompressed content and compressed bytes. Generated provenance contains only upstream-relative paths.

## License boundary

The software MIT license does not relicense corpus material. VRI content retains its non-commercial attribution boundary. Bilara imports are limited to verified CC0 translation editions. BPS/Ñāṇamoli Visuddhimagga is not stored.

## Deployment constraints

Validation records tracked bytes/files, corpus bytes/files, largest reader asset and largest search shard. A green build is not runtime proof: the exact protected preview must pass full reader and search smoke before re-audit.
