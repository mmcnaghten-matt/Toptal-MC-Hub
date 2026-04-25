import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { pillars, calculateAllScores, PILLAR_COLORS } from "@/data/surveyData";
import { useSurvey } from "@/context/SurveyContext";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

const SurveyPage = () => {
  const { pillarId } = useParams<{ pillarId: string }>();
  const pillarIndex = parseInt(pillarId || "1") - 1;
  const pillar = pillars[pillarIndex];
  const navigate = useNavigate();
  const { responses, setResponse, userInfo, setRecord, addCompletedRecord } = useSurvey();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pillarId]);

  if (!pillar) {
    navigate("/landing");
    return null;
  }

  const allAnswered = pillar.questions.every(q => responses[q.id] !== undefined);
  const isLast = pillarIndex === pillars.length - 1;
  const progress = ((pillarIndex + 1) / pillars.length) * 100;

  const handleNext = () => {
    if (!allAnswered) return;
    if (isLast) {
      const scores = calculateAllScores(responses);
      const rec = {
        name: userInfo.name,
        enterprise: userInfo.enterprise,
        department: userInfo.department,
        role: userInfo.role,
        email: userInfo.email,
        responses: { ...responses },
        pillarScores: scores,
        completedAt: new Date().toISOString(),
      };
      setRecord(rec);
      addCompletedRecord(rec);
      navigate("/results");
    } else {
      navigate(`/survey/${pillarIndex + 2}`);
    }
  };

  const pillarColor = PILLAR_COLORS[pillarIndex];

  return (
    <div className="min-h-screen bg-surface">
      {/* Progress bar */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Pillar {pillar.id} of {pillars.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: pillarColor }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Pillar header */}
        <div className="mb-8">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{ backgroundColor: `${pillarColor}15`, color: pillarColor }}
          >
            Pillar {pillar.id}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{pillar.name}</h1>
          <p className="text-muted-foreground leading-relaxed text-[15px]">{pillar.description}</p>
        </div>

        {/* Focus area */}
        <div className="bg-accent rounded-lg p-4 mb-8 border border-border">
          <p className="text-sm font-medium text-accent-foreground">
            <span className="font-semibold">Focus:</span> {pillar.focus}
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {pillar.questions.map((q, qi) => (
            <div key={q.id} className="bg-card rounded-xl border border-border p-6">
              <div className="font-medium text-foreground mb-4">
                {q.text.includes("\n") ? (
                  <>
                    <p>
                      <span className="text-muted-foreground mr-2">{qi + 1}.</span>
                      {q.text.split("\n")[0]}
                    </p>
                    <div className="mt-2 space-y-1">
                      {q.text.split("\n").slice(1).map((line, li) => (
                        <p key={li} className="text-sm font-normal text-muted-foreground">{line}</p>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>
                    <span className="text-muted-foreground mr-2">{qi + 1}.</span>
                    {q.text}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = responses[q.id] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => setResponse(q.id, oi)}
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
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <button
            onClick={() => pillarIndex > 0 ? navigate(`/survey/${pillarIndex}`) : navigate("/user-info")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!allAnswered}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              allAnswered
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isLast ? (
              <>
                View Results
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                Next Pillar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;
