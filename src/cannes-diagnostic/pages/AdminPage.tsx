import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey, type CompletedRecord } from "@/cannes-diagnostic/context/SurveyContext";
import {
  surveyQuestions,
  getMaturityLevelColor,
} from "@/cannes-diagnostic/data/cannesSurveyData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Search, ChevronUp, ChevronDown, X,
  Trash2, FileText, Download,
} from "lucide-react";
import toptalLogo from "@/assets/toptal-logo-white.svg";
import { exportResultsPdf } from "@/cannes-diagnostic/lib/exportResultsPdf";
import { ResultsView } from "@/cannes-diagnostic/components/ResultsView";

type SortField = "name" | "company" | "department" | "role" | "email" | "completedAt";
type SortDir = "asc" | "desc";

export default function AdminPage() {
  const { isAuthenticated, isAdmin, completedRecords, deleteRecord } = useSurvey();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("completedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedRecord, setSelectedRecord] = useState<CompletedRecord | null>(null);
  const [responsesRecord, setResponsesRecord] = useState<CompletedRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return completedRecords
      .filter((r) =>
        r.userInfo.name.toLowerCase().includes(s) ||
        r.userInfo.company.toLowerCase().includes(s) ||
        r.userInfo.department.toLowerCase().includes(s) ||
        r.userInfo.role.toLowerCase().includes(s) ||
        r.userInfo.email.toLowerCase().includes(s)
      )
      .sort((a, b) => {
        let aVal: string, bVal: string;
        if (sortField === "completedAt") {
          aVal = a.completedAt;
          bVal = b.completedAt;
        } else {
          aVal = (a.userInfo[sortField] || "").toLowerCase();
          bVal = (b.userInfo[sortField] || "").toLowerCase();
        }
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [completedRecords, search, sortField, sortDir]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && (!isAuthenticated || !isAdmin)) navigate("/cannes-diagnostic");
  }, [mounted, isAuthenticated, isAdmin, navigate]);

  if (!mounted || !isAuthenticated || !isAdmin) return null;

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="inline ml-1 h-3 w-3" /> : <ChevronDown className="inline ml-1 h-3 w-3" />;
  };

  const exportCSV = () => {
    const esc = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const headers = ["Name", "Company", "Department", "Role", "Email", "Date", ...surveyQuestions.map((q) => q.category), "Total Score", "Maturity Level"];
    const rows = filtered.map((r) => [
      esc(r.userInfo.name), esc(r.userInfo.company), esc(r.userInfo.department || ""), esc(r.userInfo.role || ""),
      esc(r.userInfo.email), esc(new Date(r.completedAt).toLocaleDateString()),
      ...surveyQuestions.map((q) => (r.answers[q.id] || 0).toString()),
      r.totalScore.toString(), esc(`Level ${r.maturityLevel}: ${r.maturityName}`),
    ].join(","));
    const csv = [headers.map(esc).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cannes-me-diagnostic-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: { key: SortField; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "company", label: "Company" },
    { key: "department", label: "Department" },
    { key: "role", label: "Role" },
    { key: "email", label: "Email" },
    { key: "completedAt", label: "Date" },
  ];

  const renderRecordDetail = (rec: CompletedRecord) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setSelectedRecord(null)}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{rec.userInfo.name}</h2>
            <p className="text-sm text-muted-foreground">{rec.userInfo.company} · {rec.userInfo.department || "N/A"} · {rec.userInfo.role || "N/A"}</p>
          </div>
          <button onClick={() => setSelectedRecord(null)} className="rounded-lg p-2 hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6">
          <ResultsView
            answers={rec.answers}
            userInfo={{ name: rec.userInfo.name, company: rec.userInfo.company, email: rec.userInfo.email }}
            totalScore={rec.totalScore}
            aiRecs={rec.aiRecommendations || []}
            showFallbackRecs={false}
            showPdfButton={true}
          />
        </div>
      </div>
    </div>
  );

  const renderResponsesDetail = (rec: CompletedRecord) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
        <div className="sticky top-0 flex items-center justify-between rounded-t-xl border-b border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Survey Responses</h2>
            <p className="text-sm text-muted-foreground">{rec.userInfo.name} · {rec.userInfo.company}</p>
          </div>
          <button onClick={() => setResponsesRecord(null)} className="rounded-lg p-2 hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-6 p-6">
          {surveyQuestions.map((q, idx) => {
            const selectedValue = rec.answers[q.id];
            const selectedOption = q.options.find((o) => o.value === selectedValue);
            return (
              <div key={q.id} className="border-b border-border pb-4 last:border-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{q.category}</p>
                <p className="text-sm text-muted-foreground mb-2">{idx + 1}. {q.question}</p>
                <p className="inline-block rounded-md bg-accent/50 px-3 py-1.5 text-sm font-medium text-foreground">
                  {selectedOption ? selectedOption.text : "No answer"} ({selectedValue || 0} pts)
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <img src={toptalLogo} alt="Toptal" className="h-10 mb-6" />
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm font-medium uppercase tracking-wider opacity-80">Admin</p>
              <h1 className="text-2xl font-bold md:text-3xl">Survey Reports — Cannes Edition</h1>
            </div>
            <button onClick={() => navigate("/cannes-diagnostic")} className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-4 py-2 text-sm text-primary-foreground hover:bg-primary-foreground/10 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Exit
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, department, role, or email…"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {completedRecords.length > 0 && (
            <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>

        {completedRecords.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No completed surveys yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {columns.map((col) => (
                      <th key={col.key} className="cursor-pointer select-none px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground" onClick={() => toggleSort(col.key)}>
                        {col.label}<SortIcon field={col.key} />
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Level</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const levelColor = getMaturityLevelColor(r.maturityLevel);
                    return (
                      <tr key={r.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-accent/50 transition-colors" onClick={() => setSelectedRecord(r)}>
                        <td className="px-4 py-3 font-medium text-foreground">{r.userInfo.name}</td>
                        <td className="px-4 py-3 text-foreground">{r.userInfo.company}</td>
                        <td className="px-4 py-3 text-foreground">{r.userInfo.department || "—"}</td>
                        <td className="px-4 py-3 text-foreground">{r.userInfo.role || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.userInfo.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(r.completedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{r.totalScore}/40</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: `${levelColor}15`, color: levelColor }}>
                            L{r.maturityLevel}: {r.maturityName}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setResponsesRecord(r)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" title="View responses">
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => exportResultsPdf({
                                answers: r.answers as Record<string, number>,
                                userInfo: { name: r.userInfo.name, company: r.userInfo.company, email: r.userInfo.email },
                                aiRecs: r.aiRecommendations || [],
                              })}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button onClick={() => setConfirmDelete(r.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete record">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
              {filtered.length} of {completedRecords.length} records
            </div>
          </div>
        )}
      </div>

      {selectedRecord && renderRecordDetail(selectedRecord)}
      {responsesRecord && renderResponsesDetail(responsesRecord)}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Record</h3>
            <p className="mb-6 text-sm text-muted-foreground">Are you sure you want to permanently delete this survey record? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => { deleteRecord(confirmDelete); setConfirmDelete(null); setSelectedRecord(null); }}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
