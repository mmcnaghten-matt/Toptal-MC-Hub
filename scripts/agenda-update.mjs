// The client-agenda update of November 2026 (see src/data/mcStorefront.ts) as a data migration for the saved needs.
//   node scripts/agenda-update.mjs <outDir>
// Writes agenda-update.sql (snapshot, rewrite, checks) and agenda-update-review.sql (lists every need whose agenda changed).
//
// Four agendas were only reworded and keep their ids (cost-margin-cash, modernize-planning, cut-procurement-ops-cost,
// govern-ai-regulation), so saved needs need nothing for them. Two Customer agendas were replaced:
//   pricing-commercial-excellence   ("Sharpen pricing and commercial excellence")
//   marketing-sales-effectiveness   ("Lift marketing and sales effectiveness")
// A need under either moves by its PRIMARY offering:
//   Customer > Customer Experience & Journey Design -> redesign-customer-experience
//   Customer > Pricing & Monetization Strategy      -> grow-customer-value
//   anything else                                    -> no agenda ("Other agenda"), still in the Customer area
// The next Industry Insights refresh places those needs under the new agendas properly. `migrateNeed` is that rule in JavaScript; the SQL
// below is the same rule for Postgres, so it runs on whatever is saved now (scripts/qc/pipeline/agenda-update.test.mjs checks the
// JavaScript and that the SQL carries the same mapping).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Agenda ids that no longer exist. */
export const RETIRED_AGENDAS = ["pricing-commercial-excellence", "marketing-sales-effectiveness"];
/** Where a need under a retired agenda goes, by its primary offering. */
export const AGENDA_BY_PRIMARY = {
  "Customer > Customer Experience & Journey Design": "redesign-customer-experience",
  "Customer > Pricing & Monetization Strategy": "grow-customer-value",
};
const CUSTOMER_AREA = "customer-growth";

const { AGENDAS } = await import(path.join(root, "src/data/mcStorefront.ts"));

/** The agenda a retired agenda's need moves to, or undefined for "Other". Agendas that are not retired are returned unchanged. */
export function migrateAgendaId(agenda, primary) {
  if (!RETIRED_AGENDAS.includes(agenda)) return agenda;
  return AGENDA_BY_PRIMARY[primary];
}

/** One saved need ({ agenda?, area?, mcOffers }) or correction. Returns a new object; a need not under a retired agenda is returned as is. */
export function migrateNeed(need) {
  if (!RETIRED_AGENDAS.includes(need.agenda)) return need;
  const next = migrateAgendaId(need.agenda, Array.isArray(need.mcOffers) ? need.mcOffers[0] : undefined);
  if (next) return { ...need, agenda: next, area: CUSTOMER_AREA };
  const { agenda, ...rest } = need;
  return { ...rest, area: CUSTOMER_AREA };
}

const sq = (s) => `'${String(s).replace(/'/g, "''")}'`;
const retiredList = RETIRED_AGENDAS.map(sq).join(", ");
const currentList = AGENDAS.map((a) => sq(a.id)).join(", ");

export function buildSql() {
  const cases = Object.entries(AGENDA_BY_PRIMARY).map(([primary, agenda]) => `    when ${sq(primary)} then ${sq(agenda)}`).join("\n");
  const touched = `ic.needs::text like any (array[${RETIRED_AGENDAS.map((a) => sq(`%"${a}"%`)).join(", ")}])`;

  const main = `-- The client-agenda update, applied to what is saved: industry_content.needs (agenda) and industry_need_feedback.
-- Two Customer agendas were replaced; the other four changes are rewordings that keep their ids, so they need nothing here.
-- Run it once in the Supabase SQL Editor, then run agenda-update-review.sql to see the needs that moved.
-- Step 2 saves a snapshot of every affected sub-sector in the version history first, so the admin page's Restore can undo it.
-- A need under a retired agenda goes by its primary offering: Customer Experience & Journey Design -> "Redesign the customer experience
-- end to end"; Pricing & Monetization Strategy -> "Grow customer value"; anything else -> "Other agenda" in Customer.
-- Wording, signals, narratives and offerings are not changed. Running it again changes nothing.

-- 1. Helper functions (dropped again in step 6)
create or replace function public.agenda_update_agenda(a text, primary_offer text) returns text language sql immutable as $f$
  select case
    when a in (${retiredList}) then
      case primary_offer
${cases.replace(/^ {4}/gm, "        ")}
        else null
      end
    else a
  end
$f$;

-- One saved need: a retired agenda is replaced (or removed), and the area is set to Customer.
create or replace function public.agenda_update_need(n jsonb) returns jsonb language plpgsql immutable as $f$
declare
  next_agenda text;
begin
  if (n->>'agenda') is null or not ((n->>'agenda') in (${retiredList})) then
    return n;
  end if;
  next_agenda := public.agenda_update_agenda(n->>'agenda', n->'mcOffers'->>0);
  if next_agenda is null then
    return (n - 'agenda') || jsonb_build_object('area', ${sq(CUSTOMER_AREA)});
  end if;
  return n || jsonb_build_object('agenda', next_agenda, 'area', ${sq(CUSTOMER_AREA)});
end
$f$;

-- 2. Snapshot (version history)
insert into industry_content_versions (sub_industry_id, version_number, content, created_by)
select ic.sub_industry_id,
       coalesce((select max(v.version_number) from industry_content_versions v where v.sub_industry_id = ic.sub_industry_id), 0) + 1,
       to_jsonb(ic),
       'agenda-update'
from industry_content ic
where jsonb_typeof(ic.needs) = 'array' and ${touched};

-- 3. Rewrite the saved needs
update industry_content ic
set needs = (select jsonb_agg(public.agenda_update_need(t.n) order by t.ord)
             from jsonb_array_elements(ic.needs) with ordinality as t(n, ord)),
    updated_at = now()
where jsonb_typeof(ic.needs) = 'array' and ${touched};

-- 4. Rewrite the saved corrections (worked examples for future refreshes): the final placement by its final primary offering, the
-- model's original proposal by its proposed primary offering.
update industry_need_feedback
set final_agenda = public.agenda_update_agenda(final_agenda, final_primary),
    final_area = case when final_agenda in (${retiredList}) then ${sq(CUSTOMER_AREA)} else final_area end
where final_agenda in (${retiredList});

update industry_need_feedback
set proposed_agenda = public.agenda_update_agenda(proposed_agenda, proposed_primary)
where proposed_agenda in (${retiredList});

-- 5. Checks. Expected: retired_in_needs 0, retired_in_feedback 0, unknown_agenda_in_needs 0.
select (select count(*) from industry_content ic, jsonb_array_elements(ic.needs) n where n->>'agenda' in (${retiredList})) as retired_in_needs,
       (select count(*) from industry_need_feedback where final_agenda in (${retiredList}) or proposed_agenda in (${retiredList})) as retired_in_feedback,
       (select count(*) from industry_content ic, jsonb_array_elements(ic.needs) n
        where n->>'agenda' is not null and not (n->>'agenda' in (${currentList}))) as unknown_agenda_in_needs;

-- 6. Remove the helper functions
drop function public.agenda_update_need(jsonb);
drop function public.agenda_update_agenda(text, text);
`;

  const review = `-- Needs the agenda update moved: compares each sub-sector's snapshot (saved by agenda-update.sql) with what is saved now.
-- "new agenda" shows where the need went; an empty one means it is now under "Other agenda" in Customer. The next Industry Insights
-- refresh places these properly; or fix any of them on the admin page (Edit > Agenda).
with snap as (
  select distinct on (v.sub_industry_id) v.sub_industry_id, v.content->'needs' as needs
  from industry_content_versions v
  where v.created_by = 'agenda-update'
  order by v.sub_industry_id, v.version_number desc
)
select ic.sub_industry_id as sub_sector,
       n->>'name' as need,
       old.o->>'agenda' as old_agenda,
       n->>'agenda' as new_agenda,
       n->'mcOffers'->>0 as primary_offering
from industry_content ic
join snap s on s.sub_industry_id = ic.sub_industry_id
cross join lateral jsonb_array_elements(ic.needs) as n
join lateral (select e.value as o from jsonb_array_elements(s.needs) e where e.value->>'name' = n->>'name' limit 1) old on true
where old.o->>'agenda' in (${retiredList})
order by ic.sub_industry_id, n->>'name';
`;
  return { main, review };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = process.argv[2];
  if (!outDir) {
    console.error("usage: node scripts/agenda-update.mjs <outDir>");
    process.exit(1);
  }
  const { main, review } = buildSql();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "agenda-update.sql"), main);
  writeFileSync(path.join(outDir, "agenda-update-review.sql"), review);
  console.log(`wrote ${outDir}/agenda-update.sql and agenda-update-review.sql`);
}
