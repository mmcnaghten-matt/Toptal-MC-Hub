import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MCPlan() {
  const navigate = useNavigate();

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
            Professional Services Transformation
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

      {/* ── Section 2: Context ── */}
      <section className="bg-white py-20">
        <Container>
          <SectionLabel>Context</SectionLabel>
          <SectionHeading>MC has a motion problem, not a capability problem</SectionHeading>
          <Body className="max-w-2xl mb-12">
            Our consultants are excellent. The challenge is structural — the wrong people selling consulting
            in the wrong way to the wrong buyers.
          </Body>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Brand mismatch",
                body: "Toptal is perceived as a talent network. Enterprise buyers don't search for consulting this way — paid search misses them entirely.",
              },
              {
                title: "Seller mismatch",
                body: "Sales and CPs are great at closing talent deals. PS selling is a different motion — longer, more complex, lower close rate.",
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

      {/* ── Section 3: The Shift Required ── */}
      <section className="bg-[#f8fafc] py-20">
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
                  "MC expertise held back in a pre-sales support role",
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
                  "Squad leads (domain experts) own MC client relationships",
                  "Sales finds the lead; expert runs the pursuit",
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

      {/* ── Section 4: Hub Offerings ── */}
      <section className="bg-white py-20">
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
                <h3 className="text-base font-bold mb-2" style={{ color: hub.color }}>{hub.name}</h3>
                <p className="text-sm text-[#374151] leading-relaxed flex-1 mb-4">{hub.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {hub.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Section 5: Marketing & Positioning ── */}
      <section className="bg-[#f8fafc] py-20">
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
              "Senior consultants from the firms you trust — assembled around your problem, not our pyramid.
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
                body: "The assessments you've already built are marketing assets. 10-min 'AI readiness' check → personalized output → conversation starter. Brand before a meeting.",
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

      {/* ── Section 6: Land & Expand ── */}
      <section className="bg-white py-20">
        <Container>
          <SectionLabel>Land & Expand</SectionLabel>
          <SectionHeading>The fastest path to MC growth: Our tech services accounts</SectionHeading>
          <Body className="max-w-2xl mb-12">
            Every tech engagement creates a downstream business problem. Train CPs to spot the trigger —
            then hand off to the right squad lead.
          </Body>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6b7280]">Tech engagement</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#6b7280]">Trigger question CP asks</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#2563eb]">MC hub entry point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {[
                  {
                    engagement: "Cloud migration / app modernization",
                    trigger: '"Now that infrastructure changed — how are your processes and team model keeping up?"',
                    hub: "Business Transformation",
                  },
                  {
                    engagement: "AI / ML implementation",
                    trigger: '"When your CFO asks if this is working — do you have a way to measure ROI yet?"',
                    hub: "Finance Transformation",
                  },
                  {
                    engagement: "Large-scale tech talent deployment (10+ resources)",
                    trigger: '"How are you thinking about your long-term talent model as AI changes what engineers do?"',
                    hub: "Workforce Transformation",
                  },
                  {
                    engagement: "Agile / product model work",
                    trigger: '"Now that the model is in place — are you confident you\'re building the right things?"',
                    hub: "Growth Strategy",
                  },
                  {
                    engagement: "Supply chain / ERP / ops systems",
                    trigger: '"Do you have visibility into where AI could automate in your value chain today?"',
                    hub: "Performance Improvement / Supply Chain",
                  },
                ].map((row) => (
                  <tr key={row.engagement} className="hover:bg-[#fafcff] transition-colors">
                    <td className="px-5 py-4 text-[#2563eb] font-bold align-top">{row.engagement}</td>
                    <td className="px-5 py-4 text-[#374151] italic align-top">{row.trigger}</td>
                    <td className="px-5 py-4 align-top">
                      <Tag>{row.hub}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mechanism */}
          <InnerCard>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563eb] mb-2">Mechanism</p>
            <p className="text-sm text-[#374151] leading-relaxed">
              Build a one-page "MC trigger guide" for every tech CP — one trigger question per hub with
              handoff language to the right squad lead. Make it a habit, not an exception.
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
            Sales surfaces the signal and lead. MC squad leads own everything from qualification through
            delivery and expansion.
          </Body>

          <div className="space-y-4 mb-10">
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
                owner: "Squad lead + Sales",
                phase: "Pursue & solution",
                items: [
                  "Squad lead owns client calls",
                  "Fast scoping, right-sized scope",
                  "AI diagnostic tools deployed",
                  "TCP used as warranted",
                ],
              },
              {
                num: "3",
                owner: "Squad lead",
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
              <Card key={phase.num} className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-lg bg-[#eff6ff] text-[#2563eb] font-extrabold text-lg flex items-center justify-center shrink-0">
                  {phase.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-3 mb-2">
                    <h3 className="text-base font-bold text-[#0f172a]">{phase.phase}</h3>
                    <span className="text-xs text-[#6b7280] font-medium">{phase.owner}</span>
                  </div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-1">
                    {phase.items.map((item) => (
                      <li key={item} className="text-sm text-[#374151] flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#2563eb] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
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
            Sequenced to build — not everything at once. Phase 1 unlocks Phase 2. Phase 2 earns Phase 3.
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
                  "Latch onto PS outbound campaign under Robert",
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
                  "Push for intl LinkedIn/marketing spend parity",
                  "Squad-to-region pairings for international coverage",
                ],
                outcome: "Self-sustaining practice with expert-led growth engine.",
              },
            ].map((col) => (
              <div key={col.phase} className="bg-white/8 border border-white/15 rounded-xl p-6 flex flex-col">
                <p className="text-base font-bold uppercase tracking-widest text-blue-400 mb-1">{col.phase}</p>
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
