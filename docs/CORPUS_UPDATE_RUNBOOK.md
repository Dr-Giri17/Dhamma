# Corpus update runbook

1. Identify an edition from a primary source and record translator, publisher, exact repository/file, revision, and edition-specific license.
2. Confirm that local redistribution is expressly allowed. Reject missing, ambiguous, read-only, or all-rights-reserved sources.
3. Pin the upstream revision and calculate SHA-256 over the exact response bytes.
4. Add one `CorpusEditionManifest` record in `src/lib/corpus/registry.ts`.
5. Run `npm run corpus:metadata`; inspect generated coverage and confirm no full-canon claim was introduced.
6. Run the relevant ingestion command. It must fail if the checksum or license gate differs.
7. Run `npm run build:index` to regenerate the deterministic index.
8. Run `npm run corpus:validate`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
9. Browser-check edition availability, fallback labels, parallel position, source metadata, and citation fragments.

Never put temporary downloads, unlicensed source files, build output, or credentials in Git. Never infer that a repository-wide license covers a translation unless the edition record confirms it.

## Expected generated files

```text
data/corpus/manifest.json
data/corpus/catalog.json
data/corpus/coverage.json
data/corpus/search-index.json
```

Generated files are committed so production does not fetch corpus sources at runtime.
