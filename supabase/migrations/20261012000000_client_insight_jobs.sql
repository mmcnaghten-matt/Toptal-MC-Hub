-- Client Insights reports that run on the server and are emailed ("Email me" on the entry page).
--
--   client_insight_jobs     one row per emailed report: who asked, the company, progress, status.
--   client_insight_reports  the finished report (readable only by the person who ran it, kept 30 days).
--   client_insight_steps    the journal of finished research calls, so a job can be resumed in short slices.
--
-- Only the client-insights-job edge function writes to these tables (service role). People can read their own
-- jobs and reports. The recipient is always the signed-in person's own Toptal address: the check constraint
-- below is one of four places that rule is enforced.

create table if not exists public.client_insight_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@toptal\.com$'),
  company text not null check (char_length(company) between 1 and 200),
  website text check (website is null or char_length(website) <= 253),
  deep_research boolean not null default true,
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  progress text,
  error text,
  attempts int not null default 0,
  lock_until timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  expires_at timestamptz not null default now() + interval '30 days'
);

create index if not exists client_insight_jobs_user_idx on public.client_insight_jobs (user_id, created_at desc);
create index if not exists client_insight_jobs_status_idx on public.client_insight_jobs (status, updated_at);

create table if not exists public.client_insight_reports (
  job_id uuid primary key references public.client_insight_jobs (id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.client_insight_steps (
  job_id uuid not null references public.client_insight_jobs (id) on delete cascade,
  key text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (job_id, key)
);

alter table public.client_insight_jobs enable row level security;
alter table public.client_insight_reports enable row level security;
alter table public.client_insight_steps enable row level security;

-- The owner can see their own, unexpired jobs and reports. There are no insert/update/delete policies:
-- nothing in the browser can create or change a job.
create policy "Owners can read their client insight jobs"
  on public.client_insight_jobs for select
  to authenticated
  using (user_id = auth.uid() and expires_at > now());

create policy "Owners can read their client insight reports"
  on public.client_insight_reports for select
  to authenticated
  using (
    exists (
      select 1 from public.client_insight_jobs j
      where j.id = client_insight_reports.job_id and j.user_id = auth.uid() and j.expires_at > now()
    )
  );

-- client_insight_steps: RLS on and no policies, so only the service role (the edge function) can use it.
