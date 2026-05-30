import jsPDF from "jspdf";
import type { DiagnosticConfig, RecommendationContent } from "../types";

const TOPTAL_BLUE: [number, number, number] = [37, 99, 235];
const TOPTAL_LIGHT_BLUE: [number, number, number] = [147, 197, 253];
const DARK: [number, number, number] = [30, 40, 50];
const MUTED: [number, number, number] = [100, 116, 139];
const LIGHT_MUTED: [number, number, number] = [160, 160, 160];
const BODY: [number, number, number] = [50, 50, 50];

const PILLAR_COLORS: [number, number, number][] = [
  [99, 102, 241],   // indigo
  [139, 92, 246],   // violet
  [59, 130, 246],   // blue
  [16, 185, 129],   // emerald
  [245, 158, 11],   // amber
  [239, 68, 68],    // red
];

const HEADER_H = 18;
const MARGIN = 15;

export interface ExportReportParams {
  config: DiagnosticConfig;
  pillarStats: Record<string, { raw: number; max: number }>;
  scoreSummary: Record<string, number>;
  maturityLevel: string;
  totalRaw: number;
  maxRaw: number;
  avgScore: number;
  scoreDisplay: "raw" | "normalized";
  recommendation: RecommendationContent | null;
  respondent: { full_name: string; enterprise: string; role: string; department: string } | null;
  compositeLabel?: string;
  chartDataUrl?: string;
}

export function exportReportPdf({
  config,
  pillarStats,
  scoreSummary,
  maturityLevel,
  totalRaw,
  maxRaw,
  avgScore,
  scoreDisplay,
  recommendation,
  respondent,
  compositeLabel,
  chartDataUrl,
}: ExportReportParams) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  let y = 0;

  const reportTitle = compositeLabel
    ? `${config.title} Composite Report`
    : `${config.title} Report`;

  const drawHeader = (pageNum?: number) => {
    doc.setFillColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
    doc.rect(0, 0, pageW, HEADER_H, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOPTAL", MARGIN, 11);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 220, 255);
    doc.text(`  |  ${reportTitle}`, MARGIN + 18, 11);
    if (pageNum !== undefined) {
      doc.setFontSize(7);
      doc.setTextColor(200, 220, 255);
      doc.text(`${pageNum}`, pageW - MARGIN, 11, { align: "right" });
    }
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 12) {
      doc.addPage();
      drawHeader();
      y = HEADER_H + 8;
    }
  };

  const drawBarChart = (
    items: { label: string; value: number; max: number; color?: [number, number, number] }[],
    startY: number,
    barHeight = 5,
    gap = 4,
    labelWidth = 52,
  ) => {
    const cw = contentW - labelWidth - 12;
    let cy = startY;
    items.forEach((item) => {
      ensureSpace(barHeight + gap + 2);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(BODY[0], BODY[1], BODY[2]);
      const labelLines = doc.splitTextToSize(item.label, labelWidth - 3);
      const labelY = cy + barHeight / 2 + 1.5;
      doc.text(labelLines, MARGIN, labelY);
      const barX = MARGIN + labelWidth;
      doc.setFillColor(235, 237, 242);
      doc.roundedRect(barX, cy, cw, barHeight, 1, 1, "F");
      const fillW = Math.max(1, (item.value / item.max) * cw);
      const color = item.color ?? TOPTAL_BLUE;
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(barX, cy, fillW, barHeight, 1, 1, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BODY[0], BODY[1], BODY[2]);
      doc.text(`${item.value}`, barX + fillW + 2, cy + barHeight / 2 + 1.5);
      const rowH = Math.max(barHeight, labelLines.length * 3.5) + gap;
      cy += rowH;
    });
    return cy;
  };

  // ── Page 1 header ──
  drawHeader();
  y = HEADER_H + 8;

  // ── Respondent / composite card ──
  if (compositeLabel || respondent) {
    const cardH = 14;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(218, 222, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, contentW, cardH, 2, 2, "FD");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    if (compositeLabel) {
      doc.text("Composite Report", MARGIN + 4, y + 5.5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(compositeLabel, MARGIN + 4, y + 10.5);
    } else if (respondent) {
      doc.text(respondent.full_name, MARGIN + 4, y + 5.5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text(
        `${respondent.role} · ${respondent.enterprise} · ${respondent.department}`,
        MARGIN + 4,
        y + 10.5,
      );
    }
    y += cardH + 7;
  }

  // ── Overall score ──
  ensureSpace(28);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text("OVERALL MATURITY SCORE", pageW / 2, y, { align: "center" });
  y += 5;

  const scoreText = scoreDisplay === "normalized"
    ? `${avgScore.toFixed(1)} / 5`
    : `${totalRaw} / ${maxRaw}`;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
  doc.text(scoreText, pageW / 2, y + 8, { align: "center" });
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(maturityLevel, pageW / 2, y + 4, { align: "center" });
  y += 12;

  // ── Pillar scores ──
  ensureSpace(20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text("Pillar Scores", MARGIN, y);
  y += 6;

  const pillarItems = config.dimensions.map((dim, i) => {
    const { raw, max } = pillarStats[dim.id] ?? { raw: 0, max: 1 };
    const normScore = scoreSummary[dim.id] ?? 1;
    const value = scoreDisplay === "normalized" ? normScore : raw;
    const maxVal = scoreDisplay === "normalized" ? 5 : max;
    return {
      label: dim.shortName,
      value: Math.round(value * 10) / 10,
      max: maxVal,
      color: PILLAR_COLORS[i % PILLAR_COLORS.length],
    };
  });

  y = drawBarChart(pillarItems, y, 5, 4, 52);
  y += 6;

  // ── Radar chart image ──
  if (chartDataUrl) {
    ensureSpace(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text("Dimension Profile", MARGIN, y);
    y += 5;

    const chartProps = doc.getImageProperties(chartDataUrl);
    const chartW = contentW;
    const chartH = (chartProps.height / chartProps.width) * chartW;
    ensureSpace(chartH + 4);
    doc.addImage(chartDataUrl, "PNG", MARGIN, y, chartW, chartH);
    y += chartH + 8;
  }

  // ── Strategic recommendations ──
  if (recommendation?.recommendations && recommendation.recommendations.length > 0) {
    ensureSpace(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text("Strategic Recommendations", MARGIN, y);
    y += 8;

    recommendation.recommendations.forEach((rec, i) => {
      ensureSpace(20);

      // Number + title
      doc.setFillColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
      doc.circle(MARGIN + 3.5, y + 0.5, 3.5, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${i + 1}`, MARGIN + 3.5, y + 1.5, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      const titleLines = doc.splitTextToSize(rec.title, contentW - 12);
      doc.text(titleLines, MARGIN + 10, y + 1.5);
      y += titleLines.length * 4.5 + 5;

      const indent = MARGIN + 6;
      const indentW = contentW - 10;

      // Rationale
      ensureSpace(12);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text("RATIONALE", indent, y);
      y += 3.5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(BODY[0], BODY[1], BODY[2]);
      const ratLines = doc.splitTextToSize(rec.rationale, indentW);
      ratLines.forEach((line: string) => {
        ensureSpace(5);
        doc.text(line, indent, y);
        y += 4;
      });
      y += 3;

      // Strategic action
      ensureSpace(12);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text("STRATEGIC ACTION", indent, y);
      y += 3.5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(BODY[0], BODY[1], BODY[2]);
      const actionLines = doc.splitTextToSize(rec.strategic_action, indentW);
      actionLines.forEach((line: string) => {
        ensureSpace(5);
        doc.text(line, indent, y);
        y += 4;
      });
      y += 3;

      // Expected impact
      ensureSpace(12);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      doc.text("EXPECTED IMPACT", indent, y);
      y += 3.5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
      const impactLines = doc.splitTextToSize(rec.expected_impact, indentW);
      impactLines.forEach((line: string) => {
        ensureSpace(5);
        doc.text(line, indent, y);
        y += 4;
      });
      y += 8;
    });
  }

  // ── Footer (all pages) ──
  const pageCount = doc.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    // Stamp page number in header
    doc.setFillColor(TOPTAL_BLUE[0], TOPTAL_BLUE[1], TOPTAL_BLUE[2]);
    doc.rect(pageW - MARGIN - 8, 4, 12, 10, "F"); // clear patch to overdraw
    doc.setFontSize(7);
    doc.setTextColor(200, 220, 255);
    doc.text(`${p} / ${pageCount}`, pageW - MARGIN, 11, { align: "right" });
    // Footer line
    doc.setFontSize(7);
    doc.setTextColor(LIGHT_MUTED[0], LIGHT_MUTED[1], LIGHT_MUTED[2]);
    doc.text(
      `Generated ${dateStr} · Toptal ${config.title} Maturity Report`,
      pageW / 2,
      pageH - 6,
      { align: "center" },
    );
  }

  doc.save(`${config.slug}-report.pdf`);
}
