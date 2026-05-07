import jsPDF from "jspdf";
export interface AIRecommendation {
  title: string;
  rationale: string;
  actions: string[];
  impact: string;
}
import {
  surveyQuestions,
  benchmarkCompanies,
  calculateTotalScore,
  getMaturityLevel,
} from "@/data/cannesSurveyData";

interface ExportParams {
  answers: Record<string, number>;
  userInfo: { name: string; company: string; email: string };
  aiRecs: AIRecommendation[];
}

// Toptal brand blue
const TOPTAL_BLUE: [number, number, number] = [37, 99, 235]; // #2563EB
const TOPTAL_LIGHT_BLUE: [number, number, number] = [147, 197, 253]; // #93C5FD
const DARK_BG: [number, number, number] = [32, 33, 36];

export function exportResultsPdf({ answers, userInfo, aiRecs }: ExportParams) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  const totalScore = calculateTotalScore(answers);
  const maturity = getMaturityLevel(totalScore);

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 15) {
      doc.addPage();
      y = 20;
    }
  };

  // ── Helper: draw horizontal bar chart ──
  const drawBarChart = (
    items: { label: string; value: number; max: number; isUser?: boolean; color?: [number, number, number] }[],
    startY: number,
    barHeight: number = 7,
    gap: number = 3,
    labelWidth: number = 55,
    chartWidth?: number,
  ) => {
    const cw = chartWidth || contentW - labelWidth - 15;
    let cy = startY;

    items.forEach((item) => {
      ensureSpace(barHeight + gap + 2);

      // Label
      doc.setFontSize(8);
      doc.setFont("helvetica", item.isUser ? "bold" : "normal");
      doc.setTextColor(50, 50, 50);

      // Wrap long labels
      const labelLines = doc.splitTextToSize(item.label, labelWidth - 4);
      const labelY = cy + barHeight / 2 + (labelLines.length > 1 ? -1 : 1.5);
      doc.text(labelLines, margin, labelY);

      // Bar background
      const barX = margin + labelWidth;
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(barX, cy, cw, barHeight, 1, 1, "F");

      // Bar fill
      const fillW = Math.max(1, (item.value / item.max) * cw);
      const color = item.color || (item.isUser ? TOPTAL_BLUE : TOPTAL_LIGHT_BLUE);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(barX, cy, fillW, barHeight, 1, 1, "F");

      // Value label
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text(`${item.value}`, barX + fillW + 3, cy + barHeight / 2 + 1.5);

      const rowH = Math.max(barHeight, labelLines.length * 3.5) + gap;
      cy += rowH;
    });

    return cy;
  };

  // ── Score color shades (dark to light as score increases) ──
  const getScoreShade = (score: number): [number, number, number] => {
    if (score <= 1) return [30, 58, 95];   // #1E3A5F
    if (score <= 2) return [30, 86, 160];  // #1E56A0
    if (score <= 3) return TOPTAL_BLUE;    // #2563EB
    if (score <= 4) return [96, 165, 250]; // #60A5FA
    return TOPTAL_LIGHT_BLUE;             // #93C5FD
  };

  // ── Header band ──
  doc.setFillColor(DARK_BG[0], DARK_BG[1], DARK_BG[2]);
  doc.rect(0, 0, pageW, 38, "F");

  // TOPTAL logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TOPTAL", margin, 14);

  // Accent line under logo
  doc.setDrawColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, 17, margin + 24, 17);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("M&E Fan/Audience Platform Diagnostic — Cannes Edition", margin, 27);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(`${userInfo.name} — ${userInfo.company}`, margin, 34);
  y = 48;

  // ── Overall Score ──
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text("OVERALL MATURITY SCORE", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
  doc.text(`${totalScore}`, pageW / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text("out of 40", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text(`Level ${maturity.level}: ${maturity.name}`, pageW / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(11);
  doc.setTextColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
  doc.setFont("helvetica", "italic");
  doc.text(`"${maturity.title}"`, pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(maturity.description, contentW - 20);
  doc.text(descLines, pageW / 2, y, { align: "center", maxWidth: contentW - 20 });
  y += descLines.length * 4 + 12;

  // ── Category Scores Bar Chart ──
  ensureSpace(80);
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text("Score by Category", margin, y);
  y += 8;

  const categoryItems = surveyQuestions.map((q) => {
    const score = answers[q.id] || 0;
    return {
      label: q.category,
      value: score,
      max: 5,
      color: getScoreShade(score),
    };
  });

  y = drawBarChart(categoryItems, y, 7, 3, 55);
  y += 8;

  // ── Benchmark Comparison Bar Chart ──
  ensureSpace(80);
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text("How You Compare to Industry Leaders", margin, y);
  y += 8;

  const benchItems = [
    { name: userInfo.company || "Your Score", score: totalScore, isUser: true },
    ...benchmarkCompanies.map((c) => ({ name: c.name, score: c.score, isUser: false })),
  ]
    .sort((a, b) => b.score - a.score)
    .map((r) => ({
      label: r.name,
      value: r.score,
      max: 40,
      isUser: r.isUser,
      color: r.isUser ? TOPTAL_BLUE : TOPTAL_LIGHT_BLUE,
    }));

  y = drawBarChart(benchItems, y, 7, 3, 45);
  y += 10;

  // ── AI Recommendations ──
  const recs = aiRecs.length > 0 ? aiRecs : null;
  if (recs) {
    ensureSpace(30);
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text("AI-Powered Strategic Recommendations", margin, y);
    y += 8;

    recs.forEach((rec, i) => {
      ensureSpace(40);

      // Title
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
      const titleLines = doc.splitTextToSize(`${i + 1}. ${rec.title}`, contentW);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 4.5 + 3;

      // Rationale
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 120, 120);
      doc.text("RATIONALE", margin + 4, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const ratLines = doc.splitTextToSize(rec.rationale, contentW - 8);
      ratLines.forEach((line: string) => {
        ensureSpace(5);
        doc.text(line, margin + 4, y);
        y += 3.8;
      });
      y += 3;

      // Actions
      ensureSpace(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 120, 120);
      doc.text("STRATEGIC ACTIONS", margin + 4, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      rec.actions.forEach((action: string) => {
        ensureSpace(8);
        const actionLines = doc.splitTextToSize(action, contentW - 16);
        actionLines.forEach((line: string, li: number) => {
          ensureSpace(5);
          if (li === 0) {
            doc.setTextColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
            doc.text("•", margin + 6, y);
            doc.setTextColor(50, 50, 50);
            doc.text(line, margin + 10, y);
          } else {
            doc.text(line, margin + 10, y);
          }
          y += 3.8;
        });
        y += 1;
      });
      y += 2;

      // Impact
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 120, 120);
      doc.text("EXPECTED IMPACT", margin + 4, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(37, 99, 235);
      const impLines = doc.splitTextToSize(rec.impact, contentW - 8);
      impLines.forEach((line: string) => {
        ensureSpace(5);
        doc.text(line, margin + 4, y);
        y += 3.8;
      });
      y += 8;
    });
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Generated ${new Date().toLocaleDateString()} • Toptal M&E Fan/Audience Platform Diagnostic — Cannes Edition`,
      pageW / 2,
      pageH - 8,
      { align: "center" },
    );
  }

  doc.save(`${userInfo.company.replace(/\s+/g, "_")}_ME_Fan_Audience_Diagnostic_Cannes.pdf`);
}
