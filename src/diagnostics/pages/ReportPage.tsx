import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import DiagnosticLayout from "../components/DiagnosticLayout";
import ReportView from "../components/ReportView";
import { useResponse, useRespondent } from "../hooks/useRecommendation";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticConfig, RecommendationContent } from "../types";

interface Props {
  config: DiagnosticConfig;
}

export default function ReportPage({ config }: Props) {
  const { responseId } = useParams<{ responseId: string }>();
  const { data: responseData, isLoading: loadingResponse } = useResponse(responseId);
  const respondentId = (responseData as any)?.respondent_id as string | undefined;
  const { data: respondent } = useRespondent(respondentId);

  const triggered = useRef(false);
  const [recommendation, setRecommendation] = useState<RecommendationContent | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Trigger edge function once when response data loads; uses direct response (idempotent on edge fn side)
  useEffect(() => {
    if (triggered.current || !responseId || !responseData) return;
    triggered.current = true;
    setRecLoading(true);

    supabase.functions.invoke('generate-diagnostic-report', {
      body: {
        diagnostic_id: config.slug,
        response_id: responseId,
        diagnostic_title: config.title,
        questions: config.questions,
        answers: (responseData as any).answers,
        score_summary: (responseData as any).score_summary,
      },
    }).then(({ data, error }) => {
      if (error) { setRecError(error.message ?? 'Edge function error'); return; }
      if (data) setRecommendation(data as RecommendationContent);
      else setRecError('No response from edge function');
    }).catch(err => setRecError(err?.message ?? 'Unknown error'))
      .finally(() => setRecLoading(false));
  }, [responseId, responseData, config]);

  if (loadingResponse) {
    return (
      <DiagnosticLayout title={`${config.title} Report`}>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DiagnosticLayout>
    );
  }

  if (!responseData) {
    return (
      <DiagnosticLayout title={`${config.title} Report`}>
        <p className="text-sm text-destructive">Report not found.</p>
      </DiagnosticLayout>
    );
  }

  const answers = (responseData as any).answers as Record<string, number>;
  const scoreSummary = ((responseData as any).score_summary as Record<string, number>) ?? {};

  return (
    <DiagnosticLayout title={`${config.title} Report`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">Based on your survey responses.</p>
      </div>
      <ReportView
        config={config}
        answers={answers}
        scoreSummary={scoreSummary}
        respondent={respondent ?? null}
        recommendation={recommendation}
        recLoading={recLoading}
        recError={recError}
      />
    </DiagnosticLayout>
  );
}
