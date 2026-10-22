# Operator portal

Use `npm run dev` locally and `npm run build` to validate the production bundle.

## Package selling-season classification

The real create/edit package form separates package type, service level and
selling season. Ramadan is an explicit Umrah season, never inferred from a name.
New Hajj/Ramadan packages require an integer selling year from 2000 through 2200.
Departure dates can remain unknown while the selling season is confirmed.

Legacy seasonal packages without a year display a warning and allow unrelated
edits. Unchanged classification fields are omitted from update payloads; changing
type/season/year requires valid classification. Switching back to ordinary Umrah
explicitly sends `season: null` and `seasonYear: null`.

The installed AI client is the description/itinerary suggestion action
(`packagesService.suggest`), not a document extractor/importer. Suggestions never
set type, season or year; the form prompts human review and requires a missing
selling year before submitting AI-assisted seasonal content. There is no package
document-import surface in this portal to wire!

Run focused classification/adapter tests:

```sh
node --test src/utils/packageMapper.test.js
```
