-- Add separate enterprise and role columns to diagnostic_respondents.
-- Previously these were combined into job_title as "role at enterprise".

ALTER TABLE public.diagnostic_respondents
  ADD COLUMN enterprise TEXT NOT NULL DEFAULT '',
  ADD COLUMN role       TEXT NOT NULL DEFAULT '';

-- Best-effort parse existing rows: "Role at Enterprise" → separate columns
UPDATE public.diagnostic_respondents
SET
  role = CASE
    WHEN position(' at ' IN job_title) > 0
    THEN left(job_title, position(' at ' IN job_title) - 1)
    ELSE job_title
  END,
  enterprise = CASE
    WHEN position(' at ' IN job_title) > 0
    THEN substring(job_title FROM position(' at ' IN job_title) + 4)
    ELSE ''
  END;

-- Allow admin (anon/authenticated) to delete respondents (cascade removes response + recommendation)
CREATE POLICY "Anon delete respondents"
  ON public.diagnostic_respondents FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Authenticated delete respondents"
  ON public.diagnostic_respondents FOR DELETE
  TO authenticated
  USING (true);
