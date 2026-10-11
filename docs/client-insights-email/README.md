# Emailed Client Insights reports: setup

"Email me" on the Client Insights page runs the research on the server (`client-insights-job` edge function) and
emails the person who asked. The email always goes to their own `@toptal.com` login address, from the shared
**Toptal MC Hub** mailbox. The finished report is stored for 30 days and can be opened only by the person who ran it.

Nothing here is shared with the assistant: you create and store every secret yourself.

## One-time setup

1. **Migration.** Run `supabase/migrations/20261012000000_client_insight_jobs.sql` (SQL editor).
2. **Extensions.** Dashboard > Database > Extensions: enable `pg_cron` and `pg_net`.
3. **Mail script.**
   1. Signed in as the shared Toptal MC Hub mailbox, create a project at <https://script.google.com>, paste `apps-script.gs`.
   2. Project Settings > Script properties: add `MAIL_SECRET` (a long random string). Optional `FROM_ALIAS`.
   3. Deploy > New deployment > Web app. Execute as **Me**, access **Anyone**. Authorise when asked. Copy the web app URL.
   4. The script refuses any request without the secret and any recipient that is not `@toptal.com`.
4. **Supabase secrets** (Dashboard > Edge Functions > Secrets). You choose and store the values:
   | Secret | Value |
   | --- | --- |
   | `JOB_SECRET` | a long random string (used between the two functions and the cron job) |
   | `APPS_SCRIPT_URL` | the web app URL from step 3 |
   | `APPS_SCRIPT_SECRET` | the same value as the script's `MAIL_SECRET` |
   | `APP_URL` | optional, default `https://mc-hub.toptal.tech` |
5. **Deploy both functions** (Dashboard > Edge Functions, paste each file):
   - `gemini-research`: `npm run copy:client-insights` (adds support for the server's internal calls).
   - `client-insights-job`: `npm run copy:client-insights-job` (generates the file from the app source, stamps the build, copies it). Create the function with that name.
6. **Cron.** In the SQL editor (replace both placeholders; this is the only place the secret appears, and it is not committed):
   ```sql
   select cron.schedule(
     'client-insights-resume',
     '*/2 * * * *',
     $$
     select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/client-insights-job',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer <service-role key>',
         'x-job-secret', '<JOB_SECRET>'
       ),
       body := '{"action":"resume"}'::jsonb
     );
     $$
   );
   ```
   It restarts jobs whose slice died, retries emails that were not accepted (for an hour) and deletes reports older than 30 days.

## How a report runs

A report takes 5-7 minutes; an edge function lives about 150 seconds. The job therefore runs in slices: every research
call is saved (`client_insight_steps`), a slice replays the pipeline (saved calls return instantly), starts new calls for
about 40 seconds, then starts the next slice. Cron resumes any job whose slice died. A job stops after 30 minutes or 30 slices.

## Rules enforced in four places

Recipient is always the signed-in `@toptal.com` address: the page shows it read-only; `start` takes it from the verified
token and ignores any address in the request; the database has a check constraint; the job function and the mail script
both refuse anything else.

## Updating

Edit `src/services/researchPipeline.ts` (or `scripts/job/template.ts`), run `npm run build:job-function`, commit the
generated `supabase/functions/client-insights-job/index.ts`, and redeploy both functions. `npm run qc` fails if the
generated file is out of date.
