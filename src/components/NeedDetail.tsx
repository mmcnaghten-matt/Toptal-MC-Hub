import { Need } from "@/data/industryData";
import { battlecardLinks } from "@/data/battlecardLinks";
import { ChevronLeft, Radio, Briefcase, MessageSquareText, ExternalLink } from "lucide-react";

interface Props {
  need: Need;
  onBack: () => void;
  colorVar: string;
}

export function NeedDetail({ need, onBack }: Props) {
  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Industry Need
          </p>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">{need.name}</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Signals */}
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-card-foreground">Signals</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Indicators that a prospect has this need
          </p>
          <ul className="space-y-3">
            {need.signals.map((signal, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                {signal}
              </li>
            ))}
          </ul>
        </section>

        {/* MC Offers */}
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-card-foreground">MC Offers</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Consulting services that address this need
          </p>
          <div className="space-y-2">
            {need.mcOffers.map((offer) => {
              const url = battlecardLinks[offer];
              return url ? (
                <a
                  key={offer}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  {offer}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-2 opacity-60" />
                </a>
              ) : (
                <div
                  key={offer}
                  className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary"
                >
                  {offer}
                </div>
              );
            })}
          </div>
        </section>

        {/* Narrative */}
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-card-foreground">Narrative</h3>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Talking points for sales conversations
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {need.narrative}
          </p>
        </section>
      </div>
    </div>
  );
}
