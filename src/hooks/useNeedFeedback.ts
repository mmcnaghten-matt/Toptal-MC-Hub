import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { chooseExamples, type FeedbackRow, type PlacementExample, type StoredFeedback } from "@/lib/needFeedback";

// Saved corrections to where a need sits (service area, agenda, primary and secondary offering). Admin-only (row-level security).

/** The corrections to send with a refresh as worked examples. Never blocks a refresh: any failure just means no examples. */
export async function fetchPlacementExamples(): Promise<PlacementExample[]> {
  try {
    const { data, error } = await supabase.from("industry_need_feedback").select("*").order("created_at", { ascending: false }).limit(80);
    if (error || !data) return [];
    return chooseExamples(data as StoredFeedback[]);
  } catch {
    return [];
  }
}

/** Saves corrections. Failure is reported to the caller but must not undo the save of the content itself. */
export async function recordNeedFeedback(rows: FeedbackRow[]): Promise<void> {
  if (!rows.length) return;
  const { data: auth } = await supabase.auth.getUser();
  const createdBy = auth.user?.email ?? "admin";
  const { error } = await supabase.from("industry_need_feedback").insert(rows.map((r) => ({ ...r, created_by: createdBy })));
  if (error) throw new Error(error.message);
}

/** How many corrections refreshes can learn from (shown next to the refresh buttons). */
export function useFeedbackCount() {
  return useQuery({
    queryKey: ["need-feedback-count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase.from("industry_need_feedback").select("id", { count: "exact", head: true });
      if (error) return 0;
      return count ?? 0;
    },
  });
}
