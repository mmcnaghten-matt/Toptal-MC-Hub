import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { industries } from "@/data/industryData";
import { useAllIndustryContent, useIndustryScopes, useRefreshContent, useSaveContent } from "@/hooks/useIndustryContent";
import type { IndustryResearchResult, ProgressChip } from "@/services/industryResearchPipeline";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgressChips } from "@/components/ProgressChips";
import { RefreshPreview } from "@/components/RefreshPreview";

type Status = "queued" | "running" | "draft" | "failed" | "applied" | "skipped";
interface Row {
  subId: string;
  subName: string;
  industryId: string;
  industryName: string;
  status: Status;
  content?: IndustryResearchResult;
  error?: string;
}

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : null);

// A draft is "clean" when it has no warnings and the usual amount of content.
const isClean = (c?: IndustryResearchResult) =>
  !!c && (c.quality?.warnings?.length ?? 0) === 0 && c.challenges.length >= 3 && c.initiatives.length >= 3 && c.needs.length >= 5;

export function MultiRefreshDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: stored } = useAllIndustryContent();
  const { data: scopes } = useIndustryScopes();
  const refresh = useRefreshContent();
  const save = useSaveContent();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [chips, setChips] = useState<ProgressChip[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const stopRef = useRef(false);

  const lastBySub = useMemo(() => {
    const m = new Map<string, { researchedAt?: string | null; updatedAt?: string }>();
    (stored ?? []).forEach((r) => m.set(r.sub_industry_id, { researchedAt: r.researched_at, updatedAt: r.updated_at }));
    return m;
  }, [stored]);

  // Warn before leaving the page while a run is going or drafts are unapplied.
  const hasUnapplied = running || rows.some((r) => r.status === "draft");
  useEffect(() => {
    if (!hasUnapplied) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hasUnapplied]);

  const patch = (subId: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.subId === subId ? { ...r, ...p } : r)));

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  const allSubs = industries.flatMap((i) => i.subIndustries.map((s) => ({ ...s, industryId: i.id, industryName: i.name })));
  const neverResearched = allSubs.filter((s) => !lastBySub.get(s.id)?.researchedAt).map((s) => s.id);

  const start = async () => {
    const queue: Row[] = allSubs.filter((s) => selected.has(s.id)).map((s) => ({
      subId: s.id, subName: s.name, industryId: s.industryId, industryName: s.industryName, status: "queued",
    }));
    if (!queue.length) return;
    stopRef.current = false;
    setRows(queue);
    setReviewId(null);
    setRunning(true);
    for (const q of queue) {
      if (stopRef.current) {
        patch(q.subId, { status: "skipped" });
        continue;
      }
      patch(q.subId, { status: "running" });
      setChips([]);
      try {
        const content = await refresh.mutateAsync({
          subIndustryId: q.subId, subIndustryName: q.subName, industryName: q.industryName, scope: scopes?.get(q.subId), onProgress: setChips,
        });
        patch(q.subId, { status: "draft", content });
      } catch (e) {
        patch(q.subId, { status: "failed", error: e instanceof Error ? e.message : String(e) });
      }
    }
    setRunning(false);
    setChips([]);
  };

  const apply = async (r: Row) => {
    if (!r.content) return;
    try {
      await save.mutateAsync({
        subIndustryId: r.subId, industryId: r.industryId, subIndustryName: r.subName, industryName: r.industryName,
        content: {
          overview: r.content.overview, challenges: r.content.challenges, initiatives: r.content.initiatives, needs: r.content.needs,
          sources: r.content.sources, researchedAt: r.content.researchedAt,
        },
        silent: true,
      });
      patch(r.subId, { status: "applied" });
      return true;
    } catch (e) {
      patch(r.subId, { error: e instanceof Error ? e.message : String(e) });
      toast.error(`Could not save ${r.subName}: ${e instanceof Error ? e.message : e}`);
      return false;
    }
  };

  const applyClean = async () => {
    setApplyingAll(true);
    let n = 0;
    for (const r of rows) if (r.status === "draft" && isClean(r.content) && (await apply(r))) n++;
    setApplyingAll(false);
    toast.success(`Applied ${n} draft${n === 1 ? "" : "s"}`);
  };

  const reviewing = rows.find((r) => r.subId === reviewId);
  const drafts = rows.filter((r) => r.status === "draft");
  const cleanCount = drafts.filter((r) => isClean(r.content)).length;
  const started = rows.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Multi-update: research several sub-sectors</DialogTitle>
          <DialogDescription>
            Each sub-sector is researched one at a time (about 3 minutes each) and held as a draft. Nothing changes for sellers until you apply it. Keep this tab open.
          </DialogDescription>
        </DialogHeader>

        {reviewing?.content ? (
          <div className="space-y-3">
            <Button variant="outline" size="sm" onClick={() => setReviewId(null)}>Back to results</Button>
            <p className="font-semibold text-foreground">{reviewing.industryName} · {reviewing.subName}</p>
            <RefreshPreview
              content={reviewing.content}
              applying={save.isPending}
              onApply={async () => {
                if (await apply(reviewing)) setReviewId(null);
              }}
              onDiscard={() => {
                patch(reviewing.subId, { status: "skipped", content: undefined });
                setReviewId(null);
              }}
            />
          </div>
        ) : !started ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set(allSubs.map((s) => s.id)))}>Select all</Button>
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set(neverResearched))}>Select never researched ({neverResearched.length})</Button>
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
              <span className="ml-auto text-sm text-muted-foreground">{selected.size} selected</span>
            </div>
            {industries.map((ind) => {
              const ids = ind.subIndustries.map((s) => s.id);
              const all = ids.every((id) => selected.has(id));
              const some = ids.some((id) => selected.has(id));
              return (
                <div key={ind.id} className="rounded-lg border border-border">
                  <label className="flex items-center gap-3 border-b border-border bg-secondary/50 px-4 py-2 font-semibold text-foreground">
                    <Checkbox
                      checked={all ? true : some ? "indeterminate" : false}
                      onCheckedChange={(v) => ids.forEach((id) => toggle(id, v === true))}
                    />
                    {ind.name}
                  </label>
                  <ul className="divide-y divide-border">
                    {ind.subIndustries.map((s) => {
                      const last = lastBySub.get(s.id);
                      const label = last?.researchedAt
                        ? `Researched ${fmtDate(last.researchedAt)}`
                        : last?.updatedAt
                        ? `Updated ${fmtDate(last.updatedAt)} (not researched)`
                        : "Built-in content (never updated)";
                      return (
                        <li key={s.id}>
                          <label className="flex items-center gap-3 px-4 py-2 text-sm">
                            <Checkbox checked={selected.has(s.id)} onCheckedChange={(v) => toggle(s.id, v === true)} />
                            <span className="flex-1 text-foreground">{s.name}</span>
                            <span className={last?.researchedAt ? "text-muted-foreground" : "text-amber-600"}>{label}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            <div className="flex justify-end">
              <Button onClick={start} disabled={selected.size === 0}>
                <Play className="mr-1 h-4 w-4" /> Run {selected.size} sub-sector{selected.size === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {running ? (
                <Button variant="outline" size="sm" onClick={() => { stopRef.current = true; }}>
                  <Square className="mr-1 h-4 w-4" /> Stop after the current one
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { setRows([]); setReviewId(null); }}>New selection</Button>
              )}
              <Button size="sm" onClick={applyClean} disabled={running || applyingAll || cleanCount === 0}>
                {applyingAll && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Apply all clean drafts ({cleanCount})
              </Button>
              <span className="ml-auto text-sm text-muted-foreground">
                {rows.filter((r) => r.status === "applied").length} applied · {drafts.length} drafts · {rows.filter((r) => r.status === "failed").length} failed
              </span>
            </div>
            {running && (
              <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-medium text-foreground">
                  Researching {rows.find((r) => r.status === "running")?.subName ?? "..."}
                </p>
                <ProgressChips chips={chips} />
              </div>
            )}
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-bold">Sub-sector</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                    <th className="px-3 py-2 font-bold">Result</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => {
                    const c = r.content;
                    return (
                      <tr key={r.subId}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground">{r.subName}</p>
                          <p className="text-xs text-muted-foreground">{r.industryName}</p>
                        </td>
                        <td className="px-3 py-2">
                          {r.status === "running" ? (
                            <span className="inline-flex items-center gap-1 text-primary"><Loader2 className="h-3 w-3 animate-spin" /> running</span>
                          ) : r.status === "failed" ? (
                            <span className="text-red-600">failed</span>
                          ) : r.status === "applied" ? (
                            <span className="text-green-700">applied</span>
                          ) : r.status === "draft" ? (
                            <span className={isClean(c) ? "text-green-700" : "text-amber-600"}>{isClean(c) ? "draft" : "draft · review"}</span>
                          ) : (
                            <span className="text-muted-foreground">{r.status}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {c
                            ? `${c.challenges.length} challenges · ${c.initiatives.length} initiatives · ${c.needs.length} needs · ${c.sources.length} sources · ${c.quality?.droppedCount ?? 0} dropped · ${c.quality?.warnings?.length ?? 0} warnings`
                            : r.error ?? ""}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.status === "draft" && (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => setReviewId(r.subId)}>Review</Button>
                              <Button size="sm" onClick={() => apply(r)} disabled={save.isPending || applyingAll}>Apply</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
