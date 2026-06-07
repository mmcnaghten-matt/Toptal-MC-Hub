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

// ── Hub color map (matches ConstellationDiagram light-mode palette) ────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MCPlanArchive() {
  const navigate = useNavigate();
  const [openHub, setOpenHub] = useState<string | null>(null);
  const [pipelineAnalysis, setPipelineAnalysis] = useState(false);

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
          <p className="text-lg text-blue-200 mb-10">Context · Vision · Marketing · Plan</p>
          <div className="flex flex-wrap gap-3">
            {["Context", "Hub Strategy", "Marketing", "Execution Plan"].map((label) => (
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

      {/* ── Section 2: MC by the Numbers ── */}
      <section className="bg-white py-20">
        <Container>
          <h2 className="text-2xl font-semibold text-[#9ca3af] mb-6">MC at a Glance</h2>
          <SectionLabel>By the Numbers</SectionLabel>

          {/* KPI stat bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">

            {/* Gross Revenue — LTM + Projected */}
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

            {/* Net Revenue — LTM + Projected */}
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

            {/* ENT vs SMB — YoY Growth */}
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
                body: "Q1 2026 was the best quarter on record: $7.5M gross, +9% YoY, three consecutive quarters of growth. This is a compounding trend.",
                titleColor: "text-emerald-700",
              },
              {
                num: "02",
                title: "Enterprise Is the Engine — and the Flywheel Is Working",
                body: "ENT grew 25% YoY, now represents 70% of gross revenue, and conversion rate has doubled from 12% to 27% over five quarters. New opportunity creation hit a record 122 in Q1 2026 — its structural improvement.",
                titleColor: "text-emerald-700",
              },
              {
                num: "03",
                title: "SMB Is in Structural Decline — This Requires a Decision",
                body: "Five consecutive quarters of YoY decline (−16% to −34%), no account above $200K net in 12 months, and a pipeline with just 3 open opportunities. ENT is masking it — but without understanding the cause and planning a change, SMB risks continual drifting.",
                titleColor: "text-red-600",
              },
              {
                num: "04",
                title: "Professional Services Is the Right Bet — With the Right Pitch",
                body: "PS grew from 4% to 14% of gross in one year. The value is strategic positioning and client stickiness — not yet margin expansion; PS margins run 31–36%, in line with Talent.",
                titleColor: "text-[#2563eb]",
              },
              {
                num: "05",
                title: "The Pipeline Is Deep — and PS Is Gaining Ground",
                body: "$13.2M weighted ENT pipeline entering Q2 2026. PS weighted pipeline has grown 68% over three quarters — as it converts, it cements MC's identity as a full-service practice.",
                titleColor: "text-[#2563eb]",
              },
              {
                num: "06",
                title: "Margins Are Stable — H2 Is a Top-Line Story",
                body: "Blended margins have held at 34–37% for five consecutive quarters through a significant mix shift. H2 2026 is about revenue volume: more ENT wins, converting the 83 Solutioning opportunities, and a deliberate call on SMB. Margin can be addressed as a deal-by-deal pricing call.",
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
            <Link to="/mc-narrative" className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-medium transition-colors">
              Deeper analysis →
            </Link>
          </div>

        </Container>
      </section>

      {/* ── Section 3: Context ── */}
      <section className="bg-[#f8fafc] py-20">
        <Container>
          <SectionLabel>Context</SectionLabel>
          <SectionHeading>MC has a branding and motion problem, not a capability problem</SectionHeading>
          <Body className="max-w-2xl mb-12">
            <strong>Our consultants are excellent. The challenge is structural</strong> — limited market recognition means we're fighting for credibility before the conversation even starts, and we've asked sellers built for speed and relationship to carry a pursuit motion that requires deep domain expertise. <strong>That's not a people problem. It's a model problem.</strong>
          </Body>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Brand mismatch",
                body: "Toptal is perceived as a talent network. Enterprise buyers don't search for consulting this way — paid search misses them entirely.",
              },
              {
                title: "Seller mismatch",
                body: "Sales and CPs are great at closing talent deals. MC is selling is a different motion — longer, more complex, lower close rate.",
              },
              {
                title: "Incentive mismatch",
                body: "Current comp rewards deal speed. Professional services deals are slower with limited personal upside for sellers today.",
              },
              {
                title: "Complexity overload",
                body: "40+ services across 4 practices, plus tech and marketing. Too much to carry — sellers disengage before they start.",
              },
              {
                title: "Credibility gap",
                body: 'Enterprise buyers ask for 3 case studies. "Our consultant was at Accenture" isn\'t enough yet. We\'re building that track record.',
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
          <SectionHeading>Fix the center of gravity: from institution to expert</SectionHeading>
          <Body className="max-w-2xl mb-12">
            Sales finds the door. Squad leads walk through it. Domain expertise — not the Toptal brand — closes the trust gap.
          </Body>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TODAY */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-4">Today</p>
              <ul className="space-y-3">
                {[
                  "Sales/CP owns the client relationship and pursuit",
                  "MC expertise often backstage helping in a pre-sales support role",
                  'Generic "Toptal" brand carries credibility weight',
                  "40+ services create confusion; sellers disengage",
                  "Proposals too large, too slow, too costly to build",
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
                  "Squad leads (domain experts) drive MC engagement on pursuit efforts",
                  "Sales finds the lead; expert drives the pursuit",
                  "Individual expert credibility drives trust and close",
                  "6 hub offerings — one clear conversation per door",
                  "Fast, right-sized proposals built by domain owners",
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
            Each hub reframed around the specific executive pressure buyers are feeling today,
            not generic service categories.
          </Body>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

              {/* Highlight stat cards */}
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

              {/* PS win rate trend bar */}
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

              {/* Talent table */}
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

              {/* PS table */}
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

              {/* Callout narrative boxes */}
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

      {/* ── Section 6: Marketing & Positioning ── */}
      <section className="bg-white py-20">
        <Container>
          <SectionLabel>Marketing & Positioning</SectionLabel>
          <SectionHeading>Build the brand through experts, not the institution</SectionHeading>
          <Body className="max-w-2xl mb-10">
            Only Toptal can credibly say: senior consultants from firms you trust, assembled around your
            problem — not our pyramid.
          </Body>

          {/* Positioning callout */}
          <div className="border-l-4 border-[#2563eb] bg-white rounded-r-xl p-6 mb-12 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mb-3">The positioning only Toptal owns</p>
            <p className="text-base font-medium text-[#0f172a] leading-relaxed italic">
              "Senior level consultants from the firms you trust — assembled around your problem, not our pyramid.
              No billing juniors at senior rates. No utilization pressure. Experts in, outcome out."
            </p>
            <p className="text-xs text-[#6b7280] mt-3">This is the brief for every hub POV asset and every squad lead post.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: "LinkedIn (squad leads)",
                body: "Personal posts from named experts on hub-specific tensions. Toptal amplifies — credibility comes from the individual, not the brand account.",
              },
              {
                title: "Hub POV documents",
                body: "One 4–6 page opinionated POV per hub. Not 'AI is changing finance' — something forwardable. The CFO's AI ROI framework. The operating model playbook.",
              },
              {
                title: "Diagnostic tools as lead gen",
                body: "Our existing assessments are marketing assets. 10-min 'AI readiness' check → personalized output → conversation starter. Brand before a meeting.",
              },
              {
                title: "PS campaign under Services",
                body: "MC must be named and visible in the new professional services outbound push. 6 hubs. Named squad leads. Request international parity in LinkedIn spend.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <h3 className="text-sm font-bold text-[#2563eb] mb-2">{item.title}</h3>
                <p className="text-sm text-[#374151] leading-relaxed">{item.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Section 7: Land & Expand ── */}
      <section className="bg-[#f8fafc] py-20">
        <Container>
          <SectionLabel>Land & Expand</SectionLabel>
          <SectionHeading>The fastest path to MC growth: our tech services accounts and engagements</SectionHeading>
          <Body className="max-w-2xl mb-12">
            Every tech engagement creates downstream business problems. Train CPs to spot the trigger —
            then hand off to the right squad lead(s).
          </Body>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6b7280]">Tech engagement</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6b7280]">Trigger question CP asks</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#2563eb]">MC hub entry point(s)</th>
                </tr>
              </thead>
              <tbody>
                {([
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
                ] as { engagement: string; pairs: { trigger: string; hub: string }[] }[]).map((row) =>
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

          {/* Mechanism */}
          <InnerCard>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mb-2">Key insight</p>
            <p className="text-sm text-[#374151] leading-relaxed">
              Change management is a wedge, not just a follow-on — smaller scope, faster close, immediate
              trust-builder. Every tech implementation creates the need automatically.
            </p>
          </InnerCard>
        </Container>
      </section>

      {/* ── Section 8: Future Model ── */}
      <section className="bg-white py-20">
        <Container>
          <SectionLabel>Future Model</SectionLabel>
          <SectionHeading>The future value chain: find to deliver</SectionHeading>
          <Body className="max-w-2xl mb-12">
            CP/Seller surfaces the signal and lead. MC squad leads and pursuit ops drive everything from qualification through delivery and expansion.
          </Body>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
            {[
              {
                num: "1",
                owner: "Sales / CP",
                phase: "Find & qualify",
                items: [
                  "CP spots MC trigger signal",
                  "Warm intro to squad lead",
                  "Leverages tech account relationships",
                  "SDR + account hub tooling",
                ],
              },
              {
                num: "2",
                owner: "Squad Lead + Pursuit Ops",
                phase: "Pursue & solution",
                items: [
                  "Squad lead leads client calls",
                  "Fast scoping, right-sized scope",
                  "AI diagnostic tools deployed",
                  "Additional TCP used as warranted",
                ],
              },
              {
                num: "3",
                owner: "Squad Lead + Pursuit Ops",
                phase: "Propose & win",
                items: [
                  "Squad lead presents in orals",
                  "Expert credibility closes trust gap",
                  "Tight, priced-to-win proposals",
                  "Client referrals as proof points",
                ],
              },
              {
                num: "4",
                owner: "Squad lead + team",
                phase: "Deliver & expand",
                items: [
                  "Squad lead monthly client touch",
                  "Advisory relationship (no sale needed)",
                  "Case study captured immediately",
                  "Expand: MC → Tech or Tech → MC",
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

          {/* Key insight */}
          <div className="bg-[#0d1b40] rounded-xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Key insight</p>
            <p className="text-base text-white leading-relaxed">
              Sales doesn't lose — they gain. They keep the relationship and hand off the hard work.
              Nine pursuits in parallel instead of owning every detail of one.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Section 8: Plan on a Page ── */}
      <section className="bg-[#0d1b40] py-24">
        <Container>
          <SectionLabel light>Plan on a Page</SectionLabel>
          <SectionHeading light>Three phases. Clear owners. Measurable momentum.</SectionHeading>
          <Body light className="max-w-2xl mb-14">
            Sequenced to build — not everything at once.<br />Phase 1 unlocks Phase 2. Phase 2 earns Phase 3.
          </Body>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                phase: "Phase 1",
                timeframe: "Now → 90 days",
                title: "Structural foundations",
                items: [
                  "Reduce to 6 hubs; eliminate complexity for sellers",
                  "Assign squad leads; brief all sales and CPs",
                  "Warm intros: squad leads into top 15 accounts",
                  "Fix pursuit model: squad leads scope & propose",
                  "Build MC trigger guide for tech CP team",
                ],
                outcome: "Sales enabled. Squad leads active in client conversations.",
              },
              {
                phase: "Phase 2",
                timeframe: "90 days → 6 months",
                title: "Market activation",
                items: [
                  "Map top 30 tech accounts; ID MC entry points",
                  "Squad leads begin LinkedIn POV content by hub",
                  "One anchor POV document per hub in market",
                  "Case study pipeline: document every win immediately",
                  "Latch onto PS outbound campaign under professional services launch",
                ],
                outcome: "First branded case studies. Pipeline via existing relationships.",
              },
              {
                phase: "Phase 3",
                timeframe: "6 months+",
                title: "Scale and own",
                items: [
                  "Squad leads transition 'ownership'",
                  "AI diagnostic tools live as lead-gen marketing assets",
                  "Formalize AI-differentiated delivery story",
                  "Squad-to-region pairings for international coverage",
                ],
                outcome: "Self-sustaining practice with expert-led growth engine.",
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
            to="/mc-seller-reintro"
            className="flex items-center gap-2 text-sm text-blue-300/70 hover:text-blue-200 transition-colors"
          >
            MC Sellers Reintro
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

    </div>
  );
}
