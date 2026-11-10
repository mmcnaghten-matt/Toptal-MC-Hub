-- Safe to run more than once.
-- Talent Bench: pre-identified talent for the Engagement Leader, Manager and Specialist roles in three service areas. A restricted page
-- on the hub (Way of Working > Talent Bench). Candidate data lives only here, never in the code repository, which is public.
--   access: only people listed in talent_bench_access, signed in with Google and a verified email (the same checks as private_pages).
--           People are added from the SQL editor:  insert into public.talent_bench_access (email) values ('name@toptal.com');
--   talent: everyone with access can read and change the list.

create table if not exists public.talent_bench_access (
  email text primary key check (email = lower(email))
);

alter table public.talent_bench_access enable row level security;

drop policy if exists "People can see their own Talent Bench access" on public.talent_bench_access;
create policy "People can see their own Talent Bench access"
  on public.talent_bench_access for select
  to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- True when the signed-in person may use the Talent Bench. Used by the table policies below, the page and the talent-profile function.
create or replace function public.has_talent_bench_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.talent_bench_access a where a.email = lower(coalesce(auth.jwt() ->> 'email', '')))
    and jsonb_exists(coalesce(auth.jwt() -> 'app_metadata' -> 'providers', '[]'::jsonb), 'google')
    and coalesce(auth.jwt() -> 'user_metadata' ->> 'email_verified', '') = 'true'
$$;

revoke all on function public.has_talent_bench_access() from public, anon;
grant execute on function public.has_talent_bench_access() to authenticated;

create table if not exists public.talent_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  added_by text,
  service_area text not null check (service_area in ('strategy', 'finance', 'people')),
  role text not null check (role in ('engagement-leader', 'manager', 'specialist')),
  name text not null check (char_length(name) between 1 and 200),
  location text not null default '' check (char_length(location) <= 200),
  headline text not null default '' check (char_length(headline) <= 300),
  summary text not null default '' check (char_length(summary) <= 1200),
  highlights jsonb not null default '[]'::jsonb,
  profile_url text not null unique check (profile_url ~ '^https://(www\.)?toptal\.com/'),
  -- a small data URL (resized in the browser) or, for rows added by SQL, an https image address
  photo text check (photo is null or char_length(photo) <= 400000)
);

create index if not exists talent_profiles_cell_idx on public.talent_profiles (service_area, role);

alter table public.talent_profiles enable row level security;

drop policy if exists "Talent Bench members can read talent" on public.talent_profiles;
create policy "Talent Bench members can read talent"
  on public.talent_profiles for select
  to authenticated
  using (public.has_talent_bench_access());

drop policy if exists "Talent Bench members can add talent" on public.talent_profiles;
create policy "Talent Bench members can add talent"
  on public.talent_profiles for insert
  to authenticated
  with check (public.has_talent_bench_access());

drop policy if exists "Talent Bench members can change talent" on public.talent_profiles;
create policy "Talent Bench members can change talent"
  on public.talent_profiles for update
  to authenticated
  using (public.has_talent_bench_access())
  with check (public.has_talent_bench_access());

drop policy if exists "Talent Bench members can remove talent" on public.talent_profiles;
create policy "Talent Bench members can remove talent"
  on public.talent_profiles for delete
  to authenticated
  using (public.has_talent_bench_access());
