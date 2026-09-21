import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowRight } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

export default function ServicesExecDashboardMockup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary-foreground/10 text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-primary-foreground">
                Services Performance Dashboards
              </h1>
              <p className="text-xs text-primary-foreground/80">Mockup v23.0 · Confidential</p>
            </div>
          </div>
          <ToptalLogo className="h-8" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Choose a Dashboard
        </p>
        <h2 className="mb-3 text-2xl font-bold text-card-foreground tracking-tight">
          Services Performance Reporting Framework
        </h2>
        <p className="mb-10 text-sm leading-relaxed text-muted-foreground">
          Two versions of the v23.0 dashboard mockup are available — pick the one you want to view.
        </p>

        <div className="space-y-4">
          <Link
            to="/services-exec-dashboard-mockup/vision"
            className="group flex items-center justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
          >
            <div>
              <h3 className="text-lg font-bold text-card-foreground">Future Vision v23.0</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The long-term target state for services performance reporting.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>

          <Link
            to="/services-exec-dashboard-mockup/wave1"
            className="group flex items-center justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
          >
            <div>
              <h3 className="text-lg font-bold text-card-foreground">Wave 1 Dashboard v23.0</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The first-release scope of the dashboard, reflecting what ships initially.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </Link>
        </div>

        <Link
          to="/services-exec-dashboard-mockup-v22-archive"
          className="mt-10 inline-block text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View v22 archive →
        </Link>
      </main>
    </div>
  );
}
