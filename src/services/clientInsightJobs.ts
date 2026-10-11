// Background Client Insights reports: starting a server-side job, listing the person's own jobs, loading a saved report.
// The research itself runs in the client-insights-job edge function; the browser only starts it and reads results
// back through row-level security (a person can read only their own jobs and reports).
import { supabase } from "@/integrations/supabase/client";
import { isToptalEmail } from "@/lib/toptalEmail";
import type { ResearchResult } from "./geminiService";

export type JobStatus = "running" | "done" | "failed";

export interface ClientInsightJob {
  id: string;
  company: string;
  status: JobStatus;
  progress: string | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
  expires_at: string;
}

// The new tables are not in the generated database types, so use an untyped handle for them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tables = () => supabase as unknown as { from: (table: string) => any };

/** The signed-in person's Toptal address, or null if there is none (not signed in, or not a toptal.com account). */
export async function getSignedInToptalEmail(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email ?? null;
  return isToptalEmail(email) ? email.toLowerCase() : null;
}

export async function startBackgroundReport(input: { companyName: string; companyWebsite?: string; deepResearch: boolean }): Promise<{ id: string; email: string; expiresAt: string }> {
  if (!supabase) throw new Error("Backend not configured. This feature requires a published deployment with Lovable Cloud enabled.");
  // Only the company, website and mode are sent. Who the report belongs to is never part of the request: the server takes it from the sign-in.
  const { data, error } = await supabase.functions.invoke("client-insights-job", { body: { action: "start", ...input } });
  if (error) {
    const res = (error as { context?: Response }).context;
    const detail = await res?.json?.().catch(() => null);
    throw new Error(detail?.error || error.message || "Could not start the background report");
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listMyJobs(limit = 8): Promise<ClientInsightJob[]> {
  if (!supabase) return [];
  const { data, error } = await tables()
    .from("client_insight_jobs")
    .select("id, company, status, progress, error, created_at, finished_at, expires_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientInsightJob[];
}

/** A saved report, or null if it does not exist, has expired, or belongs to someone else (all look the same). */
export async function loadReport(jobId: string): Promise<ResearchResult | null> {
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(jobId)) return null;
  const { data, error } = await tables().from("client_insight_reports").select("result").eq("job_id", jobId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.result as ResearchResult | undefined) ?? null;
}
