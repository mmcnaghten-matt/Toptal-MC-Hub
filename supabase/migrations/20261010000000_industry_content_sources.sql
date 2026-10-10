-- Evidence-grounded Industry Insights refresh: store the numbered sources behind the citations
-- and when the research was run. Existing rows keep working (no sources = no citations shown).
alter table public.industry_content
  add column if not exists sources jsonb not null default '[]'::jsonb,
  add column if not exists researched_at timestamptz;
