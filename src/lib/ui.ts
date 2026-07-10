import { DEFAULT_LANGUAGE, type SupportedLanguage, normalizeLanguage } from "./i18n/language";

export interface UiStrings {
  language: {
    label: string;
  };
  nav: {
    home: string;
    library: string;
    read: string;
    search: string;
    ask: string;
    voice: string;
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
    cardVoice: string;
    cardVoiceDesc: string;
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
    unavailable: string;
    fullCanonMissing: string;
    currentCoverage: string;
    fallbackEnglish: string;
  };
  visuddhimagga: {
    title: string;
    status: string;
    classification: string;
    notBuddhaQuote: string;
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
    paliText: string;
    translation: string;
    englishAvailable: string;
    selectedMissing: string;
    fallbackEnglish: string;
    partialTranslation: string;
    sourceAndLicense: string;
    backToLibrary: string;
    fallbackBadge: string;
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
    library: "Library",
    read: "Reader",
    search: "Search",
    ask: "Ask",
    voice: "Dhamma Voice",
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
    cardVoice: "Learn with Dhamma Voice",
    cardVoiceDesc:
      "Explore Buddhist doctrine through a calm teacher mode that stays grounded in mapped source texts.",
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
      "The complete verified Chaṭṭha Saṅgāyana Pāli edition is available in paginated form.",
    vinaya: "Vinaya Pitaka",
    vinayaDesc: "Monastic discipline, available in the full Pāli corpus.",
    sutta: "Sutta Pitaka",
    suttaDesc: "Discourses available in the checked-in corpus.",
    abhidhamma: "Abhidhamma Pitaka",
    abhidhammaDesc: "Systematic teachings, available in the full Pāli corpus.",
    available: "available",
    unavailable: "not yet available",
    fullCanonMissing: "The complete verified Pāli edition is imported.",
    currentCoverage: "Current verified coverage",
    fallbackEnglish: "fallback EN",
  },
  visuddhimagga: {
    title: "Visuddhimagga",
    status:
      "The VRI Pāli Visuddhimagga is imported as post-canonical text. The protected BPS English translation is not included.",
    classification: "Commentarial / post-canonical",
    notBuddhaQuote: "Not presented as words of the Buddha.",
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
      "Search the Pāli, English, and Russian corpus. Canonical texts rank above post-canonical works; exact normalized terms use bounded language shards.",
    placeholder: "dukkha, anatta, suffering, mindfulness...",
    button: "Search",
    pending: "Searching...",
    diacriticNote: "Search ignores diacritics: anatta finds anatta with diacritics.",
    noResults: "No results yet. Try a Pāli, English, or Russian keyword.",
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
    paliText: "Pāli text",
    translation: "Translation",
    englishAvailable: "English translation is available.",
    selectedMissing: "Selected-language translation is not yet in the corpus.",
    fallbackEnglish: "The available English translation is shown.",
    partialTranslation: "Some segments do not yet have the selected-language translation.",
    sourceAndLicense: "Source and license",
    backToLibrary: "Library / Tipiṭaka",
    fallbackBadge: "fallback EN",
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
    library: "Библиотека",
    read: "Чтение",
    search: "Поиск",
    ask: "Спросить",
    voice: "Голос Дхаммы",
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
      "Ищите фрагменты по терминам пали, английским или русским словам.",
    cardAsk: "Спросить о Дхамме",
    cardAskDesc:
      "Задайте вопрос и получите ответ с цитируемыми источниками. Если корпус не дает опоры, приложение скажет об этом прямо.",
    cardVoice: "Учиться с Голосом Дхаммы",
    cardVoiceDesc:
      "Исследуйте буддийское учение в спокойном режиме наставления с опорой на сопоставленные источники.",
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
      "Полная проверенная палийская редакция Чаттха Сангаяна доступна с постраничной загрузкой.",
    vinaya: "Виная-питака",
    vinayaDesc: "Монашеская дисциплина доступна в полном палийском корпусе.",
    sutta: "Сутта-питака",
    suttaDesc: "Доступные в корпусе беседы.",
    abhidhamma: "Абхидхамма-питака",
    abhidhammaDesc: "Систематическое учение доступно в полном палийском корпусе.",
    available: "доступно",
    unavailable: "пока недоступно",
    fullCanonMissing: "Полная проверенная палийская редакция импортирована.",
    currentCoverage: "Текущее проверенное покрытие",
    fallbackEnglish: "резервный EN",
  },
  visuddhimagga: {
    title: "Висуддхимагга",
    status:
      "Палийская Висуддхимагга VRI импортирована как постканонический текст. Защищённый английский перевод BPS не включён.",
    classification: "Комментарий / post-canonical",
    notBuddhaQuote: "Не представлено как слова Будды.",
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
      "Поиск по корпусу на пали, английском и русском. Канонические тексты ранжируются выше постканонических; используются ограниченные языковые шарды.",
    placeholder: "dukkha, anatta, suffering, mindfulness...",
    button: "Искать",
    pending: "Ищу...",
    diacriticNote: "Поиск игнорирует диакритику: anatta находит anatta с диакритикой.",
    noResults: "Результатов пока нет. Попробуйте ключевое слово на пали, английском или русском.",
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
    paliText: "Текст на пали",
    translation: "Перевод",
    englishAvailable: "Доступен английский перевод.",
    selectedMissing: "Русский перевод пока не включён в корпус.",
    fallbackEnglish: "Показан доступный английский перевод.",
    partialTranslation: "Для некоторых фрагментов перевод на выбранный язык пока отсутствует.",
    sourceAndLicense: "Источник и лицензия",
    backToLibrary: "Библиотека / Трипитака",
    fallbackBadge: "резервный EN",
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
    library: "Pustaka",
    read: "Pembaca",
    search: "Cari",
    ask: "Tanya",
    voice: "Suara Dhamma",
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
    cardVoice: "Belajar dengan Suara Dhamma",
    cardVoiceDesc:
      "Jelajahi ajaran Buddha melalui mode guru yang tenang dan tetap berpijak pada sumber yang dipetakan.",
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
      "Edisi Pāli Chaṭṭha Saṅgāyana lengkap yang telah diverifikasi tersedia dengan pemuatan per halaman.",
    vinaya: "Vinaya Pitaka",
    vinayaDesc: "Disiplin monastik tersedia dalam korpus Pāli lengkap.",
    sutta: "Sutta Pitaka",
    suttaDesc: "Khotbah yang tersedia dalam korpus.",
    abhidhamma: "Abhidhamma Pitaka",
    abhidhammaDesc: "Ajaran sistematis tersedia dalam korpus Pāli lengkap.",
    available: "tersedia",
    unavailable: "belum tersedia",
    fullCanonMissing: "Edisi Pāli lengkap yang terverifikasi telah diimpor.",
    currentCoverage: "Cakupan terverifikasi saat ini",
    fallbackEnglish: "cadangan EN",
  },
  visuddhimagga: {
    title: "Visuddhimagga",
    status:
      "Visuddhimagga Pāli VRI diimpor sebagai teks pascakanonis. Terjemahan Inggris BPS yang dilindungi tidak disertakan.",
    classification: "Komentar / pascakanonis",
    notBuddhaQuote: "Tidak disajikan sebagai sabda Buddha.",
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
      "Cari dalam korpus Pāli, Inggris, dan Rusia. Teks kanonis diberi peringkat di atas teks pascakanonis dengan shard bahasa yang terbatas.",
    placeholder: "dukkha, anatta, suffering, mindfulness...",
    button: "Cari",
    pending: "Mencari...",
    diacriticNote: "Pencarian mengabaikan diakritik: anatta menemukan anatta dengan diakritik.",
    noResults: "Belum ada hasil. Coba kata kunci Pāli, Inggris, atau Rusia.",
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
    paliText: "Teks Pāli",
    translation: "Terjemahan",
    englishAvailable: "Terjemahan bahasa Inggris tersedia.",
    selectedMissing: "Terjemahan bahasa Indonesia belum tersedia dalam korpus.",
    fallbackEnglish: "Terjemahan bahasa Inggris yang tersedia ditampilkan.",
    partialTranslation: "Beberapa bagian belum memiliki terjemahan dalam bahasa yang dipilih.",
    sourceAndLicense: "Sumber dan lisensi",
    backToLibrary: "Pustaka / Tipiṭaka",
    fallbackBadge: "cadangan EN",
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
