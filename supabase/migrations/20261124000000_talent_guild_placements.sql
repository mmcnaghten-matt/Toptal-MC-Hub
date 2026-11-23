-- Safe to run more than once.
-- Talent Guild: one profile can be in several service areas, with its own role in each. A profile (talent_profiles) is the person; each
-- area they are in is a placement (talent_placements: service area + role). In the GM Talent Guild Members column a placement can be
-- flagged as a Fractional Leader: at most 2 per service area.
--   access: same as the profiles: only people on the Talent Guild access list (has_talent_bench_access).
--   the old service_area and role columns on talent_profiles are kept, made optional and ignored (a mirror for rollback); drop them later.

create table if not exists public.talent_placements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  profile_id uuid not null references public.talent_profiles (id) on delete cascade,
  service_area text not null check (service_area in ('strategy', 'finance', 'people', 'supply-chain')),
  role text not null check (role in ('engagement-leader', 'manager', 'specialist', 'gm-member')),
  fractional_leader boolean not null default false,
  -- only a placement in the GM Talent Guild Members column can be flagged
  constraint talent_placements_fractional_gm check (not fractional_leader or role = 'gm-member'),
  -- one role per service area for a person
  constraint talent_placements_one_per_area unique (profile_id, service_area)
);

create index if not exists talent_placements_cell_idx on public.talent_placements (service_area, role);

-- At most 2 Fractional Leaders per service area. The lock makes two people flagging at once count correctly.
create or replace function public.talent_placements_cap()
returns trigger
language plpgsql
as $$
begin
  if new.fractional_leader then
    perform pg_advisory_xact_lock(hashtext('talent_fractional_leader_' || new.service_area));
    if (select count(*) from public.talent_placements p
        where p.service_area = new.service_area and p.fractional_leader and p.id <> new.id) >= 2 then
      raise exception 'At most 2 Fractional Leaders per service area';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists talent_placements_cap on public.talent_placements;
create trigger talent_placements_cap
  before insert or update on public.talent_placements
  for each row execute function public.talent_placements_cap();

alter table public.talent_placements enable row level security;

drop policy if exists "Talent Guild members can read placements" on public.talent_placements;
create policy "Talent Guild members can read placements"
  on public.talent_placements for select
  to authenticated
  using (public.has_talent_bench_access());

drop policy if exists "Talent Guild members can add placements" on public.talent_placements;
create policy "Talent Guild members can add placements"
  on public.talent_placements for insert
  to authenticated
  with check (public.has_talent_bench_access());

drop policy if exists "Talent Guild members can change placements" on public.talent_placements;
create policy "Talent Guild members can change placements"
  on public.talent_placements for update
  to authenticated
  using (public.has_talent_bench_access())
  with check (public.has_talent_bench_access());

drop policy if exists "Talent Guild members can remove placements" on public.talent_placements;
create policy "Talent Guild members can remove placements"
  on public.talent_placements for delete
  to authenticated
  using (public.has_talent_bench_access());

-- The old columns are no longer required (new profiles are saved without them) and are no longer read.
alter table public.talent_profiles alter column service_area drop not null;
alter table public.talent_profiles alter column role drop not null;

-- BACKFILL: give every profile that has no placement yet the one it already had (its old area and role). Safe to run again: it only
-- touches profiles with no placement at all, so it never brings back an area someone was removed from. Run it once more after the new
-- page is deployed, to catch anything saved by the old page in between.
insert into public.talent_placements (profile_id, service_area, role)
select p.id, p.service_area, p.role
from public.talent_profiles p
where p.service_area is not null
  and p.role is not null
  and not exists (select 1 from public.talent_placements x where x.profile_id = p.id)
on conflict (profile_id, service_area) do nothing;

-- Check. Expected: profiles_without_placement 0.
select (select count(*) from public.talent_profiles p where not exists (select 1 from public.talent_placements x where x.profile_id = p.id)) as profiles_without_placement,
       (select count(*) from public.talent_placements) as placements;
