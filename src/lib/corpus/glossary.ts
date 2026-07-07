/**
 * Curated Pāli glossary (ТЗ §5 `terms`, §8.1 Terms screen).
 *
 * Each entry carries a short definition AND a canonical reference, so the
 * glossary is itself source-grounded rather than free-floating commentary.
 * Status is explicit: 'reviewed' entries have a human-verified definition;
 * 'draft' entries are placeholders that must not be cited as final.
 */

export interface GlossaryEntry {
  pali: string;
  sanskrit?: string;
  english: string;
  russian?: string;
  shortDefinition: string;
  canonicalRefs: string[];
  status: "draft" | "reviewed";
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    pali: "dukkha",
    sanskrit: "duḥkha",
    english: "suffering / unsatisfactoriness",
    russian: "страдание / неудовлетворённость",
    shortDefinition:
      "The first Noble Truth: the inherent unsatisfactoriness of conditioned experience.",
    canonicalRefs: ["SN 56.11", "Dhp 1"],
    status: "reviewed",
  },
  {
    pali: "anicca",
    sanskrit: "anitya",
    english: "impermanence",
    russian: "непостоянство",
    shortDefinition:
      "All conditioned phenomena arise and pass; nothing compounded lasts.",
    canonicalRefs: ["SN 56.11"],
    status: "reviewed",
  },
  {
    pali: "anattā",
    sanskrit: "anātman",
    english: "not-self",
    russian: "отсутствие постоянного «я»",
    shortDefinition:
      "No conditioned phenomenon is a permanent self; what we call 'self' is a process.",
    canonicalRefs: ["Dhp 1", "SN 56.11"],
    status: "reviewed",
  },
  {
    pali: "taṇhā",
    sanskrit: "tṛṣṇā",
    english: "craving / thirst",
    russian: "жажда",
    shortDefinition:
      "The origin of suffering (second Noble Truth): craving for sense-pleasure, becoming, and non-becoming.",
    canonicalRefs: ["SN 56.11"],
    status: "reviewed",
  },
  {
    pali: "sati",
    sanskrit: "smṛti",
    english: "mindfulness",
    russian: "осознанность",
    shortDefinition:
      "Present-moment, non-judgmental awareness; a factor of the Noble Eightfold Path.",
    canonicalRefs: ["SN 56.11"],
    status: "reviewed",
  },
  {
    pali: "samādhi",
    english: "concentration",
    russian: "сосредоточение",
    shortDefinition:
      "One-pointed collectedness of mind; developed through right effort and mindfulness.",
    canonicalRefs: ["SN 56.11"],
    status: "reviewed",
  },
  {
    pali: "mettā",
    sanskrit: "maitrī",
    english: "loving-kindness",
    russian: "любящая доброта",
    shortDefinition:
      "Goodwill toward all beings without exception; hatred ceases by mettā, not by hatred.",
    canonicalRefs: ["Dhp 5"],
    status: "reviewed",
  },
  {
    pali: "nibbāna",
    sanskrit: "nirvāṇa",
    english: "liberation / extinguishing",
    russian: "освобождение",
    shortDefinition:
      "The cessation of craving and suffering; the third Noble Truth.",
    canonicalRefs: ["SN 56.11"],
    status: "reviewed",
  },
];
