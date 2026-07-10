import { describe, expect, it } from "vitest";
import {
  REQUIRED_CONCEPT_KEYS,
  TEACHER_CONCEPTS,
  TEACHER_CONCEPT_BY_KEY,
} from "../concepts";

describe("teacher concept map", () => {
  it("contains all required concepts", () => {
    const keys = TEACHER_CONCEPTS.map((concept) => concept.key);
    for (const key of REQUIRED_CONCEPT_KEYS) {
      expect(keys).toContain(key);
    }
  });

  it("has RU/EN/ID explanations and source arrays for every required concept", () => {
    for (const key of REQUIRED_CONCEPT_KEYS) {
      const concept = TEACHER_CONCEPT_BY_KEY.get(key);
      expect(concept).toBeDefined();
      expect(concept?.text.en.shortExplanation.length).toBeGreaterThan(0);
      expect(concept?.text.ru.shortExplanation.length).toBeGreaterThan(0);
      expect(concept?.text.id.shortExplanation.length).toBeGreaterThan(0);
      expect(Array.isArray(concept?.sourceRefs)).toBe(true);
    }
  });

  it("uses valid related concept keys", () => {
    const keys = new Set(TEACHER_CONCEPTS.map((concept) => concept.key));
    for (const concept of TEACHER_CONCEPTS) {
      for (const related of concept.relatedConcepts) {
        expect(keys.has(related), `${concept.key} -> ${related}`).toBe(true);
      }
    }
  });
});
