import ScoreChart from "./ScoreChart";
import type { DiagnosticConfig, RecommendationContent } from "../types";

interface Props {
  config: DiagnosticConfig;
  scoreSummary: Record<string, number>;
  recommendation: RecommendationContent;
}

const MATURITY_COLORS: Record<string, string> = {
  Initial: 'bg-red-100 text-red-800',
  Developing: 'bg-orange-100 text-orange-800',
  Defined: 'bg-yellow-100 text-yellow-800',
  Managed: 'bg-blue-100 text-blue-800',
  Optimizing: 'bg-green-100 text-green-800',
};

const TIMEFRAME_COLORS: Record<string, string> = {
  'Quick Win': 'bg-green-100 text-green-700',
  'Short-term': 'bg-blue-100 text-blue-700',
  'Medium-term': 'bg-yellow-100 text-yellow-700',
  'Long-term': 'bg-purple-100 text-purple-700',
};

export default function ReportView({ config, scoreSummary, recommendation }: Props) {
  const maturityColor = MATURITY_COLORS[recommendation.maturity_level] ?? 'bg-muted text-foreground';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${maturityColor}`}>
          {recommendation.maturity_level}
        </span>
        <h2 className="text-3xl font-bold text-foreground">
          {recommendation.overall_score.toFixed(1)} / 5.0
        </h2>
        <p className="text-muted-foreground text-sm">Overall AI Maturity Score</p>
      </div>

      {/* Radar chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Dimension Scores</h3>
        <ScoreChart dimensions={config.dimensions} scoreSummary={scoreSummary} />
      </div>

      {/* Executive summary */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-2">
        <h3 className="font-semibold text-foreground">Executive Summary</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {recommendation.executive_summary}
        </p>
      </div>

      {/* Dimension insights */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Dimension Insights</h3>
        {recommendation.dimension_insights.map(insight => (
          <div key={insight.dimension} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{insight.dimension}</span>
              <span className="text-sm font-semibold text-primary">{insight.score.toFixed(1)} / 5</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Strength</p>
                <p className="text-muted-foreground">{insight.strength}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Gap</p>
                <p className="text-muted-foreground">{insight.gap}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Recommendation</p>
                <p className="text-muted-foreground">{insight.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Priority actions */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Priority Actions</h3>
        {recommendation.priority_actions.map((action, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium text-foreground text-sm">{action.action}</p>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${TIMEFRAME_COLORS[action.timeframe] ?? 'bg-muted text-foreground'}`}>
                {action.timeframe}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{action.rationale}</p>
            <p className="text-xs text-primary font-medium">Impact: {action.impact}</p>
          </div>
        ))}
      </div>

      {/* Roadmap */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Transformation Roadmap</h3>
        <div className="space-y-3">
          {recommendation.roadmap.map((phase, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{phase.phase}</span>
                  <p className="font-medium text-foreground text-sm">{phase.label}</p>
                </div>
              </div>
              <ul className="space-y-1">
                {phase.initiatives.map((initiative, j) => (
                  <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {initiative}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
