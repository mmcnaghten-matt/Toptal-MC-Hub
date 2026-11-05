// The offering/area rename: the catalog is the new 51-offering list, saved needs migrate by one rule, and the SQL that does it in the
// database carries the same mapping as the JavaScript (the SQL itself cannot run here; scripts/offering-rename.mjs holds both).
import { readFileSync } from "node:fs";
let failures = 0;
const check = (name, ok, detail = "") => { if (!ok) { failures++; console.log(`FAIL ${name}${detail ? "  -> " + detail : ""}`); } else console.log(`ok   ${name}`); };
const { RETIRED_OFFERS, RETIRED_L2, renameOffer, migrateNeed, buildSql } = await import("../../offering-rename.mjs");
const { SERVICE_AREAS } = await import("../../../src/data/mcStorefront.ts");

const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), "utf8");
const offeringsSrc = read("src/data/mcOfferings.ts");
const catalogOfArea = new Map(SERVICE_AREAS.map((a) => [a.id, a.catalogL2]));
const KEYS = new Set([...offeringsSrc.matchAll(/\{ area: "([^"]+)", l3: "([^"]+)" \}/g)].map((m) => `${catalogOfArea.get(m[1])} > ${m[2]}`));

// ---- the mapping lands on offerings that exist ----
check("every retired offering maps to an offering in the new catalog", Object.values(RETIRED_OFFERS).every((o) => KEYS.has(o)), JSON.stringify(Object.values(RETIRED_OFFERS).filter((o) => !KEYS.has(o))));
check("no retired name is still in the catalog", Object.keys(RETIRED_OFFERS).every((o) => !KEYS.has(o)) && [...KEYS].every((k) => !Object.keys(RETIRED_L2).some((l2) => k.startsWith(`${l2} > `))));
check("an offering in a renamed area keeps its name under the new area name", renameOffer("Risk & Compliance > Risk AI") === "Risk, Compliance & AI Governance > Risk AI" && renameOffer("Strategy & Transformation > Enterprise AI") === "Strategy & AI Transformation > Enterprise AI" && renameOffer("Customer & Growth > Customer Service & Success") === "Customer > Customer Service & Success");
check("offerings that did not change are left alone", renameOffer("Finance > Finance AI") === "Finance > Finance AI" && renameOffer("AI Consulting") === "AI Consulting");

// ---- one saved need ----
const mig = migrateNeed({ name: "a", agenda: "modernize-customer-service", area: "customer-growth", mcOffers: ["Customer & Growth > Customer & Growth AI", "Customer & Growth > Customer & Growth Technology"] });
check("Customer & Growth AI and Technology merge into one offering", mig.mcOffers.join("|") === "Customer > Customer Technology & AI" && mig.agenda === "modernize-customer-service", JSON.stringify(mig));
const learn = migrateNeed({ name: "b", agenda: "reshape-work-skills", area: "people", mcOffers: ["People & Organization > Learning & Capability Development", "People & Organization > Change Management"] });
check("Learning & Capability Development becomes Talent & Leadership in the same area", learn.mcOffers.join("|") === "People & Organization > Talent & Leadership|People & Organization > Change Management" && learn.agenda === "reshape-work-skills");
const swap = migrateNeed({ name: "c", agenda: "pricing-commercial-excellence", area: "customer-growth", mcOffers: ["Customer & Growth > Growth Strategy", "Customer & Growth > Customer Experience"] });
check("a Growth Strategy primary swaps with a secondary in the need's own area, keeping the agenda", swap.mcOffers.join("|") === "Customer > Customer Experience & Journey Design|Strategy & AI Transformation > Growth Strategy" && swap.agenda === "pricing-commercial-excellence" && swap.area === "customer-growth", JSON.stringify(swap));
const moved = migrateNeed({ name: "d", agenda: "pricing-commercial-excellence", area: "customer-growth", mcOffers: ["Customer & Growth > Growth Strategy", "Finance > Financial Planning & Analysis"] });
check("otherwise the need follows its Growth Strategy primary to Strategy & AI Transformation and loses its agenda", moved.area === "strategy" && !("agenda" in moved) && moved.mcOffers[0] === "Strategy & AI Transformation > Growth Strategy", JSON.stringify(moved));
const alone = migrateNeed({ name: "e", agenda: "marketing-sales-effectiveness", area: "customer-growth", mcOffers: ["Customer & Growth > Growth Strategy"] });
check("a Growth Strategy-only need moves to Strategy as 'Other'", alone.area === "strategy" && !("agenda" in alone) && alone.mcOffers.length === 1, JSON.stringify(alone));
const secondary = migrateNeed({ name: "f", agenda: "plan-forecast-ai", area: "finance", mcOffers: ["Finance > Finance AI", "Customer & Growth > Growth Strategy"] });
check("Growth Strategy as a secondary just takes its new name", secondary.mcOffers[1] === "Strategy & AI Transformation > Growth Strategy" && secondary.area === "finance" && secondary.agenda === "plan-forecast-ai");
const strat = migrateNeed({ name: "g", area: "strategy", mcOffers: ["Strategy & Transformation > Corporate Strategy"] });
check("an 'Other' need in a renamed area keeps its area and gets the new area name", strat.area === "strategy" && !("agenda" in strat) && strat.mcOffers[0] === "Strategy & AI Transformation > Corporate Strategy");
const legacy = { name: "h", mcOffers: ["AI Consulting"] };
check("legacy free-text offerings are untouched", JSON.stringify(migrateNeed(legacy)) === JSON.stringify(legacy));
const everything = [mig, learn, swap, moved, alone, secondary, strat];
check("running the migration twice changes nothing", everything.every((n) => JSON.stringify(migrateNeed(n)) === JSON.stringify(n)));
check("a migrated need only holds offerings in the new catalog, at most two", everything.every((n) => n.mcOffers.length <= 2 && n.mcOffers.every((o) => KEYS.has(o))));

// ---- the SQL carries the same mapping ----
{
  const { main, review } = buildSql();
  check("the SQL maps every retired offering", Object.entries(RETIRED_OFFERS).every(([a, b]) => main.includes(`when o = '${a}' then '${b}'`)));
  check("the SQL renames every retired area", Object.entries(RETIRED_L2).every(([a, b]) => main.includes(`= '${a}' then '${b}' || ' > '`)));
  check("the SQL snapshots before it updates and drops its helper functions", main.indexOf("insert into industry_content_versions") < main.indexOf("update industry_content ic") && (main.match(/drop function/g) || []).length === 4 && !/create (or replace )?function(?! public\.offering_rename)/.test(main));
  check("the SQL knows all 18 agendas and 6 areas", (main.match(/then '(strategy|finance|people|supply-chain|customer-growth|risk)'/g) || []).length === 24);
  check("the review query reads the snapshot the main script saves", /created_by = 'offering-rename'/.test(review) && /'offering-rename'/.test(main));
}

// ---- the function carries the same retired-name map (used to read old saved corrections) ----
{
  const fn = read("supabase/functions/refresh-industry-insights/index.ts");
  const pairs = (name) => Object.fromEntries([...fn.slice(fn.indexOf(`const ${name}:`), fn.indexOf("};", fn.indexOf(`const ${name}:`))).matchAll(/"([^"]+)": "([^"]+)"/g)].map((m) => [m[1], m[2]]));
  check("the function's retired-offering map equals the migration's", JSON.stringify(pairs("RETIRED_OFFERS")) === JSON.stringify(RETIRED_OFFERS), JSON.stringify(pairs("RETIRED_OFFERS")));
  check("the function's retired-area map equals the migration's", JSON.stringify(pairs("RETIRED_L2")) === JSON.stringify(RETIRED_L2), JSON.stringify(pairs("RETIRED_L2")));
}

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
