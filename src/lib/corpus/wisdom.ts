import type { Corpus, DhammaSegment } from "./types";
import {
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  type SupportedLanguage,
} from "../i18n/language";

export type WisdomRenderingKind = "canonical-translation" | "app-rendering";

export interface DailyWisdomItem {
  segmentUid: string;
  sourceRef: string;
  sourceText: string;
  sourceLanguage: string;
  renderings: Record<SupportedLanguage, string>;
  renderingKind: WisdomRenderingKind;
  disclaimer: Record<SupportedLanguage, string>;
}

export interface DailyWisdom {
  segment: DhammaSegment;
  item: DailyWisdomItem;
  displayText: string;
  disclaimer: string;
  theme: string;
  shortReflection: string;
  practicePrompt: string;
  language: SupportedLanguage;
  createdBy: "manual";
}

export interface WisdomOptions {
  language?: string;
  theme?: string;
  date?: Date | string;
}

const APP_RENDERING_DISCLAIMER: Record<SupportedLanguage, string> = {
  ru: "Смысловой перевод приложения. Не канонический текст.",
  en: "App rendering. Not canonical scripture.",
  id: "Terjemahan makna oleh aplikasi. Bukan teks kanonis.",
};

interface CuratedWisdomEntry {
  segmentUid: string;
  theme: string;
  renderings: Record<SupportedLanguage, string>;
}

const CURATED_WISDOM: readonly CuratedWisdomEntry[] = [
  {
    segmentUid: "dhp:1",
    theme: "Mind and intention",
    renderings: {
      ru: "То, к чему снова и снова склоняется ум, формирует наш путь. Недоброе намерение приносит страдание так же верно, как колесо следует за повозкой.",
      en: "What the mind returns to again and again shapes the path. When speech or action begins from an unwholesome intention, suffering follows close behind.",
      id: "Apa yang terus diarahkan oleh batin membentuk jalan kita. Ucapan atau tindakan yang berawal dari niat tidak baik membawa penderitaan mengikutinya.",
    },
  },
  {
    segmentUid: "dhp:2",
    theme: "Wholesome intention",
    renderings: {
      ru: "Когда слово и действие исходят из чистого намерения, счастье естественно следует за человеком, как тень, которая не отступает.",
      en: "When speech and action begin from a clear and wholesome intention, well-being follows naturally, like a shadow that stays near.",
      id: "Ketika ucapan dan tindakan berawal dari niat yang jernih dan baik, kebahagiaan mengikuti secara alami seperti bayangan yang dekat.",
    },
  },
  {
    segmentUid: "dhp:4",
    theme: "Letting go of resentment",
    renderings: {
      ru: "Обида ослабевает, когда мы перестаем снова удерживать историю нанесенной боли и не кормим ее повторением.",
      en: "Resentment loosens when we stop rehearsing the story of injury and refuse to keep feeding it with repetition.",
      id: "Dendam mulai longgar ketika kita berhenti mengulang cerita luka dan tidak terus memberinya makan dengan pengulangan.",
    },
  },
  {
    segmentUid: "dhp:5",
    theme: "Non-hatred",
    renderings: {
      ru: "Вражда не прекращается новой враждой. Ее можно остановить только отказом подпитывать ненависть.",
      en: "Hostility is not ended by adding more hostility. It ends only when hatred is no longer fed.",
      id: "Permusuhan tidak selesai dengan menambah permusuhan. Ia berakhir hanya ketika kebencian tidak lagi diberi makan.",
    },
  },
  {
    segmentUid: "dhp:6",
    theme: "Remembering mortality",
    renderings: {
      ru: "Память о конечности жизни смягчает ссоры: становится яснее, что удерживать вражду слишком дорого.",
      en: "Remembering that life is finite softens quarrels: it becomes clearer that carrying hostility costs too much.",
      id: "Mengingat bahwa hidup terbatas melembutkan pertengkaran: menjadi jelas bahwa membawa permusuhan terlalu mahal.",
    },
  },
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dayKey(date: Date | string | undefined): string {
  const d = date instanceof Date ? date : date ? new Date(date) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDailyWisdom(
  corpus: Corpus,
  options: WisdomOptions = {}
): DailyWisdom {
  const language = normalizeLanguage(options.language);
  const candidates = CURATED_WISDOM.map((entry) =>
    resolveWisdomItem(corpus, entry)
  ).filter((item): item is { entry: CuratedWisdomEntry; segment: DhammaSegment; item: DailyWisdomItem } =>
    Boolean(item)
  );

  if (candidates.length === 0) {
    throw new Error(
      "No eligible wisdom segments in corpus. Cannot ship unsourced wisdom."
    );
  }

  const idx = hashString(`${dayKey(options.date)}:daily-wisdom`) % candidates.length;
  const { entry, segment, item } = candidates[idx];

  return {
    segment,
    item,
    displayText: item.renderings[language] ?? item.renderings[DEFAULT_LANGUAGE],
    disclaimer: item.disclaimer[language] ?? item.disclaimer[DEFAULT_LANGUAGE],
    theme: options.theme ?? entry.theme,
    shortReflection: reflectionFor(language, item.sourceRef),
    practicePrompt: practicePromptFor(language),
    language,
    createdBy: "manual",
  };
}

function resolveWisdomItem(
  corpus: Corpus,
  entry: CuratedWisdomEntry
): { entry: CuratedWisdomEntry; segment: DhammaSegment; item: DailyWisdomItem } | null {
  const segment = corpus.segments.find((s) => s.segmentUid === entry.segmentUid);
  const sourceText = segment?.translationText?.trim();
  if (!segment || !sourceText || !segment.sourceRef) return null;

  return {
    entry,
    segment,
    item: {
      segmentUid: entry.segmentUid,
      sourceRef: segment.sourceRef,
      sourceText,
      sourceLanguage: segment.language,
      renderings: entry.renderings,
      renderingKind: "app-rendering",
      disclaimer: APP_RENDERING_DISCLAIMER,
    },
  };
}

function reflectionFor(language: SupportedLanguage, ref: string): string {
  switch (language) {
    case "ru":
      return `Это размышление помогает читать ${ref} как практическое напоминание о намерении, внимании и последствиях. Оно не заменяет исходный фрагмент.`;
    case "id":
      return `Renungan ini membantu membaca ${ref} sebagai pengingat praktis tentang niat, perhatian, dan akibat. Ini tidak menggantikan kutipan sumber.`;
    case "en":
    default:
      return `This reflection reads ${ref} as a practical reminder about intention, attention, and consequences. It does not replace the source excerpt.`;
  }
}

function practicePromptFor(language: SupportedLanguage): string {
  switch (language) {
    case "ru":
      return "Сегодня перед одним действием коротко проверьте намерение: что я сейчас питаю - ясность, доброжелательность или привычную реакцию?";
    case "id":
      return "Hari ini, sebelum satu tindakan, periksa niat sejenak: apa yang sedang saya beri makan - kejernihan, kebaikan, atau reaksi lama?";
    case "en":
    default:
      return "Today, before one action, briefly check the intention: what am I feeding right now - clarity, kindness, or a familiar reaction?";
  }
}
