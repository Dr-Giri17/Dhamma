import type { SupportedLanguage } from "../i18n/language";

export type TeacherMode = "strict_source" | "explain_simple" | "dhamma_voice";

export type TeacherWarning =
  | "not-canonical-quote"
  | "no-source-found"
  | "refused-to-impersonate-buddha"
  | "refused-to-fabricate-quote"
  | "not-an-ordained-monk"
  | "no-direct-concept-match"
  | "source-limited";

export type InterpretationLevel =
  | "source"
  | "early_buddhist_explanation"
  | "practical_reflection"
  | "commentarial";

export interface TeacherAnswer {
  answer: string;
  mode: TeacherMode;
  language: SupportedLanguage;
  concepts: string[];
  sourceRefs: string[];
  interpretationLevel: InterpretationLevel;
  warnings: TeacherWarning[];
}

export interface LocalizedConceptText {
  displayName: string;
  shortExplanation: string;
  practicalExplanation: string;
  reflectionQuestion: string;
}

export interface TeacherConcept {
  key: string;
  text: Record<SupportedLanguage, LocalizedConceptText>;
  sourceRefs: string[];
  relatedConcepts: string[];
  interpretationLevel: InterpretationLevel;
  keywords: Record<SupportedLanguage | "pali", string[]>;
}
