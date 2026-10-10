# Client Insights QC suite

Everything the QC rounds found, as checks you can run after any change to `supabase/functions/gemini-research/index.ts`
or `src/services/researchPipeline.ts`.

```bash
npm run qc                                   # pipeline tests (mocked Gemini, no network) + checker tests
npm run qc:report -- report.json             # check a real report
npm run qc:report -- report.json --forbid="Siding Solutions,Taloja" --today=2026-10-10
```

To check a real run: open the report, expand **Research log**, click **Copy report JSON**, save it as `report.json`, run the
second command. Exit code 1 means at least one assertion failed; each failure prints the offending text.

## Report checker (`check-report.mjs`)

| Assertion | QC finding |
|---|---|
| No evidence ids ("(E37, E47)") in client text | Round 6: ids visible in the MC table |
| No HTML entities or garbled characters; no bot-check source title | Round 3: `&ldquo;`, ",Äî", "Human verification" |
| No sold business (name, products, plants, brands) described as current | Siding Solutions (2007) shown as 2026; Taloja plant recommended as a model; "vinyl siding" praised |
| No blocked domain among the sources (stock-data, peer-list, job, social) | fullratio EBITDA; owler and comparably still cited; indeed.com as a strength |
| No look-alike or unauditable source cited | johnsmanvilleus.com |
| Each competitor listed once | Johns Manville twice, Saint-Gobain four ways, ROCKWOOL three |
| Each market segment once; market at least the company's own segment sales; a row never cites a page about another market | Roofing twice; Doors $1.5B vs $2.1B own sales; "Conveying Equipment" page for Roofing |
| No colour, SKU, award or report-publication item in initiatives, recommendations or MC rows | Shingle colours, "Color of the Year" |
| No strategic initiative older than 24 months; no forecast whose quarter has ended | Stale evidence presented as current |
| Litigation statements cite a filing or major press, or are worded as a law firm's claim | zlk.com securities suit stated as fact |
| Positioning is "Leader/Challenger/Niche in <segment>" with a cited rank | Label flipped Leader/Challenger between runs |
| Method numbers, cited-domain list and date-check log present | Caveat and method section |

`check-report.test.mjs` proves the checker: it passes `fixtures/report-good.json` (synthetic, produced by the round-6 pipeline
test) and fails each deliberately broken copy for the right reason.

## Pipeline tests (`pipeline/*.test.mjs`)

They run the real edge function and the real client pipeline against a mocked Gemini and mocked web pages, with the clock fixed
at 2026-10-10 (`fixed-date.mjs`). Add a case here whenever a QC round finds a new failure.

| File | Covers |
|---|---|
| `release-a.test.mjs` | Stock-data and peer-list sources, public-company financials, competitor classification, segments and TAM ranges, balanced customer evidence, source hygiene |
| `dates.test.mjs` | Dated evidence checked against the cited page (2007 article reported as 2026), corroboration of material events, expired forecasts, law-firm sources, asbestos misfiled as customer themes, unreadable pages kept as unverified, forecast edge cases, sold-business list |
| `round6.test.mjs` | Sold-business footprint, market sanity checks, competitor name merging, rank-based positioning, litigation and materiality rules, evidence-id stripping, per-topic drop counts |
| `faults.test.mjs` | Failed scans, sections and analysis parts degrade without failing the report; gateway errors are retried; unknown company stops with a 422 |
| `tiers.test.mjs` | Source tiers, excluded domains, three-citation cap, financial-statement rules |
