import type { TeacherConcept } from "./types";

export const REQUIRED_CONCEPT_KEYS = [
  "dukkha",
  "anicca",
  "anatta",
  "tanha",
  "upadana",
  "nibbana",
  "four_noble_truths",
  "noble_eightfold_path",
  "mindfulness",
  "metta",
  "kamma",
  "rebirth",
  "five_aggregates",
  "dependent_origination",
  "meditation",
  "sila",
  "samadhi",
  "panna",
] as const;

const common = {
  en: {
    reflectionQuestion: "Where can this be observed directly in present experience?",
  },
  ru: {
    reflectionQuestion: "Где это можно увидеть прямо в нынешнем опыте?",
  },
  id: {
    reflectionQuestion: "Di mana hal ini dapat diamati langsung dalam pengalaman sekarang?",
  },
};

export const TEACHER_CONCEPTS: TeacherConcept[] = [
  {
    key: "dukkha",
    text: {
      en: {
        displayName: "dukkha",
        shortExplanation: "Dukkha means suffering, stress, or unsatisfactoriness. It is broader than pain: even pleasant experience is unstable and cannot give final security.",
        practicalExplanation: "Notice how grasping for experience to stay pleasant creates pressure. Seeing that pressure clearly is the beginning of release.",
        reflectionQuestion: "Where does wanting this moment to be different add stress?",
      },
      ru: {
        displayName: "dukkha",
        shortExplanation: "Dukkha означает страдание, напряжение или неудовлетворённость. Это шире, чем боль: даже приятный опыт непостоянен и не даёт окончательной опоры.",
        practicalExplanation: "Замечайте, как жажда удержать приятное или убрать неприятное создаёт напряжение и цепляние. Ясное видение этого напряжения открывает путь к освобождению.",
        reflectionQuestion: "Где желание изменить этот момент добавляет страдание?",
      },
      id: {
        displayName: "dukkha",
        shortExplanation: "Dukkha berarti penderitaan, tekanan, atau ketidakpuasan. Ini lebih luas daripada rasa sakit: pengalaman menyenangkan pun tidak stabil dan tidak memberi keamanan akhir.",
        practicalExplanation: "Perhatikan bagaimana kemelekatan pada pengalaman yang menyenangkan menciptakan tekanan. Melihat tekanan itu dengan jelas adalah awal pelepasan.",
        reflectionQuestion: "Di mana keinginan agar momen ini berbeda menambah tekanan?",
      },
    },
    sourceRefs: ["SN 56.11"],
    relatedConcepts: ["tanha", "upadana", "four_noble_truths"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["dukkha"],
      en: ["suffering", "stress", "unsatisfactoriness", "pain"],
      ru: ["дуккха", "дуккхи", "страдание", "страдания", "неудовлетворенность", "неудовлетворённость", "напряжение"],
      id: ["penderitaan", "ketidakpuasan", "tekanan"],
    },
  },
  {
    key: "anicca",
    text: {
      en: {
        displayName: "anicca",
        shortExplanation: "Anicca means impermanence: conditioned things arise, change, and pass away.",
        practicalExplanation: "Reflecting on change softens clinging, because what changes cannot be owned or held exactly as we want.",
        reflectionQuestion: "What changed today that you expected to remain the same?",
      },
      ru: {
        displayName: "anicca",
        shortExplanation: "Anicca означает непостоянство: обусловленные явления возникают, изменяются и исчезают.",
        practicalExplanation: "Размышление о переменчивости ослабляет цепляние, потому что изменяющееся невозможно удержать именно таким, как хочется.",
        reflectionQuestion: "Что сегодня изменилось, хотя вы ожидали постоянства?",
      },
      id: {
        displayName: "anicca",
        shortExplanation: "Anicca berarti ketidakkekalan: hal-hal yang terkondisi muncul, berubah, dan lenyap.",
        practicalExplanation: "Merenungkan perubahan melembutkan kemelekatan, karena yang berubah tidak dapat dimiliki sesuai keinginan kita.",
        reflectionQuestion: "Apa yang berubah hari ini padahal Anda mengharapkannya tetap sama?",
      },
    },
    sourceRefs: ["SN 56.11", "Dhammapada"],
    relatedConcepts: ["dukkha", "anatta", "five_aggregates"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["anicca"],
      en: ["impermanence", "impermanent", "change", "changing"],
      ru: ["непостоянство", "изменчивость", "переменчивость"],
      id: ["ketidakkekalan", "tidak kekal", "perubahan", "berubah"],
    },
  },
  {
    key: "anatta",
    text: {
      en: {
        displayName: "anattā",
        shortExplanation: "Anattā means not-self: body, feeling, perception, choices, and consciousness are not a permanent, controllable essence.",
        practicalExplanation: "Seeing experience as processes rather than a possession can reduce defensiveness and craving.",
        reflectionQuestion: "Which experience feels like 'mine' but changes outside your command?",
      },
      ru: {
        displayName: "anattā",
        shortExplanation: "Anattā означает не-я: тело, чувство, восприятие, намерения и сознание не являются постоянной управляемой сущностью.",
        practicalExplanation: "Когда опыт видится как процессы, а не как собственность, цепляние и самозащита могут ослабевать.",
        reflectionQuestion: "Какой опыт кажется «моим», но меняется не по вашей команде?",
      },
      id: {
        displayName: "anattā",
        shortExplanation: "Anattā berarti bukan-diri: tubuh, perasaan, persepsi, bentukan kehendak, dan kesadaran bukan inti tetap yang dapat dikendalikan.",
        practicalExplanation: "Melihat pengalaman sebagai proses, bukan milik pribadi, dapat mengurangi kemelekatan dan sikap defensif.",
        reflectionQuestion: "Pengalaman apa yang terasa 'milikku' tetapi berubah di luar kendali?",
      },
    },
    sourceRefs: ["SN 56.11", "Dhammapada"],
    relatedConcepts: ["anicca", "dukkha", "five_aggregates"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["anatta", "anattā"],
      en: ["not-self", "not self", "nonself", "no-self"],
      ru: ["не-я", "не я", "безличность", "отсутствие я"],
      id: ["bukan diri", "tanpa diri", "anatta"],
    },
  },
  {
    key: "tanha",
    text: {
      en: {
        displayName: "taṇhā",
        shortExplanation: "Taṇhā is craving: thirst for sensual pleasure, becoming, or non-becoming.",
        practicalExplanation: "Craving is felt as leaning forward into experience. Naming it helps create space before acting.",
        reflectionQuestion: "What is the mind thirsting for right now?",
      },
      ru: {
        displayName: "taṇhā",
        shortExplanation: "Taṇhā — это жажда: тяга к чувственным удовольствиям, становлению или исчезновению.",
        practicalExplanation: "Жажда ощущается как внутреннее тянущее движение к опыту. Когда её замечают, появляется пространство перед действием.",
        reflectionQuestion: "Чего ум жаждет прямо сейчас?",
      },
      id: {
        displayName: "taṇhā",
        shortExplanation: "Taṇhā adalah nafsu kehausan: hasrat akan kenikmatan indra, menjadi, atau tidak-menjadi.",
        practicalExplanation: "Kehausan batin terasa seperti condong mengejar pengalaman. Menamainya memberi ruang sebelum bertindak.",
        reflectionQuestion: "Apa yang sedang haus dikejar oleh batin saat ini?",
      },
    },
    sourceRefs: ["SN 56.11"],
    relatedConcepts: ["dukkha", "upadana", "dependent_origination"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["tanha", "taṇhā"],
      en: ["craving", "thirst", "desire"],
      ru: ["жажда", "тяга", "страстное желание"],
      id: ["tanha", "kehausan", "nafsu", "hasrat"],
    },
  },
  {
    key: "upadana",
    text: {
      en: {
        displayName: "upādāna",
        shortExplanation: "Upādāna is clinging or grasping: taking views, habits, pleasures, or identity as something to hold.",
        practicalExplanation: "Clinging tightens around what is already changing. Practice notices the tightening and relaxes it.",
        reflectionQuestion: "What are you holding so tightly that it holds you back?",
      },
      ru: {
        displayName: "upādāna",
        shortExplanation: "Upādāna — это цепляние: хватание за взгляды, привычки, удовольствия или идентичность.",
        practicalExplanation: "Цепляние сжимается вокруг того, что уже меняется. Практика замечает это сжатие и отпускает его.",
        reflectionQuestion: "За что вы держитесь так крепко, что оно удерживает вас?",
      },
      id: {
        displayName: "upādāna",
        shortExplanation: "Upādāna adalah kemelekatan atau genggaman pada pandangan, kebiasaan, kesenangan, atau identitas.",
        practicalExplanation: "Kemelekatan menegang pada sesuatu yang sedang berubah. Latihan melihat ketegangan itu dan melepasnya.",
        reflectionQuestion: "Apa yang Anda genggam begitu kuat hingga justru menahan Anda?",
      },
    },
    sourceRefs: ["SN 56.11"],
    relatedConcepts: ["tanha", "dukkha", "dependent_origination"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["upadana", "upādāna"],
      en: ["clinging", "grasping", "attachment"],
      ru: ["цепляние", "привязанность", "хватание"],
      id: ["kemelekatan", "melekat", "genggaman"],
    },
  },
  {
    key: "nibbana",
    text: {
      en: {
        displayName: "nibbāna",
        shortExplanation: "Nibbāna is the ending of greed, hatred, and delusion; the unbinding from dukkha.",
        practicalExplanation: "In practice, small moments of non-grasping point toward the peace described by the path.",
        reflectionQuestion: "What changes when craving is absent for one breath?",
      },
      ru: {
        displayName: "nibbāna",
        shortExplanation: "Nibbāna — прекращение жадности, ненависти и заблуждения; освобождение от dukkha.",
        practicalExplanation: "В практике даже краткие моменты нецепляния указывают на покой, к которому ведёт путь.",
        reflectionQuestion: "Что меняется, когда жажда отсутствует хотя бы один вдох?",
      },
      id: {
        displayName: "nibbāna",
        shortExplanation: "Nibbāna adalah padamnya keserakahan, kebencian, dan delusi; pelepasan dari dukkha.",
        practicalExplanation: "Dalam latihan, momen singkat tanpa genggaman menunjuk pada kedamaian yang dituju sang jalan.",
        reflectionQuestion: "Apa yang berubah ketika kehausan batin absen selama satu napas?",
      },
    },
    sourceRefs: ["SN 56.11", "Dhammapada"],
    relatedConcepts: ["four_noble_truths", "noble_eightfold_path", "panna"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["nibbana", "nibbāna", "nirvana"],
      en: ["nirvana", "liberation", "unbinding", "awakening"],
      ru: ["нирвана", "освобождение", "прекращение"],
      id: ["nibbana", "nirwana", "pembebasan"],
    },
  },
  {
    key: "four_noble_truths",
    text: {
      en: {
        displayName: "four noble truths",
        shortExplanation: "The four noble truths frame dukkha, its origin in craving, its cessation, and the path leading to cessation.",
        practicalExplanation: "They are a diagnostic pattern: understand stress, abandon its cause, realize release, and cultivate the path.",
        reflectionQuestion: "Can this difficulty be seen through cause, ending, and path?",
      },
      ru: {
        displayName: "четыре благородные истины",
        shortExplanation: "Четыре благородные истины описывают dukkha, её происхождение в жажде, прекращение и путь к прекращению.",
        practicalExplanation: "Это практическая диагностика: понять страдание, оставить его причину, реализовать прекращение и развивать путь.",
        reflectionQuestion: "Можно ли увидеть эту трудность через причину, прекращение и путь?",
      },
      id: {
        displayName: "empat kebenaran mulia",
        shortExplanation: "Empat kebenaran mulia menjelaskan dukkha, asalnya dalam kehausan, berhentinya dukkha, dan jalan menuju berhentinya.",
        practicalExplanation: "Ini pola diagnosis: pahami tekanan, tinggalkan penyebabnya, sadari pelepasan, dan latih jalan.",
        reflectionQuestion: "Dapatkah kesulitan ini dilihat melalui sebab, akhir, dan jalan?",
      },
    },
    sourceRefs: ["SN 56.11"],
    relatedConcepts: ["dukkha", "tanha", "noble_eightfold_path", "nibbana"],
    interpretationLevel: "source",
    keywords: {
      pali: ["cattari ariyasaccani"],
      en: ["four noble truths", "noble truths"],
      ru: ["четыре благородные истины", "благородные истины"],
      id: ["empat kebenaran mulia", "kebenaran mulia"],
    },
  },
  {
    key: "noble_eightfold_path",
    text: {
      en: {
        displayName: "noble eightfold path",
        shortExplanation: "The noble eightfold path trains view, intention, speech, action, livelihood, effort, mindfulness, and concentration.",
        practicalExplanation: "The path turns doctrine into conduct, meditation, and wisdom in daily choices.",
        reflectionQuestion: "Which factor of the path is most needed today?",
      },
      ru: {
        displayName: "благородный восьмеричный путь",
        shortExplanation: "Благородный восьмеричный путь развивает воззрение, намерение, речь, действие, образ жизни, усилие, осознанность и сосредоточение.",
        practicalExplanation: "Путь превращает учение в поведение, медитацию и мудрость повседневных решений.",
        reflectionQuestion: "Какой фактор пути особенно нужен сегодня?",
      },
      id: {
        displayName: "jalan mulia berunsur delapan",
        shortExplanation: "Jalan mulia berunsur delapan melatih pandangan, niat, ucapan, tindakan, penghidupan, usaha, perhatian, dan konsentrasi benar.",
        practicalExplanation: "Jalan ini menjadikan ajaran sebagai perilaku, meditasi, dan kebijaksanaan dalam pilihan sehari-hari.",
        reflectionQuestion: "Faktor jalan mana yang paling perlu dilatih hari ini?",
      },
    },
    sourceRefs: ["SN 56.11"],
    relatedConcepts: ["sila", "samadhi", "panna", "mindfulness"],
    interpretationLevel: "source",
    keywords: {
      pali: ["ariya atthangika magga"],
      en: ["eightfold path", "right view", "right livelihood", "path"],
      ru: ["восьмеричный путь", "правильное воззрение", "правильный образ жизни", "путь"],
      id: ["jalan mulia", "jalan berunsur delapan", "penghidupan benar"],
    },
  },
  {
    key: "mindfulness",
    text: {
      en: {
        displayName: "mindfulness",
        shortExplanation: "Mindfulness is clear remembering and observation of body, feelings, mind, and mental qualities.",
        practicalExplanation: "It brings experience close enough to see reactivity before it becomes speech or action.",
        reflectionQuestion: "What is known clearly before you name it pleasant or unpleasant?",
      },
      ru: {
        displayName: "осознанность",
        shortExplanation: "Осознанность — ясное памятование и наблюдение тела, чувств, ума и умственных качеств.",
        practicalExplanation: "Она приближает опыт настолько, чтобы увидеть реактивность до речи или поступка.",
        reflectionQuestion: "Что ясно известно до того, как вы называете это приятным или неприятным?",
      },
      id: {
        displayName: "perhatian sadar",
        shortExplanation: "Mindfulness adalah ingatan jernih dan pengamatan atas tubuh, perasaan, batin, dan kualitas batin.",
        practicalExplanation: "Ia membawa pengalaman cukup dekat untuk melihat reaksi sebelum menjadi ucapan atau tindakan.",
        reflectionQuestion: "Apa yang diketahui jelas sebelum Anda menamainya menyenangkan atau tidak menyenangkan?",
      },
    },
    sourceRefs: ["MN 10", "MN 118"],
    relatedConcepts: ["meditation", "samadhi", "noble_eightfold_path"],
    interpretationLevel: "source",
    keywords: {
      pali: ["sati", "satipatthana", "satipaṭṭhāna"],
      en: ["mindfulness", "aware", "awareness"],
      ru: ["осознанность", "внимательность", "памятование"],
      id: ["perhatian sadar", "sadar", "kesadaran", "mindfulness"],
    },
  },
  {
    key: "metta",
    text: {
      en: {
        displayName: "mettā",
        shortExplanation: "Mettā is loving-kindness: a sincere wish for welfare and safety for oneself and others.",
        practicalExplanation: "Mettā trains the heart away from ill will and toward non-harming.",
        reflectionQuestion: "Can goodwill be offered without needing anything in return?",
      },
      ru: {
        displayName: "mettā",
        shortExplanation: "Mettā — доброжелательность: искреннее пожелание благополучия и безопасности себе и другим.",
        practicalExplanation: "Mettā развивает сердце от недоброжелательности к ненанесению вреда.",
        reflectionQuestion: "Можно ли пожелать добра, ничего не требуя взамен?",
      },
      id: {
        displayName: "mettā",
        shortExplanation: "Mettā adalah cinta kasih: harapan tulus agar diri sendiri dan makhluk lain sejahtera dan aman.",
        practicalExplanation: "Mettā melatih hati menjauh dari niat buruk menuju tidak menyakiti.",
        reflectionQuestion: "Dapatkah niat baik diberikan tanpa menuntut balasan?",
      },
    },
    sourceRefs: ["Snp 1.8", "Dhammapada"],
    relatedConcepts: ["sila", "meditation", "samadhi"],
    interpretationLevel: "source",
    keywords: {
      pali: ["metta", "mettā"],
      en: ["loving-kindness", "loving kindness", "goodwill", "kindness"],
      ru: ["доброжелательность", "любящая доброта", "метта"],
      id: ["metta", "mettā", "cinta kasih", "niat baik"],
    },
  },
  {
    key: "kamma",
    text: {
      en: {
        displayName: "kamma",
        shortExplanation: "Kamma means intentional action. Its ethical weight lies in intention and its consequences.",
        practicalExplanation: "Before acting, ask what intention is being planted and what result it tends toward.",
        reflectionQuestion: "What intention is this action training?",
      },
      ru: {
        displayName: "kamma",
        shortExplanation: "Kamma означает намеренное действие. Его нравственный вес связан с намерением и последствиями.",
        practicalExplanation: "Перед действием спросите, какое намерение вы выращиваете и к какому результату оно ведёт.",
        reflectionQuestion: "Какое намерение тренирует это действие?",
      },
      id: {
        displayName: "kamma",
        shortExplanation: "Kamma berarti tindakan yang disengaja. Bobot etikanya terletak pada niat dan akibatnya.",
        practicalExplanation: "Sebelum bertindak, tanyakan niat apa yang sedang ditanam dan ke mana akibatnya cenderung.",
        reflectionQuestion: "Niat apa yang sedang dilatih oleh tindakan ini?",
      },
    },
    sourceRefs: ["Dhammapada", "DN 31"],
    relatedConcepts: ["sila", "rebirth", "noble_eightfold_path"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["kamma", "karma"],
      en: ["karma", "action", "intention", "intentional action"],
      ru: ["карма", "камма", "намерение", "поступок"],
      id: ["karma", "kamma", "niat", "tindakan"],
    },
  },
  {
    key: "rebirth",
    text: {
      en: {
        displayName: "rebirth",
        shortExplanation: "Rebirth is the continuation of conditioned existence according to causes, including kamma.",
        practicalExplanation: "Practically, the teaching asks us to take intention and consequence seriously beyond a single mood or moment.",
        reflectionQuestion: "What pattern are you helping to continue?",
      },
      ru: {
        displayName: "перерождение",
        shortExplanation: "Перерождение — продолжение обусловленного существования согласно причинам, включая kamma.",
        practicalExplanation: "Практически это учение просит серьёзно относиться к намерению и последствиям, не только к одному настроению или моменту.",
        reflectionQuestion: "Какой узор вы помогаете продолжать?",
      },
      id: {
        displayName: "kelahiran kembali",
        shortExplanation: "Kelahiran kembali adalah kelanjutan keberadaan terkondisi menurut sebab-sebab, termasuk kamma.",
        practicalExplanation: "Secara praktis, ajaran ini meminta kita menanggapi niat dan akibat dengan serius, melampaui satu suasana hati.",
        reflectionQuestion: "Pola apa yang sedang Anda bantu lanjutkan?",
      },
    },
    sourceRefs: ["Dhammapada"],
    relatedConcepts: ["kamma", "dependent_origination", "dukkha"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["punabbhava"],
      en: ["rebirth", "reincarnation", "becoming"],
      ru: ["перерождение", "новое рождение", "реинкарнация"],
      id: ["kelahiran kembali", "tumimbal lahir", "rebirth"],
    },
  },
  {
    key: "five_aggregates",
    text: {
      en: {
        displayName: "five aggregates",
        shortExplanation: "The five aggregates are form, feeling, perception, formations, and consciousness: a way to examine experience without assuming a fixed self.",
        practicalExplanation: "Breaking experience into aggregates helps reveal change, pressure, and not-self.",
        reflectionQuestion: "Is this experience body, feeling, perception, formation, consciousness, or a mix?",
      },
      ru: {
        displayName: "пять совокупностей",
        shortExplanation: "Пять совокупностей — форма, чувство, восприятие, формации и сознание: способ исследовать опыт без предположения о неизменном я.",
        practicalExplanation: "Разложение опыта на совокупности помогает увидеть изменение, напряжение и не-я.",
        reflectionQuestion: "Этот опыт — тело, чувство, восприятие, формация, сознание или их сочетание?",
      },
      id: {
        displayName: "lima gugusan",
        shortExplanation: "Lima gugusan adalah bentuk, perasaan, persepsi, bentukan, dan kesadaran: cara memeriksa pengalaman tanpa menganggap diri tetap.",
        practicalExplanation: "Membagi pengalaman menjadi gugusan membantu melihat perubahan, tekanan, dan bukan-diri.",
        reflectionQuestion: "Pengalaman ini tubuh, perasaan, persepsi, bentukan, kesadaran, atau gabungannya?",
      },
    },
    sourceRefs: ["SN 56.11"],
    relatedConcepts: ["anatta", "anicca", "dukkha"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["khandha", "skandha"],
      en: ["five aggregates", "aggregates", "form feeling perception"],
      ru: ["пять совокупностей", "совокупности", "скандхи"],
      id: ["lima gugusan", "gugusan", "skandha"],
    },
  },
  {
    key: "dependent_origination",
    text: {
      en: {
        displayName: "dependent origination",
        shortExplanation: "Dependent origination teaches that suffering arises through conditions rather than from a single self or creator.",
        practicalExplanation: "Look for conditions: contact, feeling, craving, clinging. Changing conditions changes the result.",
        reflectionQuestion: "What condition is feeding this reaction?",
      },
      ru: {
        displayName: "зависимое возникновение",
        shortExplanation: "Зависимое возникновение учит, что страдание возникает из условий, а не из отдельного неизменного я или творца.",
        practicalExplanation: "Ищите условия: контакт, чувство, жажда, цепляние. Меняя условия, меняют результат.",
        reflectionQuestion: "Какое условие питает эту реакцию?",
      },
      id: {
        displayName: "kemunculan bergantungan",
        shortExplanation: "Kemunculan bergantungan mengajarkan bahwa penderitaan muncul melalui kondisi, bukan dari satu diri tetap atau pencipta.",
        practicalExplanation: "Lihat kondisinya: kontak, perasaan, kehausan, kemelekatan. Mengubah kondisi mengubah hasil.",
        reflectionQuestion: "Kondisi apa yang memberi makan reaksi ini?",
      },
    },
    sourceRefs: ["SN 56.11"],
    relatedConcepts: ["tanha", "upadana", "rebirth", "dukkha"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["paticcasamuppada", "paṭiccasamuppāda"],
      en: ["dependent origination", "dependent arising", "conditions"],
      ru: ["зависимое возникновение", "обусловленное возникновение", "условия"],
      id: ["kemunculan bergantungan", "sebab kondisi", "berkondisi"],
    },
  },
  {
    key: "meditation",
    text: {
      en: {
        displayName: "meditation",
        shortExplanation: "Meditation is the deliberate cultivation of steadiness, mindfulness, kindness, and insight.",
        practicalExplanation: "Begin with a simple object such as the breath, then learn how the mind moves around it.",
        reflectionQuestion: "Can one breath be known without forcing it?",
      },
      ru: {
        displayName: "медитация",
        shortExplanation: "Медитация — намеренное развитие устойчивости, осознанности, доброжелательности и прозрения.",
        practicalExplanation: "Начните с простого объекта, например дыхания, и изучайте, как ум движется вокруг него.",
        reflectionQuestion: "Можно ли знать один вдох без принуждения?",
      },
      id: {
        displayName: "meditasi",
        shortExplanation: "Meditasi adalah pengembangan sengaja atas kestabilan, perhatian sadar, cinta kasih, dan kebijaksanaan.",
        practicalExplanation: "Mulailah dengan objek sederhana seperti napas, lalu pelajari bagaimana batin bergerak di sekitarnya.",
        reflectionQuestion: "Dapatkah satu napas diketahui tanpa dipaksa?",
      },
    },
    sourceRefs: ["MN 10", "MN 118", "Snp 1.8"],
    relatedConcepts: ["mindfulness", "samadhi", "metta"],
    interpretationLevel: "practical_reflection",
    keywords: {
      pali: ["bhavana", "anapanasati", "ānāpānasati"],
      en: ["meditation", "breath meditation", "breathing"],
      ru: ["медитация", "дыхание", "созерцание"],
      id: ["meditasi", "napas", "pernapasan"],
    },
  },
  {
    key: "sila",
    text: {
      en: {
        displayName: "sīla",
        shortExplanation: "Sīla is ethical conduct: restraint and care in body, speech, livelihood, and relationships.",
        practicalExplanation: "Ethics protects the mind from remorse and gives meditation a stable ground.",
        reflectionQuestion: "Which action today would leave the mind lighter?",
      },
      ru: {
        displayName: "sīla",
        shortExplanation: "Sīla — нравственное поведение: сдержанность и забота в теле, речи, образе жизни и отношениях.",
        practicalExplanation: "Нравственность защищает ум от сожаления и даёт медитации устойчивую основу.",
        reflectionQuestion: "Какой поступок сегодня оставит ум более лёгким?",
      },
      id: {
        displayName: "sīla",
        shortExplanation: "Sīla adalah perilaku etis: pengendalian dan kepedulian dalam tubuh, ucapan, penghidupan, dan relasi.",
        practicalExplanation: "Etika melindungi batin dari penyesalan dan memberi dasar stabil bagi meditasi.",
        reflectionQuestion: "Tindakan apa hari ini yang akan membuat batin lebih ringan?",
      },
    },
    sourceRefs: ["DN 31", "Snp 2.4", "Dhammapada"],
    relatedConcepts: ["noble_eightfold_path", "kamma", "metta"],
    interpretationLevel: "source",
    keywords: {
      pali: ["sila", "sīla"],
      en: ["ethics", "virtue", "conduct", "precepts", "right livelihood", "money"],
      ru: ["нравственность", "этика", "добродетель", "предписания", "деньги"],
      id: ["etika", "moralitas", "sila", "penghidupan benar", "uang"],
    },
  },
  {
    key: "samadhi",
    text: {
      en: {
        displayName: "samādhi",
        shortExplanation: "Samādhi is collectedness or concentration: the mind gathered and steady.",
        practicalExplanation: "A steadier mind sees more clearly and is less pushed around by craving and aversion.",
        reflectionQuestion: "What supports steadiness rather than agitation?",
      },
      ru: {
        displayName: "samādhi",
        shortExplanation: "Samādhi — собранность или сосредоточение: ум становится устойчивым и единым.",
        practicalExplanation: "Более устойчивый ум видит яснее и меньше подталкивается жаждой и отвращением.",
        reflectionQuestion: "Что поддерживает устойчивость, а не возбуждение?",
      },
      id: {
        displayName: "samādhi",
        shortExplanation: "Samādhi adalah keterkumpulan atau konsentrasi: batin yang terkumpul dan stabil.",
        practicalExplanation: "Batin yang lebih stabil melihat lebih jelas dan tidak mudah terdorong oleh nafsu atau penolakan.",
        reflectionQuestion: "Apa yang mendukung kestabilan, bukan kegelisahan?",
      },
    },
    sourceRefs: ["MN 118", "SN 56.11"],
    relatedConcepts: ["meditation", "mindfulness", "panna"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["samadhi", "samādhi"],
      en: ["concentration", "collectedness", "stillness"],
      ru: ["сосредоточение", "собранность", "устойчивость"],
      id: ["konsentrasi", "ketenangan", "terkumpul"],
    },
  },
  {
    key: "panna",
    text: {
      en: {
        displayName: "paññā",
        shortExplanation: "Paññā is wisdom: seeing experience in terms of impermanence, dukkha, not-self, and release.",
        practicalExplanation: "Wisdom grows when observation changes how we cling, speak, and act.",
        reflectionQuestion: "What does clear seeing ask you to release?",
      },
      ru: {
        displayName: "paññā",
        shortExplanation: "Paññā — мудрость: видение опыта через непостоянство, dukkha, не-я и освобождение.",
        practicalExplanation: "Мудрость растёт, когда наблюдение меняет то, как мы цепляемся, говорим и действуем.",
        reflectionQuestion: "Что ясное видение просит отпустить?",
      },
      id: {
        displayName: "paññā",
        shortExplanation: "Paññā adalah kebijaksanaan: melihat pengalaman melalui ketidakkekalan, dukkha, bukan-diri, dan pelepasan.",
        practicalExplanation: "Kebijaksanaan tumbuh ketika pengamatan mengubah cara kita melekat, berbicara, dan bertindak.",
        reflectionQuestion: "Apa yang diminta untuk dilepas oleh penglihatan jernih?",
      },
    },
    sourceRefs: ["SN 56.11", "Dhammapada"],
    relatedConcepts: ["anicca", "dukkha", "anatta", "nibbana"],
    interpretationLevel: "early_buddhist_explanation",
    keywords: {
      pali: ["panna", "paññā", "prajna"],
      en: ["wisdom", "discernment", "insight"],
      ru: ["мудрость", "прозрение", "понимание"],
      id: ["kebijaksanaan", "kearifan", "wawasan"],
    },
  },
];

export const TEACHER_CONCEPT_BY_KEY = new Map(
  TEACHER_CONCEPTS.map((concept) => [concept.key, concept])
);
