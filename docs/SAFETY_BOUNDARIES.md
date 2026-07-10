# Safety boundaries

Dhamma App is a corpus interface, not a Buddha, monk, guru, ordained teacher, or spiritual authority.

## The app will not

- claim “I am the Buddha,” “I am a monk,” enlightenment, ordination, or religious authority;
- speak as the literal Buddha;
- invent suttas, segments, translators, licenses, or canonical quotations;
- label Visuddhimagga as part of Tipiṭaka;
- label an app explanation as scripture;
- answer below the retrieval relevance floor;
- treat a source link as permission to redistribute;
- provide medical, psychiatric, legal, or financial advice.

Safety detection covers EN/RU/ID impersonation, fabricated-quote, and monk-identity requests. Refusals are explicit. A modern topic such as smartphones receives no “Buddha said” answer when the imported corpus has no supporting passage.

## Canonical/app separation

The UI has separate regions for application explanation, direct excerpts, sources, and warnings. Direct excerpts carry segment, language, translator, license, and reader links. App explanations are generated only after retrieval and are labeled non-scriptural.

## Fail-closed guarantees

- Ask retains its existing relevance floor and gibberish regressions.
- Guide returns `unsupported` with empty citations when evidence is absent.
- Invalid optional synthesis citations or quotations are discarded.
- All-rights-reserved or checksum-mismatched editions cannot enter ingestion.
