import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DemographicsData } from "../components/DemographicsForm";
import type { DiagnosticConfig } from "../types";

interface SubmitPayload {
  demographics: DemographicsData;
  answers: Record<string, number>;
  config: DiagnosticConfig;
}

function computeScoreSummary(config: DiagnosticConfig, answers: Record<string, number>) {
  const result: Record<string, number> = {};
  for (const dim of config.dimensions) {
    const pillarQuestions = config.questions.filter(q => q.dimension === dim.id);
    const rawScore = pillarQuestions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const maxRaw = pillarQuestions.reduce((sum, q) => sum + (q.options.length - 1), 0);
    result[dim.id] = maxRaw > 0
      ? Math.round((1 + (rawScore / maxRaw) * 4) * 10) / 10
      : 1;
  }
  return result;
}

export function useSurveySubmit() {
  return useMutation({
    mutationFn: async ({ demographics, answers, config }: SubmitPayload) => {
      const score_summary = computeScoreSummary(config, answers);

      const { data: respondent, error: rErr } = await supabase
        .from('diagnostic_respondents' as never)
        .insert({
          diagnostic_id: config.slug,
          full_name: demographics.full_name,
          enterprise: demographics.enterprise,
          role: demographics.role,
          job_title: `${demographics.role} at ${demographics.enterprise}`,
          department: demographics.department,
          email: demographics.email,
        })
        .select('id')
        .single();

      if (rErr) throw rErr;

      const { data: response, error: sErr } = await supabase
        .from('diagnostic_responses' as never)
        .insert({
          diagnostic_id: config.slug,
          respondent_id: (respondent as { id: string }).id,
          answers,
          score_summary,
        })
        .select('id')
        .single();

      if (sErr) throw sErr;

      return { responseId: (response as { id: string }).id };
    },
  });
}
