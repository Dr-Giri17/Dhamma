import { DEFAULT_LANGUAGE, type SupportedLanguage, normalizeLanguage } from "./i18n/language";

export interface UiStrings {
  language: {
    label: string;
  };
  nav: {
    home: string;
    read: string;
    search: string;
    ask: string;
    wisdom: string;
    terms: string;
  };
  subtitle: string;
  footer: {
    corpus: string;
    disclaimer: string;
  };
  home: {
    hero: string;
    tagline: string;
    cardSearch: string;
    cardSearchDesc: string;
    cardAsk: string;
    cardAskDesc: string;
    cardDhammapada: string;
    cardDhammapadaDesc: string;
    cardTerms: string;
    cardTermsDesc: string;
  };
  wisdom: {
    title: string;
    seeMore: string;
    reflection: string;
    practice: string;
    notAvailable: string;
    sourceRef: string;
    sourceExcerpt: string;
    sourceExcerptSummary: string;
    license: string;
  };
  tipitaka: {
    title: string;
    partialNote: string;
    vinaya: string;
    vinayaDesc: string;
    sutta: string;
    suttaDesc: string;
    abhidhamma: string;
    abhidhammaDesc: string;
    available: string;
  };
  visuddhimagga: {
    title: string;
    status: string;
  };
  ask: {
    title: string;
    description: string;
    placeholder: string;
    button: string;
    pending: string;
    confidence: string;
    warnings: string;
    retrievedPassages: string;
    error: string;
  };
  search: {
    title: string;
    description: string;
    placeholder: string;
    button: string;
    pending: string;
    diacriticNote: string;
    noResults: string;
  };
  reader: {
    title: string;
    description: string;
    segments: string;
    schemaOnly: string;
    blockedText: string;
    verse: string;
  };
  terms: {
    title: string;
    description: string;
    refs: string;
    draft: string;
  };
}

const en: UiStrings = {
  language: { label: "Language" },
  nav: {
    home: "Home",
    read: "Reader",
    search: "Search",
    ask: "Ask",
    wisdom: "Wisdom",
    terms: "Terms",
  },
  subtitle: "a source-grounded Theravada companion",
  footer: {
    corpus:
      "Corpus: Pali roots where available; Dhammapada in F. Max Muller 1881 public domain English; selected suttas via Bhikkhu Sujato CC0 translations from SuttaCentral/Bilara.",
    disclaimer:
      "Dhamma App does not provide medical, psychiatric, legal, or financial advice. In a crisis, contact local emergency services.",
  },
  home: {
    hero: "Dhamma",
    tagline:
      "Read, search, and reflect on Theravada texts with source-grounded explanations that cite their basis.",
    cardSearch: "Search the corpus",
    cardSearchDesc:
      "Find passages by Pali terms such as dukkha and anatta, or by English words.",
    cardAsk: "Ask about Dhamma",
    cardAskDesc:
      "Ask a question and get a cited answer. If the corpus does not support an answer, the app says so directly.",
    cardDhammapada: "Dhammapada",
    cardDhammapadaDesc:
      "Read the verses with Pali roots where available and the checked-in English translation.",
    cardTerms: "Terms",
    cardTermsDesc: "A short Pali glossary with canonical references.",
  },
  wisdom: {
    title: "Daily Wisdom",
    seeMore: "read more",
    reflection: "Reflection",
    practice: "Practice for today",
    notAvailable: "No sourced Daily Wisdom item is available yet.",
    sourceRef: "Source",
    sourceExcerpt: "Original corpus excerpt",
    sourceExcerptSummary: "Show original corpus excerpt",
    license: "License",
  },
  tipitaka: {
    title: "Canon / Tipitaka",
    partialNote:
      "The app currently contains a starter corpus. More texts can be added only after source and license review.",
    vinaya: "Vinaya Pitaka",
    vinayaDesc: "Monastic discipline, not yet represented in the corpus.",
    sutta: "Sutta Pitaka",
    suttaDesc: "Discourses available in the checked-in corpus.",
    abhidhamma: "Abhidhamma Pitaka",
    abhidhammaDesc: "Systematic teachings, not yet represented in the corpus.",
    available: "available",
  },
  visuddhimagga: {
    title: "Visuddhimagga",
    status:
      "Not included in the corpus. This section remains schema-only until source and license review is complete.",
  },
  ask: {
    title: "Ask about Dhamma",
    description:
      "Ask a Theravada question. Doctrinal answers must cite sources; unsupported answers fail closed instead of inventing quotations or Pali terms.",
    placeholder: "What did the Buddha say about suffering?  ·  What is tanha?",
    button: "Ask",
    pending: "Asking...",
    confidence: "Confidence:",
    warnings: "warnings:",
    retrievedPassages: "Retrieved passages",
    error: "Error:",
  },
  search: {
    title: "Search",
    description:
      "Search the Pali and English corpus. Canonical texts rank above commentary; exact Pali terms rank above approximate matches.",
    placeholder: "dukkha, anatta, suffering, mindfulness...",
    button: "Search",
    pending: "Searching...",
    diacriticNote: "Search ignores diacritics: anatta finds anatta with diacritics.",
    noResults: "No results yet. Try a Pali term or an English keyword.",
  },
  reader: {
    title: "Reader",
    description:
      "Browse the corpus by collection. Each text shows source, translator, and license.",
    segments: "segments",
    schemaOnly:
      "Post-canonical commentary. Schema only; text is pending license review.",
    blockedText:
      "This text is the Visuddhimagga, a post-canonical commentary by Buddhaghosa. It is not part of the Tipitaka and is not presented as words of the Buddha. Text ingestion is pending source and license review.",
    verse: "verse",
  },
  terms: {
    title: "Terms",
    description:
      "A short Pali glossary. Each term includes canonical references so definitions stay tied to sources.",
    refs: "Refs:",
    draft: "draft",
  },
};

const ru: UiStrings = {
  language: { label: "Язык" },
  nav: {
    home: "Главная",
    read: "Чтение",
    search: "Поиск",
    ask: "Спросить",
    wisdom: "Мудрость",
    terms: "Термины",
  },
  subtitle: "приложение по Тхераваде с опорой на источники",
  footer: {
    corpus:
      "Корпус: корни на пали, где доступны; Дхаммапада в английском переводе Ф. Макса Мюллера 1881 года, общественное достояние; избранные сутты через переводы Бхиккху Суджато CC0 из SuttaCentral/Bilara.",
    disclaimer:
      "Dhamma App не дает медицинских, психиатрических, юридических или финансовых рекомендаций. В кризисной ситуации обратитесь в местные экстренные службы.",
  },
  home: {
    hero: "Дхамма",
    tagline:
      "Читайте, ищите и размышляйте над текстами Тхеравады с пояснениями, которые всегда указывают источники.",
    cardSearch: "Поиск по корпусу",
    cardSearchDesc:
      "Ищите фрагменты по терминам пали, например dukkha и anatta, или по английским словам.",
    cardAsk: "Спросить о Дхамме",
    cardAskDesc:
      "Задайте вопрос и получите ответ с цитируемыми источниками. Если корпус не дает опоры, приложение скажет об этом прямо.",
    cardDhammapada: "Дхаммапада",
    cardDhammapadaDesc:
      "Читайте строфы с корнем на пали, где он доступен, и проверенным английским переводом из корпуса.",
    cardTerms: "Термины",
    cardTermsDesc: "Краткий словарь пали с каноническими ссылками.",
  },
  wisdom: {
    title: "Мудрость дня",
    seeMore: "читать далее",
    reflection: "Размышление",
    practice: "Практика на сегодня",
    notAvailable: "Пока нет фрагмента для Мудрости дня с надежным источником.",
    sourceRef: "Источник",
    sourceExcerpt: "Исходный фрагмент корпуса",
    sourceExcerptSummary: "Показать исходный фрагмент корпуса",
    license: "Лицензия",
  },
  tipitaka: {
    title: "Канон / Tipitaka",
    partialNote:
      "Сейчас в приложении есть начальный корпус. Новые тексты добавляются только после проверки источника и лицензии.",
    vinaya: "Виная-питака",
    vinayaDesc: "Монашеская дисциплина пока не представлена в корпусе.",
    sutta: "Сутта-питака",
    suttaDesc: "Доступные в корпусе беседы.",
    abhidhamma: "Абхидхамма-питака",
    abhidhammaDesc: "Систематическое учение пока не представлено в корпусе.",
    available: "доступно",
  },
  visuddhimagga: {
    title: "Висуддхимагга",
    status:
      "Не включена в корпус. Раздел остается только схемой до проверки источника и лицензии.",
  },
  ask: {
    title: "Спросить о Дхамме",
    description:
      "Задайте вопрос о Тхераваде. Доктринальные ответы должны ссылаться на источники; неподдержанные ответы закрываются отказом, а не выдумывают цитаты или термины пали.",
    placeholder: "Что Будда говорил о страдании?  ·  Что такое tanha?",
    button: "Спросить",
    pending: "Спрашиваю...",
    confidence: "Уверенность:",
    warnings: "предупреждения:",
    retrievedPassages: "Найденные фрагменты",
    error: "Ошибка:",
  },
  search: {
    title: "Поиск",
    description:
      "Поиск по корпусу на пали и английском. Канонические тексты ранжируются выше комментариев; точные термины пали выше приблизительных совпадений.",
    placeholder: "dukkha, anatta, suffering, mindfulness...",
    button: "Искать",
    pending: "Ищу...",
    diacriticNote: "Поиск игнорирует диакритику: anatta находит anatta с диакритикой.",
    noResults: "Результатов пока нет. Попробуйте термин пали или английское ключевое слово.",
  },
  reader: {
    title: "Чтение",
    description:
      "Просматривайте корпус по собраниям. Каждый текст показывает источник, переводчика и лицензию.",
    segments: "фрагментов",
    schemaOnly:
      "Постканонический комментарий. Только схема; текст ожидает проверки лицензии.",
    blockedText:
      "Этот текст - Висуддхимагга, постканонический комментарий Буддхагхоши. Он не является частью Tipitaka и не представлен как слова Будды. Добавление текста ожидает проверки источника и лицензии.",
    verse: "строфа",
  },
  terms: {
    title: "Термины",
    description:
      "Краткий словарь пали. Каждый термин снабжен каноническими ссылками, чтобы определения оставались привязаны к источникам.",
    refs: "Ссылки:",
    draft: "черновик",
  },
};

const id: UiStrings = {
  language: { label: "Bahasa" },
  nav: {
    home: "Beranda",
    read: "Pembaca",
    search: "Cari",
    ask: "Tanya",
    wisdom: "Kebijaksanaan",
    terms: "Istilah",
  },
  subtitle: "pendamping Theravada yang berpijak pada sumber",
  footer: {
    corpus:
      "Korpus: akar Pali jika tersedia; Dhammapada dalam terjemahan Inggris F. Max Muller 1881 domain publik; sutta terpilih melalui terjemahan Bhikkhu Sujato CC0 dari SuttaCentral/Bilara.",
    disclaimer:
      "Dhamma App tidak memberi nasihat medis, psikiatris, hukum, atau keuangan. Dalam krisis, hubungi layanan darurat setempat.",
  },
  home: {
    hero: "Dhamma",
    tagline:
      "Baca, cari, dan renungkan teks Theravada dengan penjelasan yang selalu menyebut sumbernya.",
    cardSearch: "Cari dalam korpus",
    cardSearchDesc:
      "Temukan bagian dengan istilah Pali seperti dukkha dan anatta, atau kata bahasa Inggris.",
    cardAsk: "Tanya tentang Dhamma",
    cardAskDesc:
      "Ajukan pertanyaan dan dapatkan jawaban bersumber. Jika korpus tidak mendukung jawaban, aplikasi menyatakannya langsung.",
    cardDhammapada: "Dhammapada",
    cardDhammapadaDesc:
      "Baca syair dengan akar Pali jika tersedia dan terjemahan Inggris yang ada dalam korpus.",
    cardTerms: "Istilah",
    cardTermsDesc: "Glosarium Pali singkat dengan rujukan kanonis.",
  },
  wisdom: {
    title: "Kebijaksanaan Harian",
    seeMore: "baca lagi",
    reflection: "Renungan",
    practice: "Latihan hari ini",
    notAvailable: "Belum ada Kebijaksanaan Harian yang bersumber.",
    sourceRef: "Sumber",
    sourceExcerpt: "Kutipan korpus asli",
    sourceExcerptSummary: "Tampilkan kutipan korpus asli",
    license: "Lisensi",
  },
  tipitaka: {
    title: "Kanon / Tipitaka",
    partialNote:
      "Aplikasi saat ini berisi korpus awal. Teks lain hanya ditambahkan setelah pemeriksaan sumber dan lisensi.",
    vinaya: "Vinaya Pitaka",
    vinayaDesc: "Disiplin monastik belum ada dalam korpus.",
    sutta: "Sutta Pitaka",
    suttaDesc: "Khotbah yang tersedia dalam korpus.",
    abhidhamma: "Abhidhamma Pitaka",
    abhidhammaDesc: "Ajaran sistematis belum ada dalam korpus.",
    available: "tersedia",
  },
  visuddhimagga: {
    title: "Visuddhimagga",
    status:
      "Tidak disertakan dalam korpus. Bagian ini tetap berupa skema sampai sumber dan lisensi selesai ditinjau.",
  },
  ask: {
    title: "Tanya tentang Dhamma",
    description:
      "Ajukan pertanyaan Theravada. Jawaban doktrinal harus mengutip sumber; jawaban yang tidak didukung ditutup dengan penolakan, bukan membuat kutipan atau istilah Pali.",
    placeholder: "Apa yang Buddha katakan tentang penderitaan?  ·  Apa itu tanha?",
    button: "Tanya",
    pending: "Menanya...",
    confidence: "Keyakinan:",
    warnings: "peringatan:",
    retrievedPassages: "Bagian yang ditemukan",
    error: "Galat:",
  },
  search: {
    title: "Cari",
    description:
      "Cari dalam korpus Pali dan Inggris. Teks kanonis diberi peringkat di atas komentar; istilah Pali tepat di atas kecocokan perkiraan.",
    placeholder: "dukkha, anatta, suffering, mindfulness...",
    button: "Cari",
    pending: "Mencari...",
    diacriticNote: "Pencarian mengabaikan diakritik: anatta menemukan anatta dengan diakritik.",
    noResults: "Belum ada hasil. Coba istilah Pali atau kata kunci Inggris.",
  },
  reader: {
    title: "Pembaca",
    description:
      "Telusuri korpus menurut koleksi. Setiap teks menampilkan sumber, penerjemah, dan lisensi.",
    segments: "bagian",
    schemaOnly:
      "Komentar pascakanonis. Hanya skema; teks menunggu pemeriksaan lisensi.",
    blockedText:
      "Teks ini adalah Visuddhimagga, komentar pascakanonis oleh Buddhaghosa. Ini bukan bagian dari Tipitaka dan tidak disajikan sebagai sabda Buddha. Pemuatan teks menunggu pemeriksaan sumber dan lisensi.",
    verse: "syair",
  },
  terms: {
    title: "Istilah",
    description:
      "Glosarium Pali singkat. Setiap istilah memiliki rujukan kanonis agar definisi tetap terkait dengan sumber.",
    refs: "Rujukan:",
    draft: "draf",
  },
};

export const UI_STRINGS: Record<SupportedLanguage, UiStrings> = { en, ru, id };

export function getUi(language: string | undefined | null): UiStrings {
  return UI_STRINGS[normalizeLanguage(language)];
}

export const UI = UI_STRINGS[DEFAULT_LANGUAGE];
