CREATE POLICY "Anyone can delete survey records"
ON public.survey_records
FOR DELETE
TO anon, authenticated
USING (true);