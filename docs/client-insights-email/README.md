# Background Client Insights reports: setup

"Run in the background" on the Client Insights page runs the research on the server (`client-insights-job` edge function)
instead of in the browser tab. The person can close the page and come back: the finished report appears under
**Your recent reports** on the Client Insights page. It is saved for 30 days and only the person who ran it can open it.

**No mailbox is needed.** Email is an optional extra (see the end); without it nothing is emailed.

Nothing here is shared with the assistant: you create and store every secret yourself.

## One-time setup

1. **Migration.** Run `supabase/migrations/20261012000000_client_insight_jobs.sql` (SQL editor).
2. **Extensions.** Dashboard > Database > Extensions: enable `pg_cron` and `pg_net`.
3. **Supabase secret** (Dashboard > Edge Functions > Secrets): `JOB_SECRET`, a long random string you choose and store
   (used between the two functions and the cron job).
4. **Deploy both functions** (Dashboard > Edge Functions, paste each file):
   - `gemini-research`: `npm run copy:client-insights` (adds support for the server's internal calls).
   - `client-insights-job`: `npm run copy:client-insights-job` (generates the file from the app source, stamps the build, copies it). Create the function with that name.
5. **Cron.** In the SQL editor (replace the placeholders; this is the only place the secret appears, and it is not committed):
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
   It restarts jobs whose slice died and deletes reports older than 30 days.

## How a report runs

A report takes 5-7 minutes; an edge function lives about 150 seconds. The job therefore runs in slices: every research
call is saved (`client_insight_steps`), a slice replays the pipeline (saved calls return instantly), starts new calls for
about 40 seconds, then starts the next slice. Cron resumes any job whose slice died. A job stops after 30 minutes or 30 slices.

## Who can use it

Only signed-in `@toptal.com` accounts. The page checks the sign-in, `start` takes the person from the verified token
(never from the request), the database has a check constraint on the stored address, and the research function accepts
internal calls only with the job secret and a `@toptal.com` user. Each person can have 2 running and 10 started per day.

## Optional: email when a report is ready

Not set up, and not needed. If you ever get a mailbox that can send (a shared mailbox, a send-as alias, or similar),
the function is ready for it:

1. Signed in as that account, create a project at <https://script.google.com> and paste `apps-script.gs`.
2. Script properties: `MAIL_SECRET` (a long random string); optional `FROM_ALIAS`.
3. Deploy > New deployment > Web app: execute as **Me**, access **Anyone**. Copy the URL.
4. Supabase secrets: `APPS_SCRIPT_URL` (that URL), `APPS_SCRIPT_SECRET` (same value as `MAIL_SECRET`), optional `APP_URL`
   (default `https://mc-hub.toptal.tech`).

With those set, the job emails the person's own login address with a link, and retries an unsent email for an hour. The
script and the function both refuse any recipient that is not `@toptal.com`. The page text would also need a line
saying an email will be sent; today it says "Nothing is emailed."

## Updating

Edit `src/services/researchPipeline.ts` (or `scripts/job/template.ts`), run `npm run build:job-function`, commit the
generated `supabase/functions/client-insights-job/index.ts`, and redeploy both functions. `npm run qc` fails if the
generated file is out of date.
