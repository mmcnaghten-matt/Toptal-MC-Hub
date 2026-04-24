import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticRecommendation } from "../types";

export function useRecommendation(responseId: string | undefined) {
  return useQuery<DiagnosticRecommendation | null>({
    queryKey: ['diagnostic-recommendation', responseId],
    queryFn: async () => {
      if (!responseId) return null;

      const { data, error } = await supabase
        .from('diagnostic_recommendations' as never)
        .select('*')
        .eq('response_id', responseId)
        .maybeSingle();

      if (error) throw error;
      return (data as DiagnosticRecommendation) ?? null;
    },
    enabled: !!responseId,
    refetchInterval: (query) => {
      // Poll until we have a recommendation
      return query.state.data ? false : 3000;
    },
  });
}

export function useResponse(responseId: string | undefined) {
  return useQuery({
    queryKey: ['diagnostic-response', responseId],
    queryFn: async () => {
      if (!responseId) return null;

      const { data, error } = await supabase
        .from('diagnostic_responses' as never)
        .select('*')
        .eq('id', responseId)
        .maybeSingle();

      if (error) throw error;
      return data as { id: string; score_summary: Record<string, number> | null } | null;
    },
    enabled: !!responseId,
  });
}
