import {
  BILARA_ADDITIONAL_TRANSLATIONS,
  BILARA_REVISION,
  BILARA_TARGETS,
  additionalTranslationPath,
  rootPath,
  translationPath,
  uidToSourceRef,
} from "./bilara";
import type { CorpusEditionManifest } from "./types";

const BILARA_REPOSITORY = "suttacentral/bilara-data";
const BILARA_RAW = `https://raw.githubusercontent.com/${BILARA_REPOSITORY}/${BILARA_REVISION}`;
const CC0_URL = "https://creativecommons.org/publicdomain/zero/1.0/";
const SC_LICENSE_URL = "https://suttacentral.net/licensing";
const RETRIEVED_AT = "2026-07-09";

/** SHA-256 of the exact upstream bytes used by the checked-in corpus. */
export const SOURCE_SHA256: Readonly<Record<string, string>> = {
  "root/pli/ms/sutta/mn/mn10_root-pli-ms.json": "34c9a49a84a76d70fc366529973cfe8d1627728f38057de9117e67328fea745b",
  "translation/en/sujato/sutta/mn/mn10_translation-en-sujato.json": "9ec4ddadddd2fa3d48cbf3a646b5fe0c42402cec547772d66a7d3d175d0d8c4c",
  "translation/ru/sv/sutta/mn/mn10_translation-ru-sv.json": "fad7019437d3f8101afc29087e3be3e2ee5459a9f7a8132fe5eb7e2dcbe9ead5",
  "root/pli/ms/sutta/mn/mn118_root-pli-ms.json": "65eeb3cb1e395fa4aa103928c2262e2f50bad8d76b197534746e161ef988c15c",
  "translation/en/sujato/sutta/mn/mn118_translation-en-sujato.json": "36920342ec978dcb85fb141d35091442799dc96c94f726204448ee413262328a",
  "translation/ru/sv/sutta/mn/mn118_translation-ru-sv.json": "369c342cac1c0f6270e782ee84c2840c235f6b903119b7d14f13e22c22398ca8",
  "root/pli/ms/sutta/dn/dn31_root-pli-ms.json": "7b14e99b8e11e7d85af51aadb900797ce2c66ed1e15ea16b0917348e0204e9dd",
  "translation/en/sujato/sutta/dn/dn31_translation-en-sujato.json": "f0c039ab7fba061366cf88a893d598a8ff06fe35c327ff11d160e066d4f4d275",
  "translation/ru/khantibalo/sutta/dn/dn31_translation-ru-khantibalo.json": "f32aed0720eae6e55bad6ae7d96e3b97216c7e6bf3ec440ee283662b9cea42ac",
  "root/pli/ms/sutta/an/an3/an3.65_root-pli-ms.json": "72394e0d7c6e739d607585d1aed747fd095c91a9e5526ce792f35d6c680e6b9d",
  "translation/en/sujato/sutta/an/an3/an3.65_translation-en-sujato.json": "3f6fc2992df0b3e1dc08c6ae58a10d46577627da1ba1372a9c6529d29dcc355e",
  "root/pli/ms/sutta/sn/sn56/sn56.11_root-pli-ms.json": "c733b9ad6007f88b95bedd8904599f76d9b7fa999be2d56b9cd87c5acb4550d7",
  "translation/en/sujato/sutta/sn/sn56/sn56.11_translation-en-sujato.json": "f1d4ecd93aca4b3329d1a6c6123f469f9141723a4c0de15ddcf3847a4a5c5430",
  "translation/ru/sv/sutta/sn/sn56/sn56.11_translation-ru-sv.json": "6fc35b75431ae546b1aeddc1659a35d4e38be97b9fcfb3da78e557365a0eb617",
  "root/pli/ms/sutta/kn/snp/vagga1/snp1.8_root-pli-ms.json": "0c7dc7cd588a66bfe800a52bc10636ceecb96f62d7106a59c29601c86d29d272",
  "translation/en/sujato/sutta/kn/snp/vagga1/snp1.8_translation-en-sujato.json": "937626dbaa7c3f6a46dfe3ddf1a51018befcb5ab20e863b080d1c9c6d9ca6565",
  "translation/ru/sv/sutta/kn/snp/vagga1/snp1.8_translation-ru-sv.json": "c3d2f73e5d277ec9ad0d03db23bcefc0dfbb2ad132d9663d609626980c2cfdad",
  "root/pli/ms/sutta/kn/snp/vagga2/snp2.1_root-pli-ms.json": "fc829e63d66ea54db8d3320c713e99969775853679591da221fc43bbd3804a3f",
  "translation/en/sujato/sutta/kn/snp/vagga2/snp2.1_translation-en-sujato.json": "1ba568226129e787caa499592955f1f31391b2411836869d38614f97f3387b42",
  "root/pli/ms/sutta/kn/snp/vagga2/snp2.4_root-pli-ms.json": "55ed614de0258f4f449878f90f52be5234c59e93ff3ca88b4878872b2a2906be",
  "translation/en/sujato/sutta/kn/snp/vagga2/snp2.4_translation-en-sujato.json": "fd537f85fd89a17789cec994232c5cda73514e7f10106285f1738ce4f2f1b033",
  "pg2017.txt": "f2d09ebf28af0bf87ae7be7635d485b142e6526cb2cc164ba01c74586ff547bb",
};

const COLLECTIONS: Readonly<Record<string, string>> = {
  mn10: "Majjhima Nikāya",
  mn118: "Majjhima Nikāya",
  dn31: "Dīgha Nikāya",
  "an3.65": "Aṅguttara Nikāya",
  "sn56.11": "Saṃyutta Nikāya",
  "snp1.8": "Khuddaka Nikāya / Sutta Nipāta",
  "snp2.1": "Khuddaka Nikāya / Sutta Nipāta",
  "snp2.4": "Khuddaka Nikāya / Sutta Nipāta",
};

function textId(uid: string): string {
  return uid === "sn56.11" ? "text-sn56.11" : `text-${uid.replace(/\W/g, "")}`;
}

function checkedSha(sourceFile: string): string {
  const hash = SOURCE_SHA256[sourceFile];
  if (!hash) throw new Error(`Missing audited SHA-256 for ${sourceFile}`);
  return hash;
}

const bilaraEditions: CorpusEditionManifest[] = BILARA_TARGETS.flatMap((target) => {
  const title = uidToSourceRef(target.uid);
  const common = {
    workId: target.workId,
    textId: textId(target.uid),
    segmentIdFormat: `${target.uid}:*`,
    title,
    basket: "sutta" as const,
    collection: COLLECTIONS[target.uid] ?? title,
    canonicalStatus: "canonical" as const,
    publisher: "SuttaCentral",
    sourceRepository: BILARA_REPOSITORY,
    sourceRevision: BILARA_REVISION,
    redistributionAllowed: true,
    modificationAllowed: true,
    attributionRequired: false,
    retrievedAt: RETRIEVED_AT,
    imported: true,
  };
  const rootFile = rootPath(target);
  const enFile = translationPath(target);
  const additional = BILARA_ADDITIONAL_TRANSLATIONS.filter(
    (candidate) => candidate.uid === target.uid
  ).map((candidate): CorpusEditionManifest => {
    const sourceFile = additionalTranslationPath(candidate);
    return {
      ...common,
      language: candidate.language,
      isRootText: false,
      isTranslation: true,
      translator: candidate.translator,
      sourceUrl: `${BILARA_RAW}/${sourceFile}`,
      sourceFile,
      licenseName: "CC0 1.0 Universal (CC0 1.0)",
      licenseUrl: CC0_URL,
      sha256: checkedSha(sourceFile),
      notes: `${candidate.publicationNumber}; ${candidate.publicationStatus}`,
      capabilities: [
        "source_link_available",
        "translation_available",
        "parallel_text_available",
      ],
    };
  });

  return [
    {
      ...common,
      language: "pli",
      isRootText: true,
      isTranslation: false,
      translator: "Not applicable (Pāli root text)",
      sourceUrl: `${BILARA_RAW}/${rootFile}`,
      sourceFile: rootFile,
      licenseName: "Public Domain",
      licenseUrl: SC_LICENSE_URL,
      sha256: checkedSha(rootFile),
      notes: "Ancient Pāli root; Mahāsaṅgīti digital edition.",
      capabilities: [
        "source_link_available",
        "root_text_available",
        "parallel_text_available",
      ],
    },
    {
      ...common,
      language: "en",
      isRootText: false,
      isTranslation: true,
      translator: "Bhikkhu Sujato",
      sourceUrl: `${BILARA_RAW}/${enFile}`,
      sourceFile: enFile,
      licenseName: "CC0 1.0 Universal (CC0 1.0)",
      licenseUrl: CC0_URL,
      sha256: checkedSha(enFile),
      notes: "Published Bilara translation.",
      capabilities: [
        "source_link_available",
        "translation_available",
        "parallel_text_available",
      ],
    },
    ...additional,
  ];
});

const dhammapadaEdition: CorpusEditionManifest = {
  workId: "work-dhp",
  textId: "text-dhp",
  segmentIdFormat: "dhp:{verse}",
  title: "Dhammapada — F. Max Müller (1881)",
  basket: "sutta",
  collection: "Khuddaka Nikāya",
  canonicalStatus: "canonical",
  language: "en",
  isRootText: false,
  isTranslation: true,
  translator: "F. Max Müller",
  publisher: "Project Gutenberg",
  sourceRepository: "Project Gutenberg eBook #2017",
  sourceUrl: "https://www.gutenberg.org/cache/epub/2017/pg2017.txt",
  sourceRevision: "ebook-2017-updated-2024-12-11",
  sourceFile: "pg2017.txt",
  licenseName: "Public Domain",
  licenseUrl: "https://www.gutenberg.org/policy/license.html",
  redistributionAllowed: true,
  modificationAllowed: true,
  attributionRequired: false,
  retrievedAt: "2026-07-07",
  sha256: checkedSha("pg2017.txt"),
  notes: "423 verses parsed from the Project Gutenberg plain-text edition.",
  imported: true,
  capabilities: ["source_link_available", "translation_available"],
};

export const CORPUS_EDITIONS: readonly CorpusEditionManifest[] = [
  dhammapadaEdition,
  ...bilaraEditions,
];

export function editionFor(
  textIdValue: string,
  language: string
): CorpusEditionManifest | undefined {
  return CORPUS_EDITIONS.find(
    (edition) => edition.textId === textIdValue && edition.language === language
  );
}
