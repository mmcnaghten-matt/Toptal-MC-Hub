-- Research scope per sub-sector: plain-words guidance telling the Industry Insights refresh what a sub-sector means
-- in our model (for example "Higher Education" is the education industry itself, not student lending).
create table if not exists public.industry_scopes (
  sub_industry_id text primary key,
  scope text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.industry_scopes enable row level security;

create policy "Authenticated users can read industry scopes"
  on public.industry_scopes for select
  to authenticated
  using (true);

create policy "Admins can insert industry scopes"
  on public.industry_scopes for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update industry scopes"
  on public.industry_scopes for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete industry scopes"
  on public.industry_scopes for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Pre-fill Higher Education, which sits under Banking, Financial Services & Insurance in our model.
insert into public.industry_scopes (sub_industry_id, scope, updated_by)
values (
  'higher-ed',
  'The higher education industry itself: colleges and universities (public, private and for-profit), their enrollment, funding and tuition economics, operations, technology, research and workforce. Not student lending, financial aid or education finance. The parent industry name is only a grouping in our internal model.',
  'migration'
)
on conflict (sub_industry_id) do nothing;
