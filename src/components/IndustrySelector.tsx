import { Industry } from "@/data/industryData";
import { Building2, Monitor, ShoppingBag, GraduationCap, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  bfsi: Building2,
  cmet: Monitor,
  cps: ShoppingBag,
  "higher-ed": GraduationCap,
};

interface Props {
  industries: Industry[];
  onSelect: (industry: Industry) => void;
}

export function IndustrySelector({ industries, onSelect }: Props) {
  return (
    <div className="fade-in">
      <div className="mb-12 max-w-2xl">
        <h2 className="mb-3 text-4xl font-bold tracking-tight text-foreground">
          Industry Insights
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Select an industry to explore sub-industry insights, needs, and MC offers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {industries.map((industry) => {
          const Icon = iconMap[industry.id] || Building2;
          return (
            <button
              key={industry.id}
              onClick={() => onSelect(industry)}
              className="card-hover group flex flex-col items-start gap-5 rounded-lg border border-border bg-card p-6 text-left"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/8">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-card-foreground">
                  {industry.shortName}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {industry.name}
                </p>
              </div>
              <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
