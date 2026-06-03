import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Workflow, BarChart3, Building2, ArrowRight, X } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";
import SignOutButton from "@/components/SignOutButton";

const sections = [
  {
    id: "services",
    title: "Management Consulting Services",
    description: "Explore Toptal's full portfolio of MC service offerings across Strategy, Finance, Operations, and People — plus GTM materials and sales assets.",
    icon: Briefcase,
    path: "/services",
  },
  {
    id: "way-of-working",
    title: "Management Consulting Way of Working",
    description: "Our consistent four-phase consulting approach, AI accelerators, maturity diagnostic models, and delivery standards.",
    icon: Workflow,
    path: "/way-of-working",
  },
  {
    id: "industry-insights",
    title: "Industry Insights",
    description: "Sub-industry challenges, initiatives, and needs mapped to MC service offerings with signals and sales narratives.",
    icon: BarChart3,
    path: "/industry-insights",
  },
  {
    id: "client-insights",
    title: "Client Insights",
    description: "AI-powered company research generating executive summaries, competitive landscape analysis, strategic frameworks, and MC opportunity mapping.",
    icon: Building2,
    path: "/client-insights",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem("vercel-migration-banner-dismissed") === "true"
  );
  const showBanner = window.location.hostname.includes("vercel.app") && !bannerDismissed;

  const dismissBanner = () => {
    localStorage.setItem("vercel-migration-banner-dismissed", "true");
    setBannerDismissed(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-primary-foreground">
              Toptal Management Consulting
            </h1>
            <p className="text-xs text-primary-foreground/80">Q2 2026 · Confidential</p>
          </div>
          <div className="flex items-center gap-3">
            <SignOutButton />
            <ToptalLogo className="h-8" />
          </div>
        </div>
      </header>

      {showBanner && (
        <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-6 py-3">
          <p className="text-sm text-amber-800">
            <strong>Heads up:</strong> This site is moving to a new URL. Please bookmark{" "}
            <a
              href="https://mc-hub.toptal.tech/"
              className="font-semibold underline hover:text-amber-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              mc-hub.toptal.tech
            </a>{" "}
            — this Vercel deployment will be retired soon.
          </p>
          <button
            onClick={dismissBanner}
            className="ml-4 flex-shrink-0 text-amber-600 hover:text-amber-800"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="fade-in mb-12 max-w-2xl">
          <h2 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
            Management Consulting Hub
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Select a section to explore service offerings, our way of working, industry-specific insights, or client insights.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => navigate(section.path)}
                className="card-hover group flex flex-col items-start gap-5 rounded-lg border border-border bg-card p-8 text-left"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/8">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {section.description}
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
