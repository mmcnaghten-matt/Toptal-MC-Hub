import { useState } from "react";
import type { DiagnosticConfig, DiagnosticRespondent, DiagnosticResponse, DiagnosticRecommendation, RecommendationContent } from "../types";
import ReportView from "./ReportView";

interface AdminRow {
  respondent: DiagnosticRespondent;
  response: DiagnosticResponse;
  recommendation: DiagnosticRecommendation | undefined;
}

interface Props {
  config: DiagnosticConfig;
  rows: AdminRow[];
}

const MATURITY_BADGE: Record<string, string> = {
  Foundational: 'bg-red-100 text-red-800',
  Developing: 'bg-orange-100 text-orange-800',
  Integrated: 'bg-yellow-100 text-yellow-800',
  Predictive: 'bg-blue-100 text-blue-800',
  'Optimized & Adaptive': 'bg-green-100 text-green-800',
};

export default function AdminDashboard({ config, rows }: Props) {
  const [selected, setSelected] = useState<AdminRow | null>(null);

  if (selected) {
    const { respondent, response, recommendation } = selected;
    const answers = (response.answers ?? {}) as Record<string, number>;
    const scoreSummary = (response.score_summary ?? {}) as Record<string, number>;
    const recContent = recommendation?.content as RecommendationContent | null ?? null;

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          ← Back to list
        </button>
        <ReportView
          config={config}
          answers={answers}
          scoreSummary={scoreSummary}
          respondent={{ full_name: respondent.full_name, job_title: respondent.job_title, department: respondent.department }}
          recommendation={recContent}
          recLoading={false}
          recError={recContent ? null : 'No recommendation on record for this submission.'}
        />
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
          {rows.map(row => {
            const level = row.recommendation?.content?.maturity_level as string | undefined;
            return (
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
                  <div className="text-right shrink-0 space-y-1">
                    {level ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MATURITY_BADGE[level] ?? 'bg-muted text-foreground'}`}>
                        {level}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
