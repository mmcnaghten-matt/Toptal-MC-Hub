// The client-agenda update: two Customer agendas were replaced, saved needs move by one rule (by primary offering), and the SQL that does it in
// the database carries the same mapping as the JavaScript (the SQL itself cannot run here; scripts/agenda-update.mjs holds both).
import { readFileSync } from "node:fs";
let failures = 0;
const check = (name, ok, detail = "") => { if (!ok) { failures++; console.log(`FAIL ${name}${detail ? "  -> " + detail : ""}`); } else console.log(`ok   ${name}`); };
const { RETIRED_AGENDAS, AGENDA_BY_PRIMARY, migrateAgendaId, migrateNeed, buildSql } = await import("../../agenda-update.mjs");
const { AGENDAS } = await import("../../../src/data/mcStorefront.ts");
const read = (p) => readFileSync(new URL(`../../../${p}`, import.meta.url), "utf8");
const ids = new Set(AGENDAS.map((a) => a.id));
const offeringsSrc = read("supabase/functions/refresh-industry-insights/index.ts");

// ---- the mapping lands on agendas and offerings that exist ----
check("no retired agenda is still on the storefront", RETIRED_AGENDAS.every((a) => !ids.has(a)));
check("every target agenda exists and is a Customer agenda", Object.values(AGENDA_BY_PRIMARY).every((a) => AGENDAS.find((x) => x.id === a)?.area === "customer-growth"));
check("every primary offering in the rule is in the catalog", Object.keys(AGENDA_BY_PRIMARY).every((o) => offeringsSrc.includes(`l2: "${o.split(" > ")[0]}", l3: "${o.split(" > ")[1]}"`)), JSON.stringify(Object.keys(AGENDA_BY_PRIMARY)));

// ---- one saved need ----
const cx = migrateNeed({ name: "a", agenda: "pricing-commercial-excellence", area: "customer-growth", mcOffers: ["Customer > Customer Experience & Journey Design"] });
check("a need under a retired agenda with a Customer Experience primary moves to Redesign the customer experience", cx.agenda === "redesign-customer-experience" && cx.area === "customer-growth", JSON.stringify(cx));
const price = migrateNeed({ name: "b", agenda: "marketing-sales-effectiveness", area: "customer-growth", mcOffers: ["Customer > Pricing & Monetization Strategy", "Customer > Change Management"] });
check("a Pricing & Monetization primary moves to Grow customer value, whichever retired agenda it was under", price.agenda === "grow-customer-value" && price.mcOffers.length === 2, JSON.stringify(price));
const other = migrateNeed({ name: "c", agenda: "pricing-commercial-excellence", area: "customer-growth", mcOffers: ["Customer > Customer Technology & AI"] });
check("any other primary leaves the agenda empty, still in the Customer area", !("agenda" in other) && other.area === "customer-growth" && other.mcOffers[0] === "Customer > Customer Technology & AI", JSON.stringify(other));
const none = migrateNeed({ name: "d", agenda: "marketing-sales-effectiveness", mcOffers: [] });
check("a need with no offerings is kept, as Other in Customer", !("agenda" in none) && none.area === "customer-growth", JSON.stringify(none));
const keep = { name: "e", agenda: "modernize-customer-service", area: "customer-growth", mcOffers: ["Customer > Customer Service & Success"] };
const keepFin = { name: "f", agenda: "cost-margin-cash", area: "finance", mcOffers: ["Finance > Finance Strategy"] };
const keepOther = { name: "g", area: "strategy", mcOffers: ["Strategy & AI Transformation > Corporate Strategy"] };
check("needs under a current agenda (including reworded ones) and Other needs are untouched", [keep, keepFin, keepOther].every((n) => migrateNeed(n) === n));
check("the agenda id helper only changes retired ids", migrateAgendaId("cost-margin-cash", "x") === "cost-margin-cash" && migrateAgendaId("pricing-commercial-excellence", "Customer > Pricing & Monetization Strategy") === "grow-customer-value" && migrateAgendaId("pricing-commercial-excellence", "Finance > Finance AI") === undefined);
check("running it twice changes nothing", [cx, price, other, none, keep, keepFin, keepOther].every((n) => JSON.stringify(migrateNeed(n)) === JSON.stringify(n)));
check("a migrated need is never under an id that is off the storefront", [cx, price, other, none].every((n) => !n.agenda || ids.has(n.agenda)));

// ---- the SQL carries the same mapping ----
{
  const { main, review } = buildSql();
  check("the SQL maps every primary offering to its agenda", Object.entries(AGENDA_BY_PRIMARY).every(([o, a]) => main.includes(`when '${o}' then '${a}'`)));
  check("the SQL names both retired agendas and no current one as retired", RETIRED_AGENDAS.every((a) => main.includes(`'${a}'`)) && !/in \('[^)]*cost-margin-cash[^)]*'\)\s+then/.test(main));
  check("the SQL snapshots before it updates and drops its helper functions", main.indexOf("insert into industry_content_versions") < main.indexOf("update industry_content ic") && (main.match(/drop function/g) || []).length === 2 && !/create (or replace )?function[^;]*\$f\$[^;]*drop function/.test(main));
  check("the SQL also rewrites the saved corrections (final and proposed agenda)", /update industry_need_feedback\s+set final_agenda/.test(main) && /set proposed_agenda/.test(main));
  check("the SQL's check lists all 18 current agendas", AGENDAS.every((a) => main.includes(`'${a.id}'`)));
  check("the review query reads the snapshot the main script saves", /created_by = 'agenda-update'/.test(review) && /'agenda-update'/.test(main));
  check("the SQL sets the Customer area on a moved need", /'area', 'customer-growth'/.test(main));
}

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
