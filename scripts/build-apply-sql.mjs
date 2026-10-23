// Builds the SQL that writes the reviewed placement into the saved needs (industry_content) and remembers the corrections for future refreshes.
//   node scripts/build-apply-sql.mjs <reviewed.xlsx> <suggested.json> <outDir> [<round1Dir> [<overrides.json>]]
//   reviewed.xlsx  the spreadsheet after the review (read by header names, so extra columns are fine)
//   suggested.json what was proposed before the review (needs-placement.json from build-live-needs-placement.mjs)
//   round1Dir      optional: folder holding the first review's needs-placement.json (as proposed) and needs-placement.xlsx (as corrected)
//   overrides.json optional: [{ "sub", "need", "area", "agenda" }] decisions made after the review (for example to resolve a primary outside its service area)
// Writes apply-needs-placement.sql (snapshot, update, checks) and feedback.sql (corrections as worked examples).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [reviewedPath, suggestedPath, outDir, round1Dir, overridesPath] = process.argv.slice(2);
if (!reviewedPath || !suggestedPath || !outDir) { console.error("usage: build-apply-sql.mjs <reviewed.xlsx> <suggested.json> <outDir> [<round1Dir>]"); process.exit(2); }
const { AGENDAS, SERVICE_AREAS } = await import(path.join(root, "src/data/mcStorefront.ts"));
const fnSrc = readFileSync(path.join(root, "supabase/functions/refresh-industry-insights/index.ts"), "utf8");
const catalog = new Set([...fnSrc.slice(fnSrc.indexOf("const CATALOG:"), fnSrc.indexOf("const offerKey")).matchAll(/l2: "([^"]+)", l3: "([^"]+)"/g)].map((m) => `${m[1]} > ${m[2]}`));
const areaByName = new Map(SERVICE_AREAS.map((a) => [a.name, a]));
const readXlsx = (file) => JSON.parse(spawnSync("python3", [path.join(root, "scripts/read-needs-xlsx.py"), file], { encoding: "utf8", maxBuffer: 1 << 27 }).stdout || "[]");

const problems = [];
const norm = (r, where) => {
  const area = areaByName.get(r["Service area"]);
  const agendaLabel = r["Agenda"];
  const agenda = agendaLabel === "Other" || !agendaLabel ? null : AGENDAS.find((a) => a.label === agendaLabel);
  const key = `${r["Sub-sector"]}#${r["Position"]} ${r["Need"]}`;
  if (!area) problems.push(`${where}: ${key}: unknown service area "${r["Service area"]}"`);
  if (agendaLabel && agendaLabel !== "Other" && !agenda) problems.push(`${where}: ${key}: unknown agenda "${agendaLabel}"`);
  if (agenda && area && agenda.area !== area.id) problems.push(`${where}: ${key}: agenda "${agendaLabel}" is not in ${area.name}`);
  return { sub: r["Sub-sector"], need: r["Need"], area: area?.id ?? "", agenda: agenda?.id ?? "", primary: r["Primary offering"] ?? "", secondary: r["Secondary offering (optional)"] ?? "" };
};
const reviewed = readXlsx(reviewedPath).map((r) => norm(r, "reviewed"));
for (const o of overridesPath ? JSON.parse(readFileSync(overridesPath, "utf8")) : []) {
  const r = reviewed.find((x) => x.sub === o.sub && x.need === o.need);
  if (!r) { problems.push(`override: ${o.sub} / ${o.need} not found`); continue; }
  if (o.area && !areaByName.has(SERVICE_AREAS.find((a) => a.id === o.area)?.name)) problems.push(`override: unknown area ${o.area}`);
  r.area = o.area ?? r.area;
  r.agenda = o.agenda ?? "";
}
const suggested = JSON.parse(readFileSync(suggestedPath, "utf8")).map((r) => ({ sub: r.subSector, need: r.need, area: r.area, agenda: r.agenda ?? "", primary: r.primary, secondary: r.secondary ?? "" }));
if (reviewed.length !== suggested.length) problems.push(`reviewed has ${reviewed.length} rows, suggested has ${suggested.length}`);
const sugg = new Map(suggested.map((r) => [`${r.sub}|${r.need}`, r]));
const areaOf = new Map(SERVICE_AREAS.map((a) => [a.id, a]));
for (const r of reviewed) {
  const where = `${r.sub} / ${r.need}`;
  if (!sugg.has(`${r.sub}|${r.need}`)) problems.push(`${where}: not in the suggested file (renamed?)`);
  if (!r.primary) problems.push(`${where}: no primary offering`);
  else if (!catalog.has(r.primary)) problems.push(`${where}: primary "${r.primary}" is not in the catalog`);
  else if (areaOf.get(r.area) && !r.primary.startsWith(areaOf.get(r.area).catalogL2 + " > ")) problems.push(`${where}: primary "${r.primary}" is not in ${areaOf.get(r.area).name}`);
  if (r.secondary && !catalog.has(r.secondary)) problems.push(`${where}: secondary "${r.secondary}" is not in the catalog`);
  if (r.secondary && r.secondary === r.primary) problems.push(`${where}: secondary equals primary`);
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }

const sq = (v) => (v === "" || v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const subs = [...new Set(reviewed.map((r) => r.sub))];
const values = reviewed.map((r) => `  (${sq(r.sub)}, ${sq(r.need)}, ${sq(r.agenda)}, ${sq(r.area)}, ${sq(r.primary)}, ${sq(r.secondary)})`).join(",\n");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "apply-needs-placement.sql"), `-- Writes the reviewed placement into the needs saved in industry_content: service area, agenda, primary and secondary offering.
-- Wording, signals and narratives are not changed. Matching is on sub_industry_id and the need's exact name.
-- Run it once. Step 1 saves a snapshot of every affected sub-sector in the version history first, so the admin page's Restore can undo it.

-- 1. Snapshot (version history)
insert into industry_content_versions (sub_industry_id, version_number, content, created_by)
select ic.sub_industry_id,
       coalesce((select max(v.version_number) from industry_content_versions v where v.sub_industry_id = ic.sub_industry_id), 0) + 1,
       to_jsonb(ic),
       'placement-update'
from industry_content ic
where ic.sub_industry_id in (${subs.map(sq).join(", ")});

-- 2. Update
with placement(sub, need, agenda, area, primary_offer, secondary_offer) as (values
${values}
)
update industry_content ic
set needs = (
      select jsonb_agg(
               case when p.area is null then t.n
                    else (t.n - 'agenda' - 'area' - 'mcOffers')
                         || jsonb_strip_nulls(jsonb_build_object('agenda', p.agenda, 'area', p.area))
                         || jsonb_build_object('mcOffers', case when p.secondary_offer is null then jsonb_build_array(p.primary_offer)
                                                                else jsonb_build_array(p.primary_offer, p.secondary_offer) end)
               end
               order by t.ord)
      from jsonb_array_elements(ic.needs) with ordinality as t(n, ord)
      left join placement p on p.sub = ic.sub_industry_id and p.need = t.n->>'name'
    ),
    updated_at = now()
where ic.sub_industry_id in (select distinct sub from placement);

-- 3. Checks. Expected: needs ${reviewed.length}, with_area ${reviewed.length}, with_agenda ${reviewed.filter((r) => r.agenda).length}, too_many_offers 0, needs_without_area none.
select count(*) as needs,
       count(*) filter (where n ? 'area') as with_area,
       count(*) filter (where n ? 'agenda') as with_agenda,
       count(*) filter (where jsonb_array_length(n->'mcOffers') > 2) as too_many_offers,
       coalesce(string_agg(n->>'name', '; ') filter (where not n ? 'area'), 'none') as needs_without_area
from industry_content, jsonb_array_elements(needs) as n;
`);

// ---- corrections as worked examples ----
const rows = [];
const added = (r, p, source) => {
  rows.push({ sub: r.sub, need: r.need, pArea: p?.area ?? "", pAgenda: p?.agenda ?? "", pPrimary: p?.primary ?? "", pSecondary: p?.secondary ?? "", ...r, source });
};
const changed = (a, b) => a.area !== b.area || a.agenda !== b.agenda || a.primary !== b.primary || a.secondary !== b.secondary;
for (const r of reviewed) { const p = sugg.get(`${r.sub}|${r.need}`); if (p && changed(p, r)) added(r, p, "spreadsheet-review"); }
if (round1Dir) {
  const before = new Map(JSON.parse(readFileSync(path.join(round1Dir, "needs-placement.json"), "utf8")).map((r) => [`${r.subSector}|${r.need}`, { area: r.area, agenda: r.agenda ?? "" }]));
  const after = new Map(readXlsx(path.join(round1Dir, "needs-placement.xlsx")).map((r) => norm(r, "round 1")).map((r) => [`${r.sub}|${r.need}`, r]));
  const final = new Map(reviewed.map((r) => [`${r.sub}|${r.need}`, r]));
  for (const [k, b] of before) {
    const a = after.get(k), f = final.get(k);
    if (a && f && (a.area !== b.area || a.agenda !== b.agenda)) added({ ...f, area: a.area, agenda: a.agenda }, { area: b.area, agenda: b.agenda }, "spreadsheet-review");
  }
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
const by = "spreadsheet review (m.mcnaghten@toptal.com)";
const fb = rows.map((r) => `  (${sq(by)}, ${sq(r.sub)}, ${sq(r.need)}, '', ${sq(r.pArea)}, ${sq(r.pAgenda)}, ${sq(r.pPrimary)}, ${sq(r.pSecondary)}, ${sq(r.area)}, ${sq(r.agenda)}, ${sq(r.primary)}, ${sq(r.secondary)}, ${sq(r.source)})`).join(",\n");
writeFileSync(path.join(outDir, "feedback.sql"), rows.length ? `-- The corrections from the review, saved as worked examples for future refreshes (admin-only table).
insert into industry_need_feedback (created_by, sub_industry_id, need_name, need_text, proposed_area, proposed_agenda, proposed_primary, proposed_secondary, final_area, final_agenda, final_primary, final_secondary, source) values
${fb};
select count(*) as corrections from industry_need_feedback;
` : "-- No corrections to record.\n");
console.log(`${reviewed.length} needs in ${subs.length} sub-sectors; ${rows.length} corrections recorded; agendas set on ${reviewed.filter((r) => r.agenda).length}`);
