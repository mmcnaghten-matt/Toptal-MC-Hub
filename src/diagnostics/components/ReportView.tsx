import { useRef } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import ScoreChart from "./ScoreChart";
import logoSvg from "@/assets/toptal-logo-white.svg";
import type { DiagnosticConfig, RecommendationContent } from "../types";

interface Props {
  config: DiagnosticConfig;
  answers: Record<string, number>;
  scoreSummary: Record<string, number>;
  respondent: { full_name: string; enterprise: string; role: string; department: string } | null;
  recommendation: RecommendationContent | null;
  recLoading: boolean;
  recError: string | null;
  compositeLabel?: string;
}

const PILLAR_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const MATURITY_BADGE: Record<string, string> = {
  Foundational: 'bg-red-100 text-red-800',
  Developing: 'bg-orange-100 text-orange-800',
  Integrated: 'bg-yellow-100 text-yellow-800',
  Predictive: 'bg-blue-100 text-blue-800',
  'Optimized & Adaptive': 'bg-green-100 text-green-800',
};

function computePillarStats(config: DiagnosticConfig, answers: Record<string, number>) {
  const result: Record<string, { raw: number; max: number }> = {};
  for (const dim of config.dimensions) {
    const qs = config.questions.filter(q => q.dimension === dim.id);
    result[dim.id] = {
      raw: qs.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0),
      max: qs.reduce((sum, q) => sum + (q.options.length - 1), 0),
    };
  }
  return result;
}

function computeMaturityLevel(raw: number, maxRaw: number): RecommendationContent['maturity_level'] {
  const pct = maxRaw > 0 ? raw / maxRaw : 0;
  if (pct < 0.21) return 'Foundational';
  if (pct < 0.42) return 'Developing';
  if (pct < 0.63) return 'Integrated';
  if (pct < 0.84) return 'Predictive';
  return 'Optimized & Adaptive';
}

export default function ReportView({ config, answers, scoreSummary, respondent, recommendation, recLoading, recError, compositeLabel }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

  const scoreDisplay = config.scoreDisplay ?? 'raw';
  const pillarStats = computePillarStats(config, answers);
  const totalRaw = Object.values(pillarStats).reduce((sum, s) => sum + s.raw, 0);
  const maxRaw = Object.values(pillarStats).reduce((sum, s) => sum + s.max, 0);
  const maturityLevel = computeMaturityLevel(totalRaw, maxRaw);
  const badgeClass = MATURITY_BADGE[maturityLevel] ?? 'bg-muted text-foreground';

  // Normalized display: show average 1–5 score across pillars
  const pillarNorm = config.dimensions.map(d => scoreSummary[d.id] ?? 1);
  const avgScore = pillarNorm.length > 0
    ? pillarNorm.reduce((a, b) => a + b, 0) / pillarNorm.length
    : 1;

  const handleExportPDF = async () => {
    const el = reportRef.current;
    if (!el) return;

    // Allow Recharts SVG to finish rendering before capture
    await new Promise(r => setTimeout(r, 300));

    // Inject branded header into the capture area, then remove it after
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const header = document.createElement('div');
    header.style.cssText = `display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:hsl(${primaryColor});border-radius:12px;margin-bottom:24px;`;
    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = 'font-weight:600;color:white;font-size:14px;font-family:inherit;';
    titleSpan.textContent = compositeLabel ? `${config.title} Composite Report` : `${config.title} Report`;
    const logo = document.createElement('img');
    logo.src = logoSvg;
    logo.style.cssText = 'height:28px;';
    header.appendChild(titleSpan);
    header.appendChild(logo);
    el.prepend(header);

    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const props = pdf.getImageProperties(dataUrl);
      const pdfW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const pdfH = (props.height * pdfW) / props.width;

      if (pdfH <= pageH) {
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH);
      } else {
        let yOffset = 0;
        while (yOffset < pdfH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, -yOffset, pdfW, pdfH);
          yOffset += pageH;
        }
      }

      pdf.save(`${config.slug}-report.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      if (el.contains(header)) el.removeChild(header);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleExportPDF}
          disabled={recLoading}
          title={recLoading ? "Waiting for recommendations to finish generating…" : undefined}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-muted"
        >
          {recLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {recLoading ? "Generating recommendations…" : "Export PDF"}
        </button>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Respondent / composite header */}
        {compositeLabel ? (
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-semibold text-foreground text-base">Composite Report</p>
            <p className="text-muted-foreground text-sm mt-0.5">{compositeLabel}</p>
          </div>
        ) : respondent && (
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-semibold text-foreground text-base">{respondent.full_name}</p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {respondent.role} · {respondent.enterprise} · {respondent.department}
            </p>
          </div>
        )}

        {/* Overall score + Pillar Scores side by side */}
        <div className="grid grid-cols-3 gap-6 items-stretch">
          {/* Overall score — 1/3 width */}
          <div className="bg-card border border-border rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
              {maturityLevel}
            </span>
            {scoreDisplay === 'normalized' ? (
              <p className="text-4xl font-bold text-foreground">
                {avgScore.toFixed(1)}
                <span className="text-xl text-muted-foreground font-normal"> / 5</span>
              </p>
            ) : (
              <p className="text-4xl font-bold text-foreground">
                {totalRaw}
                <span className="text-xl text-muted-foreground font-normal"> / {maxRaw}</span>
              </p>
            )}
            <p className="text-muted-foreground text-sm">Overall Maturity Score</p>
          </div>

          {/* Pillar Scores bar chart — 2/3 width */}
          <div className="col-span-2 bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Pillar Scores</h3>
            <div className="space-y-4">
              {config.dimensions.map((dim, i) => {
                const { raw, max } = pillarStats[dim.id] ?? { raw: 0, max: 1 };
                const normScore = scoreSummary[dim.id] ?? 1;
                const pct = scoreDisplay === 'normalized'
                  ? ((normScore - 1) / 4) * 100
                  : max > 0 ? (raw / max) * 100 : 0;
                return (
                  <div key={dim.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{dim.shortName}</span>
                      {scoreDisplay === 'normalized'
                        ? <span className="text-xs text-muted-foreground font-mono">{normScore.toFixed(1)} / 5</span>
                        : <span className="text-xs text-muted-foreground font-mono">{raw} / {max}</span>
                      }
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: PILLAR_COLORS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Radar chart — full width gives labels room to render */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-3">Dimension Profile</h3>
          <ScoreChart dimensions={config.dimensions} scoreSummary={scoreSummary} />
        </div>

        {/* Strategic recommendations */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Strategic Recommendations</h3>

          {recLoading && (
            <div className="flex items-center gap-3 py-5 px-5 bg-card border border-border rounded-xl">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-sm text-muted-foreground">Generating personalized recommendations… (~15–30 seconds)</p>
            </div>
          )}

          {recError && !recLoading && (
            <div className="py-4 px-5 bg-card border border-destructive/40 rounded-xl space-y-1">
              <p className="text-sm text-destructive font-medium">Could not generate recommendations</p>
              <p className="text-xs text-muted-foreground font-mono">{recError}</p>
            </div>
          )}

          {recommendation?.recommendations.map((rec, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <h4 className="font-semibold text-foreground text-sm leading-snug">{rec.title}</h4>
              </div>
              <div className="pl-9 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Rationale</p>
                  <p className="text-foreground leading-relaxed">{rec.rationale}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Strategic Action</p>
                  <p className="text-foreground leading-relaxed">{rec.strategic_action}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Expected Impact</p>
                  <p className="text-primary font-medium leading-relaxed">{rec.expected_impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
