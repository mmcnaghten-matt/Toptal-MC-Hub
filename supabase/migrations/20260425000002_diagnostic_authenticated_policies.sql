-- Add RLS policies for authenticated role on diagnostic tables
-- Needed when users access diagnostics after logging into the hub
-- (Supabase client uses authenticated role, not anon, when a session exists)

CREATE POLICY "Authenticated insert respondents"
  ON public.diagnostic_respondents FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated read respondents"
  ON public.diagnostic_respondents FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated insert responses"
  ON public.diagnostic_responses FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated read responses"
  ON public.diagnostic_responses FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated read recommendations"
  ON public.diagnostic_recommendations FOR SELECT
  TO authenticated USING (true);
