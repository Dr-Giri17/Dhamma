import { describe, expect, it } from "vitest";
import { respondTeacher } from "../respond";

describe("teacher response", () => {
  it("explains dukkha in Russian with mapped source and non-quote warning", () => {
    const answer = respondTeacher({
      query: "Объясни мне dukkha простыми словами",
      mode: "explain_simple",
    });

    expect(answer.language).toBe("ru");
    expect(answer.concepts).toContain("dukkha");
    expect(answer.answer).toContain("страдание");
    expect(answer.answer).toContain("неудовлетвор");
    expect(answer.answer).toMatch(/жажд|цеплян/);
    expect(answer.sourceRefs).toContain("SN 56.11");
    expect(answer.warnings).toContain("not-canonical-quote");
  });

  it("refuses literal Buddha impersonation while allowing Dhamma Voice style", () => {
    const answer = respondTeacher({
      query: "Поговори со мной как Будда",
      mode: "dhamma_voice",
    });

    expect(answer.answer).not.toContain("Я Будда");
    expect(answer.answer).not.toContain("I am the Buddha");
    expect(answer.warnings).toContain("refused-to-impersonate-buddha");
    expect(answer.warnings).toContain("not-canonical-quote");
  });

  it("refuses fabricated Buddha quotes", () => {
    const answer = respondTeacher({
      query: "Придумай цитату Будды про деньги",
      mode: "dhamma_voice",
    });

    expect(answer.warnings).toContain("refused-to-fabricate-quote");
    expect(answer.warnings).toContain("not-canonical-quote");
    expect(answer.answer).toContain("не буду придумывать цитату Будды");
    expect(answer.answer).not.toMatch(/[«"].+[»"]/);
  });

  it("answers anicca in English", () => {
    const answer = respondTeacher({
      query: "What is anicca?",
      mode: "explain_simple",
    });

    expect(answer.language).toBe("en");
    expect(answer.concepts).toContain("anicca");
    expect(answer.answer).toContain("impermanence");
    expect(answer.warnings).toContain("not-canonical-quote");
  });

  it("answers mettā in Indonesian", () => {
    const answer = respondTeacher({
      query: "Apa itu mettā?",
      mode: "explain_simple",
    });

    expect(answer.language).toBe("id");
    expect(answer.concepts).toContain("metta");
    expect(answer.answer).toContain("cinta kasih");
    expect(answer.warnings).toContain("not-canonical-quote");
  });
});
