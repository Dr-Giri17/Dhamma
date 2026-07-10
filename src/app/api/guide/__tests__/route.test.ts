import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  answerGuide: vi.fn(),
  getCorpus: vi.fn(() => ({ corpus: true })),
}));

vi.mock("@/lib/guide/respond", () => ({ answerGuide: mocks.answerGuide }));
vi.mock("@/lib/server", () => ({ getCorpus: mocks.getCorpus }));

import { POST } from "../route";

const URL = "http://localhost/api/guide";

function request(body: string): Request {
  return new Request(URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

async function expectError(body: string, status: number, error: string) {
  const response = await POST(request(body));
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error });
  expect(mocks.getCorpus).not.toHaveBeenCalled();
  expect(mocks.answerGuide).not.toHaveBeenCalled();
}

describe("POST /api/guide", () => {
  afterEach(() => vi.clearAllMocks());

  it("rejects invalid JSON", async () => {
    await expectError("{", 400, "invalid-json");
  });

  it.each(["null", "[]", '"question"'])("rejects non-object JSON: %s", async (body) => {
    await expectError(body, 400, "invalid-body");
  });

  it("rejects a non-string question", async () => {
    await expectError(JSON.stringify({ question: 42 }), 400, "invalid-question");
  });

  it("rejects an empty question", async () => {
    await expectError(JSON.stringify({ question: "   " }), 400, "missing-question");
  });

  it("accepts a question exactly at the limit", async () => {
    mocks.answerGuide.mockResolvedValue({ groundingStatus: "grounded" });
    const question = "d".repeat(2000);
    const response = await POST(request(JSON.stringify({ question, mode: "strict_source" })));
    expect(response.status).toBe(200);
    expect(mocks.answerGuide).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ question, mode: "strict_source" })
    );
  });

  it("rejects a question over the limit", async () => {
    await expectError(JSON.stringify({ question: "d".repeat(2001) }), 413, "question-too-long");
  });

  it("rejects an invalid mode", async () => {
    await expectError(JSON.stringify({ question: "dukkha", mode: "invent" }), 400, "invalid-mode");
  });

  it.each(["fr", 42])("rejects an invalid language: %s", async (language) => {
    await expectError(JSON.stringify({ question: "dukkha", language }), 400, "invalid-language");
  });

  it("accepts a valid Russian request", async () => {
    mocks.answerGuide.mockResolvedValue({ groundingStatus: "grounded" });
    const response = await POST(request(JSON.stringify({
      question: "Что такое дуккха?",
      language: "ru",
      mode: "explain_simple",
    })));
    expect(response.status).toBe(200);
    expect(mocks.answerGuide).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ language: "ru", mode: "explain_simple" })
    );
  });
});
