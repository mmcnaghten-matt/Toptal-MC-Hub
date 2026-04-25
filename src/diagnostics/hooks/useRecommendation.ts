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
      return data as {
        id: string;
        respondent_id: string;
        answers: Record<string, number>;
        score_summary: Record<string, number> | null;
      } | null;
    },
    enabled: !!responseId,
  });
}

export function useRespondent(respondentId: string | undefined) {
  return useQuery({
    queryKey: ['diagnostic-respondent', respondentId],
    queryFn: async () => {
      if (!respondentId) return null;

      const { data, error } = await supabase
        .from('diagnostic_respondents' as never)
        .select('id, full_name, enterprise, role, job_title, department')
        .eq('id', respondentId)
        .maybeSingle();

      if (error) throw error;
      return data as { id: string; full_name: string; enterprise: string; role: string; job_title: string; department: string } | null;
    },
    enabled: !!respondentId,
  });
}
