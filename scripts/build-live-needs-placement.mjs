// Turns scripts/data/live-needs-placement.txt (the needs saved in industry_content: placement and MC offering assignment) into the
// review spreadsheet (with drop-downs and colour-coded confidence), a CSV and a JSON.
//   node scripts/build-live-needs-placement.mjs <outDir>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { industries } = await import(path.join(root, "src/data/industryData.ts"));
const { AGENDAS, SERVICE_AREAS, AREA_BY_ID, AREA_BY_CATALOG_L2 } = await import(path.join(root, "src/data/mcStorefront.ts"));
const fnSrc = readFileSync(path.join(root, "supabase/functions/refresh-industry-insights/index.ts"), "utf8");
const catalogPairs = [...fnSrc.slice(fnSrc.indexOf("const CATALOG:"), fnSrc.indexOf("const offerKey")).matchAll(/l2: "([^"]+)", l3: "([^"]+)"/g)].map((m) => [m[1], m[2]]);
const catalog = new Set(catalogPairs.map(([a, b]) => `${a} > ${b}`));

const AGENDA = { AIPL: "ai-into-pl-value", AIOM: "ai-first-operating-model", MA: "portfolio-through-ma", FM: "modernize-finance", FP: "plan-forecast-ai", FC: "cost-margin-cash", WS: "reshape-work-skills", OD: "ai-era-organization", LC: "leaders-and-change", PL: "modernize-planning", SF: "resilient-sourcing-footprint", PC: "cut-procurement-ops-cost", CS: "modernize-customer-service", PR: "pricing-commercial-excellence", MS: "marketing-sales-effectiveness", GA: "govern-ai-regulation", MR: "modernize-risk-compliance", TP: "third-party-operational-resilience" };
const AREA = { S: "strategy", F: "finance", SC: "supply-chain", CG: "customer-growth", PO: "people", RC: "risk" };
const L2 = { S: "Strategy & Transformation", F: "Finance", SC: "Supply Chain & Operations", CG: "Customer & Growth", PO: "People & Organization", RC: "Risk & Compliance" };
const CONF = { H: "High", M: "Medium", L: "Low" };
const industryOf = new Map(industries.flatMap((i) => i.subIndustries.map((s) => [s.id, i.shortName])));
const full = (o) => { if (!o) return ""; const [p, l3] = o.trim().split(/:(.+)/); return `${L2[p]} > ${l3}`; };

const problems = [];
const rows = [];
const seen = new Set();
for (const line of readFileSync(path.join(root, "scripts/data/live-needs-placement.txt"), "utf8").split("\n")) {
  if (!line.trim() || line.startsWith("#")) continue;
  const [key, code, areaCode, pconf, review, need, savedStr, primaryStr, secondaryStr, oconf, onote = ""] = line.split("|");
  const [sub, pos] = key.split("#");
  const savedOfferings = savedStr.split(";").map(full);
  const agendaId = code === "O" ? undefined : AGENDA[code];
  if (code !== "O" && !agendaId) problems.push(`${key}: unknown agenda code ${code}`);
  const agenda = AGENDAS.find((a) => a.id === agendaId);
  const area = AREA_BY_ID.get(AREA[areaCode]);
  if (!area) problems.push(`${key}: unknown area code ${areaCode}`);
  if (agenda && area && agenda.area !== area.id) problems.push(`${key}: agenda ${code} is not in area ${areaCode}`);
  if (!CONF[pconf] || !CONF[oconf]) problems.push(`${key}: bad confidence`);
  if (!industryOf.has(sub)) problems.push(`${key}: unknown sub-sector`);
  if (seen.has(key)) problems.push(`${key}: listed twice`);
  seen.add(key);
  const primary = full(primaryStr), secondary = full(secondaryStr);
  for (const o of [...savedOfferings, primary, secondary]) if (o && !catalog.has(o)) problems.push(`${key}: "${o}" is not in the catalog`);
  if (!primary) problems.push(`${key}: no primary offering`);
  else if (area && !primary.startsWith(area.catalogL2 + " > ")) problems.push(`${key}: primary offering ${primary} is not in ${area.name}`);
  if (secondary && secondary === primary) problems.push(`${key}: secondary equals primary`);
  const savedFirstArea = AREA_BY_CATALOG_L2.get(savedOfferings[0].split(" > ")[0]);
  const savedFlag = area && savedFirstArea && savedFirstArea.id !== area.id ? `Saved first offering is in ${savedFirstArea.name}, not ${area.name}` : "";
  rows.push({ industry: industryOf.get(sub), subSector: sub, position: Number(pos), need, area: area?.id, areaName: area?.name, agenda: agendaId ?? null, agendaLabel: agenda?.label ?? "Other", placementConfidence: CONF[pconf], review, primary, secondary, offeringConfidence: CONF[oconf], offeringNote: onote.trim(), savedOfferings, savedFlag });
}
const bySub = new Map();
for (const r of rows) bySub.set(r.subSector, [...(bySub.get(r.subSector) ?? []), r]);
for (const [sub, list] of bySub) {
  if (list.length !== 8) problems.push(`${sub}: ${list.length} needs, expected 8`);
  if (new Set(list.map((r) => r.need)).size !== list.length) problems.push(`${sub}: duplicate need names`);
}
if (bySub.size !== 27) problems.push(`${bySub.size} sub-sectors, expected 27`);
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

const outDir = process.argv[2];
if (outDir) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "needs-placement.json"), JSON.stringify(rows, null, 2) + "\n");
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  writeFileSync(path.join(outDir, "needs-placement.csv"), ["Industry,Sub-sector,Position,Need,Service area,Agenda,Placement confidence,Your review,Primary offering,Secondary offering,Offering confidence,Offering note,Offerings as saved,Saved first offering", ...rows.map((r) => [r.industry, r.subSector, r.position, r.need, r.areaName, r.agendaLabel, r.placementConfidence, r.review, r.primary, r.secondary, r.offeringConfidence, r.offeringNote, r.savedOfferings.join("; "), r.savedFlag].map(q).join(","))].join("\n") + "\n");
  const lists = { areas: SERVICE_AREAS.map((a) => ({ name: a.name, catalogL2: a.catalogL2, agendas: AGENDAS.filter((g) => g.area === a.id).map((g) => g.label), offerings: catalogPairs.filter(([l2]) => l2 === a.catalogL2).map(([l2, l3]) => `${l2} > ${l3}`) })) };
  const listsPath = path.join(outDir, ".lists.json");
  writeFileSync(listsPath, JSON.stringify(lists));
  const py = spawnSync("python3", [path.join(root, "scripts/make-needs-xlsx.py"), path.join(outDir, "needs-placement.json"), path.join(outDir, "needs-placement.xlsx"), listsPath], { encoding: "utf8" });
  spawnSync("rm", ["-f", listsPath]);
  if (py.status !== 0) { console.error(py.stderr); process.exit(1); }
}
const count = (f) => rows.reduce((m, r) => (m.set(f(r), (m.get(f(r)) ?? 0) + 1), m), new Map());
console.log(`${rows.length} needs in ${bySub.size} sub-sectors (${catalog.size} catalog offerings)`);
console.log("placement confidence:", Object.fromEntries(count((r) => r.placementConfidence)), "| offering confidence:", Object.fromEntries(count((r) => r.offeringConfidence)));
console.log("saved first offering outside the service area:", rows.filter((r) => r.savedFlag).length, "| primary changed from the saved first offering:", rows.filter((r) => r.primary !== r.savedOfferings[0]).length, "| with a secondary:", rows.filter((r) => r.secondary).length);
