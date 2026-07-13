# Corpus Policy (seed retrieval layer)

> The protected BPS English Visuddhimagga remains excluded. The separately
> licensed VRI Pāli Visuddhimagga is now imported as post-canonical material;
> see [FULL_CORPUS_ARCHITECTURE.md](./FULL_CORPUS_ARCHITECTURE.md).

This document governs what texts may enter the Dhamma App corpus, under what
license, and how they are labelled. It implements the requirements of the
project specification (ТЗ §4, §14, §15).

## 1. Two-layer license principle

- `LICENSE` (MIT) governs the **software** of the Dhamma App.
- Corpus **texts** carry their own per-segment licenses, stored in
  `source_works.license` and `segments.license`.

These layers must never be conflated. The software being MIT does **not** make
the corpus texts freely redistributable.

## 2. Allow-list

Only these license strings may appear on an imported segment
(`src/lib/corpus/licenses.ts`):

| License | Typical use |
|---|---|
| `Public Domain` | Ancient Pāli roots; pre-1900 translations (e.g. Müller 1881). |
| `CC0 1.0 Universal (CC0 1.0)` | Sujato translations distributed via SuttaCentral/Bilara. |
| `CC BY-NC-ND 4.0` | Read-only display of some modern editions; never used for derivative works. |

Anything else is rejected by `validateCorpus()` at load time.

## 3. Required provenance per segment

Every imported segment MUST carry (ТЗ §15.8):

- a non-empty `sourceRef` (e.g. `Dhp 5`, `SN 56.11`);
- a non-empty `license` from the allow-list;
- a non-empty `provider` (`suttacentral` / `bilara` / `project_gutenberg` / `manual`);
- a `translator` or `author` when applicable;
- a **stable** `segmentUid` that is never rewritten.

A segment missing any of these is a validation error, not a warning.

## 4. Sources used in the MVP seed

- **Dhammapada**
  - Pāli root — public domain (ancient text).
  - English — F. Max Müller, 1881 (*Sacred Books of the East*, vol. X, Oxford).
    Pre-1900; public domain. Stored verbatim with attribution.
- **SN 56.11 (Dhammacakkappavattana Sutta)**
  - Pāli root — public domain.
  - English working explanation is clearly labelled as such ("working
    explanation, Pāli root public domain"); it is **not** presented as a
    published translation. A proper Sujato CC0 translation is added by the
    Bilara ingestion path in the next pass.

## 5. Sources planned (next pass, via ingestion scripts)

- **Sujato CC0 translations** for the seed suttas
  (MN 10, MN 118, DN 31, AN 3.65, Snp 1.8/2.1/2.4) fetched from
  `suttacentral/bilara-data`. Each fetched segment preserves Bilara's stable
  segment UID and attaches CC0 license metadata.

## 6. Visuddhimagga in seed retrieval

The Visuddhimagga is a **post-canonical** commentary by Buddhaghosa. It is
**not** part of the Tipiṭaka and is not words attributed to the Buddha.

- The schema/interface exists (`category: "commentarial"`,
  `pitaka: "post_canonical"`).
- No Visuddhimagga segment may enter the **Ask/Guide seed corpus**.
  `validateCorpus()` rejects any segment whose owning work slug is
  `visuddhimagga` / `vism`.
- The full-reader layer separately imports the VRI Pāli edition under its
  non-commercial attribution terms and always marks it post-canonical.
- The Ñāṇamoli / BPS English edition has distribution restrictions and remains
  excluded.

## 7. Prohibited sources

Never ingested automatically (ТЗ §4.4):

- random PDFs;
- pirated scans;
- Scribd / Z-Library dumps;
- copyrighted modern translations;
- AccessToInsight wholesale mirrors without per-text copyright checks;
- any text without license metadata.

## 8. Canonical vs commentarial separation

Retrieval re-ranking (ТЗ §6.1.5) and the Ask layer enforce this:

- `canonical` texts rank above `commentarial` and `modern_explanation`;
- for "what did the Buddha say" questions, commentarial material is excluded
  from retrieval rather than misattributed;
- Dhammapada verses are eligible for short wisdom, but are never the **sole**
  source for a complex doctrinal answer.
