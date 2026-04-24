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
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const q of config.questions) {
    if (answers[q.id] !== undefined) {
      sums[q.dimension] = (sums[q.dimension] ?? 0) + answers[q.id];
      counts[q.dimension] = (counts[q.dimension] ?? 0) + 1;
    }
  }

  return Object.fromEntries(
    Object.keys(sums).map(dim => [dim, sums[dim] / counts[dim]])
  );
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
          job_title: demographics.job_title,
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

      // Trigger LLM report generation (fire-and-wait)
      const { data: recommendation, error: fnErr } = await supabase.functions.invoke(
        'generate-diagnostic-report',
        {
          body: {
            diagnostic_id: config.slug,
            response_id: (response as { id: string }).id,
            respondent: demographics,
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
