
-- Create survey_records table for persisting completed survey submissions
CREATE TABLE public.survey_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  department TEXT,
  role TEXT,
  email TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  total_score INTEGER NOT NULL,
  maturity_level INTEGER NOT NULL,
  maturity_name TEXT NOT NULL,
  maturity_title TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.survey_records ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert records (no auth required for this survey app)
CREATE POLICY "Anyone can insert survey records"
  ON public.survey_records
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read survey records (admin page needs this)
CREATE POLICY "Anyone can read survey records"
  ON public.survey_records
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to delete survey records (admin can delete)
CREATE POLICY "Anyone can delete survey records"
  ON public.survey_records
  FOR DELETE
  TO anon, authenticated
  USING (true);
