import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
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

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white border border-[#e2e8f0] rounded-xl p-6 ${className}`}>
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

// ── Data ──────────────────────────────────────────────────────────────────────

const hubOfferings = [
  {
    name: "Growth Strategy",
    traditional: {
      quote: "Where should we be investing to grow — and where should we stop?",
      description: "Market expansion, portfolio strategy, where to compete and how to win",
    },
    ai: {
      quote: "Are you using data and AI to identify your highest-ROI growth bets?",
      description: "AI-powered market sensing, data-driven growth prioritization",
    },
  },
  {
    name: "Business Transformation",
    traditional: {
      quote: "Is your operating model keeping up with how fast the market is moving?",
      description: "Org restructuring, process redesign, enterprise operating model change",
    },
    ai: {
      quote: "How are you redesigning roles and processes around what AI can now automate?",
      description: "Redesigning the operating model for AI — who does what when AI changes the work",
    },
  },
  {
    name: "Finance Transformation",
    traditional: {
      quote: "Is your finance function a strategic partner to the business — or still just reporting?",
      description: "Finance function modernization, FP&A redesign, close process improvement",
    },
    ai: {
      quote: "Do you have a way to measure what your AI investments are actually delivering?",
      description: "AI ROI measurement, finance automation, CFO-to-board AI narrative",
    },
  },
  {
    name: "Performance Improvement",
    traditional: {
      quote: "Where are you leaving productivity on the table in your core operations?",
      description: "Process optimization, cost reduction, operational efficiency programs",
    },
    ai: {
      quote: "Have you mapped where AI could absorb work in your value chain today?",
      description: "AI-assisted process mining, workflow automation identification",
    },
  },
  {
    name: "Supply Chain",
    traditional: {
      quote: "How resilient is your supply chain to the next disruption?",
      description: "Supply chain optimization, logistics improvement, procurement strategy",
    },
    ai: {
      quote: "Are you using AI for demand forecasting and supply visibility — or still running on lag indicators?",
      description: "AI demand sensing, inventory optimization, nearshoring scenario modeling",
    },
  },
  {
    name: "Workforce Transformation",
    traditional: {
      quote: "Is your org structure set up for where the business needs to go — or where it's been?",
      description: "Org design, workforce planning, talent strategy, change management",
    },
    ai: {
      quote: "Do you know which roles AI will change most — and do you have a plan for your people?",
      description: "AI readiness assessment, role redesign for AI era, reskilling strategy",
    },
  },
];

const landExpandRows = [
  {
    engagement: "ERP / platform / Salesforce implementation",
    pairs: [
      { trigger: "How are you thinking about adoption — do your people have what they need to actually change how they work?", hub: "Change Management" },
      { trigger: "Now that the system is live, are your processes and team model keeping up?", hub: "Business Transformation" },
    ],
  },
  {
    engagement: "AI / ML implementation",
    pairs: [
      { trigger: "When your CFO asks if this is working — do you have a way to measure ROI yet?", hub: "Finance Transformation" },
      { trigger: "The tools are live — are people actually using them? What's the resistance looking like?", hub: "Change Management" },
    ],
  },
  {
    engagement: "Agile / product model transformation",
    pairs: [
      { trigger: "Now that the model is in place — are you confident you're building the right things?", hub: "Growth Strategy" },
      { trigger: "Are the team behaviors and structure actually keeping up with the new model?", hub: "Change Management" },
    ],
  },
  {
    engagement: "Cloud migration / app modernization",
    pairs: [
      { trigger: "Now that infrastructure changed — how are your processes and team model keeping up?", hub: "Business Transformation" },
    ],
  },
  {
    engagement: "Large-scale tech talent (10+ resources)",
    pairs: [
      { trigger: "How are you thinking about your long-term talent model as AI changes what your engineers do?", hub: "Workforce Transformation" },
    ],
  },
  {
    engagement: "Supply chain / ERP / ops systems",
    pairs: [
      { trigger: "Do you have visibility into where AI could automate in your value chain today?", hub: "Performance Improvement" },
      { trigger: "How resilient is your supply chain if a primary supplier or region gets disrupted?", hub: "Supply Chain" },
    ],
  },
];

const pursuitStages = [
  {
    num: "1",
    phase: "Find & qualify",
    owner: "You (CP / Sales)",
    yours: true,
    items: [
      "Spot the MC trigger signal",
      "Warm intro to squad lead",
      "Leverage your tech account relationship",
      "Keep the broader deal in motion",
    ],
  },
  {
    num: "2",
    phase: "Pursue & solution",
    owner: "Squad lead",
    yours: false,
    items: [
      "Owns all discovery & scoping calls",
      "Right-sizes the engagement fast",
      "Deploys diagnostic tools",
      "Engages TCP if needed",
    ],
  },
  {
    num: "3",
    phase: "Propose & win",
    owner: "Squad lead",
    yours: false,
    items: [
      "Presents in client orals",
      "Expert credibility closes trust gap",
      "Fast, priced-to-win proposal",
      "Client referrals as proof",
    ],
  },
  {
    num: "4",
    phase: "Deliver & expand",
    owner: "You + Squad lead",
    yours: true,
    items: [
      "You stay in monthly client relationship",
      "Squad lead holds advisory touch",
      "Expand: MC → Tech or Tech → MC",
      "Case study captured — you share in the win",
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MCSellerReintro() {
  const navigate = useNavigate();
  const [openHub, setOpenHub] = useState<string | null>(null);

  return (
    <div className="min-h-screen font-sans antialiased">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 bg-[#0d1b40] border-b border-white/10 py-3">
        <Container className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-300/70 hover:text-blue-200 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <ToptalLogo className="h-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300/60">
            MC Sellers Reintro · Confidential
          </p>
        </Container>
      </header>

      {/* ── Section 1: Hero ── */}
      <section className="bg-[#0d1b40] py-20">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400 mb-5">
            ✦ Toptal Management Consulting
          </p>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 max-w-3xl">
            Management Consulting
          </h1>
          <p className="text-2xl text-blue-200 font-medium mb-8">A Guide for Client Partners &amp; Sellers</p>
          <div className="flex flex-wrap gap-3">
            {["What we sell", "How to spot it", "How to hand it off"].map((pill) => (
              <span key={pill} className="flex items-center gap-2 bg-white/10 text-white text-sm font-medium rounded-full px-4 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                {pill}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Section 2: Context ── */}
      <section className="py-20 bg-white">
        <Container>
          <SectionLabel>Context</SectionLabel>
          <SectionHeading>MC has a branding and motion problem,<br />not a capability problem</SectionHeading>
          <Body className="max-w-2xl mb-12">
            <strong>Our consultants are excellent. The challenge is structural</strong> — and we've asked sellers built for speed and relationship to carry too much of a pursuit motion that requires deep domain expertise. <strong>That's not a people problem. It's a model problem.</strong>
          </Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card>
              <h3 className="text-base font-bold text-[#0f172a] mb-3">What MC actually is</h3>
              <p className="text-sm text-[#374151] leading-relaxed">
                Management consulting engagements — scoped work with clear deliverables, a defined approach, and outcomes we own alongside the client. Not staff aug. Think: <em>"we'll solve this together"</em> vs. <em>"here's a resource."</em>
              </p>
            </Card>
            <Card>
              <h3 className="text-base font-bold text-[#0f172a] mb-3">A model that asked too much</h3>
              <p className="text-sm text-[#374151] leading-relaxed">
                Selling MC requires solutioning, scoping and pursuing complex engagements — on top of your core talent work. We've been asking you to do two hard jobs at once. That's changing.
              </p>
            </Card>
            <Card>
              <h3 className="text-base font-bold text-[#0f172a] mb-3">What's changing for you</h3>
              <p className="text-sm text-[#374151] leading-relaxed">
                Your role shifts to finding the signal and making the intro. Expert squad leads take the pursuit from there. You stay in the relationship — without carrying the hard work of solutioning.
              </p>
            </Card>
          </div>
          <div className="mt-8 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl px-6 py-5">
            <p className="text-sm text-[#1e40af] leading-relaxed">
              <strong>The opportunity is real.</strong> Toptal MC has closed engagements at Owens Corning, Corning, CAT, 3M, Comcast and more — with senior consultants from MBB, Big 4, and industry. The model works. Now we scale it.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Section 3: Your Role ── */}
      <section className="py-20 bg-[#f8fafc]">
        <Container>
          <SectionLabel>Your role in the new model</SectionLabel>
          <SectionHeading>You find the door. MC experts walk through it.</SectionHeading>
          <Body className="max-w-2xl mb-12">
            This isn't more work — it's a cleaner motion. Spot the signal, make the warm intro, stay in the relationship. The squad lead handles everything from qualification to proposal.
          </Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#2563eb]/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#2563eb] text-white text-xs font-bold rounded-full px-3 py-1 uppercase tracking-wide">Your role</span>
                <h3 className="text-base font-bold text-[#0f172a]">What stays yours</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Client relationship — you own it throughout",
                  "Spotting the MC trigger signal in account conversations",
                  "Making the warm intro to the right squad lead",
                  "Staying in the loop on pursuit progress",
                  "Credit for the MC engagement in your account",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#374151]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-[#64748b]/30 bg-[#f8fafc]">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#475569] text-white text-xs font-bold rounded-full px-3 py-1 uppercase tracking-wide">Squad lead</span>
                <h3 className="text-base font-bold text-[#0f172a]">What the squad lead carries</h3>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Qualification and discovery calls",
                  "Scoping and solutioning the engagement",
                  "Proposal drafting and pricing",
                  "Presenting in client orals",
                  "Delivery ownership and client success",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#374151]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#475569] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </section>

      {/* ── Section 4: Hub Offerings ── */}
      <section className="py-20 bg-white">
        <Container>
          <SectionLabel>Hub offerings</SectionLabel>
          <SectionHeading>Six hubs — every conversation has a traditional and an AI angle</SectionHeading>
          <Body className="max-w-2xl mb-12">
            Each hub opens two doors. Lead with whichever fits the client conversation — both land in the same practice.
          </Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {hubOfferings.map((hub) => {
              const c = HUB_COLORS[hub.name] ?? { bg: "#F1F5F9", text: "#374151" };
              return (
                <Card key={hub.name}>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setOpenHub(hub.name)} className="flex items-center gap-1.5 text-left">
                      <HubTag hub={hub.name} />
                      <Info size={13} className="text-[#6b7280] opacity-50 shrink-0" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-2">Traditional</p>
                      <p className="text-sm italic text-[#374151] mb-2 leading-snug">"{hub.traditional.quote}"</p>
                      <p className="text-xs text-[#6b7280] leading-relaxed">{hub.traditional.description}</p>
                    </div>
                    <div className="border-l border-[#f1f5f9] pl-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#2563eb] mb-2">AI angle</p>
                      <p className="text-sm italic text-[#374151] mb-2 leading-snug">"{hub.ai.quote}"</p>
                      <p className="text-xs text-[#6b7280] leading-relaxed">{hub.ai.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
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
        </Container>
      </section>

      {/* ── Section 5: Land & Expand ── */}
      <section className="py-20 bg-[#f8fafc]">
        <Container>
          <SectionLabel>Land &amp; expand — start here</SectionLabel>
          <SectionHeading>Your tech accounts are the fastest path to MC revenue</SectionHeading>
          <Body className="max-w-2xl mb-10">
            Every tech engagement creates a downstream business problem. These are the trigger questions — and the MC doors they open.
          </Body>
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-[#6b7280] w-[28%]">Tech engagement</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-[#6b7280]">Trigger question to ask</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-[#6b7280] w-[20%]">MC door it opens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {landExpandRows.map((row) =>
                  row.pairs.map((pair, pairIdx) => (
                    <tr key={`${row.engagement}-${pairIdx}`} className="hover:bg-[#fafcff] transition-colors">
                      {pairIdx === 0 && (
                        <td rowSpan={row.pairs.length} className="px-5 py-4 text-[#2563eb] font-bold align-top border-r border-[#f1f5f9]">
                          {row.engagement}
                        </td>
                      )}
                      <td className="px-5 py-4 text-[#374151] italic align-top">"{pair.trigger}"</td>
                      <td className="px-5 py-4 align-top">
                        <HubTag hub={pair.hub} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl px-6 py-5">
            <p className="text-sm text-[#1e40af] leading-relaxed">
              <strong>Change management is a wedge, not just a follow-on</strong> — smaller scope, faster close, immediate trust-builder. Every tech implementation creates the need automatically.
            </p>
          </div>
        </Container>
      </section>

      {/* ── Section 6: How It Works ── */}
      <section className="py-20 bg-white">
        <Container>
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading>The pursuit model: your role and the handoff</SectionHeading>
          <Body className="max-w-2xl mb-12">
            You own stages 1 and 4. The squad lead drives everything in between. You never lose the client — you gain a consulting win in your account.
          </Body>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            {pursuitStages.map((stage) => (
              <div
                key={stage.num}
                className={`rounded-xl border p-5 ${stage.yours ? "bg-[#eff6ff] border-[#bfdbfe]" : "bg-white border-[#e2e8f0]"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-3xl font-extrabold ${stage.yours ? "text-[#2563eb]" : "text-[#cbd5e1]"}`}>{stage.num}</span>
                  {stage.yours && (
                    <span className="text-xs font-semibold text-[#2563eb] bg-[#dbeafe] rounded-full px-2 py-0.5">Your stage</span>
                  )}
                </div>
                <p className="text-sm font-bold text-[#0f172a] mb-0.5">{stage.phase}</p>
                <p className="text-xs text-[#6b7280] mb-4">{stage.owner}</p>
                <ul className="space-y-2">
                  {stage.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[#374151]">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${stage.yours ? "bg-[#2563eb]" : "bg-[#94a3b8]"}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-[#0d1b40] rounded-xl px-6 py-5">
            <p className="text-sm text-blue-100 leading-relaxed">
              <strong className="text-white">You never lose the client — you gain a consulting win.</strong> A closed MC engagement in your account lifts the full relationship and opens new doors.
            </p>
          </div>
        </Container>
      </section>

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
