import { useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowRight, Brain, Layers, KeyRound } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

const mcDiagnostics = [
  {
    slug: "ai-maturity",
    title: "AI Maturity Checkup",
    description:
      "Assess your organization's AI readiness across six critical pillars — Strategy, Data & Technology, Development, Talent, Governance, and Change Management — and receive a personalized transformation roadmap.",
    pillars: ["AI Strategy & Vision", "Data & Technology", "Development & Deployment", "Talent & Org", "Responsible AI", "Change Management"],
    path: "/diagnostics/ai-maturity",
    password: "AI2026",
  },
  {
    slug: "finance-transformation",
    title: "Finance Transformation Maturity Checkup",
    description:
      "Assess your organization's finance function maturity across five capability pillars — Strategy & Vision, Performance Management, Process Optimization, Organization & Governance, and Data & Technology — and receive a personalized transformation roadmap.",
    pillars: ["Strategy & Vision", "Performance Management", "Process Optimization", "Org & Governance", "Data & Technology"],
    path: "/diagnostics/finance-transformation",
    password: "FT2026",
  },
  {
    slug: "growth-strategy",
    title: "Growth Strategy Maturity Checkup",
    description:
      "Assess your organization's growth strategy maturity across five capability pillars — Growth Strategy Formulation & Vision, Market & Customer Intelligence, Execution & Go-to-Market, Organizational Alignment & Collaboration, and Technology & Innovation Adoption — and receive a personalized growth roadmap.",
    pillars: ["Strategy & Vision", "Market Intelligence", "Execution & GTM", "Org Alignment", "Tech & Innovation"],
    path: "/diagnostics/growth-strategy",
    password: "GS2026",
  },
  {
    slug: "business-transformation",
    title: "Business Transformation Maturity Checkup",
    description:
      "Assess your organization's business transformation maturity across five capability pillars — Strategic Alignment & Governance, Process & Operational Excellence, Data & Technology Integration, Organizational & Cultural Change, and Customer & Market Centricity — and receive a personalized transformation roadmap.",
    pillars: ["Strategy & Gov.", "Process", "Data & Tech", "Org & Culture", "Customer"],
    path: "/diagnostics/business-transformation",
    password: "BT2026",
  },
  {
    slug: "performance-improvement",
    title: "Performance Improvement Maturity Checkup",
    description:
      "Assess your organization's operational performance maturity across six capability pillars — Strategic Alignment & Goal Setting, Process Design & Execution, Organizational & Functional Alignment, Technology & Data Management, People & Culture, and Resource & Asset Optimization — and receive a personalized improvement roadmap.",
    pillars: ["Strategy", "Process", "Org Alignment", "Tech & Data", "People", "Resources"],
    path: "/diagnostics/performance-improvement",
    password: "PI2026",
  },
  {
    slug: "supply-chain",
    title: "Supply Chain Maturity Checkup",
    description:
      "Assess your organization's supply chain maturity across five capability pillars — Strategy & Planning, Data & Digital Integration, Operations & Execution, Resilience & Risk Management, and Collaboration & Ecosystem Alignment — and receive a personalized transformation roadmap.",
    pillars: ["Strategy & Planning", "Data & Digital", "Operations", "Resilience", "Collaboration"],
    path: "/diagnostics/supply-chain",
    password: "SC2026",
  },
  {
    slug: "workforce-transformation",
    title: "Workforce Transformation Maturity Checkup",
    description:
      "Assess your organization's workforce transformation maturity across five capability pillars — Organizational Transformation, Digital Workforce Transformation, Leadership Transformation, Cultural Transformation, and Process Transformation — and receive a personalized roadmap.",
    pillars: ["Org Transformation", "Digital Workforce", "Leadership", "Culture", "Process"],
    path: "/diagnostics/workforce-transformation",
    password: "WT2026",
  },
  {
    slug: "ai-value-realization",
    title: "AI Value Realization Maturity Checkup",
    description:
      "Assess your organization's ability to translate AI investments into auditable, sustained financial and operational returns across five capability pillars — Strategy & Targeting, Data & Workflows, Telemetry & Control, Org & Steerage, and Tech Lifecycle — and receive a personalized ROI optimization roadmap.",
    pillars: ["Strategy & Targeting", "Data & Workflows", "Telemetry & Control", "Org & Steerage", "Tech Lifecycle"],
    path: "/diagnostics/ai-value-realization",
    password: "AVR2026",
  },
];

const industryDiagnostics = [
  {
    slug: "me-platform",
    title: "M&E Platform Maturity Diagnostic",
    description:
      "Assess your organization's readiness to transition from a linear media model to an optimized multi-sided platform across Ecosystem Strategy, Data Mastery, Content & AI, Monetization, Architecture, and Governance.",
    pillars: ["Ecosystem Strategy", "Data Mastery", "Content & AI", "Monetization", "Architecture", "Governance"],
    path: "/diagnostics/me-platform",
    password: "ME2026",
  },
  {
    slug: "cannes-me-fan-audience",
    title: "M&E Fan/Audience Platform Diagnostic — Cannes Edition",
    description:
      "A focused assessment of your organization's maturity in building direct, data-driven fan and audience relationships — covering data foundations, personalization, DTC channels, monetization, real-time engagement, AI, and ecosystem integration.",
    pillars: ["Fan Data", "Personalization", "DTC Channels", "Monetization", "Real-Time Engagement", "AI & Analytics", "Ecosystem", "Org Readiness"],
    path: "/cannes-diagnostic",
    password: "Cannes2026",
  },
];

function DiagnosticCard({ d }: { d: (typeof mcDiagnostics)[0] }) {
  const navigate = useNavigate();
  const isExternal = d.path.startsWith("http");
  return (
    <div className="card-hover group flex flex-col rounded-lg border border-border bg-card p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/8 mb-4">
        <Brain className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-card-foreground mb-2">{d.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{d.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {d.pillars.map((p) => (
          <span key={p} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {p}
          </span>
        ))}
      </div>
      {d.password && (
        <div className="flex items-center gap-2 mb-4 rounded-md bg-muted px-3 py-2">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Respondent password:</span>
          <span className="text-xs font-mono font-semibold text-foreground">{d.password}</span>
        </div>
      )}
      <button
        onClick={() => isExternal ? window.open(d.path, "_blank") : navigate(d.path)}
        className="flex items-center justify-between w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Launch Diagnostic
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DiagnosticsHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate("/way-of-working")}
            className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Way of Working
          </button>
          <ToptalLogo className="h-8" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-12">
        <div className="fade-in max-w-2xl">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Maturity Model Diagnostics
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Interactive assessments that help clients understand their current maturity level and receive a personalized strategic roadmap. Survey respondent login codes are provided below for each diagnostic.
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Admin access:</span> Admin passwords for viewing results and managing responses can be obtained by contacting Management Consulting leadership.
          </p>
        </div>

        {/* Management Consulting Diagnostics */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-xl font-semibold text-foreground">Management Consulting Diagnostics</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5 ml-6">Cross-industry assessments supporting the MC engagement lifecycle.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mcDiagnostics.map((d) => <DiagnosticCard key={d.slug} d={d} />)}
          </div>
        </section>

        {/* Toptal Industry Solution Diagnostics */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-xl font-semibold text-foreground">Toptal Industry Solution Diagnostics</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5 ml-6">Sector-specific assessments aligned to Toptal's industry solution offerings.</p>
          {industryDiagnostics.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {industryDiagnostics.map((d) => <DiagnosticCard key={d.slug} d={d} />)}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Industry diagnostics coming soon.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
