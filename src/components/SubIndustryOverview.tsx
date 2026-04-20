import { SubIndustry, Need } from "@/data/industryData";
import { battlecardLinks } from "@/data/battlecardLinks";
import { AlertTriangle, Rocket, ArrowRight, Target, ExternalLink } from "lucide-react";

interface Props {
  subIndustry: SubIndustry & { updatedAt?: string };
  onSelectNeed: (need: Need) => void;
  colorVar: string;
}

function stripMd(text: string): string {
  return text.replace(/\*\*/g, "").trim();
}

export function SubIndustryOverview({ subIndustry, onSelectNeed }: Props) {
  const formattedDate = subIndustry.updatedAt
    ? new Date(subIndustry.updatedAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
    : null;

  return (
    <div className="fade-in space-y-8">
      {formattedDate && (
        <p className="text-xs text-muted-foreground">Updated {formattedDate}</p>
      )}
      {/* Overview */}
      <section className="rounded-lg border border-border bg-card p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Overview
        </p>
        <h3 className="mb-3 text-xl font-bold text-card-foreground tracking-tight">
          {subIndustry.name}
        </h3>
        <p className="leading-relaxed text-muted-foreground">
          {subIndustry.overview}
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
                  {stripMd(c).includes(": ") ? (
                    <><strong className="font-semibold text-card-foreground">{stripMd(stripMd(c).split(": ")[0])}:</strong> {stripMd(c).split(": ").slice(1).join(": ")}</>
                  ) : stripMd(c)}
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
                  {stripMd(init).includes(": ") ? (
                    <><strong className="font-semibold text-card-foreground">{stripMd(stripMd(init).split(": ")[0])}:</strong> {stripMd(init).split(": ").slice(1).join(": ")}</>
                  ) : stripMd(init)}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subIndustry.needs.map((need, i) => (
            <button
              key={i}
              onClick={() => onSelectNeed(need)}
              className="card-hover group flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-5 text-left"
            >
              <h4 className="font-medium text-card-foreground leading-snug">
                {need.name}
              </h4>
              <div className="flex flex-wrap gap-1">
                {need.mcOffers.slice(0, 2).map((offer) => {
                  const url = battlecardLinks[offer];
                  return url ? (
                    <a
                      key={offer}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
                    >
                      {offer}
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </a>
                  ) : (
                    <span
                      key={offer}
                      className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {offer}
                    </span>
                  );
                })}
                {need.mcOffers.length > 2 && (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                    +{need.mcOffers.length - 2}
                  </span>
                )}
              </div>
              <span className="mt-auto flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                View details <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
