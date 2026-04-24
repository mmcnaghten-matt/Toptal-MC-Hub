import { useParams } from "react-router-dom";
import DiagnosticLayout from "../components/DiagnosticLayout";
import ReportView from "../components/ReportView";
import { useRecommendation, useResponse } from "../hooks/useRecommendation";
import type { DiagnosticConfig } from "../types";

interface Props {
  config: DiagnosticConfig;
}

export default function ReportPage({ config }: Props) {
  const { responseId } = useParams<{ responseId: string }>();
  const { data: recommendation, isLoading: loadingRec } = useRecommendation(responseId);
  const { data: response } = useResponse(responseId);

  if (loadingRec || !recommendation) {
    return (
      <DiagnosticLayout title={config.title}>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Generating your personalized report…</p>
        </div>
      </DiagnosticLayout>
    );
  }

  const scoreSummary = response?.score_summary ?? {};

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
