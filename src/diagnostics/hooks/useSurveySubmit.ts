import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DemographicsData } from "../components/DemographicsForm";
import type { DiagnosticConfig } from "../types";

interface SubmitPayload {
  demographics: DemographicsData;
  answers: Record<string, number>;
  config: DiagnosticConfig;
}

// Each question answered 0–3 (option index). Max per pillar = 4 questions × 3 = 12.
// Scale each pillar to 1–5 for radar chart: 1 + (raw / maxRaw) * 4
function computeScoreSummary(config: DiagnosticConfig, answers: Record<string, number>) {
  const result: Record<string, number> = {};

  for (const dim of config.dimensions) {
    const pillarQuestions = config.questions.filter(q => q.dimension === dim.id);
    const rawScore = pillarQuestions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
    const maxRaw = pillarQuestions.length * 3;
    const radarScore = maxRaw > 0
      ? Math.round((1 + (rawScore / maxRaw) * 4) * 10) / 10
      : 1;
    result[dim.id] = radarScore;
  }

  return result;
}

export function useSurveySubmit() {
  return useMutation({
    mutationFn: async ({ demographics, answers, config }: SubmitPayload) => {
      const score_summary = computeScoreSummary(config, answers);

      // Insert respondent
      const { data: respondent, error: rErr } = await supabase
        .from('diagnostic_respondents' as never)
        .insert({
          diagnostic_id: config.slug,
          full_name: demographics.full_name,
          job_title: `${demographics.role} at ${demographics.enterprise}`,
          department: demographics.department,
          email: demographics.email,
        })
        .select('id')
        .single();

      if (rErr) throw rErr;

      // Insert response
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

      // Trigger LLM report generation
      const { data: recommendation, error: fnErr } = await supabase.functions.invoke(
        'generate-diagnostic-report',
        {
          body: {
            diagnostic_id: config.slug,
            response_id: (response as { id: string }).id,
            respondent: {
              ...demographics,
              full_name: demographics.full_name,
            },
            diagnostic_title: config.title,
            questions: config.questions,
            answers,
            score_summary,
          },
        }
      );

      if (fnErr) throw fnErr;

      return {
        responseId: (response as { id: string }).id,
        recommendation,
      };
    },
  });
}
