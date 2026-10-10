import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import type { ResearchResult } from "@/services/geminiService";

// Wording for the AI caveat and the short per-section notes. One place, so the sidebar, the report header, the
// method section and the PDF all say the same thing.
export const AI_CAVEAT =
  "AI-generated research. Every statement is checked against its sources, but it may contain minor errors. Verify before using with a client.";
export const AI_CAVEAT_SHORT = "AI-generated and checked against cited sources; may contain minor errors. See “How this research was done”.";

export const SECTION_NOTES: Record<string, string> = {
  executive: "A summary of the sections below. Each statement cites the sources it rests on.",
  performance:
    "Financial results come from SEC filings and company releases. Growth from acquisitions or sales, and one-off charges, are labelled where the sources say so.",
  market: "Market sizes are third-party estimates for the company's current segments. Where research firms disagree, the range is shown.",
  landscape: "Competitors are classified against the company's current segments. Customers, distributors and suppliers are left out.",
  deepdive: "Competitor facts come from primary or major-press sources, or from the competitor's own site.",
  strategic: "Written only from the cited evidence. This is interpretation, not reported fact.",
  customer: "Themes come from published reviews and complaints. They are not win/loss data.",
  recommendations: "Suggestions built from the cited evidence, not commitments or forecasts.",
  mc: "Toptal Management Consulting offerings mapped to needs the evidence shows.",
};

export function SectionNote({ k }: { k: keyof typeof SECTION_NOTES }) {
  return <p className="mt-1 text-xs font-normal text-muted-foreground">{SECTION_NOTES[k]}</p>;
}

const Stat = ({ value, label }: { value: ReactNode; label: string }) => (
  <div className="rounded-lg border border-border bg-secondary/30 p-3">
    <div className="text-xl font-bold tabular-nums text-foreground">{value}</div>
    <div className="text-[11px] leading-snug text-muted-foreground">{label}</div>
  </div>
);

const STEPS: { title: string; body: string }[] = [
  {
    title: "Search",
    body: "Public web search runs per topic and per business segment. Every sentence kept has to be tied to a search result, so nothing comes from the model's memory.",
  },
  {
    title: "Rank the sources",
    body: "Sources are ranked: primary (filings, company releases, regulators), then major press and analyst firms, then everything else. Stock-data sites, social media, peer-list databases, job sites and look-alike domains are excluded.",
  },
  {
    title: "Check dates against the pages",
    body: "Each dated statement is checked against the page it cites. Dates the page contradicts or does not show are removed, events that only secondary pages report need a primary-source confirmation, and expired forecasts and old pages are set aside.",
  },
  {
    title: "Write from the evidence only",
    body: "Statements are written only from the evidence that survives, then validated: figures must appear in the evidence, financial results must come from primary sources, and litigation claims need a filing or must be worded as a law firm's claim. A second model pass independently checks each statement against its sources.",
  },
  {
    title: "Current businesses only",
    body: "The company's current segments are taken from its latest annual report. Businesses it has sold are excluded, markets are researched per current segment, and competitors are classified against those segments.",
  },
  {
    title: "What it cannot do",
    body: "It has no access to internal data. Paywalled sources may be missing, win/loss reasons need primary research, and it can still be wrong or out of date. Treat it as a well-sourced starting point and check anything that matters.",
  },
];

/** "How this research was done": the plain-language method plus this run's numbers. Sits just before the Sources. */
export function ResearchMethod({ result, sectionRef }: { result: ResearchResult; sectionRef?: (el: HTMLElement | null) => void }) {
  const q = result.quality;
  const m = q?.methodStats;
  const d = q?.dateChecks;
  const tiers = q?.sourceTiers;
  const comp = q?.competitorFilter ?? [];
  const keptComp = comp.filter((c) => c.kept).length;
  return (
    <section ref={sectionRef} className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24">
      <div className="px-8 py-6 border-b border-border bg-secondary/50">
        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          How this research was done
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{AI_CAVEAT}</p>
      </div>
      <div className="p-8 space-y-8">
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              <div>
                <div className="text-sm font-bold text-foreground">{s.title}</div>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        {(m || d || tiers) && (
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">This report in numbers</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat value={result.sources.length} label="sources cited" />
              {tiers && <Stat value={`${tiers.primary} / ${tiers.major} / ${tiers.other}`} label="primary / major press / other" />}
              {m && <Stat value={m.evidenceFound} label="facts found in search results" />}
              {m && <Stat value={m.evidenceUsed} label="facts used after checks" />}
              {m && m.evidenceRemovedByChecks > 0 && <Stat value={m.evidenceRemovedByChecks} label="facts removed by the date and source checks" />}
              {d && <Stat value={d.confirmed} label="dated statements confirmed on the cited page" />}
              {d && <Stat value={d.corroborated} label="events confirmed by a primary source" />}
              {m && <Stat value={m.claimsChecked} label="statements independently checked" />}
              {m && <Stat value={m.statementsDropped} label="statements removed by validation" />}
              {comp.length > 0 && <Stat value={`${keptComp} of ${comp.length}`} label="competitor candidates kept" />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
