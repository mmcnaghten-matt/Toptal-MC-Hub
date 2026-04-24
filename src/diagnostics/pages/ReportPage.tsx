import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import DiagnosticLayout from "../components/DiagnosticLayout";
import ReportView from "../components/ReportView";
import { useRecommendation, useResponse } from "../hooks/useRecommendation";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticConfig } from "../types";

interface Props {
  config: DiagnosticConfig;
}

export default function ReportPage({ config }: Props) {
  const { responseId } = useParams<{ responseId: string }>();
  const { data: recommendation, isLoading: loadingRec } = useRecommendation(responseId);
  const { data: response, isLoading: loadingResponse } = useResponse(responseId);
  const triggered = useRef(false);
  const [timedOut, setTimedOut] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Trigger LLM generation once when the page loads and no recommendation exists yet
  useEffect(() => {
    if (triggered.current || !responseId || !response || recommendation) return;
    triggered.current = true;

    supabase.functions.invoke('generate-diagnostic-report', {
      body: {
        diagnostic_id: config.slug,
        response_id: responseId,
        diagnostic_title: config.title,
        questions: config.questions,
        answers: (response as any).answers,
        score_summary: (response as any).score_summary,
      },
    }).then(({ error }) => {
      if (error) setGenError(error.message ?? 'Edge function error');
    }).catch(err => setGenError(err?.message ?? 'Unknown error'));
  }, [responseId, response, recommendation, config]);

  // Timeout after 90s
  useEffect(() => {
    if (recommendation) return;
    const t = setTimeout(() => setTimedOut(true), 90_000);
    return () => clearTimeout(t);
  }, [recommendation]);

  const isLoading = loadingResponse || loadingRec || !recommendation;

  if (isLoading) {
    const hasError = genError || timedOut;
    return (
      <DiagnosticLayout title={config.title}>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          {hasError ? (
            <>
              <p className="text-destructive text-sm font-medium">Report generation failed.</p>
              {genError && <p className="text-muted-foreground text-xs font-mono bg-muted px-3 py-2 rounded">{genError}</p>}
              {timedOut && !genError && <p className="text-muted-foreground text-xs">The request timed out. Check edge function logs in Supabase dashboard.</p>}
            </>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">Generating your personalized report…</p>
              <p className="text-muted-foreground text-xs">This takes about 15–30 seconds.</p>
            </>
          )}
        </div>
      </DiagnosticLayout>
    );
  }

  const scoreSummary = (response as any)?.score_summary ?? {};

  return (
    <DiagnosticLayout title={config.title}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Your AI Maturity Report</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Based on your responses, here is a personalized assessment and roadmap.
        </p>
      </div>
      <ReportView
        config={config}
        scoreSummary={scoreSummary}
        recommendation={recommendation.content}
      />
    </DiagnosticLayout>
  );
}
