import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/context/SurveyContext";
import { pillars, MATURITY_LEVELS, PILLAR_COLORS, SurveyRecord } from "@/data/surveyData";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { ArrowLeft, Search, ChevronUp, ChevronDown, X, Users, TrendingUp, Trash2, FileText, Download, Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RecommendationsRenderer from "@/components/RecommendationsRenderer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toptalLogo from "@/assets/toptal-logo-white.svg";

type SortField = "name" | "enterprise" | "department" | "role" | "email" | "completedAt";
type SortDir = "asc" | "desc";

const AdminReportPage = () => {
  const { completedRecords, deleteRecord } = useSurvey();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("completedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedRecord, setSelectedRecord] = useState<SurveyRecord | null>(null);
  const [responsesRecord, setResponsesRecord] = useState<SurveyRecord | null>(null);
  const [selectedForAggregate, setSelectedForAggregate] = useState<Set<number>>(new Set());
  const [showAggregate, setShowAggregate] = useState(false);
  const [aggregateRecs, setAggregateRecs] = useState<string | null>(null);
  const [aggregateRecsLoading, setAggregateRecsLoading] = useState(false);
  const [aggregateRecsError, setAggregateRecsError] = useState<string | null>(null);

  const recordDetailRef = useRef<HTMLDivElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const exportRecordPdf = async (rec: SurveyRecord) => {
    if (!recordDetailRef.current) return;
    setExportingPdf(true);

    try {
      const modal = recordDetailRef.current;
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      // Find the page 1 content (everything before recommendations) and page 2 (recommendations)
      const page1El = modal.querySelector("[data-pdf-page1]") as HTMLElement;
      const page2El = modal.querySelector("[data-pdf-page2]") as HTMLElement;

      if (page1El) {
        const canvas1 = await html2canvas(page1El, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
        const imgData1 = canvas1.toDataURL("image/png");
        const imgHeight1 = (canvas1.height * contentWidth) / canvas1.width;
        pdf.addImage(imgData1, "PNG", margin, margin, contentWidth, imgHeight1);
      }

      if (page2El && page2El.textContent?.trim()) {
        pdf.addPage();
        const canvas2 = await html2canvas(page2El, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
        const imgData2 = canvas2.toDataURL("image/png");
        const imgHeight2 = (canvas2.height * contentWidth) / canvas2.width;

        // If recommendations are very long, split across pages
        if (imgHeight2 > pdfHeight - margin * 2) {
          const pages = Math.ceil(imgHeight2 / (pdfHeight - margin * 2));
          const sliceHeight = Math.floor(canvas2.height / pages);

          for (let i = 0; i < pages; i++) {
            if (i > 0) pdf.addPage();
            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas2.width;
            sliceCanvas.height = Math.min(sliceHeight, canvas2.height - i * sliceHeight);
            const ctx = sliceCanvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(canvas2, 0, i * sliceHeight, canvas2.width, sliceCanvas.height, 0, 0, canvas2.width, sliceCanvas.height);
              const sliceData = sliceCanvas.toDataURL("image/png");
              const sliceImgHeight = (sliceCanvas.height * contentWidth) / sliceCanvas.width;
              pdf.addImage(sliceData, "PNG", margin, margin, contentWidth, sliceImgHeight);
            }
          }
        } else {
          pdf.addImage(imgData2, "PNG", margin, margin, contentWidth, imgHeight2);
        }
      }

      pdf.save(`${rec.name.replace(/\s+/g, "_")}_maturity_report.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  const fetchAggregateRecommendations = async (scores: number[]) => {
    setAggregateRecsLoading(true);
    setAggregateRecsError(null);
    setAggregateRecs(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-recommendations", {
        body: { pillarScores: scores, responses: {}, pillarQuestions: null },
      });
      if (error) {
        setAggregateRecsError("Unable to generate recommendations.");
      } else if (data?.error) {
        setAggregateRecsError(data.error);
      } else {
        setAggregateRecs(data.recommendations);
      }
    } catch {
      setAggregateRecsError("Unable to generate recommendations.");
    } finally {
      setAggregateRecsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return completedRecords
      .filter(r =>
        r.name.toLowerCase().includes(s) ||
        r.enterprise.toLowerCase().includes(s) ||
        (r.department || "").toLowerCase().includes(s) ||
        (r.role || "").toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s)
      )
      .map((r, i) => ({ ...r, _idx: completedRecords.indexOf(r) }))
      .sort((a, b) => {
        const aVal = (a[sortField] || "").toString().toLowerCase();
        const bVal = (b[sortField] || "").toString().toLowerCase();
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [completedRecords, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleAggregate = (idx: number) => {
    setSelectedForAggregate(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const aggregateData = useMemo(() => {
    const indices = Array.from(selectedForAggregate);
    if (indices.length === 0) return null;
    const records = indices.map(i => completedRecords[i]).filter(Boolean);
    const avgScores = pillars.map((_, pi) => {
      const sum = records.reduce((a, r) => a + r.pillarScores[pi], 0);
      return Math.round((sum / records.length) * 10) / 10;
    });
    return pillars.map((p, i) => ({ pillar: p.shortName, score: avgScores[i], fullMark: 5 }));
  }, [selectedForAggregate, completedRecords]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const exportCSV = () => {
    const escCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const headers = ["Name", "Enterprise", "Department", "Role", "Email", "Date", ...pillars.map(p => p.name), "Overall Score"];
    const rows = filtered.map(r => {
      const avg = Math.round((r.pillarScores.reduce((a, b) => a + b, 0) / r.pillarScores.length) * 10) / 10;
      return [
        escCSV(r.name), escCSV(r.enterprise), escCSV(r.department || ""), escCSV(r.role || ""),
        escCSV(r.email), escCSV(new Date(r.completedAt).toLocaleDateString()),
        ...r.pillarScores.map(s => s.toString()), avg.toString()
      ].join(",");
    });
    const csv = [headers.map(escCSV).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderResponsesDetail = (rec: SurveyRecord) => {
    return (
      <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-xl">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Survey Responses</h2>
              <p className="text-sm text-muted-foreground">{rec.name} · {rec.enterprise}</p>
            </div>
            <button onClick={() => setResponsesRecord(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="p-6 space-y-8">
            {pillars.map((pillar, pi) => (
              <div key={pillar.id}>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: `${PILLAR_COLORS[pi]}15`, color: PILLAR_COLORS[pi] }}
                  >
                    {pillar.id}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{pillar.name}</h3>
                </div>
                <div className="space-y-3 ml-9">
                  {pillar.questions.map((q, qi) => {
                    const selectedIdx = rec.responses[q.id];
                    const selectedOption = selectedIdx !== undefined ? q.options[selectedIdx] : "No answer";
                    return (
                      <div key={q.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium">{qi + 1}.</span>{" "}
                          {q.text.includes("\n") ? q.text.split("\n")[0] : q.text}
                        </p>
                        <p className="text-sm font-medium text-foreground bg-accent/50 rounded-md px-3 py-1.5 inline-block">
                          {selectedOption}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRecordDetail = (rec: SurveyRecord) => {
    const chartData = pillars.map((p, i) => ({ pillar: p.shortName, score: rec.pillarScores[i], fullMark: 5 }));
    const overallAvg = Math.round((rec.pillarScores.reduce((a, b) => a + b, 0) / rec.pillarScores.length) * 10) / 10;
    const overallLevel = MATURITY_LEVELS.find(l => l.level === Math.round(overallAvg)) || MATURITY_LEVELS[0];

    return (
      <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
        <div className="bg-card rounded-xl border border-border shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} ref={recordDetailRef}>
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-xl z-10">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{rec.name}</h2>
              <p className="text-sm text-muted-foreground">{rec.enterprise} · {rec.department || "N/A"} · {rec.role || "N/A"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportRecordPdf(rec)}
                disabled={exportingPdf}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export PDF
              </button>
              <button onClick={() => setSelectedRecord(null)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Page 1 content: info + charts + pillar bars */}
          <div data-pdf-page1 className="p-6">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Overall Maturity Score</p>
              <p className="text-4xl font-bold text-primary mb-1">{overallAvg}</p>
              <p className="text-sm font-semibold text-foreground">{overallLevel.title}</p>
            </div>

            <div className="w-full h-[350px] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="pillar" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickCount={6} />
                  <Radar name="Maturity" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {pillars.map((p, i) => {
                const score = rec.pillarScores[i];
                const level = MATURITY_LEVELS.find(l => l.level === Math.round(score)) || MATURITY_LEVELS[0];
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: `${PILLAR_COLORS[i]}15`, color: PILLAR_COLORS[i] }}>
                      {p.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-sm font-semibold ml-2" style={{ color: PILLAR_COLORS[i] }}>{score}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, backgroundColor: PILLAR_COLORS[i] }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Level {Math.round(score)}: {level.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page 2 content: Strategic Recommendations */}
          <div data-pdf-page2 className="px-6 pb-6">
            {rec.recommendations && (
              <div className="pt-6 border-t border-border">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Strategic Recommendations
                </h3>
                <RecommendationsRenderer text={rec.recommendations} />
              </div>
            )}
            {!rec.recommendations && (
              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground italic">No recommendations were generated for this record.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const columns: { key: SortField; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "enterprise", label: "Enterprise" },
    { key: "department", label: "Department" },
    { key: "role", label: "Role" },
    { key: "email", label: "Email" },
    { key: "completedAt", label: "Date" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <img src={toptalLogo} alt="Toptal" className="h-10 mb-6" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider opacity-80 mb-1">Admin</p>
              <h1 className="text-2xl md:text-3xl font-bold">Survey Reports</h1>
            </div>
            <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-foreground/30 text-primary-foreground text-sm hover:bg-primary-foreground/10 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Exit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search & Aggregate */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, company, department, role, or email…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          {completedRecords.length > 0 && (
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
          {selectedForAggregate.size >= 2 && (
            <button
              onClick={() => {
                setShowAggregate(true);
                // Generate aggregate recommendations
                const indices = Array.from(selectedForAggregate);
                const records = indices.map(i => completedRecords[i]).filter(Boolean);
                const avgScores = pillars.map((_, pi) => {
                  const sum = records.reduce((a, r) => a + r.pillarScores[pi], 0);
                  return Math.round((sum / records.length) * 10) / 10;
                });
                fetchAggregateRecommendations(avgScores);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Users className="w-4 h-4" />
              Aggregate ({selectedForAggregate.size})
            </button>
          )}
        </div>

        {completedRecords.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <p className="text-muted-foreground">No completed surveys yet.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedForAggregate.size === completedRecords.length && completedRecords.length > 0}
                        onChange={() => {
                          if (selectedForAggregate.size === completedRecords.length) setSelectedForAggregate(new Set());
                          else setSelectedForAggregate(new Set(completedRecords.map((_, i) => i)));
                        }}
                        className="rounded border-input"
                      />
                    </th>
                    {columns.map(col => (
                      <th key={col.key} className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort(col.key)}>
                        {col.label}<SortIcon field={col.key} />
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const avg = Math.round((r.pillarScores.reduce((a, b) => a + b, 0) / r.pillarScores.length) * 10) / 10;
                    return (
                      <tr key={r._idx} className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setSelectedRecord(r)}>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedForAggregate.has(r._idx)} onChange={() => toggleAggregate(r._idx)} className="rounded border-input" />
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                        <td className="px-4 py-3 text-foreground">{r.enterprise}</td>
                        <td className="px-4 py-3 text-foreground">{r.department || "—"}</td>
                        <td className="px-4 py-3 text-foreground">{r.role || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(r.completedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">{avg}</span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setResponsesRecord(r)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="View responses"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(r.id || null)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
              {filtered.length} of {completedRecords.length} records
            </div>
          </div>
        )}
      </div>

      {selectedRecord && renderRecordDetail(selectedRecord)}
      {responsesRecord && renderResponsesDetail(responsesRecord)}

      {/* Aggregate modal */}
      {showAggregate && aggregateData && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-xl">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Aggregate Maturity Score
                </h2>
                <p className="text-sm text-muted-foreground">{selectedForAggregate.size} records selected</p>
              </div>
              <button onClick={() => setShowAggregate(false)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Average Overall Score</p>
                <p className="text-4xl font-bold text-primary">
                  {Math.round((aggregateData.reduce((a, d) => a + d.score, 0) / aggregateData.length) * 10) / 10}
                </p>
              </div>
              <div className="w-full h-[350px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={aggregateData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="pillar" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickCount={6} />
                    <Radar name="Average" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {pillars.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{p.name}</span>
                    <span className="font-semibold" style={{ color: PILLAR_COLORS[i] }}>{aggregateData[i].score}</span>
                  </div>
                ))}
              </div>

              {/* Aggregate Recommendations */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Strategic Recommendations
                </h3>
                {aggregateRecsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mr-3" />
                    <span className="text-sm text-muted-foreground">Generating recommendations for aggregate scores...</span>
                  </div>
                )}
                {aggregateRecsError && (
                  <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">{aggregateRecsError}</div>
                )}
                {aggregateRecs && <RecommendationsRenderer text={aggregateRecs} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Record</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to permanently delete this survey record? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg border border-input text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteRecord(confirmDelete);
                  setConfirmDelete(null);
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportPage;
