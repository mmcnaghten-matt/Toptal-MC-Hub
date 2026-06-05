import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

const points = [
  {
    num: "01",
    title: "The business is in its strongest growth phase",
    body: "Q1 2026 was the best quarter on record. $7.5M gross in Q1 2026, +9% YoY. Three consecutive quarters of growth. The business isn't just recovering — it's compounding. That is the headline.",
  },
  {
    num: "02",
    title: "Enterprise is the engine, and the flywheel is working",
    body: "ENT grew 25% YoY in Q1 2026 and now represents 70% of gross revenue (up from 65% a year ago). The more important signal: conversion rate has doubled from 12% to 27% over five quarters. That's not luck — it's a structural improvement in how the team identifies and closes ENT work. New opportunity creation hit a record 122 in Q1 2026.",
  },
  {
    num: "03",
    title: "SMB is in structural decline — and it needs a decision, not monitoring",
    body: "Five consecutive quarters of YoY decline, ranging from −16% to −34%. ENT growth is masking it, but SMB gross has not grown in four straight quarters. No single SMB account has produced $200K net in the last 12 months. The pipeline for SMB has 31 open opportunities with essentially zero tracked dollar value. This is not noise. Without a deliberate intervention, SMB will continue drifting while ENT absorbs all available capacity.",
  },
  {
    num: "04",
    title: "Professional Services is the right strategic bet — but the pitch has changed",
    body: "PS grew 4x in one year, from 4% to 14% of gross revenue. That's real and meaningful. But the margin story needs to be told correctly: PS margins are 31–36%, in line with Talent — not the premium margins we thought. The value of PS is strategic positioning, client stickiness, and winning higher-complexity work. It is not a margin expansion story. That distinction matters when we talk about why PS is worth investing in.",
  },
  {
    num: "05",
    title: "The pipeline is deep and PS is gaining ground within it",
    body: "$13.2M weighted ENT pipeline in Q2 2026. The more interesting signal: PS weighted pipeline has grown from $1.25M to $2.10M over three quarters — a 68% increase — and is still climbing while Talent pipeline pulled back slightly from the Q1 peak. As PS pipeline converts, it will lock in MC's identity as a full-service practice, not a talent matching operation.",
  },
  {
    num: "06",
    title: "Margins are stable — the task now is growing the top line, not squeezing more margin",
    body: "Blended margins have held at 34–37% for five consecutive quarters through a significant mix shift. That's operational discipline. There is no further margin lever to pull from mix shift or PS growth. The H2 2026 story has to be about revenue volume — winning more ENT accounts, converting the 83 Solutioning opportunities, and deciding what to do about SMB.",
  },
];

export default function MCNarrativeDetail() {
  return (
    <div className="min-h-screen font-sans antialiased bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1b40] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/mc-plan"
              className="text-blue-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to MC Plan
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <ToptalLogo className="h-9" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-300/80">
            MC Plan · Confidential
          </p>
        </div>
      </header>

      {/* Page heading */}
      <div className="bg-[#0d1b40] border-b border-white/10 pb-10 pt-10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400 mb-3">
            MC Business at a Glance
          </p>
          <h1 className="text-3xl font-extrabold text-white">Deeper Analysis</h1>
          <p className="text-blue-300/70 text-sm mt-2">Six signals that define where we are and what comes next</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {points.map((point, i) => (
            <div key={point.num} className="flex gap-6">
              <span className="text-3xl font-extrabold text-[#e2e8f0] leading-none shrink-0 w-10 pt-0.5 select-none">
                {point.num}
              </span>
              <div className={i < points.length - 1 ? "pb-8 border-b border-[#f1f5f9] flex-1" : "flex-1"}>
                <h2 className="text-lg font-bold text-[#0f172a] mb-2">{point.title}</h2>
                <p className="text-base text-[#374151] leading-relaxed">{point.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
