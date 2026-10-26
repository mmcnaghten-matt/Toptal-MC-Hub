import { SubIndustry, Need } from "@/data/industryData";
import { AlertTriangle, Rocket, ArrowRight, Target } from "lucide-react";
import { Rich, SourcesList, SourcesProvider } from "@/components/Cited";
import { AiResearchNote } from "@/components/AiResearchNote";
import { groupNeeds } from "@/lib/needGrouping";

interface Props {
  subIndustry: SubIndustry & { updatedAt?: string };
  onSelectNeed: (need: Need) => void;
  colorVar: string;
}

function stripMd(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

// "Title: description" items: bold title, then the description with small citation links.
function ItemText({ text }: { text: string }) {
  const t = stripMd(text);
  if (!t.includes(": ")) return <Rich>{t}</Rich>;
  return (
    <>
      <strong className="font-semibold text-card-foreground">{stripMd(t.split(": ")[0])}:</strong> <Rich>{t.split(": ").slice(1).join(": ")}</Rich>
    </>
  );
}

// One compact card per need: the title, with an arrow that appears on hover. `wide` lays the cards out in columns (for needs that have no
// agenda column to sit in); otherwise they stack in the agenda's column.
function NeedCards({ needs, onSelectNeed, wide = false }: { needs: Need[]; onSelectNeed: (need: Need) => void; wide?: boolean }) {
  return (
    <div className={wide ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-2"}>
      {needs.map((need) => (
        <button
          key={need.name}
          onClick={() => onSelectNeed(need)}
          className="card-hover group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left"
        >
          <h6 className="text-sm font-medium text-card-foreground leading-snug">{need.name}</h6>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
        </button>
      ))}
    </div>
  );
}

export function SubIndustryOverview({ subIndustry, onSelectNeed }: Props) {
  const grouped = groupNeeds(subIndustry.needs);
  const researchedDate = subIndustry.researchedAt
    ? new Date(subIndustry.researchedAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    : null;
  const formattedDate = subIndustry.updatedAt
    ? new Date(subIndustry.updatedAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    : null;

  return (
    <SourcesProvider sources={subIndustry.sources}>
    <div className="fade-in space-y-8">
      {formattedDate && (
        <p className="text-xs text-muted-foreground">
          Updated {formattedDate}
          {researchedDate && <> · Researched {researchedDate} from {subIndustry.sources?.length ?? 0} sources</>}
        </p>
      )}
      <AiResearchNote />
      {/* Overview */}
      <section className="rounded-lg border border-border bg-card p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Overview
        </p>
        <h3 className="mb-3 text-xl font-bold text-card-foreground tracking-tight">
          {subIndustry.name}
        </h3>
        <p className="leading-relaxed text-muted-foreground">
          <Rich>{subIndustry.overview}</Rich>
        </p>
      </section>

      {/* Challenges & Initiatives */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-card-foreground">Challenges</h3>
          </div>
          <ul className="space-y-3">
            {subIndustry.challenges.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-destructive/10 text-xs font-medium text-destructive">
                  {i + 1}
                </span>
                <span>
                  <ItemText text={c} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-card-foreground">Initiatives</h3>
          </div>
          <ul className="space-y-3">
            {subIndustry.initiatives.map((init, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                  {i + 1}
                </span>
                <span>
                  <ItemText text={init} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Needs */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Industry Needs</h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {subIndustry.needs.length}
          </span>
        </div>
        <div className="space-y-6">
          {grouped.areas.map(({ area, agendas, count }) => (
            <div key={area.id} className="rounded-lg border border-border bg-card" data-testid={`needs-area-${area.id}`}>
              <div className="border-b border-border px-5 py-4" style={{ borderLeft: `4px solid ${area.color.text}`, borderTopLeftRadius: 8 }}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h4 className="text-lg font-bold tracking-tight" style={{ color: area.color.text }}>{area.name}</h4>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: area.color.bg, color: area.color.text }}>
                    {count}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{area.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold">Buyers:</span> {area.buyers.join(" · ")}
                </p>
              </div>
              <div className="grid gap-4 p-5 lg:grid-cols-2">
                {agendas.map(({ agenda, needs }) => (
                  // The client agenda is the priority the practice leads with: a tinted panel in the service area's colour with a real heading.
                  // "Other agenda" is the catch-all, so it stays neutral and quiet.
                  <section
                    key={agenda?.id ?? "other"}
                    className={agenda ? "rounded-lg p-4" : "rounded-lg border border-dashed border-border bg-muted/30 p-4"}
                    style={agenda ? { backgroundColor: `${area.color.text}14`, border: `1px solid ${area.color.text}33`, borderLeft: `4px solid ${area.color.text}` } : undefined}
                    data-testid={`agenda-${area.id}-${agenda?.id ?? "other"}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={agenda ? "text-[10px] font-semibold uppercase tracking-widest" : "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"}
                          style={agenda ? { color: area.color.text } : undefined}
                        >
                          {agenda ? "Client agenda" : "Not tied to an agenda"}
                        </p>
                        <h5
                          className={agenda ? "text-base font-bold leading-snug" : "text-base font-semibold leading-snug text-muted-foreground"}
                          style={agenda ? { color: area.color.text } : undefined}
                        >
                          {agenda ? agenda.label : "Other agenda"}
                        </h5>
                      </div>
                      <span
                        className={agenda ? "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" : "shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground"}
                        style={agenda ? { backgroundColor: area.color.bg, color: area.color.text } : undefined}
                      >
                        {needs.length}
                      </span>
                    </div>
                    <NeedCards needs={needs} onSelectNeed={onSelectNeed} />
                  </section>
                ))}
              </div>
            </div>
          ))}
          {grouped.other.length > 0 && (
            <div className="rounded-lg border border-border bg-card" data-testid="needs-other">
              <div className="border-b border-border px-5 py-4">
                <h4 className="text-lg font-bold tracking-tight text-card-foreground">Other needs</h4>
                <p className="mt-1 text-sm text-muted-foreground">Not yet placed in a service area.</p>
              </div>
              <div className="p-5">
                <NeedCards needs={grouped.other} onSelectNeed={onSelectNeed} wide />
              </div>
            </div>
          )}
        </div>
      </section>

      <SourcesList sources={subIndustry.sources} />
    </div>
    </SourcesProvider>
  );
}
