import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

// ── Shared primitives ─────────────────────────────────────────────────────────

const SectionLabel = ({ children, light = false }: { children: ReactNode; light?: boolean }) => (
  <p className={`text-xs font-semibold uppercase tracking-[0.15em] mb-3 ${light ? "text-blue-300" : "text-[#2563eb]"}`}>
    {children}
  </p>
);

const SectionHeading = ({ children, light = false }: { children: ReactNode; light?: boolean }) => (
  <h2 className={`text-4xl font-extrabold leading-tight mb-5 ${light ? "text-white" : "text-[#0f172a]"}`}>
    {children}
  </h2>
);

const Body = ({ children, light = false, className = "" }: { children: ReactNode; light?: boolean; className?: string }) => (
  <p className={`text-base leading-relaxed ${light ? "text-blue-100" : "text-[#374151]"} ${className}`}>
    {children}
  </p>
);

const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-block text-xs bg-[#dbeafe] text-[#1e40af] rounded px-2 py-0.5 font-medium">
    {children}
  </span>
);

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white border border-[#e2e8f0] rounded-xl p-6 ${className}`}>
    {children}
  </div>
);

const InnerCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`bg-[#eff6ff] rounded-lg p-4 ${className}`}>
    {children}
  </div>
);

const Container = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`max-w-5xl mx-auto px-6 ${className}`}>
    {children}
  </div>
);

// ── Hub color map ─────────────────────────────────────────────────────────────

const HUB_COLORS: Record<string, { bg: string; text: string }> = {
  "Growth Strategy":         { bg: "#EEF2FF", text: "#2B44D4" },
  "Business Transformation": { bg: "#EEF2FF", text: "#2B44D4" },
  "Finance Transformation":  { bg: "#ECFDF5", text: "#0CA678" },
  "Performance Improvement": { bg: "#FFF7ED", text: "#E86B4A" },
  "Supply Chain":            { bg: "#FFF7ED", text: "#E86B4A" },
  "Workforce Transformation":{ bg: "#EDE9FE", text: "#5C6BC0" },
  "Change Management":       { bg: "#F1F5F9", text: "#475569" },
};

const HUB_DETAILS: Record<string, { definition: string; buyer: string; buyingCenter: string; rationale: string }> = {
  "Growth Strategy": {
    definition: "Identifies and exploits expansion through market penetration, product development, and diversification.",
    buyer: "CSO / CMO",
    buyingCenter: "Strategy & Marketing",
    rationale: "Develop a structured expansion roadmap, align marketing and sales teams, and unlock new market opportunities.",
  },
  "Business Transformation": {
    definition: "Enterprise-wide change to improve performance, competitiveness, and adaptability.",
    buyer: "CEO / COO",
    buyingCenter: "C-Suite / Strategy",
    rationale: "Build a clear transformation vision, prioritize high-impact initiatives, and drive measurable results enterprise-wide.",
  },
  "Finance Transformation": {
    definition: "Modernizes finance from a cost center to a strategic partner across five pillars: Strategy & Vision, Performance Management, Process Optimization, Org & Governance, and Data & Technology.",
    buyer: "CFO",
    buyingCenter: "Finance",
    rationale: "Modernize financial operations, eliminate manual bottlenecks, and elevate finance into a true strategic partner.",
  },
  "Performance Improvement": {
    definition: "Drives EBITDA growth, cost reduction, and operational efficiency by rewiring core processes through digital strategy, change management, and AI.",
    buyer: "C-Level / Ops",
    buyingCenter: "Operations",
    rationale: "Diagnose operational drag, eliminate value leakage, and deliver sustainable efficiency and EBITDA gains.",
  },
  "Supply Chain": {
    definition: "Optimizes operations and logistics for resilience, transparency, and efficiency — integrating digital capabilities, AI, and risk management across end-to-end supply chain.",
    buyer: "COO",
    buyingCenter: "Operations / Procurement",
    rationale: "Build resilience, integrate digital capabilities, and optimize end-to-end logistics and procurement performance.",
  },
  "Workforce Transformation": {
    definition: "Evolves talent strategy, organizational structure, and culture to meet future business needs — with strong connection to AI reskilling, change management, and HR technology.",
    buyer: "CHRO / CPO",
    buyingCenter: "Human Resources / People",
    rationale: "Align talent strategy, close skill gaps, and prepare your organization for the human-AI era.",
  },
};

const HubTag = ({ hub }: { hub: string }) => {
  const c = HUB_COLORS[hub] ?? { bg: "#F1F5F9", text: "#374151" };
  return (
    <span
      className="inline-block text-xs font-semibold rounded px-2.5 py-1 whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {hub}
    </span>
  );
};

// ── Tech expansion data ───────────────────────────────────────────────────────

const ALL_TECH_ENGAGEMENTS = [
  {
    engagement: "ERP / platform / Salesforce implementation",
    pairs: [
      { trigger: '"How are you thinking about adoption — do your people have what they need to actually change how they work?"', hub: "Change Management" },
      { trigger: '"Now that the system is live, are your processes and team model keeping up?"', hub: "Business Transformation" },
    ],
  },
  {
    engagement: "AI / ML implementation",
    pairs: [
      { trigger: '"When your CFO asks if this is working — do you have a way to measure ROI yet?"', hub: "Finance Transformation" },
      { trigger: '"The tools are live — are people actually using them? What\'s the resistance looking like?"', hub: "Change Management" },
    ],
  },
  {
    engagement: "Agile / product model transformation",
    pairs: [
      { trigger: '"Now that the model is in place — are you confident you\'re building the right things?"', hub: "Growth Strategy" },
      { trigger: '"Are the team behaviors and structure actually keeping up with the new model?"', hub: "Change Management" },
    ],
  },
  {
    engagement: "Cloud migration / app modernization",
    pairs: [
      { trigger: '"Now that infrastructure changed — how are your processes and team model keeping up?"', hub: "Business Transformation" },
    ],
  },
  {
    engagement: "Large-scale tech talent deployment (10+ resources)",
    pairs: [
      { trigger: '"How are you thinking about your long-term talent model as AI changes what your engineers do?"', hub: "Workforce Transformation" },
    ],
  },
  {
    engagement: "Supply chain / ERP / ops systems",
    pairs: [
      { trigger: '"Do you have visibility into where AI could automate in your value chain today?"', hub: "Performance Improvement" },
      { trigger: '"How resilient is your supply chain if your primary supplier or region gets disrupted?"', hub: "Supply Chain" },
    ],
  },
] as { engagement: string; pairs: { trigger: string; hub: string }[] }[];

const PREVIEW_TECH_ENGAGEMENTS = ALL_TECH_ENGAGEMENTS.slice(0, 3);

const TALENT_EXPANSION_ROWS = [
  {
    signal: "Long-term staffing engagement (18+ months, stable team)",
    trigger: '"You\'ve had a consistent team in place for over a year — has the business problem evolved? What are you trying to solve next?"',
    path: "Business Transformation / Growth Strategy",
  },
  {
    signal: "Multiple roles placed across two or more functions",
    trigger: '"You\'re scaling across multiple areas at once — is that driven by a strategic shift or a capacity gap?"',
    path: "Growth Strategy / Business Transformation",
  },
  {
    signal: "Finance or FP&A talent placed",
    trigger: '"Now that you have the right people — do you have the processes and tools to fully leverage them?"',
    path: "Finance Transformation",
  },
  {
    signal: "PM or change management talent in a transformation",
    trigger: '"You have the people in place — how\'s the change actually landing with the broader team?"',
    path: "Change Management",
  },
  {
    signal: "Ops or supply chain talent expanding",
    trigger: '"Your ops team is growing — are processes keeping up, or are efficiency gaps building?"',
    path: "Performance Improvement / Supply Chain",
  },
  {
    signal: "Senior IC placed (director / VP level)",
    trigger: '"At that seniority, they\'re likely driving a broader agenda — are there areas where a consulting sprint would accelerate what they\'re already building?"',
    path: "Business Transformation / Workforce Transformation",
  },
];

// ── Tech table component ──────────────────────────────────────────────────────

function TechTable({ engagements }: { engagements: typeof ALL_TECH_ENGAGEMENTS }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6b7280]">Tech engagement</th>
            <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6b7280]">Trigger question CP/ESE asks</th>
            <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#2563eb]">MC hub entry point</th>
          </tr>
        </thead>
        <tbody>
          {engagements.map((row) =>
            row.pairs.map((pair, pairIdx) => (
              <tr
                key={`${row.engagement}-${pairIdx}`}
                className={`hover:bg-[#fafcff] transition-colors ${pairIdx === 0 ? "border-t border-[#e2e8f0]" : "border-t border-[#f1f5f9]"}`}
              >
                {pairIdx === 0 && (
                  <td
                    rowSpan={row.pairs.length}
                    className="px-5 py-4 text-[#2563eb] font-bold align-top border-r border-[#f1f5f9] w-1/4"
                  >
                    {row.engagement}
                  </td>
                )}
                <td className="px-5 py-4 text-[#374151] italic align-top">{pair.trigger}</td>
                <td className="px-5 py-4 align-top w-40">
                  <HubTag hub={pair.hub} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MCPlan() {
  const navigate = useNavigate();
  const [openHub, setOpenHub] = useState<string | null>(null);
  const [pipelineAnalysis, setPipelineAnalysis] = useState(false);
  const [contextModal, setContextModal] = useState(false);
  const [shiftModal, setShiftModal] = useState(false);
  const [techExpandModal, setTechExpandModal] = useState(false);

  return (
    <div className="min-h-screen font-sans antialiased">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-[#0d1b40] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-blue-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Hub
            </button>
            <div className="w-px h-4 bg-white/20" />
            <ToptalLogo className="h-9" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-300/80">
            MC Plan · Confidential
          </p>
        </div>
      </header>

      {/* ── Section 1: Hero ── */}
      <section className="bg-gradient-to-br from-[#0d1b40] via-[#0f2050] to-[#0a1628] py-28">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400 mb-6">
            ✦ Toptal Management Consulting
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight max-w-3xl mb-4">
            MC Model Transformation
          </h1>
          <p className="text-lg text-blue-200 mb-10">Numbers · Context · Hubs · Plan</p>
          <div className="flex flex-wrap gap-3">
            {["MC at a Glance", "Context", "Hub Strategy", "Execution Plan"].map((label) => (
              <span
                key={label}
                className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm rounded-full px-4 py-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Section 2: MC at a Glance (By the Numbers) ── */}
      <section className="bg-white py-20">
        <Container>
          <h2 className="text-2xl font-semibold text-[#9ca3af] mb-6">MC at a Glance</h2>
          <SectionLabel>By the Numbers</SectionLabel>

          {/* KPI stat bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">

            {/* Gross Revenue */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex flex-col">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5">12-Month Gross Revenue</p>
              <p className="text-xl font-extrabold text-[#0f172a] mb-0.5">$27.9M</p>
              <p className="text-[10px] text-[#374151] mb-0.5">Jun '25 – May '26</p>
              <p className="text-[10px] font-medium text-emerald-600 mb-2">Q1 '26: +9% YoY</p>
              <div className="border-t border-[#e2e8f0] pt-2">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-0.5">Projected 2026 Gross</p>
                <p className="text-lg font-extrabold text-emerald-600 mb-0.5">~$29.8M</p>
                <p className="text-[10px] text-[#6b7280] mb-0.5">vs $26.3M actual 2025</p>
                <p className="text-sm font-bold text-emerald-600">+13% YoY</p>
              </div>
            </div>

            {/* Net Revenue */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex flex-col">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5">12-Month Net Revenue</p>
              <p className="text-xl font-extrabold text-[#0f172a] mb-0.5">$9.9M</p>
              <p className="text-[10px] text-[#374151] mb-0.5">36.2% blended margin</p>
              <p className="text-[10px] font-medium text-emerald-600 mb-2">Q1 '26: +5% YoY</p>
              <div className="border-t border-[#e2e8f0] pt-2">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-0.5">Projected 2026 Net</p>
                <p className="text-lg font-extrabold text-emerald-600 mb-0.5">~$10.7M</p>
                <p className="text-[10px] text-[#6b7280] mb-0.5">vs $9.4M actual 2025</p>
                <p className="text-sm font-bold text-emerald-600">+14% YoY</p>
              </div>
            </div>

            {/* Blended Margin */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex flex-col">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5">Blended Margin</p>
              <p className="text-xl font-extrabold text-[#0f172a] mb-1">36.2%</p>
              <p className="text-[10px] text-[#6b7280]">Stable band 34–37%</p>
              <p className="text-[10px] text-[#6b7280]">5 qtrs consistent</p>
            </div>

            {/* ENT vs SMB */}
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex flex-col">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">ENT vs SMB — Q1 '26 YoY</p>
              <p className="text-xl font-extrabold text-emerald-600">ENT +25%</p>
              <p className="text-[10px] text-[#374151] mb-2">$4.2M → $5.2M</p>
              <p className="text-xl font-extrabold text-red-500">SMB –16%</p>
              <p className="text-[10px] text-[#374151] mb-1">$2.7M → $2.2M</p>
              <p className="text-[10px] text-[#9ca3af] italic mt-auto">Mix: ENT 69% · SMB 31% of LTM gross</p>
            </div>

            {/* Delivery Model Mix */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#6b7280] mb-1.5">Delivery Model Mix — Q1 '26</p>
              <div className="flex gap-2 mb-1.5">
                <div className="flex-1 bg-white border border-[#e2e8f0] rounded-lg p-2 text-center">
                  <p className="text-xl font-extrabold text-[#0f172a]">86%</p>
                  <p className="text-[10px] text-[#6b7280]">Talent</p>
                  <p className="text-[10px] font-medium text-[#374151]">$6.42M</p>
                </div>
                <div className="flex-1 bg-white border border-[#7c3aed]/30 rounded-lg p-2 text-center">
                  <p className="text-xl font-extrabold text-[#7c3aed]">14%</p>
                  <p className="text-[10px] text-[#6b7280]">Prof. Services</p>
                  <p className="text-[10px] font-medium text-[#374151]">$1.04M</p>
                </div>
              </div>
              <p className="text-[10px] text-[#9ca3af] leading-tight italic">Margins ~31–36% for both.</p>
              <p className="text-[10px] font-medium text-[#7c3aed] mt-0.5">PS share: 4% → 14% in 4 quarters</p>
            </div>

          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">

            {/* Practice Mix */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex flex-col">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-1.5">Gross Revenue % by Practice — LTM & Trend</p>
              <div className="space-y-1 flex-1">
                {([
                  { name: "People",     pct: 38, trend: "↓ 38→37%", trendUp: false, color: "#7c3aed" },
                  { name: "Finance",    pct: 30, trend: "↑ 28→31%", trendUp: true,  color: "#2563eb" },
                  { name: "Strategy",   pct: 29, trend: "↓ 30→28%", trendUp: false, color: "#16a34a" },
                  { name: "Operations", pct: 4,  trend: "↑ 3→4%",   trendUp: true,  color: "#f97316" },
                ]).map((row) => (
                  <div key={row.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                    <span className="text-xs text-[#374151] w-20 shrink-0">{row.name}</span>
                    <div className="flex-1 bg-[#e2e8f0] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color, opacity: 0.5 }} />
                    </div>
                    <span className="text-xs font-bold text-[#0f172a] w-8 text-right shrink-0">{row.pct}%</span>
                    <span className={`text-[10px] w-16 text-right shrink-0 ${row.trendUp ? "text-emerald-600" : "text-[#9ca3af]"}`}>{row.trend}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#9ca3af] leading-tight italic mt-1.5">LTM Jun '25–May '26. Trend = Q2 '25 share → Q1 '26 share. Finance and Operations expanding; People and Strategy stable or slightly contracting as a share.</p>
            </div>

            {/* Industry Vertical */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex flex-col">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-1.5">Gross Revenue by Industry Vertical — LTM</p>
              <div className="space-y-1 flex-1">
                {([
                  { name: "IPS",   pct: 30, val: "$8.4M", color: "#2563eb" },
                  { name: "CPS",   pct: 21, val: "$5.7M", color: "#f97316" },
                  { name: "CMET",  pct: 17, val: "$4.7M", color: "#16a34a" },
                  { name: "HLS",   pct: 13, val: "$3.6M", color: "#7c3aed" },
                  { name: "BFSI",  pct: 12, val: "$3.3M", color: "#dc2626" },
                  { name: "INT'L", pct: 1,  val: "$0.3M", color: "#9f1239" },
                ]).map((row) => (
                  <div key={row.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                    <span className="text-xs text-[#374151] w-10 shrink-0">{row.name}</span>
                    <div className="flex-1 bg-[#e2e8f0] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color, opacity: 0.45 }} />
                    </div>
                    <span className="text-xs font-bold text-[#0f172a] w-8 text-right shrink-0">{row.pct}%</span>
                    <span className="text-[10px] text-[#6b7280] w-12 text-right shrink-0">{row.val}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#9ca3af] leading-tight italic mt-1.5">IPS: Schneider Electric & Carrier. CPS: PepsiCo & Deckers. HLS: Zoetis, Pfizer, Syngenta. INT'L = EMEA-region accounts only.</p>
            </div>

            {/* Active Pipeline */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#2563eb]">Active Pipeline — Q2 '26</p>
                <Link to="/mc-pipeline" className="text-[10px] text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors">Full detail →</Link>
              </div>
              <div className="mb-2">
                <p className="text-2xl font-extrabold text-[#0f172a]">567</p>
                <p className="text-xs text-[#6b7280]">opportunities (536 ENT · 31 SMB)</p>
              </div>
              <div className="mb-2">
                <div className="grid grid-cols-4 gap-1 mb-0.5">
                  <span />
                  <span className="text-[10px] text-[#9ca3af] text-right">Q4 '25</span>
                  <span className="text-[10px] text-[#9ca3af] text-right">Q1 '26</span>
                  <span className="text-[10px] font-semibold text-[#2563eb] text-right">Q2 '26</span>
                </div>
                <div className="grid grid-cols-4 gap-1 py-1 border-t border-[#e2e8f0]">
                  <span className="text-[10px] text-[#6b7280]">Unwtd</span>
                  <span className="text-[10px] text-[#9ca3af] text-right">$18.1M</span>
                  <span className="text-[10px] text-[#9ca3af] text-right">$21.8M</span>
                  <span className="text-[10px] font-bold text-[#0f172a] text-right">$20.7M</span>
                </div>
                <div className="grid grid-cols-4 gap-1 py-1 border-t border-[#e2e8f0]">
                  <span className="text-[10px] text-[#6b7280]">Wtd</span>
                  <span className="text-[10px] text-[#9ca3af] text-right">$11.3M</span>
                  <span className="text-[10px] text-emerald-600 font-semibold text-right">$13.9M</span>
                  <span className="text-[10px] font-bold text-[#2563eb] text-right">$13.2M</span>
                </div>
              </div>
              <div className="bg-[#7c3aed]/8 rounded-lg px-2.5 py-1.5 mt-auto">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#7c3aed]">PS pipeline: $2.7M unweighted</p>
                  <button onClick={() => setPipelineAnalysis(true)} className="text-[10px] text-[#7c3aed] hover:text-[#6d28d9] font-medium transition-colors">Talent vs PS →</button>
                </div>
                <p className="text-[10px] text-[#6b7280]">+36% vs Q4 '25 · 16% of weighted ENT</p>
              </div>
            </div>

          </div>

          {/* Narrative */}
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2563eb] mb-3">Narrative</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            {([
              {
                num: "01",
                title: "Record Growth — The Business Is Compounding",
                body: "Q1 2026 was the best quarter on record: $7.5M gross, +9% YoY, three consecutive quarters of growth. ENT conversion has doubled. PS has grown from 4% to 14% of gross in a year. This isn't a turnaround story — it's a scaling story.",
                titleColor: "text-emerald-700",
              },
              {
                num: "02",
                title: "Talent Is the Flywheel — Protect and Extend It",
                body: "86% of revenue is Talent. Margins are strong — and we should try to increase them. Talent isn't the old model waiting to be replaced — it's the entry point for everything else. The shift is about equipping sellers to see what those relationships already make possible.",
                titleColor: "text-emerald-700",
              },
              {
                num: "03",
                title: "Enterprise Is the Engine — and the Ceiling Is Structural",
                body: "ENT grew 25% YoY and now represents 70% of gross. $13.2M weighted pipeline entering Q2. The constraint to scale isn't demand. It's seller enablement, pursuit leadership, and offer clarity.",
                titleColor: "text-[#374151]",
              },
              {
                num: "04",
                title: "SMB Is a Portfolio Decision, Not a Failure",
                body: "Five consecutive quarters of YoY decline, no account above $200K net in 12 months, three open pipeline opportunities. The SMB Talent motion works — the question is whether MC belongs in it systematically.",
                titleColor: "text-amber-600",
              },
              {
                num: "05",
                title: "Professional Services Is the Right Bet — At the Right Scale",
                body: "PS grew from 4% to 14% of gross in one year. The PS weighted pipeline has grown 68% over three quarters. What's missing is consistent signal recognition upstream and domain expertise embedded in pursuit leadership.",
                titleColor: "text-[#7c3aed]",
              },
              {
                num: "06",
                title: "H2 Is a Top-Line Story — Margin Follows Volume",
                body: "Blended margins have held at 34–37% for five consecutive quarters. H2 2026 is about revenue volume: converting the 83 Solutioning opportunities, deepening the top 30 Talent accounts, winning more ENT. Margin is a deal-by-deal pricing call.",
                titleColor: "text-[#2563eb]",
              },
            ] as { num: string; title: string; body: string; titleColor: string }[]).map((insight) => (
              <div key={insight.num} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 flex flex-col">
                <span className="text-2xl font-extrabold text-[#94a3b8] leading-none mb-2 select-none">{insight.num}</span>
                <h3 className={`text-sm font-bold mb-1.5 ${insight.titleColor}`}>{insight.title}</h3>
                <p className="text-xs text-[#374151] leading-relaxed">{insight.body}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end mb-6">
            <Link to="/mc-narrative-2" className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors">
              Deeper analysis →
            </Link>
          </div>

        </Container>
      </section>

      {/* ── Section 3: Context ── */}
      <section className="bg-[#f8fafc] py-20">
        <Container>
          <SectionLabel>Context</SectionLabel>
          <SectionHeading>MC has a scaling opportunity — and the model needs to match it</SectionHeading>
          <div className="flex items-start gap-6 mb-12">
            <Body className="max-w-2xl">
              The business is compounding. The structural constraints aren't holding us back from survival — they're capping our ceiling.
            </Body>
            <button
              onClick={() => setContextModal(true)}
              className="shrink-0 text-xs font-semibold text-[#2563eb] border border-[#2563eb]/30 rounded-lg px-4 py-2 hover:bg-[#eff6ff] transition-colors whitespace-nowrap"
            >
              Read full context →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Brand ceiling",
                body: "Clients who trust us for Talent don't naturally reach for us for consulting. That's a positioning challenge, not a client failure.",
              },
              {
                title: "Recognition ceiling",
                body: "Recognizing a PS signal requires a different lens. Six hubs with clear entry points changes the equation.",
              },
              {
                title: "Pursuit leadership ceiling",
                body: "The current motion relies on CPs/ESEs to carry the pursuit — MC supports but doesn't lead. Domain expertise should be driving.",
              },
              {
                title: "Talent expansion ceiling",
                body: "Deep Talent relationships are underleveraged. No formal motion to convert Talent depth into MC scope.",
              },
              {
                title: "Incentive ceiling",
                body: "Current comp rewards deal speed. PS and expansion deals are slower with limited personal upside for CPs/ESEs today.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <h3 className="text-base font-bold text-[#2563eb] mb-2">{item.title}</h3>
                <p className="text-sm text-[#374151] leading-relaxed">{item.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Section 4: The Shift Required ── */}
      <section className="bg-white py-20">
        <Container>
          <SectionLabel>The Shift Required</SectionLabel>
          <SectionHeading>Extend what's working. Build what's missing.</SectionHeading>
          <div className="flex items-start gap-6 mb-8">
            <Body className="max-w-2xl">
              This isn't a repair job — it's an upgrade. The SMB inbound motion works for Talent — protect it. Three things need to change in the ENT model.
            </Body>
            <button
              onClick={() => setShiftModal(true)}
              className="shrink-0 text-xs font-semibold text-[#2563eb] border border-[#2563eb]/30 rounded-lg px-4 py-2 hover:bg-[#eff6ff] transition-colors whitespace-nowrap"
            >
              See full model →
            </button>
          </div>

          {/* Core insight callout */}
          <div className="bg-[#0d1b40] rounded-xl px-6 py-4 mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">Core insight</p>
            <p className="text-base text-white leading-relaxed">
              CPs and ESEs don't lose — they gain leverage. They keep the relationship and hand off the hard pursuit work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TODAY */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-4">Today</p>
              <ul className="space-y-3">
                {[
                  "SMB: PS signal recognition not always part of the discovery screen",
                  "ENT PS signal isn't always surfaced upstream by ESEs/CPs",
                  "CPs/ESEs carry more of the pursuit than we should ask; MC supports rather than leads",
                  "No formal motion to convert Talent depth into MC scope",
                  "40+ services create recognition and enablement barriers",
                  "Clients know Toptal for Talent — don't reach for consulting",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#374151]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#cbd5e1] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            {/* FUTURE STATE */}
            <Card className="border-[#2563eb]/30 bg-[#fafcff]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mb-4">Future State</p>
              <ul className="space-y-3">
                {[
                  "SMB Talent motion stays intact — six-hub PS signal screen added at discovery",
                  "ENT sellers equipped with hub entry points and vertical trigger guides",
                  "Domain experts lead the pursuit — squad lead drives conversations and orals",
                  "Talent expansion becomes a motion — high-tenure accounts monitored for signals",
                  "Six hubs, one clear conversation per hub",
                  "Market presence builds brand — squad lead content, hub POVs, targeted outbound",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#1e3a8a]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </section>

      {/* ── Section 5: Hub Offerings ── */}
      <section className="bg-[#f8fafc] py-20">
        <Container>
          <SectionLabel>Hub Offerings</SectionLabel>
          <SectionHeading>Six hubs — sharpened to where the market is right now</SectionHeading>
          <Body className="max-w-2xl mb-12">
            Each hub is an entry point into a conversation already happening in the C-suite. CPs and ESEs carry one clear door per hub. Squad leads own the depth conversation behind it.
          </Body>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[
              {
                name: "Growth Strategy",
                tagline: "Growth in a constrained market",
                body: "Which bets to stop. Which to double down on. Profitable growth without adding headcount.",
                tags: ["Profitable growth", "Portfolio rationalization", "Pricing power"],
                color: "#2B44D4",
              },
              {
                name: "Business Transformation",
                tagline: "Operating model for the AI era",
                body: "Who does what when AI changes the work? Redesign the model — not just adopt the tools.",
                tags: ["AI operating model", "Workforce redesign", "Process intelligence"],
                color: "#2B44D4",
              },
              {
                name: "Finance Transformation",
                tagline: "The CFO's AI agenda",
                body: "Build the AI business case, measure ROI, and translate it to the board. We've done it.",
                tags: ["AI ROI", "FP&A modernization", "Finance automation"],
                color: "#0CA678",
              },
              {
                name: "Performance Improvement",
                tagline: "Do more with what you have",
                body: "Post-cut productivity gap. Processes designed for a bigger team — never redesigned.",
                tags: ["Operational productivity", "Process mining", "AI-assisted ops"],
                color: "#E86B4A",
              },
              {
                name: "Supply Chain",
                tagline: "Resilience and AI visibility",
                body: "Tariffs and disruption made optimization insufficient. Build redundancy and sensing.",
                tags: ["Supply resilience", "Nearshoring", "AI demand sensing"],
                color: "#E86B4A",
              },
              {
                name: "Workforce Transformation",
                tagline: "Workforce for what's next",
                body: "Reskilling, role redesign, org structure for AI agents. AI readiness for people.",
                tags: ["AI readiness", "Org design", "Role redesign"],
                color: "#5C6BC0",
              },
            ].map((hub) => (
              <Card key={hub.name} className="flex flex-col">
                <p className="text-xs font-semibold text-[#2563eb] mb-1">{hub.tagline}</p>
                <h3
                  className="text-base font-bold mb-2 cursor-pointer hover:underline underline-offset-2 flex items-center gap-1.5"
                  style={{ color: hub.color }}
                  onClick={() => setOpenHub(hub.name)}
                >
                  {hub.name}
                  <Info size={13} className="opacity-40 shrink-0" />
                </h3>
                <p className="text-sm text-[#374151] leading-relaxed flex-1 mb-4">{hub.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {hub.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              </Card>
            ))}
          </div>

          {/* Talent as hub entry callout */}
          <div className="bg-[#0d1b40] rounded-xl px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Talent as hub entry</p>
            <p className="text-sm text-blue-100 leading-relaxed max-w-3xl">
              Every active Talent engagement is a potential hub entry point. The CP already has the trust — the trigger question is what turns a staffing relationship into an MC conversation. Squad leads make the transition seamless.
            </p>
          </div>

          {/* Hub detail modal */}
          <Dialog open={openHub !== null} onOpenChange={(open) => { if (!open) setOpenHub(null); }}>
            <DialogContent className="max-w-md">
              {openHub && (() => {
                const detail = HUB_DETAILS[openHub];
                const c = HUB_COLORS[openHub] ?? { bg: "#F1F5F9", text: "#374151" };
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle>
                        <span className="inline-block text-sm font-semibold rounded px-2.5 py-1" style={{ backgroundColor: c.bg, color: c.text }}>
                          {openHub}
                        </span>
                      </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#374151] leading-relaxed mt-1">{detail.definition}</p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-1">Key buyers</p>
                        <span className="inline-block bg-[#dbeafe] text-[#1e40af] text-xs font-semibold rounded-full px-3 py-1">{detail.buyer}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-1">Buying center</p>
                        <p className="text-sm text-[#374151]">{detail.buyingCenter}</p>
                      </div>
                      <div className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#2563eb] mb-1">The pitch</p>
                        <p className="text-sm text-[#374151] italic leading-relaxed">{detail.rationale}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* Pipeline Analysis Modal */}
          <Dialog open={pipelineAnalysis} onOpenChange={setPipelineAnalysis}>
            <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold text-[#0f172a]">ENT MC — Talent vs Professional Services</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {([
                  { label: "Talent Win Rate", value: "24%", sub: "22–23% each quarter", color: "text-[#2563eb]" },
                  { label: "PS Win Rate", value: "44%", sub: "14% → 27% → 44% ↑", color: "text-emerald-600" },
                  { label: "Talent Avg Won Deal", value: "$89K", sub: "LTM", color: "text-[#0f172a]" },
                  { label: "PS Avg Won Deal", value: "$242K", sub: "2.7× Talent (LTM)", color: "text-[#7c3aed]" },
                ] as {label:string;value:string;sub:string;color:string}[]).map((s) => (
                  <div key={s.label} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wide mb-1">{s.label}</p>
                    <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-[#6b7280] mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 mb-2">PS Win Rate — Quarter over Quarter</p>
                <div className="flex items-end gap-3">
                  {([
                    { q: "Q4 '25", pct: 14 },
                    { q: "Q1 '26", pct: 27 },
                    { q: "Q2 '26", pct: 44 },
                  ]).map((r) => (
                    <div key={r.q} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs font-bold text-emerald-700">{r.pct}%</span>
                      <div className="w-full bg-emerald-100 rounded-sm" style={{ height: 40 }}>
                        <div className="bg-emerald-500 rounded-sm w-full transition-all" style={{ height: `${(r.pct / 44) * 40}px`, marginTop: `${40 - (r.pct / 44) * 40}px` }} />
                      </div>
                      <span className="text-[10px] text-emerald-600">{r.q}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-emerald-700 italic flex-[3] leading-tight">Accelerating — but sample sizes (7, 11, 9 deals) are too small to call a trend with confidence.</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#0f172a] mb-2">Talent</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#f1f5f9]">
                        <th className="text-left font-semibold text-[#374151] px-3 py-2 rounded-tl-lg">Metric</th>
                        <th className="text-right font-semibold text-[#374151] px-3 py-2">LTM</th>
                        <th className="text-right font-semibold text-[#374151] px-3 py-2">Q4 2025</th>
                        <th className="text-right font-semibold text-[#374151] px-3 py-2">Q1 2026</th>
                        <th className="text-right font-semibold text-[#2563eb] px-3 py-2 rounded-tr-lg">Q2 2026</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        ["Total opptys",     "543",       "130",      "165",      "87"],
                        ["Won",              "128 (24%)", "28 (22%)", "38 (23%)", "19 (22%)"],
                        ["Avg deal — all",   "$82K",      "$89K",     "$82K",     "$74K"],
                        ["Median deal — all","$50K",      "$50K",     "$56K",     "$50K"],
                        ["Avg deal — won",   "$89K",      "$151K",    "$78K",     "$32K"],
                        ["Median deal — won","$50K",      "$40K",     "$50K",     "$5K"],
                      ] as string[][]).map((row, i) => (
                        <tr key={row[0]} className={i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
                          <td className="px-3 py-1.5 text-[#374151]">{row[0]}</td>
                          <td className="px-3 py-1.5 text-right font-medium text-[#374151]">{row[1]}</td>
                          <td className="px-3 py-1.5 text-right text-[#374151]">{row[2]}</td>
                          <td className="px-3 py-1.5 text-right text-[#374151]">{row[3]}</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-[#2563eb]">{row[4]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#7c3aed] mb-2">Professional Services</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#f5f3ff]">
                        <th className="text-left font-semibold text-[#374151] px-3 py-2 rounded-tl-lg">Metric</th>
                        <th className="text-right font-semibold text-[#374151] px-3 py-2">LTM</th>
                        <th className="text-right font-semibold text-[#374151] px-3 py-2">Q4 2025</th>
                        <th className="text-right font-semibold text-[#374151] px-3 py-2">Q1 2026</th>
                        <th className="text-right font-semibold text-[#7c3aed] px-3 py-2 rounded-tr-lg">Q2 2026</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        ["Total opptys",     "33",        "7",         "11",        "9"],
                        ["Won",              "12 (36%)",  "1 (14%)",   "3 (27%)",   "4 (44%)"],
                        ["Avg deal — all",   "$187K",     "$151K",     "$154K",     "$238K"],
                        ["Median deal — all","$100K",     "$100K",     "$100K",     "$114K"],
                        ["Avg deal — won",   "$242K",     "$250K",     "$327K",     "$202K"],
                        ["Median deal — won","$114K",     "$250K",     "$100K",     "$30K*"],
                      ] as string[][]).map((row, i) => (
                        <tr key={row[0]} className={i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
                          <td className="px-3 py-1.5 text-[#374151]">{row[0]}</td>
                          <td className="px-3 py-1.5 text-right font-medium text-[#374151]">{row[1]}</td>
                          <td className="px-3 py-1.5 text-right text-[#374151]">{row[2]}</td>
                          <td className="px-3 py-1.5 text-right text-[#374151]">{row[3]}</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-[#7c3aed]">{row[4]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-[#9ca3af] italic mt-1.5 leading-tight">*Q2 PS median won is pulled down by 3 Hershey deals at $29–30K alongside the $637K Owens Corning win — only 4 data points, so the median is fragile.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 mb-1.5">Talent Q2 Median Won: $5K</p>
                  <p className="text-xs text-[#374151] leading-relaxed">Unexpectedly low — likely a mix of very small hourly placements and estimated values not updated before close on recently-created deals. Not a signal of structural deal size compression.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-700 mb-1.5">PS Win Rate: 14% → 27% → 44%</p>
                  <p className="text-xs text-[#374151] leading-relaxed">Accelerating quarter over quarter. The direction is right — but with sample sizes of 7, 11, and 9 deals, this is a promising signal, not yet a confirmed trend. Worth watching closely in Q3.</p>
                </div>
              </div>

            </DialogContent>
          </Dialog>

        </Container>
      </section>

      {/* ── Section 6: Land & Expand ── */}
      <section className="bg-white py-20">
        <Container>
          <SectionLabel>Land & Expand</SectionLabel>
          <SectionHeading>Two expansion surfaces. One growth motion.</SectionHeading>
          <Body className="max-w-2xl mb-12">
            The fastest path to MC growth runs through relationships we already own — tech services accounts and active MC Talent engagements.
          </Body>

          {/* Surface 1: Tech Services */}
          <p className="text-sm font-bold text-[#0f172a] mb-1">Surface 1: Tech Services Accounts</p>
          <p className="text-xs text-[#6b7280] mb-5">Every tech engagement creates downstream business problems. Train CPs and ESEs to spot the trigger — then hand off to the right squad lead.</p>

          <div className="mb-4">
            <TechTable engagements={PREVIEW_TECH_ENGAGEMENTS} />
          </div>
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setTechExpandModal(true)}
              className="text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
            >
              View all 6 triggers →
            </button>
          </div>

          <InnerCard className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mb-2">Key insight</p>
            <p className="text-sm text-[#374151] leading-relaxed">
              Change Management is a wedge, not just a follow-on — smaller scope, faster close, immediate trust-builder. Every tech implementation creates the need automatically.
            </p>
          </InnerCard>

          {/* Surface 2: MC Talent Accounts */}
          <p className="text-sm font-bold text-[#0f172a] mb-1">Surface 2: MC Talent Accounts</p>
          <p className="text-xs text-[#6b7280] mb-5">Active Talent engagements are the highest-trust, lowest-friction MC entry point. The relationship is already there.</p>

          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6b7280]">Talent engagement signal</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6b7280]">Trigger question squad lead/CP asks</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#2563eb]">Expansion path</th>
                </tr>
              </thead>
              <tbody>
                {TALENT_EXPANSION_ROWS.map((row, i) => (
                  <tr key={row.signal} className={`hover:bg-[#fafcff] transition-colors border-t ${i === 0 ? "border-[#e2e8f0]" : "border-[#f1f5f9]"}`}>
                    <td className="px-5 py-4 text-[#374151] font-bold align-top w-1/3">{row.signal}</td>
                    <td className="px-5 py-4 text-[#374151] italic align-top">{row.trigger}</td>
                    <td className="px-5 py-4 align-top w-44">
                      <span className="inline-block text-xs font-semibold bg-[#eff6ff] text-[#2563eb] rounded px-2.5 py-1">{row.path}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InnerCard>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mb-2">Key insight</p>
            <p className="text-sm text-[#374151] leading-relaxed">
              The Talent relationship is the trust asset. The squad lead's job on a Talent account isn't to sell — it's to stay close enough to see the next problem.
            </p>
          </InnerCard>
        </Container>
      </section>

      {/* ── Section 7: Future Model ── */}
      <section className="bg-[#f8fafc] py-20">
        <Container>
          <SectionLabel>Future Model</SectionLabel>
          <SectionHeading>The future value chain: find to deliver</SectionHeading>
          <Body className="max-w-2xl mb-12">
            Two on-ramps. One delivery engine. Squad leads and pursuit ops drive everything from qualification through delivery and expansion.
          </Body>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
            {[
              {
                num: "1",
                owner: "SDR / ESE / CP — by vertical",
                phase: "Find & qualify",
                items: [
                  "SMB: SDR discovery + six-hub PS signal screen",
                  "ENT: ESE/CP + squad lead paired with top clients",
                  "Vertical SDRs support discovery",
                  "Hub trigger guides for all sellers",
                ],
              },
              {
                num: "2",
                owner: "Squad Lead + Pursuit Ops",
                phase: "Pursue & solution",
                items: [
                  "Squad lead leads discovery and scoping calls",
                  "TCP engaged at scoping",
                  "AI diagnostic tools deployed",
                  "Right-sized scope, fast proposal",
                ],
              },
              {
                num: "3",
                owner: "Squad Lead + Pursuit Ops",
                phase: "Propose & win",
                items: [
                  "Squad lead presents in orals",
                  "Tight, priced-to-win proposals",
                  "Talent relationships as proof points",
                  "Expert credibility closes the trust gap",
                ],
              },
              {
                num: "4",
                owner: "Squad Lead + CP + Team",
                phase: "Deliver & expand",
                items: [
                  "Monthly client touch (squad lead)",
                  "CP retains account relationship",
                  "Case study captured at close",
                  "Expansion path mapped at kickoff",
                ],
              },
            ].map((phase) => (
              <div key={phase.num} className="rounded-xl border border-[#e2e8f0] bg-white p-5">
                <span className="text-3xl font-extrabold text-[#cbd5e1] mb-1 block">{phase.num}</span>
                <p className="text-sm font-bold text-[#2563eb] mb-0.5">{phase.phase}</p>
                <p className="text-xs text-[#6b7280] mb-4">{phase.owner}</p>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[#374151]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#94a3b8] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-[#0d1b40] rounded-xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Key insight</p>
            <p className="text-base text-white leading-relaxed">
              The ENT model already works. The upgrade is seller enablement upstream, domain expert pursuit leadership, and a formal Talent expansion playbook. Two on-ramps, one delivery engine.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Section 8: Plan on a Page ── */}
      <section className="bg-[#0d1b40] py-24">
        <Container>
          <SectionLabel light>Plan on a Page</SectionLabel>
          <SectionHeading light>Three phases. Measurable momentum.</SectionHeading>
          <Body light className="max-w-2xl mb-14">
            Sequenced to build — not everything at once.<br />Phase 1 unlocks Phase 2. Phase 2 earns Phase 3.
          </Body>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                phase: "Phase 1",
                timeframe: "Now → 90 days",
                title: "Strengthen the foundation",
                items: [
                  "Seller enablement: 6 hubs, vertical trigger guides, squad lead pairings",
                  "Pursuit leadership: squad leads lead conversations and orals, TCP at scoping",
                  "SMB discovery screen: six-hub PS signal check added to discovery",
                  "Talent expansion: top 20 accounts identified, expansion trigger guide live",
                  "SMB: portfolio decision made",
                ],
                outcome: "Sellers equipped. Squad leads leading pursuits. Talent expansion motion live. SMB role defined.",
              },
              {
                phase: "Phase 2",
                timeframe: "90 days → 6 months",
                title: "Activate the market",
                items: [
                  "Squad lead LinkedIn POV content by hub",
                  "One anchor POV document per hub in market",
                  "PS campaign visibility under Services",
                  "First 3 Talent-to-MC case studies live",
                  "Top 30 tech accounts mapped for MC entry points",
                ],
                outcome: "First branded case studies live. Talent expansion pipeline tracked and moving.",
              },
              {
                phase: "Phase 3",
                timeframe: "6 months+",
                title: "Scale the engine",
                items: [
                  "Squad leads hold vertical relationships independently",
                  "Talent expansion systematized across top accounts",
                  "AI diagnostic tools live as lead-gen marketing assets",
                  "International coverage through squad-to-region pairings",
                ],
                outcome: "Self-sustaining practice with two growth engines — expert-led ENT pursuit and systematic Talent expansion.",
              },
            ].map((col) => (
              <div key={col.phase} className="bg-white/8 border border-white/15 rounded-xl p-6 flex flex-col">
                <p className="text-base font-bold uppercase tracking-widest text-blue-400 mb-1 whitespace-nowrap">{col.phase}</p>
                <p className="text-sm text-blue-300/70 mb-3">{col.timeframe}</p>
                <h3 className="text-base font-bold text-white mb-4">{col.title}</h3>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-blue-100">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-white/15 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">Outcome</p>
                  <p className="text-sm text-white/90 leading-relaxed">{col.outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Seller Reintro link ── */}
      <div className="bg-[#0d1b40] border-t border-white/5 py-5">
        <Container className="flex items-center justify-end">
          <Link
            to="/mc-seller-reignite"
            className="flex items-center gap-2 text-sm text-blue-300/70 hover:text-blue-200 transition-colors"
          >
            Ignite MC Scale
            <ArrowRight size={14} />
          </Link>
        </Container>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-[#0a1628] border-t border-white/10 py-6">
        <Container className="flex items-center justify-between">
          <ToptalLogo className="h-5 opacity-60" />
          <p className="text-xs text-blue-300/50 font-medium">
            Toptal Management Consulting · Confidential · Q2 2026
          </p>
        </Container>
      </footer>

      {/* ── Context Modal ── */}
      <Dialog open={contextModal} onOpenChange={setContextModal}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#0f172a]">Full Context — The Scaling Opportunity</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#374151] leading-relaxed mt-1">
            The business is compounding — three consecutive quarters of growth, record Q1 2026, ENT conversion doubled. The structural constraints we face aren't existential. They're ceilings on how high we can go.
          </p>
          <div className="space-y-4 mt-4">
            {[
              {
                label: "Brand ceiling",
                body: "Clients know us for Talent and don't naturally reach for consulting. We need to be visible in the right C-suite conversations before we're in the room. That's a content and presence play — squad lead POVs, hub visibility, targeted outbound. Not a product problem.",
              },
              {
                label: "Recognition ceiling",
                body: "PS signals exist in nearly every engagement but go unrecognized without a clear framework. A finance transformation in progress, a restructuring underway, a new CFO agenda — these are all conversations MC can lead. Six hubs with clear entry points give the entire sales and delivery organization a common language for spotting them.",
              },
              {
                label: "Pursuit leadership ceiling",
                body: "CPs and ESEs are excellent at their jobs. The MC pursuit motion requires something different at the front of the conversation — domain expertise, not account management. The model works when squad leads drive discovery and orals. That's the upgrade, not a replacement. CPs keep the relationship; squad leads run the MC portion.",
              },
              {
                label: "Talent expansion ceiling",
                body: "We have deep relationships across major accounts that have never been formally mapped for MC potential. Long-term engagements, multiple placements, senior ICs — each of these signals an active business problem. The trust is already there. We haven't built the motion to activate it.",
              },
              {
                label: "Incentive ceiling",
                body: "The current comp structure rewards speed, and PS and expansion deals are slower. There's a structural misalignment to address — but it's a comp design question, not a people question. CPs and ESEs are responding rationally to the incentives they have.",
              },
            ].map((item) => (
              <div key={item.label} className="border-l-2 border-[#dbeafe] pl-4">
                <p className="text-xs font-bold text-[#2563eb] uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-sm text-[#374151] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="bg-[#f8fafc] rounded-xl p-4 mt-4 border border-[#e2e8f0]">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-2">The headline</p>
            <p className="text-sm font-medium text-[#0f172a] leading-relaxed">
              Five ceilings. Each one addressable with structural investment. The business is already compounding — removing these ceilings is how we accelerate.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Shift Modal ── */}
      <Dialog open={shiftModal} onOpenChange={setShiftModal}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#0f172a]">Full Model — The Shift Required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#374151] leading-relaxed mt-1">
            The ENT motion already works at its core. Three upgrades change the ceiling. SMB stays intact with one addition.
          </p>
          <div className="space-y-5 mt-4">
            <div className="bg-[#eff6ff] rounded-xl p-4 border border-[#dbeafe]">
              <p className="text-xs font-bold text-[#2563eb] uppercase tracking-wider mb-2">SMB: protect and add one screen</p>
              <p className="text-sm text-[#374151] leading-relaxed">The SMB inbound Talent motion works — protect it. One addition: a six-hub PS signal screen at discovery. One structured question that covers all six entry points. Low friction, high upside. No structural change to the SMB Talent motion.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-3">ENT: three upgrades</p>
              <div className="space-y-4">
                {[
                  {
                    num: "1",
                    title: "Seller enablement",
                    body: "CPs and ESEs can't carry 40+ services. Six hubs with vertical trigger guides gives them one door to open per account type. The first conversation changes: instead of 'what does Toptal MC do,' it becomes 'we see companies in your space navigating [specific pressure] — are you feeling that too?'",
                  },
                  {
                    num: "2",
                    title: "Pursuit leadership",
                    body: "Right now, MC mostly supports the CP-led pursuit. The upgrade: squad leads lead the discovery call, drive the scoping conversation, and present in orals. CPs and ESEs handle the intro and keep the relationship. The domain expert runs the MC part of the pursuit. This closes the trust gap that slows ENT close rates.",
                  },
                  {
                    num: "3",
                    title: "Talent expansion",
                    body: "Identify the top 20 Talent accounts, pair a squad lead with the CP on each, and create a monthly check-in trigger to ask the simple question: 'is there a business problem behind the hiring trend?' The answer is often yes. The infrastructure to activate it is the missing piece.",
                  },
                ].map((item) => (
                  <div key={item.num} className="flex gap-4">
                    <span className="text-2xl font-extrabold text-[#cbd5e1] leading-none shrink-0 w-7 pt-0.5">{item.num}</span>
                    <div>
                      <p className="text-sm font-bold text-[#0f172a] mb-1">{item.title}</p>
                      <p className="text-sm text-[#374151] leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-[#0d1b40] rounded-xl p-4 mt-4">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">The bottom line</p>
            <p className="text-sm text-white leading-relaxed">CPs and ESEs don't lose — they gain leverage. They keep the relationship and hand off the hard pursuit work. Nine pursuits supported in parallel instead of owning every detail of one.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Tech Expand Modal ── */}
      <Dialog open={techExpandModal} onOpenChange={setTechExpandModal}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#0f172a]">All Tech Services Trigger Points</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[#6b7280] mb-4">All 10 trigger-question / hub-entry-point pairs across 6 tech engagement types.</p>
          <TechTable engagements={ALL_TECH_ENGAGEMENTS} />
          <InnerCard className="mt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mb-2">Key insight</p>
            <p className="text-sm text-[#374151] leading-relaxed">
              Change Management is a wedge, not just a follow-on — smaller scope, faster close, immediate trust-builder. Every tech implementation creates the need automatically.
            </p>
          </InnerCard>
        </DialogContent>
      </Dialog>

    </div>
  );
}
