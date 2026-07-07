/**
 * Embeddings placeholder (ТЗ §13).
 *
 * MVP does NOT use embeddings. This file exists so that:
 *   - the `EmbeddingProvider` interface is importable from a stable path;
 *   - a future pass can add a local embedding model without touching call sites.
 *
 * See docs/RAG_POLICY.md for the planned search progression:
 *   lexical → term-aware → local embeddings → vector DB (if needed).
 */

import type { EmbeddingProvider } from "./provider";

/** Stub embedding provider — always throws. Reserved for a later pass. */
export const STUB_EMBEDDING_PROVIDER: EmbeddingProvider = {
  id: "stub",
  async embed() {
    throw new Error(
      "Embeddings are not enabled in MVP. See docs/RAG_POLICY.md."
    );
  },
};
