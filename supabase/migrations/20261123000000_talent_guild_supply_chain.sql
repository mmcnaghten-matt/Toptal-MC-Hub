-- Safe to run more than once.
-- Talent Guild: a fourth service area, Supply Chain & Operations (the storefront id is 'supply-chain'). The service_area column only
-- accepted the first three, so a profile saved in the new area would be refused until this runs. No data changes.
alter table public.talent_profiles drop constraint if exists talent_profiles_service_area_check;
alter table public.talent_profiles
  add constraint talent_profiles_service_area_check check (service_area in ('strategy', 'finance', 'people', 'supply-chain'));
