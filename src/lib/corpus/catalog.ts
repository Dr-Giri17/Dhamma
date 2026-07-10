import type { CatalogNode } from "./types";

const structure = ["structure_available"] as const;

export const TIPITAKA_CATALOG: readonly CatalogNode[] = [
  {
    id: "vinaya",
    title: "Vinaya Piṭaka",
    canonicalStatus: "canonical",
    capabilities: [...structure],
    children: [
      { id: "suttavibhanga", title: "Suttavibhaṅga", canonicalStatus: "canonical", capabilities: [...structure] },
      { id: "khandhaka", title: "Khandhaka", canonicalStatus: "canonical", capabilities: [...structure] },
      { id: "parivara", title: "Parivāra", canonicalStatus: "canonical", capabilities: [...structure] },
    ],
  },
  {
    id: "sutta",
    title: "Sutta Piṭaka",
    canonicalStatus: "canonical",
    capabilities: [...structure],
    children: [
      { id: "dn", title: "Dīgha Nikāya", canonicalStatus: "canonical", capabilities: [...structure, "root_text_available", "translation_available", "parallel_text_available"] },
      { id: "mn", title: "Majjhima Nikāya", canonicalStatus: "canonical", capabilities: [...structure, "root_text_available", "translation_available", "parallel_text_available"] },
      { id: "sn", title: "Saṃyutta Nikāya", canonicalStatus: "canonical", capabilities: [...structure, "root_text_available", "translation_available", "parallel_text_available"] },
      { id: "an", title: "Aṅguttara Nikāya", canonicalStatus: "canonical", capabilities: [...structure, "root_text_available", "translation_available", "parallel_text_available"] },
      { id: "kn", title: "Khuddaka Nikāya", canonicalStatus: "canonical", capabilities: [...structure, "root_text_available", "translation_available", "parallel_text_available"] },
    ],
  },
  {
    id: "abhidhamma",
    title: "Abhidhamma Piṭaka",
    canonicalStatus: "canonical",
    capabilities: [...structure],
    children: [
      { id: "dhammasangani", title: "Dhammasaṅgaṇī", canonicalStatus: "canonical", capabilities: [...structure] },
      { id: "vibhanga", title: "Vibhaṅga", canonicalStatus: "canonical", capabilities: [...structure] },
      { id: "dhatukatha", title: "Dhātukathā", canonicalStatus: "canonical", capabilities: [...structure] },
      { id: "puggalapannatti", title: "Puggalapaññatti", canonicalStatus: "canonical", capabilities: [...structure] },
      { id: "kathavatthu", title: "Kathāvatthu", canonicalStatus: "canonical", capabilities: [...structure] },
      { id: "yamaka", title: "Yamaka", canonicalStatus: "canonical", capabilities: [...structure] },
      { id: "patthana", title: "Paṭṭhāna", canonicalStatus: "canonical", capabilities: [...structure] },
    ],
  },
];

export const POST_CANONICAL_CATALOG: readonly CatalogNode[] = [
  {
    id: "visuddhimagga",
    title: "Visuddhimagga",
    canonicalStatus: "post-canonical",
    capabilities: ["structure_available", "source_link_available"],
    textSlug: "visuddhimagga",
    sourceUrl: "https://bps.lk/library-search-select.php?id=bp207h",
  },
];

