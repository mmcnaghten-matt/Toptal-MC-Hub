import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DemographicsForm, { type DemographicsData } from "../components/DemographicsForm";
import SurveyForm from "../components/SurveyForm";
import DiagnosticLayout from "../components/DiagnosticLayout";
import { useSurveySubmit } from "../hooks/useSurveySubmit";
import type { DiagnosticConfig } from "../types";

interface Props {
  config: DiagnosticConfig;
}

type Stage = 'demographics' | 'survey';

export default function SurveyPage({ config }: Props) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('demographics');
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const { mutateAsync: submit, isPending } = useSurveySubmit();

  const handleDemographics = (data: DemographicsData) => {
    setDemographics(data);
    setStage('survey');
  };

  const handleAnswers = async (answers: Record<string, number>) => {
    if (!demographics) return;
    try {
      const { responseId } = await submit({ demographics, answers, config });
      navigate(`/diagnostics/${config.slug}/report/${responseId}`);
    } catch {
      toast.error('Something went wrong submitting your survey. Please try again.');
    }
  };

  return (
    <DiagnosticLayout title={config.title}>
      {stage === 'demographics' ? (
        <DemographicsForm onSubmit={handleDemographics} />
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Assessment Survey</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Rate each statement on a scale of 1 (strongly disagree) to 5 (strongly agree).
            </p>
          </div>
          <SurveyForm
            questions={config.questions}
            dimensions={config.dimensions}
            onSubmit={handleAnswers}
            isSubmitting={isPending}
          />
        </>
      )}
    </DiagnosticLayout>
  );
}
