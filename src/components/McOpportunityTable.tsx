import { Rich } from "@/components/Cited";
import { AiLedChip } from "@/components/AiLedChip";
import { OfferingPill } from "@/components/OfferingPill";
import { groupNeeds } from "@/lib/needGrouping";
import type { ResearchResult } from "@/services/geminiService";

type Opportunity = ResearchResult["mcOpportunities"][number];

const HEAD = "py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest";

function Row({ opp }: { opp: Opportunity }) {
  return (
    <tr className="hover:bg-secondary/30 transition-colors">
      <td className="py-4 px-4 text-sm font-bold text-foreground">{opp.initiative}</td>
      <td className="py-4 px-4 text-sm text-foreground">{opp.need}</td>
      <td className="py-4 px-4">
        <OfferingPill value={opp.serviceOffering} />
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground italic break-words">"<Rich>{opp.rationale}</Rich>"</td>
    </tr>
  );
}

/**
 * The MC opportunities for a client. When the report tags them with client agendas (reports made since the agenda update), they are
 * grouped by service area and then agenda, as on Industry Insights; an older report has no agendas and shows the flat table it always did.
 */
export function McOpportunityTable({ opportunities }: { opportunities: Opportunity[] }) {
  const tagged = opportunities.some((o) => o.agenda);
  const grouped = tagged ? groupNeeds(opportunities.map((o) => ({ ...o, mcOffers: [o.serviceOffering] }))) : null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className={HEAD}>Initiative</th>
            <th className={HEAD}>Need</th>
            <th className={HEAD}>Service Offering</th>
            <th className={HEAD}>Rationale</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {!grouped && opportunities.map((opp, i) => <Row key={i} opp={opp} />)}
          {grouped?.areas.map(({ area, agendas, count }) => [
            <tr key={`area-${area.id}`} data-testid={`mc-area-${area.id}`}>
              <td colSpan={4} className="px-4 pb-1 pt-6" style={{ borderLeft: `4px solid ${area.color.text}` }}>
                <span className="text-base font-bold" style={{ color: area.color.text }}>{area.name}</span>
                <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: area.color.bg, color: area.color.text }}>{count}</span>
              </td>
            </tr>,
            ...agendas.flatMap(({ agenda, needs }) => [
              <tr key={`agenda-${area.id}-${agenda?.id ?? "other"}`} data-testid={`mc-agenda-${area.id}-${agenda?.id ?? "other"}`}>
                <td colSpan={4} className="px-4 py-2" style={{ backgroundColor: agenda ? `${area.color.text}14` : undefined, borderLeft: `4px solid ${area.color.text}` }}>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: agenda ? area.color.text : undefined }}>
                      {agenda ? "Client agenda" : "Not tied to an agenda"}
                    </span>
                    {agenda?.aiLed && <AiLedChip color={area.color.text} />}
                    <span className={agenda ? "text-sm font-bold" : "text-sm font-semibold text-muted-foreground"} style={{ color: agenda ? area.color.text : undefined }}>
                      {agenda ? agenda.label : "Other opportunities in this practice"}
                    </span>
                  </span>
                </td>
              </tr>,
              ...needs.map((opp, i) => <Row key={`${area.id}-${agenda?.id ?? "other"}-${i}`} opp={opp} />),
            ]),
          ])}
          {grouped && grouped.other.length > 0 && [
            <tr key="other-head">
              <td colSpan={4} className="px-4 pb-1 pt-6 text-base font-bold text-foreground">Other opportunities</td>
            </tr>,
            ...grouped.other.map((opp, i) => <Row key={`other-${i}`} opp={opp} />),
          ]}
        </tbody>
      </table>
    </div>
  );
}
