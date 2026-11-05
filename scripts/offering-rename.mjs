// The offering/area rename of November 2026 (see src/data/mcOfferings.ts) as a data migration for the saved needs.
//   node scripts/offering-rename.mjs <outDir>
// Writes offering-rename.sql (snapshot, rewrite, checks) and offering-rename-review.sql (lists every need the rename moved or swapped).
//
// What changes in a saved need ("L2 > L3" strings are stored in mcOffers):
//   - the three renamed areas: Strategy & Transformation, Customer & Growth, Risk & Compliance (every offering under them is renamed);
//   - Customer & Growth > Growth Strategy becomes Strategy & AI Transformation > Growth Strategy (the offering moved area);
//   - Customer Experience, Customer & Growth Technology and Customer & Growth AI (merged), Learning & Capability Development (folded
//     into Talent & Leadership).
// A need whose PRIMARY moved area cannot stay under an agenda of its old area: if its secondary is in that area the two swap, otherwise
// the need follows the primary into its new area and loses its agenda ("Other"). `migrateNeed` is that rule in JavaScript; the SQL
// below is the same rule written for Postgres, so it runs on whatever is saved now (scripts/qc/pipeline/offering-rename.test.mjs
// checks the JavaScript and that the SQL carries the same mapping).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Offerings renamed, merged, moved or removed. */
export const RETIRED_OFFERS = {
  "Customer & Growth > Growth Strategy": "Strategy & AI Transformation > Growth Strategy",
  "Customer & Growth > Customer Experience": "Customer > Customer Experience & Journey Design",
  "Customer & Growth > Customer & Growth Technology": "Customer > Customer Technology & AI",
  "Customer & Growth > Customer & Growth AI": "Customer > Customer Technology & AI",
  "People & Organization > Learning & Capability Development": "People & Organization > Talent & Leadership",
};
/** Areas renamed (their other offerings keep their names). */
export const RETIRED_L2 = {
  "Strategy & Transformation": "Strategy & AI Transformation",
  "Customer & Growth": "Customer",
  "Risk & Compliance": "Risk, Compliance & AI Governance",
};

export function renameOffer(o) {
  if (RETIRED_OFFERS[o]) return RETIRED_OFFERS[o];
  const i = o.indexOf(" > ");
  if (i > 0 && RETIRED_L2[o.slice(0, i)]) return `${RETIRED_L2[o.slice(0, i)]}${o.slice(i)}`;
  return o;
}

const { AGENDAS, SERVICE_AREAS } = await import(path.join(root, "src/data/mcStorefront.ts"));
const areaOfAgenda = new Map(AGENDAS.map((a) => [a.id, a.area]));
const areaOfL2 = new Map(SERVICE_AREAS.map((a) => [a.catalogL2, a.id]));
const areaOfOffer = (o) => areaOfL2.get(String(o ?? "").split(" > ")[0]);

/** The rule above, applied to one saved need ({ agenda?, area?, mcOffers }). Returns a new object. */
export function migrateNeed(need) {
  if (!Array.isArray(need.mcOffers)) return need;
  const original = need.mcOffers[0];
  const offers = [...new Set(need.mcOffers.map(renameOffer))].slice(0, 2);
  let out = { ...need, mcOffers: offers };
  const area = areaOfAgenda.get(need.agenda) ?? need.area;
  const primaryRenamed = original !== undefined && renameOffer(original) !== original;
  if (primaryRenamed && area && areaOfOffer(offers[0]) && areaOfOffer(offers[0]) !== area) {
    if (offers[1] && areaOfOffer(offers[1]) === area) out.mcOffers = [offers[1], offers[0]];
    else {
      const { agenda, ...rest } = out;
      out = { ...rest, area: areaOfOffer(offers[0]) };
    }
  }
  return out;
}

const sq = (s) => `'${String(s).replace(/'/g, "''")}'`;
const RETIRED_PATTERN = `(${[...Object.keys(RETIRED_L2).map((l2) => `${l2} > `), "Learning & Capability Development"].join("|")})`;

export function buildSql() {
  const offerCases = [
    ...Object.entries(RETIRED_OFFERS).map(([from, to]) => `    when o = ${sq(from)} then ${sq(to)}`),
    ...Object.entries(RETIRED_L2).map(([from, to]) => `    when split_part(o, ' > ', 1) = ${sq(from)} then ${sq(to)} || ' > ' || split_part(o, ' > ', 2)`),
  ].join("\n");
  const areaOfOfferCases = SERVICE_AREAS.map((a) => `    when ${sq(a.catalogL2)} then ${sq(a.id)}`).join("\n");
  const areaOfAgendaCases = AGENDAS.map((a) => `    when ${sq(a.id)} then ${sq(a.area)}`).join("\n");
  const touched = `ic.needs::text ~ ${sq(RETIRED_PATTERN)}`;

  const main = `-- The MC offering rename, applied to what is saved: industry_content.needs (mcOffers) and industry_need_feedback.
-- Run it once in the Supabase SQL Editor, then run offering-rename-review.sql to see the needs that changed service area or agenda.
-- Step 2 saves a snapshot of every affected sub-sector in the version history first, so the admin page's Restore can undo it.
-- Wording, signals and narratives are not changed. Running it again changes nothing.

-- 1. Helper functions (dropped again in step 6)
create or replace function public.offering_rename_offer(o text) returns text language sql immutable as $f$
  select case
${offerCases}
    else o
  end
$f$;

create or replace function public.offering_rename_area_of(o text) returns text language sql immutable as $f$
  select case split_part(o, ' > ', 1)
${areaOfOfferCases}
  end
$f$;

create or replace function public.offering_rename_agenda_area(a text) returns text language sql immutable as $f$
  select case a
${areaOfAgendaCases}
  end
$f$;

-- One saved need: rename its offerings (primary first, at most two); if the primary moved to another area, swap it with a secondary
-- that is in the need's area, or else move the need to the primary's area without an agenda.
create or replace function public.offering_rename_need(n jsonb) returns jsonb language plpgsql immutable as $f$
declare
  original text;
  offers text[] := '{}';
  o text;
  cur_area text;
begin
  if jsonb_typeof(n->'mcOffers') is distinct from 'array' then
    return n;
  end if;
  original := n->'mcOffers'->>0;
  for o in select jsonb_array_elements_text(n->'mcOffers') loop
    o := public.offering_rename_offer(o);
    if not (o = any(offers)) then
      offers := offers || o;
    end if;
  end loop;
  offers := offers[1:2];
  cur_area := coalesce(public.offering_rename_agenda_area(n->>'agenda'), n->>'area');
  if original is not null
     and public.offering_rename_offer(original) <> original
     and cur_area is not null
     and public.offering_rename_area_of(offers[1]) is not null
     and public.offering_rename_area_of(offers[1]) <> cur_area then
    if public.offering_rename_area_of(offers[2]) = cur_area then
      offers := array[offers[2], offers[1]];
    else
      n := (n - 'agenda') || jsonb_build_object('area', public.offering_rename_area_of(offers[1]));
    end if;
  end if;
  return n || jsonb_build_object('mcOffers', to_jsonb(offers));
end
$f$;

-- 2. Snapshot (version history)
insert into industry_content_versions (sub_industry_id, version_number, content, created_by)
select ic.sub_industry_id,
       coalesce((select max(v.version_number) from industry_content_versions v where v.sub_industry_id = ic.sub_industry_id), 0) + 1,
       to_jsonb(ic),
       'offering-rename'
from industry_content ic
where jsonb_typeof(ic.needs) = 'array' and ${touched};

-- 3. Rewrite the saved needs
update industry_content ic
set needs = (select jsonb_agg(public.offering_rename_need(t.n) order by t.ord)
             from jsonb_array_elements(ic.needs) with ordinality as t(n, ord)),
    updated_at = now()
where jsonb_typeof(ic.needs) = 'array' and ${touched};

-- 4. Rewrite the saved corrections (worked examples for future refreshes)
update industry_need_feedback f
set proposed_primary = public.offering_rename_offer(f.proposed_primary),
    proposed_secondary = public.offering_rename_offer(f.proposed_secondary),
    final_primary = m.need->'mcOffers'->>0,
    final_secondary = m.need->'mcOffers'->>1,
    final_agenda = m.need->>'agenda',
    final_area = coalesce(m.need->>'area', f.final_area)
from (
  select id,
         public.offering_rename_need(jsonb_build_object(
           'agenda', nullif(final_agenda, ''),
           'area', final_area,
           'mcOffers', to_jsonb(array_remove(array[nullif(final_primary, ''), nullif(final_secondary, '')], null)))) as need
  from industry_need_feedback
  where coalesce(proposed_primary, '') || '|' || coalesce(proposed_secondary, '') || '|' || final_primary || '|' || coalesce(final_secondary, '') ~ ${sq(RETIRED_PATTERN)}
) m
where f.id = m.id;

-- 5. Checks. Expected: retired_in_needs 0, retired_in_feedback 0, too_many_offers 0.
select (select count(*) from industry_content ic, jsonb_array_elements(ic.needs) n, jsonb_array_elements_text(coalesce(n->'mcOffers', '[]'::jsonb)) o
        where o ~ ${sq(RETIRED_PATTERN)}) as retired_in_needs,
       (select count(*) from industry_need_feedback
        where coalesce(proposed_primary, '') || '|' || coalesce(proposed_secondary, '') || '|' || final_primary || '|' || coalesce(final_secondary, '') ~ ${sq(RETIRED_PATTERN)}) as retired_in_feedback,
       (select count(*) from industry_content ic, jsonb_array_elements(ic.needs) n where jsonb_array_length(coalesce(n->'mcOffers', '[]'::jsonb)) > 2) as too_many_offers;

-- 6. Remove the helper functions
drop function public.offering_rename_need(jsonb);
drop function public.offering_rename_agenda_area(text);
drop function public.offering_rename_area_of(text);
drop function public.offering_rename_offer(text);
`;

  const review = `-- Needs the offering rename moved or swapped: compares each sub-sector's snapshot (saved by offering-rename.sql) with what is saved now.
-- "swapped": the secondary became the primary so the need keeps its agenda. "moved": the need followed its Growth Strategy primary to
-- Strategy & AI Transformation and is now under "Other agenda" there. Fix any of them on the admin page (Edit > Service area / Agenda).
with snap as (
  select distinct on (v.sub_industry_id) v.sub_industry_id, v.content->'needs' as needs
  from industry_content_versions v
  where v.created_by = 'offering-rename'
  order by v.sub_industry_id, v.version_number desc
)
select ic.sub_industry_id as sub_sector,
       n->>'name' as need,
       case when n->>'agenda' is not distinct from old.o->>'agenda' and n->>'area' is not distinct from old.o->>'area' then 'swapped' else 'moved' end as outcome,
       old.o->>'agenda' as old_agenda,
       old.o->>'area' as old_area,
       old.o->'mcOffers' as old_offers,
       n->>'agenda' as new_agenda,
       n->>'area' as new_area,
       n->'mcOffers' as new_offers
from industry_content ic
join snap s on s.sub_industry_id = ic.sub_industry_id
cross join lateral jsonb_array_elements(ic.needs) as n
join lateral (select e.value as o from jsonb_array_elements(s.needs) e where e.value->>'name' = n->>'name' limit 1) old on true
where old.o->'mcOffers'->>0 = 'Customer & Growth > Growth Strategy'
order by ic.sub_industry_id, n->>'name';
`;
  return { main, review };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = process.argv[2];
  if (!outDir) {
    console.error("usage: node scripts/offering-rename.mjs <outDir>");
    process.exit(1);
  }
  const { main, review } = buildSql();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "offering-rename.sql"), main);
  writeFileSync(path.join(outDir, "offering-rename-review.sql"), review);
  console.log(`wrote ${outDir}/offering-rename.sql and offering-rename-review.sql`);
}
