-- Private standalone pages: HTML documents (for example a client plan) that open at /p/<slug> on the hub for signed-in Toptal accounts only.
-- They are stored here instead of in the code repository, which is public.
--   read:  any signed-in account whose verified email is @toptal.com
--   write: admins only (rows are normally added from the SQL editor, which bypasses these rules)
create table if not exists public.private_pages (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{0,80}$'),
  title text not null check (char_length(title) between 1 and 200),
  html text not null check (char_length(html) <= 2000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.private_pages enable row level security;

create policy "Toptal accounts can read private pages"
  on public.private_pages for select
  to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@toptal.com');

create policy "Admins can add private pages"
  on public.private_pages for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can change private pages"
  on public.private_pages for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete private pages"
  on public.private_pages for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));
