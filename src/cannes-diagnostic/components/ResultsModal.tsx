import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/cannes-diagnostic/context/SurveyContext";
import {
  surveyQuestions,
  calculateTotalScore,
  getMaturityLevel,
} from "@/cannes-diagnostic/data/cannesSurveyData";
import { ArrowRight, Loader2 } from "lucide-react";
import toptalLogo from "@/assets/toptal-logo-white.svg";
import { supabase } from "@/integrations/supabase/client";
import type { AIRecommendation } from "@/cannes-diagnostic/lib/exportResultsPdf";
import { ResultsView } from "@/cannes-diagnostic/components/ResultsView";

export function ResultsModal() {
  const { isAuthenticated, answers, userInfo, addCompletedRecord, updateRecordAiRecs, completedRecords } = useSurvey();
  const navigate = useNavigate();
  const [recorded, setRecorded] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [aiRecs, setAiRecs] = useState<AIRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && userInfo && !recorded) {
      addCompletedRecord();
      setRecorded(true);
    }
  }, [isAuthenticated, userInfo, recorded, addCompletedRecord]);

  useEffect(() => {
    if (recorded && !recordId && completedRecords.length > 0 && userInfo) {
      const match = completedRecords.find(
        (r) => r.userInfo.email === userInfo.email && r.userInfo.name === userInfo.name
      );
      if (match) setRecordId(match.id);
    }
  }, [recorded, recordId, completedRecords, userInfo]);

  useEffect(() => {
    if (!isAuthenticated || !userInfo) return;
    const totalScore = calculateTotalScore(answers);
    const maturity = getMaturityLevel(totalScore);
    const categories = surveyQuestions.map((q) => ({
      name: q.category,
      score: answers[q.id] || 0,
    }));

    setAiLoading(true);
    setAiError(null);

    supabase.functions
      .invoke("generate-cannes-recommendations", {
        body: {
          answers,
          categories,
          totalScore,
          maturityLevel: maturity.level,
          maturityName: maturity.name,
          companyName: userInfo.company,
        },
      })
      .then(({ data, error }) => {
        if (error) setAiError("Could not generate AI recommendations.");
        else if (data?.fallback) setAiError(data.error || "AI service unavailable.");
        else if (data?.recommendations?.length) setAiRecs(data.recommendations);
        else setAiError("No recommendations returned.");
      })
      .catch(() => setAiError("Failed to reach recommendation service."))
      .finally(() => setAiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recordId && aiRecs.length > 0) {
      updateRecordAiRecs(recordId, aiRecs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, aiRecs]);

  const totalScore = calculateTotalScore(answers);

  return (
    <div className="fixed inset-0 z-50 bg-surface overflow-y-auto">
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <img src={toptalLogo} alt="Toptal" className="h-8 mb-5" />
          <p className="text-sm font-medium uppercase tracking-wider opacity-80 mb-1">Assessment Complete</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Your Diagnostic Results</h1>
          {userInfo && (
            <p className="opacity-90">{userInfo.name} — {userInfo.company}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {aiLoading && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card text-foreground px-6 py-3 rounded-full shadow-lg border border-border">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Generating personalized AI recommendations…</span>
          </div>
        )}

        <ResultsView
          answers={answers}
          userInfo={userInfo!}
          totalScore={totalScore}
          aiRecs={aiRecs}
          aiError={aiError}
          showFallbackRecs={!!aiError}
          showPdfButton={true}
        />

        <div className="flex items-center justify-center pb-8 mt-8">
          <button
            onClick={() => navigate("/cannes-diagnostic/thank-you")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Complete Session
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
