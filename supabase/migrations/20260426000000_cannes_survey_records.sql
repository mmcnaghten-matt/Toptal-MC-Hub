-- Create cannes_survey_records table for the Cannes M&E Fan/Audience Platform Diagnostic
CREATE TABLE public.cannes_survey_records (
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
  ai_recommendations JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cannes_survey_records ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert records (no auth required for this survey app)
CREATE POLICY "Anyone can insert cannes survey records"
  ON public.cannes_survey_records
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to read cannes survey records (admin page needs this)
CREATE POLICY "Anyone can read cannes survey records"
  ON public.cannes_survey_records
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to update cannes survey records (for saving AI recommendations)
CREATE POLICY "Anyone can update cannes survey records"
  ON public.cannes_survey_records
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete cannes survey records (admin can delete)
CREATE POLICY "Anyone can delete cannes survey records"
  ON public.cannes_survey_records
  FOR DELETE
  TO anon, authenticated
  USING (true);
