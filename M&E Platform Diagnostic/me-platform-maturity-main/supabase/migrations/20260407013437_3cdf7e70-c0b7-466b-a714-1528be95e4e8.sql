
CREATE TABLE public.survey_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  enterprise TEXT NOT NULL,
  department TEXT,
  role TEXT,
  email TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  pillar_scores DOUBLE PRECISION[] NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert survey records"
  ON public.survey_records FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read survey records"
  ON public.survey_records FOR SELECT
  TO anon, authenticated
  USING (true);
