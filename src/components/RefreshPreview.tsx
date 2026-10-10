import { Eye, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rich, SourcesList, SourcesProvider } from "@/components/Cited";
import type { IndustryResearchResult } from "@/services/industryResearchPipeline";

interface Props {
  content: IndustryResearchResult;
  applying: boolean;
  onApply: () => void;
  onDiscard: () => void;
}

// Admin preview of a refresh: the new content with citations and sources, plus what was dropped and why.
export function RefreshPreview({ content, applying, onApply, onDiscard }: Props) {
  const q = content.quality;
  return (
    <SourcesProvider sources={content.sources}>
    <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Eye className="h-4 w-4" /> Researched Preview
          {content.researchedAt && (
            <span className="text-xs font-normal text-muted-foreground">
              {new Date(content.researchedAt).toLocaleDateString("en-US")} · {content.sources.length} sources
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={onApply} disabled={applying}>
            {applying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Apply & Save
          </Button>
          <Button variant="outline" size="sm" onClick={onDiscard}>
            Discard
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Overview</p>
        <p className="text-sm text-foreground"><Rich>{content.overview || "(none passed validation)"}</Rich></p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Challenges ({content.challenges.length})</p>
          <ul className="space-y-1">{content.challenges.map((c, i) => <li key={i} className="text-sm text-foreground">• <Rich>{c}</Rich></li>)}</ul>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Initiatives ({content.initiatives.length})</p>
          <ul className="space-y-1">{content.initiatives.map((c, i) => <li key={i} className="text-sm text-foreground">• <Rich>{c}</Rich></li>)}</ul>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Needs ({content.needs.length})</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {content.needs.map((need, i) => (
            <div key={i} className="rounded border border-border p-3 space-y-1">
              <p className="font-medium text-sm text-foreground">{need.name}</p>
              <p className="text-xs text-muted-foreground">Signals: {need.signals.join(", ")}</p>
              <p className="text-xs text-primary">Offers: {need.mcOffers.join(", ")}</p>
              <p className="text-xs text-muted-foreground italic"><Rich>{need.narrative}</Rich></p>
            </div>
          ))}
        </div>
      </div>

      <SourcesList sources={content.sources} />

      {q && (
        <details className="rounded-lg border border-border bg-card text-sm">
          <summary className="cursor-pointer px-4 py-3 font-semibold text-foreground">
            Research log ({q.droppedCount ?? 0} dropped · {q.warnings?.length ?? 0} warnings)
          </summary>
          <div className="space-y-4 border-t border-border p-4 text-xs">
            {q.sourceTiers && (
              <p className="text-muted-foreground">
                Cited sources: {q.sourceTiers.primary} primary · {q.sourceTiers.major} major press or analyst · {q.sourceTiers.other} other
                {q.sourcesDroppedByType ? ` · ${q.sourcesDroppedByType} facts dropped because their sources were social media, forums or similar` : ""}
                {q.verifier ? ` · verifier: ${q.verifier}` : ""}
              </p>
            )}
            {q.scans && q.scans.length > 0 && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border uppercase tracking-widest text-muted-foreground">
                    <th className="py-1.5 pr-4 font-bold">Scan</th>
                    <th className="py-1.5 pr-4 font-bold">Status</th>
                    <th className="py-1.5 pr-4 font-bold">Cited segments</th>
                    <th className="py-1.5 font-bold">Retried</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {q.scans.map((s, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-4 font-medium text-foreground">{s.topic}</td>
                      <td className={s.status === "failed" ? "py-1 pr-4 text-red-600" : s.status === "thin" ? "py-1 pr-4 text-amber-600" : "py-1 pr-4 text-green-700"}>{s.status}</td>
                      <td className="py-1 pr-4 tabular-nums">{s.segments}</td>
                      <td className="py-1">{s.retried ? "yes" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {q.dateChecks && (
              <div>
                <p className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">Date checks</p>
                <p className="text-muted-foreground">
                  {q.dateChecks.confirmed} dated events confirmed on the cited page · {q.dateChecks.unverified} could not be checked (kept) · {q.dateChecks.dropped.length} removed
                </p>
                {q.dateChecks.dropped.length > 0 && (
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {q.dateChecks.dropped.slice(0, 30).map((d, i) => (
                      <li key={i}>
                        <span className="font-medium text-foreground">{d.reason}</span>: <span className="italic">{d.text.slice(0, 140)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {q.topUps && q.topUps.length > 0 && (
              <p className="text-muted-foreground">Thin lists were topped up with a second pass: {q.topUps.join(" · ")}</p>
            )}
            {q.repaired && q.repaired.length > 0 && (
              <div>
                <p className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">
                  Rewritten without unsupported figures ({q.repaired.length})
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {q.repaired.slice(0, 30).map((r, i) => (
                    <li key={i}>
                      <span className="font-medium text-foreground">{r.path}</span>: <span className="line-through">{r.before.slice(0, 120)}</span> → {r.after.slice(0, 140)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {q.dropped && q.dropped.length > 0 && (
              <div>
                <p className="mb-1 font-bold uppercase tracking-widest text-muted-foreground">Dropped by validation</p>
                <ul className="space-y-1 text-muted-foreground">
                  {q.dropped.slice(0, 60).map((d, i) => (
                    <li key={i}>
                      <span className="font-medium text-foreground">{d.path}</span> — {d.reason}: <span className="italic">{d.text.slice(0, 140)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {q.warnings && q.warnings.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {q.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
          </div>
        </details>
      )}
    </div>
    </SourcesProvider>
  );
}
