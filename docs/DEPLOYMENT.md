# Deployment Guide

This document explains how to deploy the Dhamma App (Next.js 15 + TypeScript)
to Vercel, and records the deploy-safety design decisions in the codebase.

## Current status

- **Stable milestone:** `main` @ tag `dhamma-mvp-v0.1`
- **Automated deployment from this environment:** **BLOCKED** — no Vercel CLI
  installed and no pre-existing auth token; the headless environment cannot
  perform the interactive browser OAuth that `vercel login` requires.
- **Recommended path:** connect the GitHub repo to Vercel via the web UI
  (manual, ~2 minutes). Steps below.

## Why the app is Vercel-ready (deploy-safety)

The corpus lives in checked-in JSON (`data/corpus/{works,texts,segments}.json`)
and is read by `src/lib/corpus/seed.ts`. Originally this was a runtime
`fs.readFile` with `process.cwd()`, which Next.js's file tracer does **not**
detect — so on serverless hosts the files would be missing and every route
would fail at runtime with ENOENT.

**Fix applied (no behavior change, packaging only):** `src/lib/server.ts`
imports the three JSON files **statically** (`import worksJson from "../../data/corpus/works.json"`).
Next.js then bundles the corpus into a shared server chunk (`.next/server/chunks/*.js`)
that every page and API route references. The validation contract from
`seed.ts` (`loadCorpusFromObjects`) still runs on first access, so the
license/sourceRef/provider invariants are enforced identically.

Verified: after `npm run build`, the corpus content ("Bhikkhu Sujato",
"Dhammapada", etc.) is present in `.next/server/chunks/340.js`, and all routes
(home, reader, search, ask, wisdom, terms, `/api/search`, `/api/ask`) work in a
local `next start` smoke with no filesystem access to `data/`.

There are **no Windows-only path assumptions** in the runtime path — `seed.ts`
keeps a `process.cwd()`-based reader for the ingestion scripts (which run at
generation time, not runtime), but the app itself no longer depends on it.

## Manual deployment: Vercel + GitHub (recommended)

1. Push `main` to GitHub (already done — `https://github.com/Dr-Giri17/Dhamma`).
2. Go to <https://vercel.com/new>.
3. Import the `Dr-Giri17/Dhamma` repository.
4. Vercel auto-detects Next.js. Accept the defaults:
   - **Framework preset:** Next.js
   - **Build command:** `npm run build`
   - **Output directory:** `.next` (auto)
   - **Install command:** `npm install`
   - **Root directory:** repo root
5. **Environment variables:** none required. The MVP has no external LLM, no
   DB, no embeddings, no auth. Do NOT add `OPENAI_API_KEY` — the app is
   intentionally fail-closed local RAG only at this milestone.
6. Click **Deploy**. First deploy typically takes 1–2 minutes.
7. Vercel returns a preview URL (`*.vercel.app`). Confirm the routes below.

### Post-deploy smoke checklist

Hit each route on the deployed URL and confirm:

| Route | Expected |
|---|---|
| `/` | HTTP 200, home page with wisdom of the day |
| `/reader` | HTTP 200, lists 9 texts (Dhammapada + 8 suttas; Visuddhimagga shows as schema-only) |
| `/reader/dhammapada` | HTTP 200, all 423 verses render |
| `/search?q=dukkha` | HTTP 200, sourced results returned |
| `/ask` (POST `{"question":"What does the Buddha teach about dukkha?"}`) | cited answer, `confidence: high` |
| `/ask` (POST `{"question":"supercalifragilistic quantum blockchain portfolio"}`) | **fail-closed**: `sources: []`, `confidence: "low"`, `warnings: ["no-retrieved-sources","refused-to-fabricate"]` |

Example unsupported-Ask contract (must match):
```json
{
  "sources": [],
  "confidence": "low",
  "warnings": ["no-retrieved-sources", "refused-to-fabricate"]
}
```

## Alternative: Vercel CLI (if you have auth locally)

If you have the Vercel CLI installed and are logged in on your own machine:

```bash
npm i -g vercel
vercel login              # browser OAuth
vercel                    # preview deploy
vercel --prod             # production deploy (only after preview passes)
```

The local `.vercel/` directory is gitignored (see `.gitignore`) so
account/org IDs and tokens are never committed.

## What NOT to do

- **Do not** add `OPENAI_API_KEY` or any LLM env var at this milestone — the
  app is intentionally fail-closed local RAG.
- **Do not** enable a database — the corpus is checked-in JSON by design.
- **Do not** enable analytics or auth — out of scope for v0.1.
- **Do not** run `npm audit fix --force` as part of deployment — it can break
  peer deps; defer to a dedicated hardening pass.

## Re-running corpus ingestion (not needed for deploy)

The committed `data/corpus/*.json` is the source of truth at runtime. The
ingestion scripts are only needed to regenerate the corpus:

```bash
npm run ingest:bilara       # refetch Sujato CC0 seed suttas from bilara-data
npm run ingest:dhammapada   # refetch Müller 1881 from Project Gutenberg #2017
```

Both are idempotent and require network at generation time only.
