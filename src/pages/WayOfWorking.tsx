import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Layers, Sparkles, ClipboardCheck, ArrowRight, Bot } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

const phases = [
  {
    id: "assess",
    title: "Assessment & Vision",
    type: "Visioning, Strategy & Planning",
    purpose:
      "Conduct a deep analysis of the current state and market conditions to identify core challenges and align on a future target vision.",
    activities: [
      "E.g., Analyze current business state, industry trends, and the competitive landscape",
      "E.g., Interview internal stakeholders to find pain points, goals, and internal capabilities",
      "E.g., Research customer behaviors, needs, and ideal customer profiles (ICP)",
      "E.g., Evaluate existing technology stacks, data foundations, and process efficiencies"
    ],
    outputs: [
      "E.g., Current State Assessment",
      "E.g., Market & Competitor Insights Report",
      "E.g., Future Vision & Value Drivers",
      "E.g., SWOT / Diagnostic Heat Map"
    ]
  },
  {
    id: "strategize",
    title: "Strategize & Plan",
    type: "Visioning, Strategy & Planning",
    purpose:
      "Formulate a tailored, data-driven strategy and implementation roadmap that defines specific initiatives and optimizes resource allocation.",
    activities: [
      "E.g., Prioritize high-impact initiatives using structured frameworks (e.g., ROI, feasibility, or RICE)",
      "E.g., Design the strategic framework, with pricing, monetization, or distribution models",
      "E.g., Construct a phased roadmap with clear milestones and resource needs",
      "E.g., Build business cases and risk mitigation"
    ],
    outputs: [
      "E.g., Strategic Plan (Blueprint)",
      "E.g., Integrated Implementation Plan",
      "E.g., Resource Allocation & Financial Plan",
      "E.g., Risk Mitigation Roadmap"
    ]
  },
  {
    id: "build",
    title: "Build or Implement",
    type: "Implementation & Operational",
    purpose:
      "Support the execution of the developed strategy through pilot testing, building internal capabilities, and fostering organizational alignment.",
    activities: [
      "E.g., Execute initial pilot programs or develop MVPs to test key strategic assumptions",
      "E.g., Integrate new systems, technologies, or automated workflows into daily operations",
      "E.g., Train teams and deliver knowledge transfer to ensure long-term capability building",
      "E.g., Restructure roles or processes to align with the new strategic objectives"
    ],
    outputs: [
      "E.g., Tested Prototype / Functional MVP",
      "E.g., Marketing/Sales Enablement Materials",
      "E.g., Internal Capability Building Program",
      "E.g., Operational Efficiency Report"
    ]
  },
  {
    id: "scale",
    title: "Scale & Improve",
    type: "Implementation & Operational",
    purpose:
      "Continuously track progress, measure initiative effectiveness, and make data-driven adjustments to ensure sustained growth and momentum.",
    activities: [
      "E.g., Monitor KPIs via real-time dashboards to track ROI and progress",
      "E.g., Scale successful pilot initiatives across the broader enterprise or global markets",
      "E.g., Optimize strategies and processes based on performance data and stakeholder feedback",
      "E.g., Establish ongoing governance frameworks to maintain quality and alignment"
    ],
    outputs: [
      "E.g., Progress & Performance Tracking Reports",
      "E.g., Optimization Strategy Document",
      "E.g., Growth & Adaptability Framework",
      "E.g., Post-Launch Evaluation & Win-Loss Review"
    ]
  }
];


const accelerators = [
{
  name: "Toptal MC - Account Trigger Filter",
  description:
    "Initial screening tool to identify high-potential client accounts and engagement triggers for MC services.",
  url: "https://gemini.google.com/gem/1djs5AHeNWklhGFyXZh9lCJpajp-rf-WQ?usp=sharing"
},
{
  name: "Toptal MC - Account Briefing",
  description:
  "Maps account challenges/needs to Toptal MC Service Offerings. Enter the Account to generate a briefing.",
  url: "https://gemini.google.com/gem/1WJ7d_oKkW-g9cDtE_RD20rfmy2G5lRfp?usp=sharing"
},
{
  name: "Toptal MC - Account Market Intelligence",
  description:
  "AI-powered competitive intelligence tool — enter a company name to generate a full market research report with SWOT, Porter's Five Forces, and MC opportunity mapping.",
  url: "/account-market-intel",
  isInternal: true
},
{
  name: "Toptal MC - Make Draft Engagement Solution Approach",
  description:
  "AI-guided tool that asks for inputs and generates a draft engagement solution approach.",
  url: "https://gemini.google.com/gem/1CnddfrkU5M93vysqWGmTYlz6L9Uy7chD?usp=sharing"
},
{
  name: "Toptal MC - Industry Briefing & MC Service Offerings",
  description:
  "Enter an industry or sub-sector and get a detailed briefing with mapped MC service offerings.",
  url: "https://gemini.google.com/gem/1XLDSmzZ2PZFn0WLWubxmabdpkcJ_crLw?usp=sharing"
},
{
  name: "Toptal MC - Make Toptal Maturity Model for a Topic",
  description:
  "Creates a CMMI-type maturity model for any topic input at runtime.",
  url: "https://gemini.google.com/gem/18FLkFqSaPTvGlwC3egMVHtOF7bruWluA?usp=sharing"
}];


const maturityPillars = [
{ name: "AI Strategy & Vision", desc: "Establishing business objectives and market dynamics" },
{ name: "Data & Technology", desc: "Building robust, scalable infrastructure" },
{ name: "AI Solution Development & Deployment", desc: "Seamless design, building, and scaling of AI solutions" },
{ name: "Operating Model & Organization", desc: "Designing AI-compatible components and processes" },
{ name: "Responsible AI & Governance", desc: "Ensuring ethical, fair accountability" },
{ name: "Transformation & Change Mgmt", desc: "Orchestrating enterprise-wide AI deployment" }];


interface DeliverableCategory {
  phase: string;
  items: string[];
}

const deliverableStandards: DeliverableCategory[] = [
{
  phase: "Mobilization & Planning",
  items: [
  "Kickoff Presentation",
  "Team Roster & Contact List",
  "Communication Plan",
  "Risk & Issue Log",
  "Systems Access & Permissions Matrix"]

},
{
  phase: "Discovery & Analysis",
  items: [
  "Client Interview Guides",
  "Data Request Lists",
  "Client-provided Materials Log",
  "Current State Analysis Findings",
  "Research Findings"]

},
{
  phase: "Solution Design & Development",
  items: [
  "Future State Design",
  "Recommendation Deck",
  "Financial Models / Business Cases",
  "Prototype / Proof-of-Concept"]

},
{
  phase: "Implementation & Execution Support",
  items: [
  "Action Plans",
  "Training Materials",
  "Change Management Plan",
  "Pilot Program Results",
  "Issue Tracking Log (Live)"]

},
{
  phase: "Project Closure",
  items: [
  "Final Report / Executive Summary",
  "Lessons Learned Document",
  "Client Satisfaction Survey Results",
  "Case Study"]

}];


export default function WayOfWorking() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary-foreground/10 text-primary-foreground">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-primary-foreground">Management Consulting: Way of Working</h1>
              <p className="text-xs text-primary-foreground/80">Q1 2026 · Confidential</p>
            </div>
          </div>
      <ToptalLogo className="h-8" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-10">
        {/* Four-Phase Approach (slide 12) */}
        <section className="fade-in">
          <div className="mb-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Approach
            </p>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Four-Phase Consulting Approach
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Regardless of topic, our approach follows a consistent pattern — typically running across four phases with clear objectives, activities, and outputs.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase, i) =>
            <div
              key={phase.id}
              className="rounded-lg border border-border bg-card p-5 space-y-3">
              
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-card-foreground text-sm">
                    {phase.title}
                  </h3>
                </div>
                <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {phase.type}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {phase.purpose}
                </p>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Activities
                    <span className="text-muted-foreground font-normal"> [action items with action verb]</span>
                  </p>
                  <ul className="space-y-1">
                    {phase.activities.map((a, j) => <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                        {a}
                      </li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">
                    Outputs
                    <span className="text-muted-foreground font-normal"> [noun]</span>
                  </p>
                  <ul className="space-y-1">
                    {phase.outputs.map((o, j) =>
                  <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                        {o}
                      </li>
                  )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* AI Accelerators (slide 14) */}
        <section className="fade-in rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">AI Accelerators</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Pre-defined GEMs in Google Gemini that facilitate speed and consistency across engagements.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {accelerators.map((acc) =>
              acc.isInternal ? (
                <Link
                  key={acc.name}
                  to={acc.url}
                  className="rounded-md border border-border bg-background p-4 transition-colors hover:bg-primary/5"
                >
                  <h4 className="font-medium text-foreground text-sm mb-1 flex items-center gap-1.5"><Bot className="h-4 w-4 text-primary shrink-0" />{acc.name} <ArrowRight className="h-3 w-3 text-primary" /></h4>
                  <p className="text-xs text-muted-foreground">{acc.description}</p>
                </Link>
              ) : (
                <a
                  key={acc.name}
                  href={acc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-border bg-background p-4 transition-colors hover:bg-primary/5"
                >
                  <h4 className="font-medium text-foreground text-sm mb-1 flex items-center gap-1.5"><Bot className="h-4 w-4 text-primary shrink-0" />{acc.name} <ArrowRight className="h-3 w-3 text-primary" /></h4>
                  <p className="text-xs text-muted-foreground">{acc.description}</p>
                </a>
              )
            )}
          </div>
        </section>

        {/* Maturity Models (slide 15) */}
        <section className="fade-in rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">Maturity Diagnostic Models</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Support the Assessments and Vision phase — they also convey best practices and a structured future vision to clients. Example: Toptal's AI Maturity Diagnostic Model.
          </p>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">6 Core Pillars</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {maturityPillars.map((p) =>
              <div key={p.name} className="rounded-md border border-border bg-background p-3">
                  <h5 className="text-xs font-semibold text-foreground">{p.name}</h5>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-md bg-secondary/50 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">Maturity Levels</h4>
            <div className="flex flex-wrap gap-2">
              {["Foundational", "Developing", "Integrated", "Advanced", "Optimized"].map((level, i) =>
              <span
                key={level}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                
                  Level {i + 1}: {level}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Delivery Standards (slide 16) */}
        <section className="fade-in rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">Delivery Standards</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Standard components utilized in delivery to improve quality, visibility, and consistency.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {deliverableStandards.map((cat) =>
            <div key={cat.phase}>
                <h4 className="text-xs font-semibold text-foreground mb-2">{cat.phase}</h4>
                <ul className="space-y-1">
                  {cat.items.map((item) =>
                <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-1 text-primary">☐</span>
                      {item}
                    </li>
                )}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>);

}