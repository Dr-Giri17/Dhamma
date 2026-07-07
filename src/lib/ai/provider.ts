/**
 * LLM provider abstraction (ТЗ §13).
 *
 * The MVP ships WITHOUT any external LLM dependency. The default `askDhamma`
 * path uses a local, deterministic, source-grounded extractive RAG that:
 *   - never fabricates citations;
 *   - fails closed when no source is retrieved;
 *   - keeps the same `{answer, sources, confidence, warnings}` contract.
 *
 * A real provider can be plugged in later by implementing `LlmProvider`.
 */

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmCompleteInput {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  temperature?: number;
}

/** A chat-style completion provider. Implementations may call a remote API. */
export interface LlmProvider {
  readonly id: string;
  complete(input: LlmCompleteInput): Promise<string>;
}

/** An embedding provider for semantic search (not used in MVP). */
export interface EmbeddingProvider {
  readonly id: string;
  embed(text: string): Promise<number[]>;
}

/** No-op default: there is no provider configured in MVP. */
export const NO_PROVIDER: LlmProvider | null = null;
