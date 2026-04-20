-- Create industry_content table for current live content
CREATE TABLE public.industry_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_industry_id TEXT NOT NULL UNIQUE,
  industry_id TEXT NOT NULL,
  sub_industry_name TEXT NOT NULL,
  industry_name TEXT NOT NULL,
  overview TEXT NOT NULL DEFAULT '',
  challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
  initiatives JSONB NOT NULL DEFAULT '[]'::jsonb,
  needs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create industry_content_versions table for rollback
CREATE TABLE public.industry_content_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_industry_id TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'system',
  UNIQUE(sub_industry_id, version_number)
);

-- Enable RLS
ALTER TABLE public.industry_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_content_versions ENABLE ROW LEVEL SECURITY;

-- Public read policies (content is not user-specific, protected by app password gate)
CREATE POLICY "Anyone can read industry content"
  ON public.industry_content FOR SELECT USING (true);

CREATE POLICY "Anyone can insert industry content"
  ON public.industry_content FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update industry content"
  ON public.industry_content FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete industry content"
  ON public.industry_content FOR DELETE USING (true);

CREATE POLICY "Anyone can read content versions"
  ON public.industry_content_versions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert content versions"
  ON public.industry_content_versions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete content versions"
  ON public.industry_content_versions FOR DELETE USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_industry_content_updated_at
  BEFORE UPDATE ON public.industry_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_industry_content_sub_id ON public.industry_content(sub_industry_id);
CREATE INDEX idx_versions_sub_id ON public.industry_content_versions(sub_industry_id);