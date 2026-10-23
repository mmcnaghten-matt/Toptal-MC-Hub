-- Corrections an admin makes to where a need sits (service area, agenda, primary and secondary offering), so future Industry Insights
-- refreshes can learn from them: the latest corrections are sent with each refresh as worked examples.
-- Admin-only: read and write both require the admin role (same check as the other industry tables).
create table if not exists public.industry_need_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text not null,
  sub_industry_id text not null,
  need_name text not null,
  -- signals and the start of the narrative, trimmed, so an example makes sense without the full content
  need_text text not null default '',
  proposed_area text,
  proposed_agenda text,
  proposed_primary text,
  proposed_secondary text,
  final_area text not null,
  final_agenda text,
  final_primary text not null,
  final_secondary text,
  source text not null check (source in ('refresh-preview', 'editor', 'spreadsheet-review'))
);

create index if not exists industry_need_feedback_created_idx on public.industry_need_feedback (created_at desc);

alter table public.industry_need_feedback enable row level security;

create policy "Admins can read need feedback"
  on public.industry_need_feedback for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can add need feedback"
  on public.industry_need_feedback for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
