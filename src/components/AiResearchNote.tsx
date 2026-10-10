import { Sparkles } from "lucide-react";

// Display-only: this text is part of the page, never part of the content saved in the database.
export const INDUSTRY_AI_CAVEAT =
  "AI-assisted, directional view of the industry: it shows where the sector is heading, not precise measurements. Researched content cites its sources and is checked against them, but it may contain minor errors. Verify before using with a client.";

/** Caveat for Industry Insights pages. `compact` is the one-line version (no method details). */
export function AiResearchNote({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
      <p className="flex items-start gap-2 leading-relaxed">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>{INDUSTRY_AI_CAVEAT}</span>
      </p>
      {!compact && (
        <details className="mt-2 pl-5">
          <summary className="cursor-pointer font-semibold text-foreground">How this was researched</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
            <li>Public web search runs per topic (market, regulation, technology, workforce, competition, buyers, programs and moves).</li>
            <li>Every statement is tied to a search result. Sources are ranked: regulators and company filings first, then major press and analyst firms; social media, stock-data sites and vendor marketing are left out.</li>
            <li>Challenges and needs are interpretation of that evidence; figures are shown only when they appear in the cited sources, and initiatives must be recent.</li>
            <li>A second model pass checks statements against their sources, and anything it cannot support is removed. The numbered sources at the bottom are what the statements rest on.</li>
          </ul>
        </details>
      )}
    </div>
  );
}
