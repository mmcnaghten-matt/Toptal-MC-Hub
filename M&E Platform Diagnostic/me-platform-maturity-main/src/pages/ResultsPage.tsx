import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/context/SurveyContext";
import { pillars, MATURITY_LEVELS, PILLAR_COLORS } from "@/data/surveyData";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { ArrowRight, TrendingUp, Lightbulb, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import RecommendationsRenderer from "@/components/RecommendationsRenderer";
import toptalLogo from "@/assets/toptal-logo-white.svg";

const ResultsPage = () => {
  const { record, responses, updateRecordRecommendations } = useSurvey();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const hasFetchedRecs = useRef(false);

  useEffect(() => {
    // Wait until record has a DB id before fetching recommendations
    if (!record || !record.id || hasFetchedRecs.current) return;
    hasFetchedRecs.current = true;

    const fetchRecommendations = async () => {
      setLoadingRecs(true);
      setRecsError(null);

      const pillarQuestions = pillars.map((p) => ({
        pillarName: p.name,
        questions: p.questions.map((q) => ({
          questionText: q.text,
          selectedOption:
            responses[q.id] !== undefined
              ? q.options[responses[q.id]]
              : "Not answered",
        })),
      }));

      try {
        const { data, error } = await supabase.functions.invoke(
          "generate-recommendations",
          {
            body: {
              pillarScores: record.pillarScores,
              responses,
              pillarQuestions,
            },
          }
        );

        if (error) {
          console.error("Edge function error:", error);
          setRecsError("Unable to generate recommendations. Please try again.");
        } else if (data?.error) {
          setRecsError(data.error);
        } else {
          setRecommendations(data.recommendations);
          if (record.id && data.recommendations) {
            updateRecordRecommendations(record.id, data.recommendations);
            const { error: updateError } = await supabase
              .from("survey_records")
              .update({ recommendations: data.recommendations })
              .eq("id", record.id);
            if (updateError) {
              console.error("Failed to save recommendations:", updateError);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        setRecsError("Unable to generate recommendations. Please try again.");
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecommendations();
  }, [record, responses]);

  if (!record) {
    navigate("/landing");
    return null;
  }

  const chartData = pillars.map((p, i) => ({
    pillar: p.shortName,
    score: record.pillarScores[i],
    fullMark: 5,
  }));

  const overallAvg = Math.round((record.pillarScores.reduce((a, b) => a + b, 0) / record.pillarScores.length) * 10) / 10;
  const overallLevel = MATURITY_LEVELS.find(l => l.level === Math.round(overallAvg)) || MATURITY_LEVELS[0];

  // Recommendation rendering is now handled by the shared RecommendationsRenderer component

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <img src={toptalLogo} alt="Toptal" className="h-10 mb-6" />
          <p className="text-sm font-medium uppercase tracking-wider opacity-80 mb-2">Assessment Complete</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Maturity Profile</h1>
          <p className="opacity-90">{record.name} — {record.enterprise}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Overall score */}
        <div className="bg-card rounded-xl border border-border p-8 mb-8 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Overall Maturity Score</p>
          <p className="text-5xl font-bold text-primary mb-2">{overallAvg}</p>
          <p className="text-lg font-semibold text-foreground">{overallLevel.title}</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">{overallLevel.description}</p>
        </div>

        {/* Spider chart */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Maturity Radar
          </h2>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="pillar"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickCount={6}
                />
                <Radar
                  name="Maturity"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pillar breakdown */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pillar Breakdown</h2>
          <div className="space-y-4">
            {pillars.map((p, i) => {
              const score = record.pillarScores[i];
              const level = MATURITY_LEVELS.find(l => l.level === Math.round(score)) || MATURITY_LEVELS[0];
              return (
                <div key={p.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: `${PILLAR_COLORS[i]}15`, color: PILLAR_COLORS[i] }}
                  >
                    {p.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                      <span className="text-sm font-semibold ml-2" style={{ color: PILLAR_COLORS[i] }}>{score}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(score / 5) * 100}%`, backgroundColor: PILLAR_COLORS[i] }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Level {Math.round(score)}: {level.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Strategic Recommendations */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Strategic Recommendations
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            AI-generated strategic recommendations based on your survey responses and industry best practices.
          </p>

          {loadingRecs && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
              <span className="text-sm text-muted-foreground">Analyzing your responses and generating recommendations...</span>
            </div>
          )}

          {recsError && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
              {recsError}
            </div>
          )}

          {recommendations && <RecommendationsRenderer text={recommendations} />}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate("/thank-you")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Complete Session
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
