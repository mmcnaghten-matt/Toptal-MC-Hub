// Client-side orchestration of the Client Insights research pipeline.
//
// The report is built from many small independent requests to the `gemini-research` function (one scan per topic,
// one fact-extraction call per section, three analysis calls, one final report call). Each request has its own
// 150s Supabase budget, only the piece that fails is retried, and a section that still fails degrades to a
// placeholder instead of taking the whole report down.
//
// This module has no framework or Supabase imports so it can be tested on its own: callers pass `call`.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type StepCall = (body: Record<string, unknown>) => Promise<any>;
export type ChipStatus = "pending" | "running" | "done" | "retried" | "failed";
export interface ProgressChip {
  id: string;
  label: string;
  status: ChipStatus;
}

export interface PipelineOptions {
  call: StepCall;
  companyName: string;
  deepResearch: boolean;
  onProgress?: (chips: ProgressChip[]) => void;
  /** Max requests in flight at once (keeps Gemini rate limits happy). */
  concurrency?: number;
  /** Wait before a retry. */
  retryDelayMs?: number;
}

const SCANS: { topic: string; chip: string; label: string }[] = [
  { topic: "performance", chip: "financials", label: "Financials" },
  { topic: "strategy_1", chip: "strategy", label: "Strategy" },
  { topic: "strategy_2", chip: "strategy", label: "Strategy" },
  { topic: "strategy_3", chip: "strategy", label: "Strategy" },
  { topic: "market", chip: "market", label: "Market" },
  { topic: "competitors", chip: "competitors", label: "Competitors" },
  { topic: "customer_praise", chip: "customers", label: "Customer praise" },
  { topic: "customer_complaints", chip: "customers", label: "Customer complaints" },
];

/** One market scan per current reporting segment (at most this many). */
const MAX_SEGMENT_SCANS = 4;

const CHIPS: { id: string; label: string }[] = [
  { id: "company", label: "Company" },
  { id: "financials", label: "Financials" },
  { id: "strategy", label: "Strategy" },
  { id: "market", label: "Market" },
  { id: "customers", label: "Customers" },
  { id: "competitors", label: "Competitors" },
  { id: "analysis", label: "Analysis" },
  { id: "report", label: "Final report" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
// Transport problems and gateway/rate-limit statuses are worth one more try; 4xx answers from the function are not.
const retryable = (e: any) => e?.status === undefined || [429, 502, 503, 504].includes(e.status);

export async function runResearch(opts: PipelineOptions): Promise<any> {
  const { call, companyName, deepResearch, onProgress } = opts;
  const retryDelay = opts.retryDelayMs ?? 1500;
  const limit = opts.concurrency ?? 5;

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

  // ---- concurrency pool ----
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

  // One call with a single retry on transport / gateway errors.
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
  const scanLog: { topic: string; status: string; ms: number; segments: number; retried: boolean }[] = [];
  const segmentsOf = (slice: any) => slice?.meta?.groundingSupports?.length ?? 0;

  // ---- 1. company (fatal on failure) ----
  begin("company");
  let entityRes: any;
  try {
    entityRes = (await attempt({ step: "entity", companyName })).data;
  } catch (e) {
    end("company", { failed: true });
    throw e;
  }
  end("company");
  const entity = entityRes.entity;
  warnings.push(...(entityRes.warnings ?? []));

  // ---- 2. scans ----
  const scan = async (chip: string, topic: string, label: string, name?: string, segment?: string): Promise<any | null> => {
    begin(chip);
    const body: Record<string, unknown> = name
      ? { step: "scan", topic: "competitor", name, entity }
      : segment
      ? { step: "scan", topic: "market_segment", segment, entity }
      : { step: "scan", topic, entity };
    let slice: any = null;
    let retried = false;
    try {
      let r = await attempt(body);
      slice = r.data?.slice;
      retried = r.retried;
      if (!slice || slice.status === "failed" || segmentsOf(slice) === 0) {
        retried = true;
        const r2 = await attempt(body);
        if (r2.data?.slice && segmentsOf(r2.data.slice) >= segmentsOf(slice)) slice = r2.data.slice;
      }
    } catch (e) {
      slice = { topic: name ? `competitor:${name}` : segment ? `market:${segment}` : topic, status: "failed", ms: 0, error: errMsg(e), meta: null };
    }
    const failed = !slice || slice.status === "failed" || segmentsOf(slice) === 0;
    scanLog.push({ topic: slice?.topic ?? topic, status: slice?.status ?? "failed", ms: slice?.ms ?? 0, segments: segmentsOf(slice), retried });
    if (failed) warnings.push(`Research on "${label}" found nothing${slice?.error ? ` (${slice.error})` : ""}; related sections may be empty.`);
    end(chip, { retried, failed });
    return slice?.meta ? slice : null;
  };

  const profileSlice = entityRes.slice?.meta ? entityRes.slice : null;
  const segmentSlice = entityRes.segmentSlice?.meta ? entityRes.segmentSlice : null;
  const segments: { name: string }[] = (entity.segments ?? []).slice(0, MAX_SEGMENT_SCANS);
  const scanned = await Promise.all([
    ...SCANS.map((s) => scan(s.chip, s.topic, s.label)),
    // Market size is researched per current segment, so a business the company has sold is not mistaken for a market it is in.
    ...segments.map((g) => scan("market", "market_segment", `Market: ${g.name}`, undefined, g.name)),
  ]);

  // ---- 3. ledger (fatal: no evidence, no report) ----
  const ledger1 = await attempt({ step: "ledger", entity, companyName, slices: [profileSlice, segmentSlice, ...scanned].filter(Boolean) });
  const state1 = ledger1.data.state;

  // ---- 4. fact sections ----
  const factsSection = async (chip: string, section: string, state: any, label: string) => {
    begin(chip);
    try {
      const r = await attempt({ step: "facts_section", section, state });
      end(chip, { retried: r.retried, failed: !r.data?.ok });
      if (!r.data?.ok) warnings.push(`${label}: fact extraction did not complete.`);
      return r.data;
    } catch (e) {
      warnings.push(`${label}: fact extraction failed (${errMsg(e)}).`);
      end(chip, { failed: true });
      return { section, ok: false };
    }
  };
  const branchB = [
    factsSection("financials", "performance", state1, "Financials"),
    factsSection("strategy", "strategy", state1, "Strategy"),
    factsSection("market", "market_size", state1, "Market size"),
    factsSection("market", "market_dynamics", state1, "Market drivers"),
    factsSection("customers", "customer", state1, "Customers"),
  ];

  // ---- 5. competitors: identify -> one scan each -> extend ledger -> facts ----
  let competitorFilter: any[] = [];
  const branchA = (async () => {
    begin("competitors");
    let state2 = state1;
    try {
      const idn = (await attempt({ step: "identify", state: state1 })).data;
      const competitors: { name: string; kind: string }[] = idn.competitors ?? [];
      competitorFilter = idn.filter ?? [];
      if (idn.warnings?.length) warnings.push(...idn.warnings);
      const compSlices = await Promise.all(competitors.map((c) => scan("competitors", "competitor", c.name, c.name)));
      const slices = [...(idn.slices ?? []), ...compSlices].filter((x) => x?.meta);
      const withCompetitors = { ...state1, competitors, validatedCompetitors: idn.validated ?? competitors };
      state2 = slices.length
        ? (await attempt({ step: "ledger", state: withCompetitors, slices })).data.state
        : withCompetitors;
      if (!competitors.length) warnings.push("No competitors could be identified, so competitor deep dives rely on general research only.");
    } catch (e) {
      warnings.push(`Competitor research failed (${errMsg(e)}); continuing without it.`);
    }
    end("competitors");
    const facts = await factsSection("competitors", "competitors", state2, "Competitors");
    return { state2, facts };
  })();

  const { state2, facts: factsComp } = await branchA;

  // ---- 6. analysis (needs only the evidence) ----
  begin("analysis");
  const analysisPart = async (part: string) => {
    try {
      const r = await attempt({ step: "analysis_part", part, state: state2, deepResearch });
      if (r.data?.warnings?.length) warnings.push(...r.data.warnings);
      return r.data?.ok ? r.data.raw : null;
    } catch (e) {
      warnings.push(`Analysis (${part}) failed (${errMsg(e)}).`);
      return null;
    }
  };
  const [core, frameworks, recs] = await Promise.all([analysisPart("core"), analysisPart("frameworks"), analysisPart("recs")]);
  end("analysis", { failed: !core || !frameworks || !recs });

  const parts = [...(await Promise.all(branchB)), factsComp];

  // ---- 7. final report (fatal on failure) ----
  begin("report");
  try {
    const r = await attempt({
      step: "report", state: state2, parts, raw: { core, frameworks, recs }, deepResearch, clientWarnings: warnings, scanLog, competitorFilter,
    });
    end("report", { retried: r.retried });
    return r.data;
  } catch (e) {
    end("report", { failed: true });
    throw e;
  }
}
