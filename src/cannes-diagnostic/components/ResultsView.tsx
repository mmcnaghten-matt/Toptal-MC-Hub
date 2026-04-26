import {
  surveyQuestions,
  benchmarkCompanies,
  getMaturityLevel,
  getMaturityLevelColor,
} from "@/cannes-diagnostic/data/cannesSurveyData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from "recharts";
import { ArrowRight, TrendingUp, Sparkles, Download, AlertTriangle } from "lucide-react";
import { exportResultsPdf, type AIRecommendation } from "@/cannes-diagnostic/lib/exportResultsPdf";

interface ResultsViewProps {
  answers: Record<string, number>;
  userInfo: { name: string; company: string; email: string };
  totalScore: number;
  aiRecs: AIRecommendation[];
  aiError?: string | null;
  /** If true, shows fallback maturity-level recommendations when aiRecs is empty */
  showFallbackRecs?: boolean;
  /** Show PDF download button */
  showPdfButton?: boolean;
}

export function ResultsView({
  answers,
  userInfo,
  totalScore,
  aiRecs,
  aiError,
  showFallbackRecs = true,
  showPdfButton = true,
}: ResultsViewProps) {
  const maturity = getMaturityLevel(totalScore);
  const levelColor = getMaturityLevelColor(maturity.level);

  const categoryData = surveyQuestions.map((q) => ({
    name: q.category,
    score: answers[q.id] || 0,
    max: 5,
  }));

  const benchmarkData = [
    { name: userInfo.company || "Your Score", score: totalScore, isUser: true },
    ...benchmarkCompanies.map((c) => ({ name: c.name, score: c.score, isUser: false, color: c.color })),
  ].sort((a, b) => b.score - a.score);

  const renderBenchmarkTick = (props: any) => {
    const { x, y, payload } = props;
    const entry = benchmarkData.find((d) => d.name === payload.value);
    const isUser = entry?.isUser;
    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fontSize={12}
        fontWeight={isUser ? 800 : 400}
        fill={isUser ? "#000000" : "#6B7280"}
      >
        {payload.value}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Overall Maturity Score</p>
        <div
          className="inline-flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold mx-auto"
          style={{ backgroundColor: '#93C5FD40', color: '#2563EB' }}
        >
          {totalScore}
        </div>
        <p className="text-sm text-muted-foreground mt-2">out of 40</p>
        <h2 className="mt-2 text-xl font-bold text-foreground">
          Level {maturity.level}: {maturity.name}
        </h2>
        <p className="text-lg font-medium" style={{ color: '#2563EB' }}>
          "{maturity.title}"
        </p>
        <p className="max-w-2xl mx-auto text-sm text-muted-foreground mt-2">
          {maturity.description}
        </p>
      </div>

      {/* Per-Category Breakdown */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Score by Category
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ left: 140, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, index) => {
                  const shade = entry.score <= 1 ? "#1E3A5F"
                    : entry.score <= 2 ? "#1E56A0"
                    : entry.score <= 3 ? "#2563EB"
                    : entry.score <= 4 ? "#60A5FA"
                    : "#93C5FD";
                  return <Cell key={index} fill={shade} />;
                })}
                <LabelList dataKey="score" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Benchmark Comparison */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">How You Compare to Industry Leaders</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benchmarkData} layout="vertical" margin={{ left: 120, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 40]} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={renderBenchmarkTick}
              />
              <Tooltip />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {benchmarkData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isUser ? "#2563EB" : "#93C5FD"}
                    stroke={entry.isUser ? "#2563EB" : "none"}
                    strokeWidth={entry.isUser ? 2 : 0}
                  />
                ))}
                <LabelList dataKey="score" position="right" />
              </Bar>
              <ReferenceLine x={totalScore} stroke={levelColor} strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI-Powered Strategic Recommendations
        </h2>

        {aiRecs.length > 0 ? (
          <div className="space-y-6">
            {aiRecs.map((rec, i) => (
              <div key={i} className="border border-border rounded-lg p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: '#93C5FD40', color: '#2563EB' }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-base font-semibold text-foreground">{rec.title}</h3>
                </div>

                <div className="ml-10 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Rationale</p>
                    <p className="text-sm text-foreground">{rec.rationale}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Strategic Actions</p>
                    <ul className="space-y-1">
                      {rec.actions.map((action, j) => (
                        <li key={j} className="text-sm text-foreground flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 mt-1 shrink-0 text-primary" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Expected Impact</p>
                    <p className="text-sm font-medium" style={{ color: '#2563EB' }}>{rec.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : showFallbackRecs ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">AI recommendations unavailable</p>
                <p className="text-sm text-muted-foreground mt-1">{aiError || "The AI service is temporarily unavailable. The default recommendations below are based on your maturity level."}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Default recommendations based on your maturity level:</p>
            <ul className="space-y-3">
              {maturity.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <span
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
                  >
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">No AI recommendations available for this record.</p>
        )}
      </div>

      {/* PDF Download */}
      {showPdfButton && (
        <div className="flex justify-center pb-4">
          <button
            onClick={() => exportResultsPdf({ answers, userInfo, aiRecs })}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg border border-primary text-primary font-medium hover:bg-primary/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
