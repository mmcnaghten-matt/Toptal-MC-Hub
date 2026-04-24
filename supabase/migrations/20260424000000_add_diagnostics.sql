-- Diagnostic tools infrastructure
-- Generic tables that scale to any number of diagnostics without schema changes.
-- Each table has a diagnostic_id discriminator so multiple diagnostics share the same tables.

-- Registry of all diagnostics (passwords stored as bcrypt hashes)
CREATE TABLE public.diagnostic_configs (
  id                       TEXT PRIMARY KEY,
  title                    TEXT NOT NULL,
  description              TEXT NOT NULL DEFAULT '',
  respondent_password_hash TEXT NOT NULL,
  admin_password_hash      TEXT NOT NULL,
  questions                JSONB NOT NULL DEFAULT '[]',
  is_active                BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per survey taker (demographics)
CREATE TABLE public.diagnostic_respondents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id TEXT NOT NULL REFERENCES public.diagnostic_configs(id),
  full_name     TEXT NOT NULL,
  job_title     TEXT NOT NULL,
  department    TEXT NOT NULL,
  email         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per completed survey (answers as JSONB)
CREATE TABLE public.diagnostic_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id TEXT NOT NULL REFERENCES public.diagnostic_configs(id),
  respondent_id UUID NOT NULL REFERENCES public.diagnostic_respondents(id) ON DELETE CASCADE,
  answers       JSONB NOT NULL,
  score_summary JSONB,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LLM-generated report — INSERT only via service role (edge function)
CREATE TABLE public.diagnostic_recommendations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id TEXT NOT NULL REFERENCES public.diagnostic_configs(id),
  response_id   UUID NOT NULL REFERENCES public.diagnostic_responses(id) ON DELETE CASCADE,
  content       JSONB NOT NULL,
  model_used    TEXT,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (response_id)
);

-- Enable RLS
ALTER TABLE public.diagnostic_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_recommendations ENABLE ROW LEVEL SECURITY;

-- diagnostic_configs: anon can read active configs; no writes from client
CREATE POLICY "Public read active diagnostic configs"
  ON public.diagnostic_configs FOR SELECT
  TO anon
  USING (is_active = true);

-- diagnostic_respondents: anon can insert and read
CREATE POLICY "Anon insert respondents"
  ON public.diagnostic_respondents FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon read respondents"
  ON public.diagnostic_respondents FOR SELECT
  TO anon
  USING (true);

-- diagnostic_responses: anon can insert and read
CREATE POLICY "Anon insert responses"
  ON public.diagnostic_responses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon read responses"
  ON public.diagnostic_responses FOR SELECT
  TO anon
  USING (true);

-- diagnostic_recommendations: anon can only read; service role writes via edge function
CREATE POLICY "Anon read recommendations"
  ON public.diagnostic_recommendations FOR SELECT
  TO anon
  USING (true);

-- Indexes for common access patterns
CREATE INDEX idx_diagnostic_respondents_diagnostic_id ON public.diagnostic_respondents(diagnostic_id);
CREATE INDEX idx_diagnostic_responses_diagnostic_id ON public.diagnostic_responses(diagnostic_id);
CREATE INDEX idx_diagnostic_responses_respondent_id ON public.diagnostic_responses(respondent_id);
CREATE INDEX idx_diagnostic_recommendations_response_id ON public.diagnostic_recommendations(response_id);

-- Seed: AI Navigator Checkup
-- Passwords: AI2026 (respondent), ADMIN2026 (admin) — bcrypt cost 10
INSERT INTO public.diagnostic_configs (id, title, description, respondent_password_hash, admin_password_hash, questions, is_active)
VALUES (
  'ai-maturity',
  'AI Navigator Checkup',
  'Assess your organization''s AI maturity across five key dimensions and receive a personalized roadmap.',
  '$2b$10$A5YeAQCeHRqYJ7KjfqcLAeLWDv8qJ2Xse9aBsVHPKW2GvvMNzwzsm',
  '$2b$10$9k/.62I91atfNHH5sbPqBuN5yc0tCHgLiMF9aH6nQeqrWSl2vCK9q',
  '[]'::jsonb,
  true
);
