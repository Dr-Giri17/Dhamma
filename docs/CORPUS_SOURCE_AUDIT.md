# Corpus source and licensing audit

Audit date: 2026-07-09. Source repository: `suttacentral/bilara-data`, branch `published`, pinned revision `ba752906b439d3c1abb870044c1b38e39f8cdb21`.

Bilara's root `LICENSE.md` dedicates Bilara-supported translations to the public domain using CC0. Import decisions also require the matching collection record in `_publication.json` to have `is_published: true` and `license.license_abbreviation: "CC0"`.

| text_uid | EN | RU | ID | verified source path | license | published | imported | decision |
|---|---:|---:|---:|---|---|---:|---:|---|
| dhp | yes | no | no | Project Gutenberg #2017, `https://www.gutenberg.org/cache/epub/2017/pg2017.txt` | Public Domain | yes | EN | No matching RU/ID Bilara file. |
| mn10 | yes | yes | no | `translation/en/sujato/sutta/mn/mn10_translation-en-sujato.json`; `translation/ru/sv/sutta/mn/mn10_translation-ru-sv.json` | CC0 | yes (`scpub88`) | EN, RU | RU imported from SV theravada.ru. |
| mn118 | yes | yes | no | `translation/en/sujato/sutta/mn/mn118_translation-en-sujato.json`; `translation/ru/sv/sutta/mn/mn118_translation-ru-sv.json` | CC0 | yes (`scpub88`) | EN, RU | RU imported from SV theravada.ru. |
| dn31 | yes | yes | no | `translation/en/sujato/sutta/dn/dn31_translation-en-sujato.json`; `translation/ru/khantibalo/sutta/dn/dn31_translation-ru-khantibalo.json` | CC0 | yes (`scpub134`, in progress) | EN, RU | Published RU file imported; collection status remains in progress and is preserved. |
| an3.65 | yes | no | no | `translation/en/sujato/sutta/an/an3/an3.65_translation-en-sujato.json` | CC0 | yes | EN | No matching RU/ID file in the published tree. |
| sn56.11 | yes | yes | no | `translation/en/sujato/sutta/sn/sn56/sn56.11_translation-en-sujato.json`; `translation/ru/sv/sutta/sn/sn56/sn56.11_translation-ru-sv.json` | CC0 | yes (`scpub105`) | EN, RU | RU imported from SV theravada.ru. |
| snp1.8 | yes | yes | no | `translation/en/sujato/sutta/kn/snp/vagga1/snp1.8_translation-en-sujato.json`; `translation/ru/sv/sutta/kn/snp/vagga1/snp1.8_translation-ru-sv.json` | CC0 | yes (`scpub117`) | EN, RU | RU imported from SV theravada.ru. |
| snp2.1 | yes | no | no | `translation/en/sujato/sutta/kn/snp/vagga2/snp2.1_translation-en-sujato.json` | CC0 | yes | EN | No matching RU/ID file in the published tree. |
| snp2.4 | yes | no | no | `translation/en/sujato/sutta/kn/snp/vagga2/snp2.4_translation-en-sujato.json` | CC0 | yes | EN | No matching RU/ID file in the published tree. |

Pāli roots for the eight seed suttas come from `root/pli/ms/sutta/...` in the same published branch and retain Mahāsaṅgīti provenance. No Indonesian file matching any current text exists under `translation/id` in the published tree, so none was imported.

## Visuddhimagga

No Visuddhimagga path exists in the Bilara published tree. The machine-readable English edition found at Buddhist Publication Society is Bhikkhu Ñāṇamoli's translation and states `©1975, 1991, 2010 Buddhist Publication Society. All rights reserved.` It is therefore not imported. The app exposes only a post-canonical, source-required status page and does not present summaries as scripture.
