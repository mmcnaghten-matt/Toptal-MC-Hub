import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";
import ConstellationDiagram from "@/components/ConstellationDiagram";

export default function MCServicesWeb() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/services")}
              className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary-foreground/10 text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-primary-foreground">
                Management Consulting Services Web
              </h1>
              <p className="text-xs text-primary-foreground/80">Q2 2026 · Confidential</p>
            </div>
          </div>
          <ToptalLogo className="h-8" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <section className="fade-in rounded-lg border border-border bg-card p-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Services Web
          </p>
          <h2 className="mb-3 text-2xl font-bold text-card-foreground tracking-tight">
            Management Consulting Services Web
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Individual consulting services are rarely delivered in isolation from one another. However, there are core "Hub" offerings that align to different leaders and buying centers within the typical client organization. The web to the right depicts eight of these core hubs and their relationship with "universal connector services" that are often paired with the Hub offering solution, as well as additional, or secondary, services that are often coupled with the Hub offering. Keep in mind that your initial client conversation may not always start at the "Hub" offering but may ultimately lead you there.
          </p>
          <p className="mb-6 text-xs text-primary">
            Hover to highlight the connections · and click for service details
          </p>
          <ConstellationDiagram />
        </section>
      </main>
    </div>
  );
}
