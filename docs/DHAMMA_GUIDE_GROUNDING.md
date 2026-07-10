# Dhamma Guide grounding

`POST /api/guide` is a deterministic, source-grounded guide for `strict_source`, `explain_simple`, and `dhamma_voice` modes.

## Retrieval contract

```text
question + selected language
  -> normalization (RU/EN/ID/Pāli, diacritic-insensitive)
  -> static index lookup
  -> relevance floor and anti-keyword-stuffing guard
  -> canonical/source filters
  -> at most five real segments
  -> citation and edition validation
```

No relevant segment means `groundingStatus=unsupported`, no citations, no excerpts, and no doctrinal synthesis. The app never substitutes a generic Buddhist answer.

Every response includes:

```text
answerType
language
mode
answer
warnings
citations
retrievedSegments
directExcerpts
fallbackUsed
groundingStatus
```

Citation IDs are internal corpus segment IDs. Routes include the exact reader fragment. Direct excerpts are stored corpus text and remain separate from the application explanation.

## Deterministic modes

- `strict_source`: strongest extractive passage plus verified excerpts/citations; no free synthesis.
- `explain_simple`: short concept explanation only when a concept map reference intersects retrieved sources.
- `dhamma_voice`: calm practical wording under the same evidence-intersection rule.

Generated wording is labeled “App explanation (not scripture).” It is never presented as a quotation or as speech by the Buddha.

## Optional synthesis adapter

`GuideSynthesisAdapter` is an injectable server-only contract and `NO_SYNTHESIS_ADAPTER` is the checked-in default. The repository does not call any external LLM and reads no provider credential.

An approved provider integration must remain disabled by default, retrieve first, send only the question/language/bounded excerpts, and return only allowed citation IDs. `validateSynthesis` rejects missing/unknown IDs and any quote that is not an exact substring of retrieved text; the generated output is discarded and deterministic fallback is returned.

No environment variables are consumed by the current disabled adapter. A future provider-specific adapter should use server-only names such as `DHAMMA_GUIDE_SYNTHESIS_ENABLED`, `DHAMMA_GUIDE_MODEL`, and the provider’s documented credential variable, without exposing values to the client or logs. Provider wiring requires a separate credential and documentation review.
