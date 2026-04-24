import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticRespondent, DiagnosticResponse, DiagnosticRecommendation } from "../types";

export function useAdminData(diagnosticId: string) {
  return useQuery({
    queryKey: ['diagnostic-admin-data', diagnosticId],
    queryFn: async () => {
      const [respondentsResult, responsesResult, recommendationsResult] = await Promise.all([
        supabase
          .from('diagnostic_respondents' as never)
          .select('*')
          .eq('diagnostic_id', diagnosticId)
          .order('created_at', { ascending: false }),
        supabase
          .from('diagnostic_responses' as never)
          .select('*')
          .eq('diagnostic_id', diagnosticId)
          .order('submitted_at', { ascending: false }),
        supabase
          .from('diagnostic_recommendations' as never)
          .select('*')
          .eq('diagnostic_id', diagnosticId),
      ]);

      if (respondentsResult.error) throw respondentsResult.error;
      if (responsesResult.error) throw responsesResult.error;
      if (recommendationsResult.error) throw recommendationsResult.error;

      const respondents = (respondentsResult.data ?? []) as DiagnosticRespondent[];
      const responses = (responsesResult.data ?? []) as DiagnosticResponse[];
      const recommendations = (recommendationsResult.data ?? []) as DiagnosticRecommendation[];

      const recByResponseId = Object.fromEntries(
        recommendations.map(r => [r.response_id, r])
      );
      const respondentById = Object.fromEntries(
        respondents.map(r => [r.id, r])
      );

      return responses.map(response => ({
        respondent: respondentById[response.respondent_id],
        response,
        recommendation: recByResponseId[response.id],
      })).filter(row => row.respondent);
    },
  });
}
