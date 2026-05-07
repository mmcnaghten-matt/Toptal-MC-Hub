import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

function avgScore(row: AdminRow): number | null {
  const vals = Object.values((row.response.score_summary ?? {}) as Record<string, number>);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function SurveyResponsesModal({ config, row, onClose }: { config: DiagnosticConfig; row: AdminRow; onClose: () => void }) {
  const answers = (row.response.answers ?? {}) as Record<string, number>;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16 px-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mb-16"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Survey Responses</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {row.respondent.full_name} · {row.respondent.enterprise}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none mt-0.5">×</button>
        </div>

        <div className="p-6 space-y-8">
          {config.dimensions.map((dim, dimIdx) => {
            const questions = config.questions.filter(q => q.dimension === dim.id);
            return (
              <div key={dim.id}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {dimIdx + 1}
                  </span>
                  <h3 className="font-bold text-gray-900">{dim.label}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {questions.map((q, qIdx) => {
                    const selectedIdx = answers[q.id] ?? 0;
                    const selectedLabel = q.options[selectedIdx] ?? String(selectedIdx);
                    return (
                      <div key={q.id} className="py-4">
                        <p className="text-sm text-gray-700 mb-2">
                          {qIdx + 1}. {q.text}
                        </p>
                        <span className="inline-block px-3 py-1 rounded-md bg-gray-100 text-gray-800 text-sm font-medium">
                          {selectedLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReportModal({ config, row, onClose }: { config: DiagnosticConfig; row: AdminRow; onClose: () => void }) {
  const answers = (row.response.answers ?? {}) as Record<string, number>;
  const scoreSummary = ((row.response.score_summary ?? {}) as Record<string, number>);
  const recContent = row.recommendation?.content as RecommendationContent | null ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-8 px-4 pb-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground text-lg">Full Report</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {row.respondent.full_name} · {row.respondent.enterprise}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
        </div>
        <div className="p-6">
          <ReportView
            config={config}
            answers={answers}
            scoreSummary={scoreSummary}
            respondent={{ full_name: row.respondent.full_name, enterprise: row.respondent.enterprise, role: row.respondent.role, department: row.respondent.department }}
            recommendation={recContent}
            recLoading={false}
            recError={recContent ? null : 'No recommendation on record for this submission.'}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ config, rows }: Props) {
  const [search, setSearch] = useState('');
  const [viewingRow, setViewingRow] = useState<AdminRow | null>(null);
  const [reportRow, setReportRow] = useState<AdminRow | null>(null);
  const queryClient = useQueryClient();

  const filtered = rows.filter(row => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      row.respondent.full_name.toLowerCase().includes(q) ||
      row.respondent.enterprise.toLowerCase().includes(q) ||
      row.respondent.department.toLowerCase().includes(q) ||
      row.respondent.role.toLowerCase().includes(q) ||
      row.respondent.email.toLowerCase().includes(q)
    );
  });

  async function handleDelete(row: AdminRow) {
    if (!window.confirm(`Delete ${row.respondent.full_name}'s submission? This cannot be undone.`)) return;
    await supabase.from('diagnostic_respondents' as never).delete().eq('id', row.respondent.id);
    queryClient.invalidateQueries({ queryKey: ['diagnostic-admin-data', config.slug] });
  }

  function handleExportCSV() {
    const headers = ['Name', 'Enterprise', 'Department', 'Role', 'Email', 'Date', 'Score', 'Maturity Level'];
    const csvRows = [headers.join(',')];
    for (const row of rows) {
      const score = avgScore(row);
      const level = (row.recommendation?.content as { maturity_level?: string } | undefined)?.maturity_level ?? '';
      csvRows.push([
        `"${row.respondent.full_name}"`,
        `"${row.respondent.enterprise}"`,
        `"${row.respondent.department}"`,
        `"${row.respondent.role}"`,
        row.respondent.email,
        new Date(row.response.submitted_at).toLocaleDateString(),
        score?.toFixed(1) ?? '',
        `"${level}"`,
      ].join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.slug}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {viewingRow && (
        <SurveyResponsesModal config={config} row={viewingRow} onClose={() => setViewingRow(null)} />
      )}
      {reportRow && (
        <ReportModal config={config} row={reportRow} onClose={() => setReportRow(null)} />
      )}

      <div className="space-y-4">
        {/* Search + Export */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, department, role, or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enterprise</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground">
                      {rows.length === 0 ? 'No responses yet.' : 'No results match your search.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(row => {
                    const score = avgScore(row);
                    return (
                      <tr key={row.response.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{row.respondent.full_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.respondent.enterprise}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.respondent.department}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.respondent.role}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.respondent.email}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(row.response.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {score !== null ? (
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                              {score.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingRow(row)}
                              title="View survey responses"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setReportRow(row)}
                              title="View full report"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              title="Delete submission"
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            {filtered.length} of {rows.length} record{rows.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </>
  );
}
