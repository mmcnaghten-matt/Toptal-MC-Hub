-- Let a person delete their own Client Insights reports (and stop a run that is still going).
-- Deleting a job also deletes its saved report and step journal (on delete cascade).
create policy "Owners can delete their client insight jobs"
  on public.client_insight_jobs for delete
  to authenticated
  using (user_id = auth.uid());
