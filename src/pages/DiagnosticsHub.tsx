import { useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowRight, Brain } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

const diagnostics = [
  {
    slug: "ai-maturity",
    title: "AI Navigator Checkup",
    description:
      "Assess your organization's AI readiness across six critical pillars — Strategy, Data & Technology, Development, Talent, Governance, and Change Management — and receive a personalized transformation roadmap.",
    pillars: ["AI Strategy & Vision", "Data & Technology", "Development & Deployment", "Talent & Org", "Responsible AI", "Change Management"],
    path: "/diagnostics/ai-maturity/survey",
  },
];

export default function DiagnosticsHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/way-of-working")}
              className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Way of Working
            </button>
          </div>
          <ToptalLogo className="h-8" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="fade-in mb-10 max-w-2xl">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
            Maturity Model Diagnostics
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Interactive assessments that help clients understand their current maturity level and receive a personalized strategic roadmap. Share the survey link directly with clients — no login required.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {diagnostics.map((d) => (
            <div
              key={d.slug}
              className="card-hover group flex flex-col rounded-lg border border-border bg-card p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/8 mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-card-foreground mb-2">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{d.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {d.pillars.map((p) => (
                  <span key={p} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {p}
                  </span>
                ))}
              </div>
              <button
                onClick={() => window.open(d.path, "_blank")}
                className="flex items-center justify-between w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Launch Diagnostic
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
