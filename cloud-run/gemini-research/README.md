# gemini-research (Cloud Run)

Client Insights research pipeline. Same code as `supabase/functions/gemini-research`, hosted on Cloud Run so runs can take
longer than Supabase's 150s limit (budget 280s, request timeout 300s).

Deploy (project `toptal-mc-ai-enablement`, region `northamerica-northeast2`):

```bash
# once: store the Gemini key (copy the key to the clipboard first)
pbpaste | gcloud secrets create gemini-api-key --data-file=- --project toptal-mc-ai-enablement

gcloud run deploy gemini-research \
  --source cloud-run/gemini-research \
  --project toptal-mc-ai-enablement --region northamerica-northeast2 \
  --allow-unauthenticated --timeout 300 --memory 512Mi --cpu 1 \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

Then set `VITE_RESEARCH_URL` (the service URL) in the site build. If unset, the page falls back to the Supabase function.
