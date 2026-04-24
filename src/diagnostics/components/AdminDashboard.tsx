import { useState } from "react";
import type { DiagnosticConfig, DiagnosticRespondent, DiagnosticResponse, DiagnosticRecommendation } from "../types";
import ScoreChart from "./ScoreChart";

interface AdminRow {
  respondent: DiagnosticRespondent;
  response: DiagnosticResponse;
  recommendation: DiagnosticRecommendation | undefined;
}

interface Props {
  config: DiagnosticConfig;
  rows: AdminRow[];
}

export default function AdminDashboard({ config, rows }: Props) {
  const [selected, setSelected] = useState<AdminRow | null>(null);

  if (selected) {
    const { respondent, response, recommendation } = selected;
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          ← Back to list
        </button>

        <div className="bg-card border border-border rounded-xl p-5 space-y-1">
          <p className="font-semibold text-foreground">{respondent.full_name}</p>
          <p className="text-sm text-muted-foreground">{respondent.job_title} · {respondent.department}</p>
          <p className="text-sm text-muted-foreground">{respondent.email}</p>
          <p className="text-xs text-muted-foreground">
            Submitted {new Date(response.submitted_at).toLocaleString()}
          </p>
        </div>

        {response.score_summary && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Dimension Scores</h3>
            <ScoreChart dimensions={config.dimensions} scoreSummary={response.score_summary} />
          </div>
        )}

        {recommendation ? (
          <div className="bg-card border border-border rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">
                {recommendation.content.overall_score?.toFixed(1)} / 5.0
              </span>
              <span className="text-sm bg-muted px-2 py-0.5 rounded-full text-foreground">
                {recommendation.content.maturity_level}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{recommendation.content.executive_summary}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recommendation generated yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{config.title} — Responses</h2>
        <span className="text-sm text-muted-foreground">{rows.length} total</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No responses yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <button
              key={row.response.id}
              onClick={() => setSelected(row)}
              className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground text-sm">{row.respondent.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.respondent.job_title} · {row.respondent.department}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {row.recommendation ? (
                    <span className="text-sm font-semibold text-primary">
                      {row.recommendation.content.overall_score?.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(row.response.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
