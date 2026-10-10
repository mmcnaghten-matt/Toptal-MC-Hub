// Client-side orchestration of the Industry Insights refresh.
//
// The refresh is built from small independent requests to the `refresh-industry-insights` function: one grounded
// research scan per topic, a ledger that turns the scans into numbered evidence, evidence-only synthesis of the
// overview/challenges, initiatives and needs, MC offer mapping, and a final assembly with citations and sources.
// Each request has its own 150s budget and only the piece that fails is retried.
//
// No framework or Supabase imports so it can be tested on its own: callers pass `call`.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type StepCall = (body: Record<string, unknown>) => Promise<any>;
export type ChipStatus = "pending" | "running" | "done" | "retried" | "failed";
export interface ProgressChip {
  id: string;
  label: string;
  status: ChipStatus;
}

export interface IndustryResearchOptions {
  call: StepCall;
  subIndustryName: string;
  industryName: string;
  /** Plain-words definition of what the sub-sector means in our model; overrides other readings of the name. */
  scope?: string;
  onProgress?: (chips: ProgressChip[]) => void;
  /** Max requests in flight at once. */
  concurrency?: number;
  /** Wait before a retry. */
  retryDelayMs?: number;
}

export interface IndustryResearchResult {
  overview: string;
  challenges: string[];
  initiatives: string[];
  needs: { name: string; signals: string[]; mcOffers: string[]; narrative: string }[];
  sources: { id: number; title: string; url: string }[];
  researchedAt: string;
  quality?: {
    scans?: { topic: string; status: string; ms: number; segments: number; retried: boolean }[];
    warnings?: string[];
    droppedCount?: number;
    dropped?: { path: string; reason: string; text: string }[];
    evidenceCount?: number;
    sourceCount?: number;
    sourcesDroppedByType?: number;
    sourceTiers?: { primary: number; major: number; other: number };
    verifier?: string;
  };
}

const TOPICS = ["market", "regulation", "technology_ai", "workforce", "competition_ma", "buyers", "moves"];
const CHIPS: { id: string; label: string }[] = [
  { id: "research", label: "Research" },
  { id: "overview", label: "Overview & challenges" },
  { id: "initiatives", label: "Initiatives" },
  { id: "needs", label: "Needs" },
  { id: "offers", label: "MC offers" },
  { id: "report", label: "Final report" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const retryable = (e: any) => e?.status === undefined || [429, 502, 503, 504].includes(e.status);

export async function runIndustryResearch(opts: IndustryResearchOptions): Promise<IndustryResearchResult> {
  const { call, subIndustryName, industryName, onProgress } = opts;
  const retryDelay = opts.retryDelayMs ?? 1500;
  const limit = opts.concurrency ?? 5;
  const names = { subIndustryName, industryName, scope: opts.scope ?? "" };

  // ---- progress chips ----
  const chips = new Map<string, { id: string; label: string; status: ChipStatus; open: number; retried: boolean; failed: boolean }>(
    CHIPS.map((c) => [c.id, { ...c, status: "pending", open: 0, retried: false, failed: false }]),
  );
  const emit = () => onProgress?.([...chips.values()].map(({ id, label, status }) => ({ id, label, status })));
  const begin = (id: string) => {
    const c = chips.get(id)!;
    c.open++;
    c.status = "running";
    emit();
  };
  const end = (id: string, o: { retried?: boolean; failed?: boolean } = {}) => {
    const c = chips.get(id)!;
    c.open = Math.max(0, c.open - 1);
    c.retried ||= !!o.retried;
    c.failed ||= !!o.failed;
    if (c.open === 0) c.status = c.failed ? "failed" : c.retried ? "retried" : "done";
    emit();
  };

  // ---- concurrency pool + one retry on transport / gateway errors ----
  let active = 0;
  const queue: (() => void)[] = [];
  const pooled = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= limit) await new Promise<void>((r) => queue.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
  const attempt = async (body: Record<string, unknown>): Promise<{ data: any; retried: boolean }> => {
    try {
      return { data: await pooled(() => call(body)), retried: false };
    } catch (e) {
      if (!retryable(e)) throw e;
      await sleep(retryDelay);
      return { data: await pooled(() => call(body)), retried: true };
    }
  };

  const warnings: string[] = [];
  const dropped: any[] = [];
  const scanLog: { topic: string; status: string; ms: number; segments: number; retried: boolean }[] = [];
  const segmentsOf = (slice: any) => slice?.meta?.groundingSupports?.length ?? 0;

  // ---- 1. research scans ----
  const scan = async (topic: string): Promise<any | null> => {
    begin("research");
    let slice: any = null;
    let retried = false;
    try {
      const r = await attempt({ step: "scan", topic, ...names });
      slice = r.data?.slice;
      retried = r.retried;
      if (!slice || slice.status === "failed" || segmentsOf(slice) === 0) {
        retried = true;
        const r2 = await attempt({ step: "scan", topic, ...names });
        if (r2.data?.slice && segmentsOf(r2.data.slice) >= segmentsOf(slice)) slice = r2.data.slice;
      }
    } catch (e) {
      slice = { topic, status: "failed", ms: 0, error: errMsg(e), meta: null };
    }
    const failed = !slice || slice.status === "failed" || segmentsOf(slice) === 0;
    scanLog.push({ topic, status: slice?.status ?? "failed", ms: slice?.ms ?? 0, segments: segmentsOf(slice), retried });
    if (failed) warnings.push(`Research on "${topic}" found nothing${slice?.error ? ` (${slice.error})` : ""}; related content may be thin.`);
    end("research", { retried, failed });
    return slice?.meta ? slice : null;
  };
  const slices = (await Promise.all(TOPICS.map(scan))).filter(Boolean);

  // ---- 2. ledger (fatal: no evidence, nothing to write) ----
  const ledger = await attempt({ step: "ledger", slices, ...names });
  const state = ledger.data.state;

  // ---- 3. synthesis: overview+challenges and initiatives in parallel ----
  const synth = async (chip: string, body: Record<string, unknown>): Promise<any | null> => {
    begin(chip);
    try {
      const r = await attempt({ step: "synth", state, ...body });
      if (r.data?.dropped?.length) dropped.push(...r.data.dropped);
      if (r.data?.warnings?.length) warnings.push(...r.data.warnings);
      end(chip, { retried: r.retried, failed: !r.data?.ok });
      return r.data?.ok ? r.data : null;
    } catch (e) {
      warnings.push(`Synthesis (${body.part}) failed (${errMsg(e)}).`);
      end(chip, { failed: true });
      return null;
    }
  };
  const [ov, ini] = await Promise.all([synth("overview", { part: "overview" }), synth("initiatives", { part: "initiatives" })]);
  if (!ov && !ini) throw new Error("The research did not produce usable results. Try again.");

  // ---- 4. needs, derived from the validated challenges and initiatives ----
  const needsRes = await synth("needs", { part: "needs", challenges: ov?.challenges ?? [], initiatives: ini?.initiatives ?? [] });
  const needs: any[] = needsRes?.needs ?? [];

  // ---- 5. MC offers (separate from writing the needs) ----
  let offers: any[] = [];
  if (needs.length) {
    begin("offers");
    try {
      const r = await attempt({ step: "offers", needs });
      if (r.data?.warnings?.length) warnings.push(...r.data.warnings);
      offers = r.data?.offers ?? [];
      end("offers", { retried: r.retried, failed: !r.data?.ok });
    } catch (e) {
      warnings.push(`MC offer mapping failed (${errMsg(e)}).`);
      end("offers", { failed: true });
    }
  } else {
    end("offers");
  }

  // ---- 6. final report (fatal on failure) ----
  begin("report");
  try {
    const r = await attempt({
      step: "report", state,
      overview: ov?.overview ?? null, challenges: ov?.challenges ?? [], initiatives: ini?.initiatives ?? [],
      needs, offers, dropped, scanLog, clientWarnings: warnings,
    });
    end("report", { retried: r.retried });
    return r.data as IndustryResearchResult;
  } catch (e) {
    end("report", { failed: true });
    throw e;
  }
}
