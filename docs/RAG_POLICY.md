# RAG Policy

This document governs how the Dhamma App answers questions. It implements
ТЗ §6 (Retrieval / RAG contract), §6.3 (mandatory citation), §6.4
(hallucination guard), and §13 (embeddings / vector search).

## 1. First principle

> Source first. Then quote. Then explain. Then state confidence. Never present
> an unverified interpretation as the words of the Buddha.

## 2. Retrieval

On every question (`src/lib/ai/ask-dhamma.ts`):

1. Detect the question language.
2. Tokenize and identify Pāli / Dhamma terms.
3. Run hybrid search (`src/lib/corpus/search.ts`):
   - exact (normalized) substring;
   - term-level match for known Pāli terms (elevated weight);
   - lexical token overlap.
4. Re-rank: canonical above commentarial; exact Pāli term above loose match.
5. Return the top segments as context.

## 3. Fail-closed contract (the most important rule)

If retrieval returns **no** sources, the app **does not answer the doctrinal
question**. It returns the canonical refusal:

> I could not find reliable support for this in the current corpus. I can
> offer a general orientation, but I will not present it as a canonical
> quotation.

(Russian variant is used when the question is in Russian — ТЗ §6.3, §12.)

`confidence` is `low` and `warnings` contains `refused-to-fabricate`.

## 4. Mandatory citation

Every doctrinal answer includes a `Sources:` block where each line carries a
`[ref]`. There is no "answer without sources" path. This is enforced by tests
(`src/lib/ai/__tests__/ask-dhamma.test.ts`).

## 5. Hallucination guard (ТЗ §6.4)

Forbidden patterns:

- "The Buddha taught that…" without a reference;
- "In the Tipiṭaka it says…" without a text UID/ref;
- generating "quotes" from memory;
- blending a Pāli term with modern psychology without labelling;
- giving "personal spiritual guidance" as authoritative.

Permitted patterns:

- "In the current corpus the closest passages are…";
- "This is a later interpretation, not a direct quote.";
- "In Theravāda this is usually explained as…";
- "This needs checking against the commentary."

## 6. Answer structure (ТЗ §6.2)

```
Short answer: ...
Sources:
1. [ref] short quote / paraphrase
2. [ref] ...
Explanation: ...
Confidence: high / medium / low
```

## 7. Two answer paths, one contract

- **LOCAL (MVP default)**: a deterministic extractive summary is composed from
  the top retrieved segments. No external model, no hallucination surface.
- **PROVIDER (optional, later)**: if an `LlmProvider` is supplied, the
  retrieved context is sent to it under the Dhamma system prompt
  (`src/lib/ai/dhamma-system-prompt.ts`). The same `{answer, sources,
  confidence, warnings}` contract applies; citations remain mandatory.

Both paths share the fail-closed behavior: no sources → no answer.

## 8. Search progression (ТЗ §13)

The MVP ships step 1–2. Steps 3–4 are documented future work.

1. Lexical search ✅
2. Term-aware search (Pāli diacritic-insensitive) ✅
3. Local embeddings ⏳
4. Vector DB only if needed ⏳

Embeddings are **not** required for MVP. `src/lib/ai/embeddings.ts` is a stub
that throws, so callers fail loudly if they reach for an unavailable embedding.
