import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/cannes-diagnostic/context/SurveyContext";
import { surveyQuestions } from "@/cannes-diagnostic/data/cannesSurveyData";
import { CheckCircle2 } from "lucide-react";
import { ResultsModal } from "@/cannes-diagnostic/components/ResultsModal";

export default function SurveyPage() {
  const { isAuthenticated, userInfo, answers, setAnswer } = useSurvey();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !isAuthenticated) navigate("/cannes-diagnostic");
    else if (mounted && !userInfo) navigate("/cannes-diagnostic/user-info");
  }, [mounted, isAuthenticated, userInfo, navigate]);

  if (!mounted || !isAuthenticated || !userInfo) return null;
  if (showResults) return <ResultsModal />;

  const allAnswered = surveyQuestions.every((q) => answers[q.id] !== undefined);
  const answeredCount = surveyQuestions.filter((q) => answers[q.id] !== undefined).length;
  const progress = (answeredCount / surveyQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-surface">
      {/* Progress bar */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Question {answeredCount} of {surveyQuestions.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Fan/Audience Platform Diagnostic</h1>
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            Answer all 8 questions to receive your maturity assessment.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {surveyQuestions.map((q, idx) => (
            <div key={q.id} className="bg-card rounded-xl border border-border p-6">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{q.category}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{q.categoryDescription}</p>
                <p className="font-medium text-foreground mt-3">
                  <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                  {q.question}
                </p>
              </div>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAnswer(q.id, opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                        selected
                          ? "border-primary bg-accent text-foreground font-medium"
                          : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent/50"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? "border-primary" : "border-muted-foreground/30"
                        }`}>
                          {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </span>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center mt-10 pt-6 border-t border-border">
          <button
            onClick={() => setShowResults(true)}
            disabled={!allAnswered}
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium transition-all ${
              allAnswered
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            View Results
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
