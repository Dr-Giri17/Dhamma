import type { SupportedLanguage } from "../i18n/language";
import type { TeacherMode } from "../teacher/types";

export type GuideAnswerType = "unsupported" | "extractive" | "app-explanation";
export type GroundingStatus = "grounded" | "unsupported" | "validated-synthesis";

export type GuideWarning =
  | "app-explanation-not-scripture"
  | "language-fallback"
  | "no-relevant-source"
  | "refused-to-impersonate-buddha"
  | "refused-to-fabricate-quote"
  | "not-an-ordained-monk"
  | "synthesis-validation-failed";

export interface GuideCitation {
  id: string;
  segmentUid: string;
  sourceRef: string;
  route: string;
  language: string;
  translator: string;
  publisher: string;
  licenseName: string;
  canonicalStatus: "canonical" | "post-canonical" | "commentarial";
}

export interface GuideRetrievedSegment {
  id: string;
  segmentUid: string;
  sourceRef: string;
  route: string;
  language: string;
  text: string;
  score: number;
  canonicalStatus: GuideCitation["canonicalStatus"];
  fallbackUsed: boolean;
}

export interface GuideAnswer {
  answerType: GuideAnswerType;
  language: SupportedLanguage;
  mode: TeacherMode;
  answer: string;
  warnings: GuideWarning[];
  citations: GuideCitation[];
  retrievedSegments: GuideRetrievedSegment[];
  directExcerpts: GuideRetrievedSegment[];
  fallbackUsed: boolean;
  groundingStatus: GroundingStatus;
}

export interface SynthesisInput {
  question: string;
  language: SupportedLanguage;
  mode: Exclude<TeacherMode, "strict_source">;
  excerpts: GuideRetrievedSegment[];
  allowedCitationIds: string[];
}

export interface SynthesisOutput {
  answer: string;
  citationIds: string[];
  directQuotes: string[];
}

export interface GuideSynthesisAdapter {
  readonly id: string;
  synthesize(input: SynthesisInput): Promise<SynthesisOutput>;
}
