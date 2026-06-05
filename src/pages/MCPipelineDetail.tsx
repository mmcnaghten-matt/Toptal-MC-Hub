import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

export default function MCPipelineDetail() {
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
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400 mb-3">
            MC Business at a Glance
          </p>
          <h1 className="text-3xl font-extrabold text-white">Pipeline Detail</h1>
          <p className="text-blue-300/70 text-sm mt-2">Q4 2025 → Q1 2026 → Q2 2026</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Pipeline by Business Unit ── */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#374151] mb-1">Pipeline by Business Unit</p>
            <p className="text-[10px] text-[#9ca3af] mb-5">Unweighted / Weighted (ENT) — SMB values not tracked in Salesforce</p>

            {([
              {
                qLabel: "Q4 2025", opptys: 544,
                entCount: 512, entUnw: "$18.1M", entWtd: "$11.3M", wtdColor: "text-[#374151]",
                smbCount: 32,
              },
              {
                qLabel: "Q1 2026", opptys: 569,
                entCount: 537, entUnw: "$21.8M", entWtd: "$13.9M", wtdColor: "text-emerald-600",
                smbCount: 32,
              },
              {
                qLabel: "Q2 2026", opptys: 567,
                entCount: 536, entUnw: "$20.7M", entWtd: "$13.2M", wtdColor: "text-[#374151]",
                smbCount: 31,
              },
            ]).map((q, i) => (
              <div key={q.qLabel} className={i > 0 ? "mt-5 pt-5 border-t border-[#f1f5f9]" : ""}>
                <p className="text-xs font-semibold text-[#6b7280] mb-2">
                  {q.qLabel} · <span className="text-[#374151]">{q.opptys} opptys</span>
                </p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] text-[#6b7280] mb-0.5">ENT ({q.entCount})</p>
                    <p className="text-xl font-extrabold text-[#0f172a]">{q.entUnw}</p>
                    <p className={`text-xs font-medium ${q.wtdColor}`}>→ {q.entWtd} weighted</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6b7280] mb-0.5">SMB ({q.smbCount})</p>
                    <p className="text-xl font-extrabold text-[#9ca3af]">~$0</p>
                    <p className="text-[10px] text-[#9ca3af] italic">est. values not set</p>
                  </div>
                </div>
              </div>
            ))}

            <p className="text-[10px] text-[#9ca3af] leading-tight italic mt-5 pt-4 border-t border-[#f1f5f9]">
              SMB estimated opportunity values are not systematically populated in Salesforce. SMB pipeline tracked by count only (stable at ~31–32 open opptys).
            </p>
          </div>

          {/* ── Middle: Pipeline by Delivery Model — ENT ── */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#374151] mb-4">Pipeline by Delivery Model — ENT</p>

            <p className="text-3xl font-extrabold text-[#0f172a] mb-0.5">$2.7M</p>
            <p className="text-xs text-[#6b7280] mb-3">PS unweighted Q2 2026 — +36% vs Q4 2025</p>
            <div className="inline-block bg-emerald-50 border border-emerald-200 rounded px-3 py-1 mb-5">
              <p className="text-xs font-semibold text-emerald-700">PS share of weighted pipeline: 16%</p>
            </div>

            <p className="text-xs font-semibold text-[#6b7280] mb-3">Unweighted Pipeline by Quarter (ENT)</p>

            {/* Talent bars */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] mb-2">Talent</p>
            <div className="space-y-2 mb-5">
              {([
                { q: "Q4 '25", val: "$16.1M", pct: Math.round(16.1 / 19.2 * 100) },
                { q: "Q1 '26", val: "$19.2M", pct: 100 },
                { q: "Q2 '26", val: "$18.1M", pct: Math.round(18.1 / 19.2 * 100) },
              ]).map((row) => (
                <div key={row.q} className="flex items-center gap-3">
                  <span className="text-xs text-[#6b7280] w-12 shrink-0">{row.q}</span>
                  <div className="flex-1 bg-[#dbeafe] rounded-sm h-5 relative">
                    <div
                      className="bg-[#3b82f6] h-5 rounded-sm transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#374151] w-14 text-right shrink-0">{row.val}</span>
                </div>
              ))}
            </div>

            {/* PS bars */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c3aed] mb-2">Professional Services</p>
            <div className="space-y-2">
              {([
                { q: "Q4 '25", val: "$1.96M", pct: Math.round(1.96 / 2.68 * 100) },
                { q: "Q1 '26", val: "$2.55M", pct: Math.round(2.55 / 2.68 * 100) },
                { q: "Q2 '26", val: "$2.68M", pct: 100 },
              ]).map((row) => (
                <div key={row.q} className="flex items-center gap-3">
                  <span className="text-xs text-[#6b7280] w-12 shrink-0">{row.q}</span>
                  <div className="flex-1 bg-[#ede9fe] rounded-sm h-5 relative">
                    <div
                      className="bg-[#8b5cf6] h-5 rounded-sm transition-all"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#374151] w-14 text-right shrink-0">{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Weighted Pipeline Summary ── */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#374151] mb-4">Weighted Pipeline Summary</p>

            {/* Table */}
            <table className="w-full text-xs mb-6">
              <thead>
                <tr className="border-b border-[#e2e8f0]">
                  <th className="text-left font-semibold text-[#374151] pb-2 pr-2">Segment</th>
                  <th className="text-right font-semibold text-[#374151] pb-2 px-2">Q4 '25</th>
                  <th className="text-right font-semibold text-[#1e3a8a] pb-2 px-2">Q1 '26</th>
                  <th className="text-right font-semibold text-[#374151] pb-2 pl-2">Q2 '26</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { label: "ENT Total",      indent: false, bold: true,  vals: ["$11.3M", "$13.9M", "$13.2M"], hi: [false, true,  false] },
                  { label: "└ Talent",        indent: true,  bold: false, vals: ["$10.0M", "$11.8M", "$11.1M"], hi: [false, false, false], color: "#2563eb" },
                  { label: "└ Prof. Services",indent: true,  bold: false, vals: ["$1.25M", "$2.06M", "$2.10M"], hi: [false, false, true],  color: "#7c3aed" },
                  { label: "SMB",            indent: false, bold: false, vals: ["32 opptys", "32 opptys", "31 opptys"], hi: [false, false, false], muted: true },
                  { label: "Total Weighted", indent: false, bold: true,  vals: ["$11.3M", "$13.9M", "$13.2M"], hi: [false, true,  false] },
                ] as { label: string; indent: boolean; bold: boolean; vals: string[]; hi: boolean[]; color?: string; muted?: boolean }[]).map((row, ri) => (
                  <tr key={row.label} className={ri === 3 ? "border-t border-[#e2e8f0]" : ri === 4 ? "border-t-2 border-[#e2e8f0]" : ""}>
                    <td className={`py-1.5 pr-2 ${row.indent ? "pl-3" : ""} ${row.bold ? "font-bold text-[#0f172a]" : row.muted ? "text-[#9ca3af]" : ""}`}
                        style={{ color: row.color && !row.bold ? row.color : undefined }}>
                      {row.label}
                    </td>
                    {row.vals.map((v, i) => (
                      <td key={i} className={`py-1.5 text-right px-2 ${row.bold ? "font-bold" : "font-medium"} ${
                        row.hi[i] ? "text-emerald-600" : row.muted ? "text-[#9ca3af]" : "text-[#374151]"
                      }`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Opportunity counts */}
            <p className="text-[10px] text-[#6b7280] mb-3">Opportunity Count (all active stages)</p>
            <div className="flex justify-between mb-4">
              {([
                { count: "544", q: "Q4 2025", color: "text-[#374151]" },
                { count: "569", q: "Q1 2026", color: "text-emerald-600" },
                { count: "567", q: "Q2 2026", color: "text-[#1e3a8a]" },
              ]).map((item) => (
                <div key={item.q} className="text-center">
                  <p className={`text-3xl font-extrabold ${item.color}`}>{item.count}</p>
                  <p className="text-[10px] text-[#9ca3af] mt-0.5">{item.q}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-[#9ca3af] leading-tight italic">
              Stage weights: Fulfillment 90%, Closing 75%, Solutioning 50%, Qualifying 25%, Identified 10%.
              Snapshots: Dec 31 / Mar 31 / Apr 8. ENT only for $ values.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
