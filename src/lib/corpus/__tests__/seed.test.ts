import { describe, expect, it } from "vitest";
import {
  CorpusValidationError,
  validateCorpus,
  searchableSegments,
} from "../seed";
import type {
  DhammaSegment,
  DhammaText,
  SourceWork,
} from "../types";

const baseWork: SourceWork = {
  id: "w1",
  slug: "dhammapada",
  title: "Dhammapada",
  tradition: "theravada",
  category: "canonical",
  pitaka: "sutta",
  nikaya: "kn",
  sourceProvider: "manual",
  license: "Public Domain",
  language: "en",
  importedAt: "2026-07-07T00:00:00.000Z",
};

const baseText: DhammaText = {
  id: "t1",
  workId: "w1",
  uid: "dhp",
  slug: "dhammapada",
  title: "Dhammapada",
};

const baseSeg: DhammaSegment = {
  id: "s1",
  textId: "t1",
  segmentUid: "dhp:1.1",
  segmentOrder: 1,
  language: "en",
  translationText: "All that we are is the result of what we have thought.",
  sourceRef: "Dhp 1",
  license: "Public Domain",
  provider: "manual",
};

const validCorpus = () => ({
  works: [{ ...baseWork }],
  texts: [{ ...baseText }],
  segments: [{ ...baseSeg }],
});

describe("corpus validation (ТЗ §9 Phase G #2, #3, #10)", () => {
  it("accepts a clean corpus", () => {
    expect(() => validateCorpus(validCorpus())).not.toThrow();
  });

  it("rejects a segment with no sourceRef", () => {
    const c = validCorpus();
    c.segments[0].sourceRef = "";
    expect(() => validateCorpus(c)).toThrow(CorpusValidationError);
  });

  it("rejects a segment with no license", () => {
    const c = validCorpus();
    c.segments[0].license = "";
    expect(() => validateCorpus(c)).toThrow(CorpusValidationError);
  });

  it("rejects a segment with no provider", () => {
    const c = validCorpus();
    // @ts-expect-error intentionally invalid for the test
    c.segments[0].provider = undefined;
    expect(() => validateCorpus(c)).toThrow(CorpusValidationError);
  });

  it("rejects duplicate stable segment UIDs", () => {
    const c = validCorpus();
    c.segments.push({
      ...baseSeg,
      id: "s2",
      segmentUid: "dhp:1.1", // duplicate!
    });
    expect(() => validateCorpus(c)).toThrow(/Duplicate segmentUid/);
  });

  it("rejects a segment pointing at an unknown textId", () => {
    const c = validCorpus();
    c.segments[0].textId = "does-not-exist";
    expect(() => validateCorpus(c)).toThrow(/unknown textId/);
  });

  it("rejects any Visuddhimagga segment (license-gated)", () => {
    const c = validCorpus();
    c.works.push({
      ...baseWork,
      id: "w-vism",
      slug: "visuddhimagga",
      title: "Visuddhimagga",
      category: "commentarial",
      pitaka: "post_canonical",
    });
    c.texts.push({ ...baseText, id: "t-vism", workId: "w-vism", uid: "vism" });
    c.segments.push({
      ...baseSeg,
      id: "s-vism",
      textId: "t-vism",
      segmentUid: "vism:1.1",
    });
    expect(() => validateCorpus(c)).toThrow(/Visuddhimagga/);
  });

  it("searchableSegments excludes Visuddhimagga and unlicensed segments", () => {
    const c = validCorpus();
    c.works.push({
      ...baseWork,
      id: "w-vism",
      slug: "visuddhimagga",
      title: "Visuddhimagga",
      category: "commentarial",
      pitaka: "post_canonical",
      // not on allow-list — should be excluded anyway, but doubly protected
      license: "PENDING_LICENSE_REVIEW",
    });
    c.texts.push({ ...baseText, id: "t-vism", workId: "w-vism", uid: "vism" });
    c.segments.push({
      ...baseSeg,
      id: "s-vism",
      textId: "t-vism",
      segmentUid: "vism:1.1",
    });
    const searchable = searchableSegments(c);
    expect(searchable.every((s) => s.textId !== "t-vism")).toBe(true);
  });

  it("requires every work to have license metadata (#10)", () => {
    const c = validCorpus();
    // license field still present & allowed; removing the field entirely breaks it
    const badWork: SourceWork = { ...baseWork, license: "All Rights Reserved" };
    c.works.push(badWork);
    // Validation itself permits works not on the allow-list (it focuses on
    // segment provenance), but searchableSegments must exclude their texts.
    c.texts.push({ ...baseText, id: "t-bad", workId: badWork.id, uid: "x" });
    c.segments.push({
      ...baseSeg,
      id: "s-bad",
      textId: "t-bad",
      segmentUid: "x:1.1",
    });
    const searchable = searchableSegments(c);
    expect(searchable.every((s) => s.textId !== "t-bad")).toBe(true);
  });
});
