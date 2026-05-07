ALTER TABLE public.survey_records
ADD COLUMN ai_recommendations jsonb DEFAULT '[]'::jsonb;