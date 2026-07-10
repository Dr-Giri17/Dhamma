# Corpus license audit

Audit date: 2026-07-10. Exact paths, revisions, checksums, and flags are machine-readable in `data/corpus/manifest.json`.

## Imported sources

| Source | Coverage | License decision |
|---|---|---|
| SuttaCentral `bilara-data` at `ba752906b439d3c1abb870044c1b38e39f8cdb21` | Eight Pāli roots; eight Bhikkhu Sujato English translations | Root texts are ancient/public-domain; published Bilara translations are CC0. |
| Bilara `scpub88`, `scpub105`, `scpub117` | RU MN 10, MN 118, SN 56.11, Snp 1.8 | Published CC0 records. |
| Bilara `scpub134` | RU DN 31 by Khantibalo | Published CC0; status “in progress” preserved. |
| Project Gutenberg eBook #2017 | Dhammapada, F. Max Müller 1881, 423 English verses | Public-domain edition; exact downloaded bytes are checksummed. |

Primary evidence:

- Bilara license: <https://github.com/suttacentral/bilara-data/blob/ba752906b439d3c1abb870044c1b38e39f8cdb21/LICENSE.md>
- Bilara publication registry: <https://github.com/suttacentral/bilara-data/blob/ba752906b439d3c1abb870044c1b38e39f8cdb21/_publication.json>
- Project Gutenberg #2017: <https://www.gutenberg.org/ebooks/2017>

## Excluded and source-gated sources

| Source | Decision | Reason |
|---|---|---|
| Bhikkhu Ñāṇamoli, BPS *Path of Purification* | Not imported | The BPS edition states ©1975, 1991, 2010 and “All rights reserved.” Availability for reading is not redistribution permission. |
| Indonesian `scpub42` | Not imported | The only published CC0 Indonesian record at the pinned Bilara revision is Saṃyukta Āgama, not a matching Theravāda Pāli seed edition. |
| Any site text without edition-level permission | Not imported | Website accessibility alone is not a redistribution grant. |

BPS metadata: <https://bps.lk/library-search-select.php?id=bp207h>.

## Enforcement

An imported edition must have all provenance fields, `redistributionAllowed=true`, an accepted license, and a 64-character audited SHA-256. Ingestion hashes the exact response bytes before parsing. A mismatch stops ingestion. Software MIT licensing never overrides corpus edition licensing.
