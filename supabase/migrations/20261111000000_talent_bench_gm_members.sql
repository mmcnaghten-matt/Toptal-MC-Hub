-- Safe to run more than once.
-- Talent Bench: a fourth column in each service area, "GM Talent Bench Members": people the Service Line leaders know in the area who
-- have not yet signed up as an Engagement Leader, Manager or Specialist. It is one more value for the role column.
alter table public.talent_profiles drop constraint if exists talent_profiles_role_check;
alter table public.talent_profiles
  add constraint talent_profiles_role_check check (role in ('engagement-leader', 'manager', 'specialist', 'gm-member'));
