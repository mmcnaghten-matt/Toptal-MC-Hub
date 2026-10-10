// The checker must pass the good fixture and fail each deliberately broken copy for the right reason.
import fs from "node:fs";
import { checkReport } from "./check-report.mjs";

const good = JSON.parse(fs.readFileSync(new URL("./fixtures/report-good.json", import.meta.url), "utf8"));
const opts = { today: "2026-10-10" };
let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`); if (!ok) failures++; };
const failedNames = (r) => checkReport(r, opts).filter((x) => !x.ok).map((x) => x.name);
const clone = () => JSON.parse(JSON.stringify(good));

check("the good report passes every check", failedNames(good).length === 0, failedNames(good).join(" | "));

const cases = [
  ["an evidence id in client text", (r) => { r.executiveSummary.tldr += " (E12, E14)"; }, /evidence ids/],
  ["a peer-list domain among the sources", (r) => { r.sources.push({ title: "Owler", url: "https://www.owler.com/company/x", tier: 3 }); }, /blocked domain/],
  ["a bot-check source title", (r) => { r.sources.push({ title: "Human verification", url: "https://example.org/a", tier: 3 }); }, /bot-check/],
  ["the same competitor listed under two names", (r) => { r.competitiveLandscape.directCompetitors.push("Johns Manville Corporation [1]", "Johns Manville [1]"); }, /each competitor is listed once/],
  ["a sold business's plant described as current", (r) => { r.businessPerformance.strategicInitiatives.push({ name: "Plant roll-out", description: "Owens Corning rolls out the Taloja plant digital transformation across the company." }); }, /sold business/],
  ["a colour launch among the initiatives", (r) => { r.businessPerformance.strategicInitiatives.push({ name: "Evergreen Mist", description: "Owens Corning launched the Evergreen Mist shingle color in March 2026." }); }, /colour, SKU/],
  ["a segment twice in the market table", (r) => { r.marketOverview.metrics.tamRows.push({ ...r.marketOverview.metrics.tamRows[0] }); }, /each market segment appears once/],
  ["a market smaller than the company's own sales", (r) => { r.marketOverview.metrics.tamRows.push({ segment: "Doors", geography: "Global", year: 2025, value: "$1.5B", publisher: "x", cite: "[1]" }); }, /never smaller/],
  ["an unbacked litigation statement", (r) => { r.customerInsights.unmetNeeds = "Owens Corning faces a class action lawsuit."; }, /litigation statements/],
  ["a free-text positioning label", (r) => { r.executiveSummary.competitivePositioning = "Leader"; }, /positioning/],
  ["a report from an older function (no method numbers)", (r) => { delete r.quality.methodStats; }, /method numbers/],
];
for (const [name, mutate, expect] of cases) {
  const r = clone();
  mutate(r);
  const failed = failedNames(r);
  check(`fails for: ${name}`, failed.some((n) => expect.test(n)), failed.join(" | ") || "nothing failed");
}
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
