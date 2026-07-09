import { detectLanguage, normalizeForSearch, stripPaliDiacritics } from "../corpus/normalize";
import { normalizeLanguage, type SupportedLanguage } from "../i18n/language";
import { TEACHER_CONCEPTS } from "./concepts";
import type {
  TeacherAnswer,
  TeacherConcept,
  TeacherMode,
  TeacherWarning,
} from "./types";

export interface TeacherRequest {
  query: string;
  mode: TeacherMode;
  language?: string;
}

const DEFAULT_CONCEPT_KEYS = ["dukkha", "tanha", "mindfulness"];

export function respondTeacher(request: TeacherRequest): TeacherAnswer {
  const query = request.query.trim();
  const mode = request.mode;
  const language = resolveTeacherLanguage(query, request.language);
  const concepts = findConcepts(query);
  const chosen = concepts.length > 0 ? concepts : fallbackConcepts(query);
  const warnings = warningSet(mode);

  const impersonation = asksForBuddhaImpersonation(query);
  const fabricatedQuote = asksForFabricatedQuote(query);
  const claimsMonk = asksForMonkIdentity(query);

  if (impersonation) warnings.add("refused-to-impersonate-buddha");
  if (fabricatedQuote) warnings.add("refused-to-fabricate-quote");
  if (claimsMonk) warnings.add("not-an-ordained-monk");

  const sourceRefs = unique(chosen.flatMap((concept) => concept.sourceRefs));
  if (sourceRefs.length === 0) warnings.add("no-source-found");
  if (mode === "strict_source" && concepts.length === 0) warnings.add("no-source-found");
  if (mode === "strict_source" && sourceRefs.length > 0) warnings.add("source-limited");

  return {
    answer: composeAnswer({
      language,
      mode,
      concepts: chosen,
      hasDirectConceptHit: concepts.length > 0,
      impersonation,
      fabricatedQuote,
      claimsMonk,
      sourceRefs,
    }),
    mode,
    language,
    concepts: chosen.map((concept) => concept.key),
    sourceRefs,
    interpretationLevel: interpretationLevelFor(mode, chosen),
    warnings: Array.from(warnings),
  };
}

export function resolveTeacherLanguage(
  query: string,
  selectedLanguage?: string
): SupportedLanguage {
  const detected = normalizeLanguage(detectLanguage(query));
  if (detected !== "en") return detected;
  if (/[а-яё]/i.test(query)) return "ru";
  return selectedLanguage ? normalizeLanguage(selectedLanguage) : detected;
}

export function findConcepts(query: string): TeacherConcept[] {
  const normalized = searchableText(query);
  const scored = TEACHER_CONCEPTS.map((concept, index) => {
    let score = 0;
    const allKeywords = [
      concept.key,
      concept.text.en.displayName,
      concept.text.ru.displayName,
      concept.text.id.displayName,
      ...concept.keywords.pali,
      ...concept.keywords.en,
      ...concept.keywords.ru,
      ...concept.keywords.id,
    ];

    for (const keyword of allKeywords) {
      const normalizedKeyword = searchableText(keyword);
      if (!normalizedKeyword) continue;
      if (normalized.includes(normalizedKeyword)) {
        score += normalizedKeyword.length > 8 ? 3 : 2;
      }
    }

    return { concept, score, index };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return scored.slice(0, 3).map((entry) => entry.concept);
}

function fallbackConcepts(query: string): TeacherConcept[] {
  const normalized = searchableText(query);
  const money = ["money", "cash", "wealth", "деньги", "богатство", "uang", "harta"].some((term) =>
    normalized.includes(searchableText(term))
  );
  const keys = money ? ["sila", "kamma", "upadana"] : DEFAULT_CONCEPT_KEYS;
  return keys
    .map((key) => TEACHER_CONCEPTS.find((concept) => concept.key === key))
    .filter((concept): concept is TeacherConcept => Boolean(concept));
}

function warningSet(mode: TeacherMode): Set<TeacherWarning> {
  const warnings = new Set<TeacherWarning>();
  if (mode === "explain_simple" || mode === "dhamma_voice") {
    warnings.add("not-canonical-quote");
  }
  return warnings;
}

function composeAnswer(input: {
  language: SupportedLanguage;
  mode: TeacherMode;
  concepts: TeacherConcept[];
  hasDirectConceptHit: boolean;
  impersonation: boolean;
  fabricatedQuote: boolean;
  claimsMonk: boolean;
  sourceRefs: string[];
}): string {
  const { language, mode, concepts, sourceRefs } = input;
  const lines: string[] = [];

  if (input.impersonation) lines.push(impersonationRefusal[language], "");
  if (input.fabricatedQuote) lines.push(fabricationRefusal[language], "");
  if (input.claimsMonk) lines.push(monkRefusal[language], "");

  if (mode === "strict_source") {
    if (!input.hasDirectConceptHit || sourceRefs.length === 0) {
      lines.push(strictNoSource[language]);
      return lines.join("\n");
    }
    lines.push(strictIntro[language]);
    for (const concept of concepts) {
      const text = concept.text[language];
      lines.push(`- ${text.displayName}: ${text.shortExplanation}`);
    }
    lines.push("", sourceLine[language](sourceRefs));
    return lines.join("\n");
  }

  if (mode === "explain_simple") {
    lines.push(explainIntro[language]);
    for (const concept of concepts) {
      const text = concept.text[language];
      lines.push(`${text.displayName}: ${text.shortExplanation}`);
      lines.push(text.practicalExplanation);
    }
    lines.push("", notQuoteNote[language]);
    if (sourceRefs.length > 0) lines.push(sourceLine[language](sourceRefs));
    return lines.join("\n\n");
  }

  lines.push(voiceIntro[language]);
  for (const concept of concepts) {
    const text = concept.text[language];
    lines.push(`${text.shortExplanation} ${text.practicalExplanation}`);
  }
  const reflection = concepts[0]?.text[language].reflectionQuestion;
  if (reflection) lines.push(reflectionLine[language](reflection));
  lines.push(notQuoteNote[language]);
  if (sourceRefs.length > 0) lines.push(sourceLine[language](sourceRefs));
  return lines.join("\n\n");
}

function interpretationLevelFor(
  mode: TeacherMode,
  concepts: TeacherConcept[]
): TeacherAnswer["interpretationLevel"] {
  if (mode === "strict_source") return "source";
  if (mode === "dhamma_voice") return "practical_reflection";
  if (concepts.some((concept) => concept.interpretationLevel === "commentarial")) {
    return "commentarial";
  }
  return "early_buddhist_explanation";
}

function asksForBuddhaImpersonation(query: string): boolean {
  const q = searchableText(query);
  return [
    "you are buddha",
    "i am buddha",
    "as if you are the buddha",
    "speak as buddha",
    "speak like buddha",
    "pretend this is buddha",
    "как будда",
    "как сам будда",
    "ты будда",
    "говори как будда",
    "sebagai buddha",
    "seolah buddha",
  ].some((pattern) => q.includes(searchableText(pattern)));
}

function asksForFabricatedQuote(query: string): boolean {
  const q = searchableText(query);
  const quoteRequest = [
    "invent",
    "make up",
    "fabricate",
    "придумай",
    "сочини",
    "выдумай",
    "buatkan",
    "karang",
  ].some((pattern) => q.includes(searchableText(pattern)));
  const sacredQuote = [
    "buddha quote",
    "sutra quote",
    "sutta quote",
    "цитату будды",
    "цитата будды",
    "сутру",
    "kutipan buddha",
    "kutipan sutta",
  ].some((pattern) => q.includes(searchableText(pattern)));
  return quoteRequest && sacredQuote;
}

function asksForMonkIdentity(query: string): boolean {
  const q = searchableText(query);
  return [
    "you are a monk",
    "as a monk",
    "ты монах",
    "как монах",
    "sebagai bhikkhu",
    "sebagai biksu",
  ].some((pattern) => q.includes(searchableText(pattern)));
}

function searchableText(input: string): string {
  return normalizeForSearch(stripPaliDiacritics(input))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

const strictIntro = {
  en: "Strict source summary from the local doctrine map:",
  ru: "Строгое резюме по локальной карте учения:",
  id: "Ringkasan sumber ketat dari peta ajaran lokal:",
};

const strictNoSource = {
  en: "I could not find a mapped source for that direct source claim in the current local teacher map, so I will not present it as scripture.",
  ru: "Я не нашёл сопоставленного источника для такого прямого утверждения в текущей локальной карте учения, поэтому не буду представлять это как писание.",
  id: "Saya tidak menemukan sumber yang dipetakan untuk klaim langsung itu dalam peta ajaran lokal saat ini, jadi saya tidak akan menyajikannya sebagai kitab suci.",
};

const explainIntro = {
  en: "Here is an app explanation in plain language:",
  ru: "Вот простое объяснение приложения:",
  id: "Berikut penjelasan sederhana dari aplikasi:",
};

const voiceIntro = {
  en: "I can offer a calm Dhamma reflection grounded in the texts:",
  ru: "Я могу предложить спокойное размышление Дхаммы, основанное на текстах:",
  id: "Saya dapat menawarkan renungan Dhamma yang tenang dan berakar pada teks:",
};

const impersonationRefusal = {
  en: "I cannot speak as the Buddha himself or present this as his literal words. I can answer in the style of a calm Dhamma teaching grounded in early texts.",
  ru: "Я не могу говорить как сам Будда или выдавать ответ за его буквальные слова. Но могу ответить в стиле спокойного наставления, основанного на ранних текстах.",
  id: "Saya tidak dapat berbicara sebagai Buddha sendiri atau menyajikan ini sebagai ucapan literal beliau. Saya dapat menjawab dalam gaya ajaran Dhamma yang tenang dan berakar pada teks awal.",
};

const fabricationRefusal = {
  en: "I will not invent a Buddha quote or make up scripture. I can offer a source-grounded explanation instead.",
  ru: "Я не буду придумывать цитату Будды или выдумывать писание. Вместо этого могу дать объяснение с опорой на источники.",
  id: "Saya tidak akan membuat kutipan Buddha atau kitab suci palsu. Sebagai gantinya, saya dapat memberi penjelasan yang berpijak pada sumber.",
};

const monkRefusal = {
  en: "This app is not an ordained monk and does not claim monastic authority.",
  ru: "Это приложение не является посвящённым монахом и не претендует на монашеский авторитет.",
  id: "Aplikasi ini bukan bhikkhu tertahbis dan tidak mengklaim otoritas monastik.",
};

const notQuoteNote = {
  en: "This is an app explanation, not a canonical quotation.",
  ru: "Это объяснение приложения, не каноническая цитата.",
  id: "Ini adalah penjelasan aplikasi, bukan kutipan kanonis.",
};

const sourceLine = {
  en: (refs: string[]) => `Mapped sources: ${refs.join(", ")}.`,
  ru: (refs: string[]) => `Сопоставленные источники: ${refs.join(", ")}.`,
  id: (refs: string[]) => `Sumber yang dipetakan: ${refs.join(", ")}.`,
};

const reflectionLine = {
  en: (question: string) => `Reflection: ${question}`,
  ru: (question: string) => `Вопрос для размышления: ${question}`,
  id: (question: string) => `Renungan: ${question}`,
};
