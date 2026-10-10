const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Official MC taxonomy: L2 practice > L3 offering, with the canonical L3 description.
// An offer is stored on a need as the string "L2 > L3" (see offerKey) because
// Change Management and Program & Portfolio Management repeat under every L2.
const CATALOG: { l2: string; l3: string; description: string }[] = [
  { l2: "Strategy & Transformation", l3: "Corporate Strategy", description: "Enterprise-level strategy that defines where and how the company competes, including strategic planning, business portfolio choices, market entry, and enterprise growth strategy." },
  { l2: "Strategy & Transformation", l3: "Enterprise Digital & Technology", description: "Enterprise-level advisory on how digital and technology investments enable corporate strategy, including enterprise technology strategy, digital roadmaps, and investment prioritization; technical delivery coordinated with Technology Services." },
  { l2: "Strategy & Transformation", l3: "Enterprise AI", description: "Enterprise-level AI business strategy spanning multiple functions, including AI ambition, enterprise use case prioritization, and AI adoption roadmaps; technical build coordinated with AI Services." },
  { l2: "Strategy & Transformation", l3: "Operating Model", description: "Design of the enterprise target operating model across business units and functions, including decision rights, shared services strategy, and global business services design." },
  { l2: "Strategy & Transformation", l3: "M&A & Divestitures", description: "Transaction support across the deal lifecycle, including commercial and operational due diligence, integration strategy, post-merger integration, Day One readiness, and carve-outs and separations." },
  { l2: "Strategy & Transformation", l3: "Performance Improvement", description: "Enterprise-wide cost and productivity improvement, including cost transformation, productivity assessments, operating margin improvement, and value creation roadmaps." },
  { l2: "Strategy & Transformation", l3: "Transformation Management", description: "Design of the enterprise transformation architecture, including transformation assessments, roadmaps, transformation office and governance design, and benefits frameworks." },
  { l2: "Strategy & Transformation", l3: "Change Management", description: "Change management for enterprise, cross-functional transformations, including change strategy, change readiness assessments, stakeholder alignment, and communications and adoption." },
  { l2: "Strategy & Transformation", l3: "Program & Portfolio Management", description: "Delivery and governance of enterprise programs, including enterprise PMO, program leadership, portfolio prioritization, Integration Management Offices, and benefits tracking." },
  { l2: "Finance", l3: "Finance Strategy", description: "Defines the direction of the finance function, including CFO strategy assessments, finance vision and priorities, finance transformation roadmaps, and value cases." },
  { l2: "Finance", l3: "Finance Operating Model", description: "Design of how the finance function is organized and delivered, including the finance target operating model, organization design, shared services, and global business services." },
  { l2: "Finance", l3: "Finance Processes & Operations", description: "Improvement and ongoing execution of core finance processes, including record-to-report, procure-to-pay, order-to-cash, and close management and optimization." },
  { l2: "Finance", l3: "Financial Planning & Analysis", description: "Design, improvement, and ongoing operation of financial planning and analysis, including budgeting and forecasting, management reporting, and financial analysis and business partnering." },
  { l2: "Finance", l3: "Finance Technology", description: "Advisory on finance platforms, including ERP strategy, selection, and modernization roadmaps, EPM advisory, finance platform selection, and finance automation design." },
  { l2: "Finance", l3: "Finance AI", description: "AI-specific strategy and solution design for finance, including use case prioritization, intelligent close, AI-enabled FP&A and finance operations, and agentic finance operating models." },
  { l2: "Finance", l3: "Change Management", description: "Change management for finance programs, including finance change strategy, change impact assessment, stakeholder communications, and finance learning and adoption." },
  { l2: "Finance", l3: "Program & Portfolio Management", description: "Project, program, and portfolio management for finance initiatives, including finance project managers, finance PMO, program leadership, portfolio management, and benefits tracking." },
  { l2: "Supply Chain & Operations", l3: "Supply Chain Strategy", description: "Defines supply chain direction and structure, including supply chain strategy, network design and optimization, supply chain operating model, and resilience strategy." },
  { l2: "Supply Chain & Operations", l3: "Supply Chain Planning", description: "Design and ongoing operation of supply chain planning, including demand, supply, and inventory planning, integrated business planning, and planning performance monitoring." },
  { l2: "Supply Chain & Operations", l3: "Procurement", description: "Strategy and execution of sourcing and supplier management, including procurement strategy, strategic sourcing, category management, supplier relationship management, and procurement operating model." },
  { l2: "Supply Chain & Operations", l3: "Manufacturing & Operations", description: "Improvement of plant and service operations performance, including manufacturing excellence, lean and operational excellence, service operations design, and quality and productivity improvement." },
  { l2: "Supply Chain & Operations", l3: "Logistics & Fulfillment", description: "Design and optimization of how goods reach customers, including warehouse operations, transportation strategy, distribution design, fulfillment optimization, and last-mile operations." },
  { l2: "Supply Chain & Operations", l3: "Supply Chain & Operations Technology", description: "Advisory on supply chain and operations platforms, including planning platform strategy, warehouse and transportation platform selection, operations systems roadmaps, and process automation design." },
  { l2: "Supply Chain & Operations", l3: "Supply Chain & Operations AI", description: "AI-specific strategy and solution design for supply chain and operations, including AI use cases, AI-enabled demand planning and procurement, inventory optimization, and predictive operations." },
  { l2: "Supply Chain & Operations", l3: "Change Management", description: "Change management for supply chain and operations programs, including site readiness and impact assessment, frontline adoption, and supplier and partner change enablement." },
  { l2: "Supply Chain & Operations", l3: "Program & Portfolio Management", description: "Project, program, and portfolio management for supply chain and operations initiatives, including supply chain PMO, network program leadership, operations portfolio management, and benefits tracking." },
  { l2: "Customer & Growth", l3: "Growth Strategy", description: "Defines commercial direction and go-to-market choices, including commercial strategy, go-to-market and channel strategy, pricing and revenue growth, and commercial market expansion." },
  { l2: "Customer & Growth", l3: "Customer Experience", description: "Design and improvement of the end-to-end customer experience, including CX strategy, customer journey design, voice of customer, experience measurement, and loyalty experience design." },
  { l2: "Customer & Growth", l3: "Customer Service & Success", description: "Design and ongoing delivery of customer service and success, including service strategy, contact center operating model, service and success operations, and retention and renewal management." },
  { l2: "Customer & Growth", l3: "Customer & Growth Technology", description: "Advisory on commercial platforms, including CRM strategy and selection, marketing platform strategy, customer service platform advisory, and commercial systems roadmaps." },
  { l2: "Customer & Growth", l3: "Customer & Growth AI", description: "AI-specific strategy and solution design for commercial functions, including commercial AI strategy, sales and marketing AI use cases, personalization strategy, and AI-enabled customer service." },
  { l2: "Customer & Growth", l3: "Change Management", description: "Change management for commercial programs, including commercial change strategy, sales and marketing readiness, stakeholder communications, and commercial adoption and enablement." },
  { l2: "Customer & Growth", l3: "Program & Portfolio Management", description: "Project, program, and portfolio management for commercial initiatives, including customer transformation PMO, commercial program leadership, growth portfolio management, and benefits tracking." },
  { l2: "People & Organization", l3: "Organization Strategy", description: "Aligns people and the HR function to business priorities, including people strategy, strategic people planning, future of work strategy, HR function strategy, and organization effectiveness assessment." },
  { l2: "People & Organization", l3: "Organization Design", description: "HR-led design of organization structures, including roles and decision rights, job architecture, HR operating model, and organization effectiveness design." },
  { l2: "People & Organization", l3: "Talent & Leadership", description: "Strategies and programs to attract, develop, and retain talent, including talent strategy, leadership and executive development, succession planning, and culture and leadership alignment." },
  { l2: "People & Organization", l3: "Learning & Capability Development", description: "Design, improvement, and ongoing delivery of learning programs, including learning strategy, capability assessment, reskilling strategy, AI readiness and literacy, and learning operating model." },
  { l2: "People & Organization", l3: "HR Operations & Services", description: "Design, improvement, and ongoing delivery of HR services, including HR service delivery design, employee lifecycle administration, HR shared services, and HR process improvement." },
  { l2: "People & Organization", l3: "HR Technology", description: "Advisory on HR platforms, including HRIS strategy and selection, talent platform advisory, HR systems roadmaps, and people analytics design." },
  { l2: "People & Organization", l3: "HR AI", description: "AI-specific strategy and solution design for HR, including HR AI strategy, use case prioritization, AI-enabled talent and learning processes, and HR AI adoption roadmaps." },
  { l2: "People & Organization", l3: "Change Management", description: "Change management for people and organization programs, including change strategy, organization change readiness, culture and behavior adoption, and stakeholder communications." },
  { l2: "People & Organization", l3: "Program & Portfolio Management", description: "Project, program, and portfolio management for HR and people initiatives, including people transformation PMO, organization program leadership, HR portfolio management, and benefits tracking." },
  { l2: "Risk & Compliance", l3: "Enterprise Risk Management", description: "Design and operation of enterprise risk management, including risk strategy and framework, risk appetite, risk operating model, enterprise risk assessments, risk registers, and monitoring and reporting." },
  { l2: "Risk & Compliance", l3: "Third-Party Risk Management", description: "Management of supplier and third-party risk from design through ongoing operation, including frameworks, due diligence, onboarding and risk tiering, ongoing monitoring, remediation, and reporting." },
  { l2: "Risk & Compliance", l3: "Operational Risk & Resilience", description: "Assessment and strengthening of operational resilience, including operational risk assessments, business continuity, scenario exercises, incident readiness, and resilience monitoring." },
  { l2: "Risk & Compliance", l3: "Governance & Controls", description: "Design, testing, and modernization of governance and internal controls, including governance frameworks, SOX controls advisory, controls testing and monitoring, and remediation tracking." },
  { l2: "Risk & Compliance", l3: "Compliance & Regulatory", description: "Design and operation of compliance programs, including compliance operating model, regulatory change management, policy frameworks, compliance monitoring and testing, financial crime compliance, and remediation." },
  { l2: "Risk & Compliance", l3: "Internal Audit", description: "Strategy, transformation, and execution of internal audit, including audit operating model, planning and methodology, audit execution, continuous auditing, and issue follow-up." },
  { l2: "Risk & Compliance", l3: "Risk Technology", description: "Advisory on risk and compliance platforms, including GRC platform strategy and selection, controls technology roadmaps, third-party risk platform advisory, and risk analytics design." },
  { l2: "Risk & Compliance", l3: "Risk AI", description: "AI governance and AI-specific solution design for risk, including AI risk and controls frameworks, AI use cases for risk, intelligent controls design, and AI-enabled compliance and audit." },
  { l2: "Risk & Compliance", l3: "Change Management", description: "Change management for risk and compliance programs, including change strategy, risk culture and adoption, policy change enablement, and controls training and adoption." },
  { l2: "Risk & Compliance", l3: "Program & Portfolio Management", description: "Project, program, and portfolio management for risk and compliance initiatives, including regulatory program PMO, risk program leadership, risk portfolio management, and remediation governance." },
];

const offerKey = (c: { l2: string; l3: string }) => `${c.l2} > ${c.l3}`;
const VALID_OFFERS: string[] = CATALOG.map(offerKey);
const VALID_SET = new Set(VALID_OFFERS);
const L2_ORDER = [...new Set(CATALOG.map((c) => c.l2))];

// Catalog as shown to the model: grouped by L2, each exact offer string followed by its
// description so the model matches on meaning, not just on the name.
const CATALOG_PROMPT = L2_ORDER.map(
  (l2) =>
    `${l2.toUpperCase()}\n` +
    CATALOG.filter((c) => c.l2 === l2)
      .map((c) => `- "${offerKey(c)}": ${c.description}`)
      .join("\n"),
).join("\n\n");

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    overview: { type: "STRING" },
    challenges: { type: "ARRAY", items: { type: "STRING" } },
    initiatives: { type: "ARRAY", items: { type: "STRING" } },
    needs: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          signals: { type: "ARRAY", items: { type: "STRING" } },
          mcOffers: {
            type: "ARRAY",
            description: "1-3 offerings from the catalog whose description most directly covers this need",
            items: { type: "STRING", format: "enum", enum: VALID_OFFERS },
          },
          narrative: { type: "STRING" },
        },
        required: ["name", "signals", "mcOffers", "narrative"],
        propertyOrdering: ["name", "signals", "mcOffers", "narrative"],
      },
    },
  },
  required: ["overview", "challenges", "initiatives", "needs"],
  propertyOrdering: ["overview", "challenges", "initiatives", "needs"],
};

const MAX_OFFERS_PER_NEED = 3;

type Need = { name: string; signals: string[]; mcOffers: string[]; narrative: string };

async function callGeminiLegacy(apiKey: string, prompt: string, useSchema: boolean) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        ...(useSchema ? { responseSchema: RESPONSE_SCHEMA } : {}),
      },
    }),
  });
  if (!response.ok) {
    return { ok: false as const, status: response.status, errorText: await response.text() };
  }
  const apiData = await response.json();
  const text: string | undefined = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("No response from Gemini:", JSON.stringify(apiData));
    return { ok: false as const, status: 502, errorText: "empty response" };
  }
  return { ok: true as const, text };
}

// Keep only catalog offers (deduped, capped). `needsRetry` is true when any need was left
// with no valid offer at all.
function sanitize(insights: any): { insights: any; needsRetry: boolean } {
  const needs: Need[] = Array.isArray(insights?.needs) ? insights.needs : [];
  let needsRetry = false;
  const cleaned = needs.map((n) => {
    const offers = [...new Set((Array.isArray(n.mcOffers) ? n.mcOffers : []).filter((o) => VALID_SET.has(o)))].slice(
      0,
      MAX_OFFERS_PER_NEED,
    );
    if (offers.length === 0) needsRetry = true;
    return { ...n, mcOffers: offers };
  });
  return { insights: { ...insights, needs: cleaned }, needsRetry };
}


// ---------- Configuration ----------
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRO_MODEL = Deno.env.get("GEMINI_PRO_MODEL") ?? "gemini-2.5-pro";
const FLASH_MODEL = Deno.env.get("GEMINI_FLASH_MODEL") ?? "gemini-2.5-flash";
// Supabase returns 504 if no response is sent within 150s, so each request is budgeted below that.
const TIME_BUDGET_MS = Number(Deno.env.get("REPORT_TIME_BUDGET_MS") ?? "140000");
const MAX_EVIDENCE = 400;
const MIN_EVIDENCE_WARN = 15;
const topicCap = (_topic: string) => 45;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// deno-lint-ignore no-explicit-any
type Any = any;
type GroundingMeta = {
  webSearchQueries?: string[];
  groundingChunks?: { web?: { uri?: string; title?: string } }[];
  groundingSupports?: { segment?: { text?: string }; groundingChunkIndices?: number[] }[];
  searchEntryPoint?: { renderedContent?: string };
};
type GeminiResult = { text: string; meta: GroundingMeta | null };
type Source = { id: number; title: string; url: string };
type Evidence = { id: number; topic: string; text: string; sourceIds: number[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeClock(budgetMs: number) {
  const start = Date.now();
  const remaining = () => budgetMs - (Date.now() - start);
  // Timeout for a step: at most `cap`, leaving `reserve` ms for the steps after it (floor 5s).
  const timeout = (cap: number, reserve: number) => Math.max(5000, Math.min(cap, remaining() - reserve));
  return { remaining, timeout };
}

// ---------- Gemini client ----------
async function callGemini(
  apiKey: string,
  opts: {
    model: string;
    prompt: string;
    grounded?: boolean;
    schema?: Any;
    temperature?: number;
    thinkingBudget?: number;
    timeoutMs: number;
    attempts?: number;
  },
): Promise<GeminiResult> {
  const generationConfig: Any = { temperature: opts.temperature ?? 0.2 };
  if (opts.schema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = opts.schema;
  }
  if (opts.thinkingBudget !== undefined) generationConfig.thinkingConfig = { thinkingBudget: opts.thinkingBudget };
  const body: Any = { contents: [{ role: "user", parts: [{ text: opts.prompt }] }], generationConfig };
  if (opts.grounded) body.tools = [{ google_search: {} }];

  const attempts = opts.attempts ?? 2;
  const deadline = Date.now() + opts.timeoutMs;
  let lastErr = "unknown error";
  for (let attempt = 0; attempt < attempts; attempt++) {
    const left = deadline - Date.now();
    if (left < 3000) break;
    if (attempt > 0) await sleep(Math.min(1500 * attempt, left / 4));
    try {
      const res = await fetch(`${GEMINI_BASE}/${opts.model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())),
      });
      if (!res.ok) {
        lastErr = `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`;
        if (res.status >= 400 && res.status < 500 && res.status !== 429) break; // not retryable
        continue;
      }
      const data = await res.json();
      const cand = data.candidates?.[0];
      const text = (cand?.content?.parts ?? []).map((p: Any) => p.text ?? "").join("");
      if (!text) {
        lastErr = `empty response (finishReason: ${cand?.finishReason ?? "n/a"})`;
        continue;
      }
      return { text, meta: cand?.groundingMetadata ?? null };
    } catch (e) {
      lastErr = (e as Error)?.name === "TimeoutError" ? "timed out" : String(e);
      if (lastErr === "timed out") break;
    }
  }
  throw new Error(`${opts.model}: ${lastErr}`);
}

function safeJson(text: string): Any {
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
  } catch {
    return null;
  }
}

async function resolveRedirects(uris: string[], timeoutMs: number): Promise<Map<string, string>> {
  // Grounding chunk URIs are Google redirect links; resolve them to the publisher URL for display/dedupe.
  const map = new Map<string, string>();
  const unique = [...new Set(uris)].filter((u) => u.includes("grounding-api-redirect"));
  await Promise.allSettled(
    unique.map(async (u) => {
      const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
      const loc = res.headers.get("location");
      await res.body?.cancel();
      if (loc) map.set(u, loc);
    }),
  );
  return map;
}

function normUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    [...u.searchParams.keys()].filter((k) => k.startsWith("utm_")).forEach((k) => u.searchParams.delete(k));
    return (u.host.replace(/^www\./, "") + u.pathname.replace(/\/$/, "") + u.search).toLowerCase();
  } catch {
    return url;
  }
}

function buildLedger(
  results: { topic: string; r: GeminiResult }[],
  urlMap: Map<string, string>,
  existing?: { sources: Source[]; evidence: Evidence[] },
) {
  const sources: Source[] = [...(existing?.sources ?? [])];
  const srcIndex = new Map<string, number>(sources.map((x) => [normUrl(x.url), x.id]));
  const evidence: Evidence[] = [...(existing?.evidence ?? [])];
  const seen = new Set<string>(evidence.map((e) => `${e.topic}|${e.text.toLowerCase()}`));
  const searchSuggestions: string[] = [];
  const queries: string[] = [];
  const perTopic = new Map<string, number>();
  for (const e of evidence) perTopic.set(e.topic, (perTopic.get(e.topic) ?? 0) + 1);

  for (const { topic, r } of results) {
    const meta = r.meta;
    if (!meta) continue;
    if (meta.searchEntryPoint?.renderedContent) searchSuggestions.push(meta.searchEntryPoint.renderedContent);
    queries.push(...(meta.webSearchQueries ?? []));
    const chunkSrc = (meta.groundingChunks ?? []).map((c) => {
      const raw = c.web?.uri;
      if (!raw) return null;
      const url = urlMap.get(raw) ?? raw;
      const key = normUrl(url);
      let id = srcIndex.get(key);
      if (!id) {
        id = sources.length + 1;
        sources.push({ id, title: c.web?.title ?? new URL(url).host, url });
        srcIndex.set(key, id);
      }
      return id;
    });
    for (const s of meta.groundingSupports ?? []) {
      const text = (s.segment?.text ?? "").replace(/^[\s*-]+/, "").trim();
      if (text.length < 15 || /NOT FOUND/i.test(text) || /^(CONFIDENCE|OTHER_ENTITIES)\b/.test(text)) continue;
      const ids = [...new Set((s.groundingChunkIndices ?? []).map((i) => chunkSrc[i]).filter((x): x is number => x != null))];
      if (!ids.length) continue;
      const k = `${topic}|${text.toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (evidence.length >= MAX_EVIDENCE || (perTopic.get(topic) ?? 0) >= topicCap(topic)) break; // this topic is full (later topics still get their share)
      perTopic.set(topic, (perTopic.get(topic) ?? 0) + 1);
      evidence.push({ id: evidence.length + 1, topic, text, sourceIds: ids });
    }
  }
  return { sources, evidence, searchSuggestions, queries: [...new Set(queries)] };
}

const numVal = (t: string) => String(Number(t.replace(/,/g, "")));
const numTokens = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).map(numVal);
// Financial-looking figures only (used for analysis text, where ordinary numbers like "two" or "Q3" are fine)
const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
const UNIT = String.raw`(?:trillion|billion|million|thousand|tn|bn|mn|[tbmk](?![a-z0-9]))`;
const FIN_FIGURE = new RegExp(String.raw`[$€£]\s?${NUM}(?:\s?${UNIT})?|${NUM}\s?(?:%|percent|×|x(?![a-z0-9])|${UNIT})`, "gi");
const UNIT_MULT: Record<string, number> = { t: 1e12, tn: 1e12, trillion: 1e12, b: 1e9, bn: 1e9, billion: 1e9, m: 1e6, mn: 1e6, million: 1e6, k: 1e3, thousand: 1e3 };
// Numbers with their magnitude suffix applied: "$4.9 trillion" -> 4.9e12, "$4,900 billion" -> 4.9e12, "6.4%" -> 6.4.
const magnitudes = (s: string): number[] =>
  [...s.matchAll(new RegExp(String.raw`(${NUM})\s?(${UNIT})?`, "gi"))]
    .map((m) => Number(m[1].replace(/,/g, "")) * (UNIT_MULT[(m[2] ?? "").toLowerCase()] ?? 1))
    .filter((n) => Number.isFinite(n));

// Strict (facts): every number must appear exactly in the cited evidence.
// Lenient (analysis text, financialOnly): a financial figure may also be a rounding of a figure in the evidence
// (within 5%, e.g. "$4.9 trillion" for "$4.86 trillion"), but never a figure the evidence does not contain.
function figuresSupported(text: string, ev: Evidence[], financialOnly: boolean): boolean {
  const hayText = ev.map((e) => e.text).join(" ");
  const hay = new Set(numTokens(hayText));
  if (!financialOnly) return numTokens(text).every((n) => hay.has(n));
  const hayValues = magnitudes(hayText);
  return (text.match(FIN_FIGURE) ?? []).every((fig) =>
    numTokens(fig).every((n) => hay.has(n)) ||
    magnitudes(fig).every((v) => hayValues.some((h) => Math.abs(h - v) <= 0.05 * Math.max(h, v)))
  );
}


// Structured (no tools, evidence-only) call. Prefers Pro when asked, falls back to Flash if Pro fails or times out.
// `reserve` is the time left for the work after this call.
async function structured(
  apiKey: string, clock: ReturnType<typeof makeClock>, warnings: string[],
  label: string, prompt: string, schema: Any, preferPro: boolean, temperature: number, reserve: number,
) {
  const usePro = preferPro && clock.remaining() > 60_000;
  try {
    const r = await callGemini(apiKey, {
      model: usePro ? PRO_MODEL : FLASH_MODEL, prompt, schema, temperature, attempts: 1,
      timeoutMs: usePro ? clock.timeout(70_000, reserve + 35_000) : clock.timeout(60_000, reserve),
    });
    const parsed = safeJson(r.text);
    if (parsed) return parsed;
    throw new Error("invalid JSON");
  } catch (e) {
    if (!usePro || clock.remaining() < 25_000) throw e;
    console.error(`${label}: ${PRO_MODEL} failed (${(e as Error).message}); retrying with ${FLASH_MODEL}`);
    warnings.push(`${label}: fell back to ${FLASH_MODEL} (${(e as Error).message}).`);
    const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, temperature, attempts: 1, timeoutMs: clock.timeout(50_000, reserve) });
    const parsed = safeJson(r.text);
    if (!parsed) throw new Error("invalid JSON");
    return parsed;
  }
}

const sliceOf = (topic: string, r: GeminiResult | null, ms: number, error?: string): Slice => {
  const supports = r?.meta?.groundingSupports?.length ?? 0;
  return { topic, status: error || !r ? "failed" : supports >= 3 ? "ok" : "thin", ms, error, meta: r?.meta ?? null };
};

// Slices come back from the page, so rebuild them field by field.
function readSlices(raw: unknown): Slice[] {
  return list(raw).slice(0, 30).flatMap((x): Slice[] => {
    const topic = typeof x?.topic === "string" ? x.topic.slice(0, 120) : "";
    if (!topic) return [];
    const m = x?.meta;
    const meta: GroundingMeta | null = m && typeof m === "object"
      ? {
        webSearchQueries: list(m.webSearchQueries).map(String).slice(0, 20),
        groundingChunks: list(m.groundingChunks).slice(0, 200).map((c) => ({
          web: { uri: typeof c?.web?.uri === "string" ? c.web.uri.slice(0, 2000) : undefined, title: typeof c?.web?.title === "string" ? c.web.title.slice(0, 300) : undefined },
        })),
        groundingSupports: list(m.groundingSupports).slice(0, 400).map((g) => ({
          segment: { text: String(g?.segment?.text ?? "").slice(0, 2000) },
          groundingChunkIndices: list(g?.groundingChunkIndices).filter((n) => Number.isInteger(n)),
        })),
        searchEntryPoint: typeof m.searchEntryPoint?.renderedContent === "string" ? { renderedContent: m.searchEntryPoint.renderedContent.slice(0, 20000) } : undefined,
      }
      : null;
    return [{ topic, status: x?.status === "ok" || x?.status === "thin" ? x.status : "failed", ms: Number(x?.ms) || 0, meta }];
  });
}

// ---------- Evidence-grounded refresh (v2): research first, then synthesize ----------
// scan (one per topic) -> ledger -> synth (overview+challenges, initiatives, needs) -> offers -> report.
// Every statement must cite evidence from Google Search results; the page chains the requests and retries pieces.
const todayStr = () => new Date().toISOString().slice(0, 10);
const list = (a: unknown): Any[] => (Array.isArray(a) ? a : []);
const STR = { type: "STRING" };
const INTS = { type: "ARRAY", items: { type: "INTEGER" } };
const arr = (items: Any) => ({ type: "ARRAY", items });
const obj = (properties: Record<string, Any>, required = Object.keys(properties)) => ({ type: "OBJECT", properties, required });
const ITEM = obj({ text: STR, basedOn: INTS });
const OPT_ITEM = { ...ITEM, nullable: true };

type Slice = { topic: string; status: "ok" | "thin" | "failed"; ms: number; error?: string; meta: GroundingMeta | null };
type Item = { text: string; basedOn: number[] };
type State = {
  subIndustryName: string;
  industryName: string;
  /** Optional plain-words definition of what this sub-sector means in our model (authoritative). */
  scope: string;
  sources: Source[];
  evidence: Evidence[];
  queries: string[];
  warnings: string[];
};
type Dropped = { path: string; reason: string; text: string };

const evidenceBlock = (ev: Evidence[]) => ev.map((e) => `E${e.id} [${e.topic}] ${e.text}`).join("\n");

const TOPICS = [
  { key: "market", ask: "Market size and growth, revenue and profitability trends, investment and deal activity, and how the sub-sector's performance has changed over the last 24 months. Give published figures with value, period and who reported them." },
  { key: "regulation", ask: "Regulatory, policy and legal developments affecting the sub-sector in the last 24 months: new or pending rules, enforcement actions, compliance deadlines, and who issued them." },
  { key: "technology_ai", ask: "Technology and AI adoption in the sub-sector: what organizations are deploying (AI, cloud, automation, data platforms), the results and obstacles reported, with published adoption figures and who reported them." },
  { key: "workforce", ask: "Workforce and talent issues in the sub-sector: skills shortages, hiring or layoffs, organizational changes and labor costs, with published figures and sources." },
  { key: "competition_ma", ask: "Competitive dynamics and consolidation in the sub-sector: notable acquisitions, mergers, divestitures, partnerships, new entrants and pricing pressure in the last 24 months." },
  { key: "buyers", ask: "What executives and customers in the sub-sector say their priorities and pain points are, as reported in analyst, consulting-firm or industry-association surveys and reports. Name the publisher and year." },
  { key: "moves", ask: "Concrete programs and investments that organizations in the sub-sector have announced or launched in the last 24 months (transformation programs, modernization, new products, operating-model or cost initiatives), with who announced them and when." },
];

// The scope, when set, says what the sub-sector means in our model. It overrides any other reading of the name.
const scopeBlock = (scope: string) =>
  scope
    ? `\nSCOPE (authoritative, set by our team): ${scope}\nFollow this scope exactly. Ignore any other meaning of the sub-sector name, and treat the industry name only as a grouping label in our model. Do not report or cite material that falls outside the scope.\n`
    : "";

const researchPrompt = (ask: string, sub: string, industry: string, today: string, scope: string) => `Today is ${today}.
You are researching the "${sub}" sub-sector of the "${industry}" industry: the sector as a whole, NOT any single company.
${scopeBlock(scope)}
RESEARCH TASK: ${ask}

Rules:
- Use Google Search. Report only facts stated in the search results. Never estimate, extrapolate, or fill gaps from memory.
- Write short, self-contained sentences with ONE fact each. Name the sub-sector or industry in each sentence, and for any figure give its date or period and who reported it (e.g. "U.S. retail banks spent $X on Y in 2025, according to Deloitte.").
- Prefer sources from the last 24 months.
- Distinguish claims by companies from independent reporting by analysts, regulators or the press.
- If you cannot find something, write one line "NOT FOUND: <item>". Incomplete answers are expected and fine.
- No recommendations, opinions, or analysis.`;

// ---------- Validation ----------
const WINDOW_MONTHS = 24;
const cutoffYear = () => new Date(Date.now() - WINDOW_MONTHS * 30.44 * 86_400_000).getFullYear();

const evidenceFor = (ids: unknown, byId: Map<number, Evidence>): Evidence[] =>
  [...new Set(list(ids).map(Number))].map((id) => byId.get(id)).filter((e): e is Evidence => !!e);

// An item is kept only if it cites real evidence, its financial figures appear in that evidence (rounding tolerated),
// and it is not about a period older than the research window.
function checkItem(it: Any, path: string, byId: Map<number, Evidence>, dropped: Dropped[]): Item | null {
  const text = typeof it?.text === "string" ? it.text.trim() : "";
  if (!text) return null;
  const ev = evidenceFor(it?.basedOn, byId);
  const years = (text.match(/\b20\d\d\b/g) ?? []).map(Number);
  const reason = !ev.length
    ? "no evidence cited"
    : !figuresSupported(text, ev, true)
    ? "figure not present in cited evidence"
    : years.length && Math.max(...years) < cutoffYear()
    ? `older than ${WINDOW_MONTHS} months`
    : null;
  if (reason) {
    dropped.push({ path, reason, text });
    return null;
  }
  return { text, basedOn: ev.map((e) => e.id) };
}

const titleKey = (t: string) => t.split(":")[0].toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
function dedupe(items: Item[], path: string, dropped: Dropped[]): Item[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    const k = titleKey(it.text) || it.text.toLowerCase();
    if (seen.has(k)) {
      dropped.push({ path, reason: "duplicate of an earlier item", text: it.text });
      return false;
    }
    seen.add(k);
    return true;
  });
}

type NeedIn = { name: string; signals: string[]; narrative: string; basedOn: number[] };
function checkNeed(n: Any, path: string, byId: Map<number, Evidence>, dropped: Dropped[]): NeedIn | null {
  const name = typeof n?.name === "string" ? n.name.trim() : "";
  const narrative = typeof n?.narrative === "string" ? n.narrative.trim() : "";
  if (!name || !narrative) return null;
  const ev = evidenceFor(n?.basedOn, byId);
  const reason = !ev.length ? "no evidence cited" : !figuresSupported(narrative, ev, true) ? "figure not present in cited evidence" : null;
  if (reason) {
    dropped.push({ path, reason, text: `${name}: ${narrative}` });
    return null;
  }
  // Signals are buyer-observable symptoms; a signal quoting a figure must match the evidence.
  const signals = list(n?.signals).map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean).filter((sg, i) => {
    if (figuresSupported(sg, ev, true)) return true;
    dropped.push({ path: `${path}.signals[${i}]`, reason: "figure not present in cited evidence", text: sg });
    return false;
  }).slice(0, 5);
  if (signals.length < 2) {
    dropped.push({ path, reason: "fewer than 2 usable signals", text: name });
    return null;
  }
  return { name, signals, narrative, basedOn: ev.map((e) => e.id) };
}

// The page sends state back to us, so rebuild it field by field.
function readState(raw: Any, allowEmpty = false): State | null {
  if (!raw || typeof raw !== "object") return null;
  const evidence: Evidence[] = list(raw.evidence).slice(0, MAX_EVIDENCE).flatMap((e) =>
    typeof e?.text === "string" && Number.isInteger(e?.id)
      ? [{ id: e.id, topic: String(e.topic ?? "").slice(0, 60), text: e.text.slice(0, 2000), sourceIds: list(e.sourceIds).filter((n) => Number.isInteger(n)) }]
      : []
  );
  if (!evidence.length && !allowEmpty) return null;
  const sources: Source[] = list(raw.sources).slice(0, 600).flatMap((x) =>
    Number.isInteger(x?.id) ? [{ id: x.id, title: String(x.title ?? "").slice(0, 300), url: String(x.url ?? "").slice(0, 2000) }] : []
  );
  return {
    subIndustryName: String(raw.subIndustryName ?? "").slice(0, 200),
    industryName: String(raw.industryName ?? "").slice(0, 200),
    scope: String(raw.scope ?? "").slice(0, 800),
    sources,
    evidence,
    queries: list(raw.queries).map(String).slice(0, 100),
    warnings: list(raw.warnings).map(String).slice(0, 50),
  };
}

const names = (body: Any) => {
  const sub = typeof body?.subIndustryName === "string" ? body.subIndustryName.trim().slice(0, 200) : "";
  const industry = typeof body?.industryName === "string" ? body.industryName.trim().slice(0, 200) : "";
  const scope = typeof body?.scope === "string" ? body.scope.trim().slice(0, 800) : "";
  return sub && industry ? { sub, industry, scope } : null;
};

// ---------- Requests ----------
// 1. One grounded scan for one topic. A failed scan is returned as data, not an HTTP error.
async function v2Scan(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const n = names(body);
  const tp = TOPICS.find((t) => t.key === body?.topic);
  if (!n || !tp) return json({ error: "subIndustryName, industryName and a valid topic are required." }, 400);
  const prompt = researchPrompt(tp.ask, n.sub, n.industry, todayStr(), n.scope);
  const t0 = Date.now();
  const deadline = t0 + clock.timeout(110_000, 10_000);
  const run = (ms: number) => callGemini(apiKey, { model: FLASH_MODEL, prompt, grounded: true, temperature: 0, timeoutMs: ms, attempts: 2 });
  try {
    let best = await run(Math.min(70_000, deadline - Date.now()));
    if ((best.meta?.groundingSupports?.length ?? 0) < 3 && deadline - Date.now() > 20_000) {
      try {
        const second = await run(deadline - Date.now());
        if ((second.meta?.groundingSupports?.length ?? 0) > (best.meta?.groundingSupports?.length ?? 0)) best = second;
      } catch {
        // keep the first result
      }
    }
    return json({ slice: sliceOf(tp.key, best, Date.now() - t0) });
  } catch (e) {
    return json({ slice: sliceOf(tp.key, null, Date.now() - t0, (e as Error)?.message ?? String(e)) });
  }
}

// 2. Turn slices into the evidence ledger.
async function v2Ledger(body: Any, clock: ReturnType<typeof makeClock>) {
  const n = names(body);
  if (!n) return json({ error: "subIndustryName and industryName are required." }, 400);
  const slices = readSlices(body?.slices);
  const results = slices.filter((x) => x.meta).map((x) => ({ topic: x.topic, r: { text: "", meta: x.meta } as GeminiResult }));
  const uris = results.flatMap((x) => (x.r.meta?.groundingChunks ?? []).map((c) => c.web?.uri).filter((u): u is string => !!u));
  const urlMap = await resolveRedirects(uris, Math.min(8000, Math.max(1500, clock.remaining() - 30_000)));
  const ledger = buildLedger(results, urlMap);
  if (!ledger.evidence.length) {
    return json({ error: "Search returned no citable evidence for this sub-sector, so nothing was generated." }, 422);
  }
  const warnings: string[] = [];
  if (ledger.evidence.length < MIN_EVIDENCE_WARN) warnings.push(`Only ${ledger.evidence.length} citable facts were found; expect thin results.`);
  const state: State = { subIndustryName: n.sub, industryName: n.industry, scope: n.scope, sources: ledger.sources, evidence: ledger.evidence, queries: ledger.queries, warnings };
  return json({ state });
}

const SYNTH_HEAD = (st: State, today: string) => `You are an expert management-consulting industry analyst writing for sales teams. Today is ${today}.
SUB-SECTOR: "${st.subIndustryName}" within the "${st.industryName}" industry. Write about the sub-sector as a whole, not any single company.
${scopeBlock(st.scope)}
EVIDENCE (format: E<id> [topic] text). This is the ONLY information you may use:
${evidenceBlock(st.evidence)}

Rules:
1. Every item must list in basedOn the E numbers (integers) it rests on. If you cannot point to evidence for an item, leave it out. Fewer, well-grounded items beat filling every slot.
2. Synthesis and judgement are expected, but introduce no new facts: no figures, percentages, dates, names or events that are not in the cited evidence. Copy figures exactly as written, with their period.
3. Be specific to "${st.subIndustryName}". Do not write statements that would apply equally to any industry (generic AI, talent or supply-chain remarks) unless the evidence ties them to this sub-sector.
4. Prefer developments from the last ${WINDOW_MONTHS} months.`;

const OVERVIEW_SCHEMA = obj({ overview: OPT_ITEM, challenges: arr(ITEM) });
const INITIATIVES_SCHEMA = obj({ initiatives: arr(ITEM) });
const NEEDS_SCHEMA = obj({
  needs: arr(obj({ name: STR, signals: arr(STR), narrative: STR, basedOn: INTS })),
});

// 3. Synthesis from the evidence only. Items are validated here so later parts build on validated text.
async function v2Synth(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  const part = body?.part as "overview" | "initiatives" | "needs";
  if (!state || !["overview", "initiatives", "needs"].includes(part)) return json({ error: "Missing or invalid research state or part." }, 400);
  const today = todayStr();
  const byId = new Map(state.evidence.map((e) => [e.id, e]));
  const dropped: Dropped[] = [];
  const warnings: string[] = [];
  const TITLE = `each "Short title: description" (title of 2-5 words, then a colon, then 1-2 sentences)`;
  try {
    if (part === "overview") {
      const prompt = `${SYNTH_HEAD(state, today)}
5. overview: 2-3 sentences on the sub-sector's current state, key pressures and transformation imperatives.
6. challenges: 3-5 challenges the sub-sector faces, ${TITLE}.`;
      const raw = await structured(apiKey, clock, warnings, "Synthesis (overview)", prompt, OVERVIEW_SCHEMA, true, 0.3, 10_000);
      const overview = checkItem(raw?.overview, "overview", byId, dropped);
      const challenges = dedupe(list(raw?.challenges).map((c, i) => checkItem(c, `challenges[${i}]`, byId, dropped)).filter((c): c is Item => !!c), "challenges", dropped).slice(0, 5);
      return json({ part, ok: true, overview, challenges, dropped, warnings });
    }
    if (part === "initiatives") {
      const prompt = `${SYNTH_HEAD(state, today)}
5. initiatives: 3-5 things organizations in this sub-sector are actually doing now (programs, investments, partnerships, operating-model changes), ${TITLE}. Describe what is being done, not what should be done.`;
      const raw = await structured(apiKey, clock, warnings, "Synthesis (initiatives)", prompt, INITIATIVES_SCHEMA, true, 0.3, 10_000);
      const initiatives = dedupe(list(raw?.initiatives).map((c, i) => checkItem(c, `initiatives[${i}]`, byId, dropped)).filter((c): c is Item => !!c), "initiatives", dropped).slice(0, 5);
      return json({ part, ok: true, initiatives, dropped, warnings });
    }
    // needs: derived from the validated challenges and initiatives
    const challenges = list(body?.challenges).map((c) => (typeof c?.text === "string" ? c.text : "")).filter(Boolean).slice(0, 5);
    const initiatives = list(body?.initiatives).map((c) => (typeof c?.text === "string" ? c.text : "")).filter(Boolean).slice(0, 5);
    if (!challenges.length && !initiatives.length) return json({ part, ok: false, needs: [], dropped, warnings: ["No validated challenges or initiatives to derive needs from."] });
    const prompt = `${SYNTH_HEAD(state, today)}

VALIDATED CHALLENGES:
${challenges.map((c, i) => `C${i + 1}. ${c}`).join("\n") || "(none)"}

VALIDATED INITIATIVES:
${initiatives.map((c, i) => `I${i + 1}. ${c}`).join("\n") || "(none)"}

5. needs: 5-8 needs of organizations in this sub-sector. Each must follow from at least one challenge or initiative above; do not invent unrelated needs, and do not describe consulting services.
6. name: 5-8 words naming the need in business terms. signals: 3-5 short, observable things a seller could listen for in a conversation with a prospect (symptoms, not statistics; do not invent figures). narrative: 2-3 sentences on why this need matters now for the sub-sector, using only the cited evidence; do NOT mention consulting offerings or services. basedOn: the E numbers the narrative rests on.`;
    const raw = await structured(apiKey, clock, warnings, "Synthesis (needs)", prompt, NEEDS_SCHEMA, true, 0.3, 10_000);
    const seen = new Set<string>();
    const needs = list(raw?.needs).map((n, i) => checkNeed(n, `needs[${i}]`, byId, dropped)).filter((n): n is NeedIn => {
      if (!n) return false;
      const k = n.name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
      if (seen.has(k)) {
        dropped.push({ path: "needs", reason: "duplicate of an earlier need", text: n.name });
        return false;
      }
      seen.add(k);
      return true;
    }).slice(0, 8);
    return json({ part, ok: true, needs, dropped, warnings });
  } catch (e) {
    return json({ part, ok: false, dropped, warnings: [...warnings, `Synthesis (${part}) failed (${(e as Error)?.message ?? e}).`] });
  }
}

// 4. Map validated needs to the MC catalog (separate from writing the needs, so offers cannot shape them).
const OFFERS_SCHEMA = obj({
  rows: arr(obj({
    index: { type: "INTEGER" },
    mcOffers: { type: "ARRAY", items: { type: "STRING", format: "enum", enum: VALID_OFFERS } },
    offerNarrative: STR,
  })),
});
async function v2Offers(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const needs: NeedIn[] = list(body?.needs).slice(0, 8).map((n) => ({
    name: String(n?.name ?? "").slice(0, 200),
    signals: list(n?.signals).map(String).slice(0, 5),
    narrative: String(n?.narrative ?? "").slice(0, 1500),
    basedOn: [],
  }));
  if (!needs.length) return json({ ok: true, offers: [], warnings: [] });
  const warnings: string[] = [];
  const result: Record<number, { mcOffers: string[]; offerNarrative: string }> = {};
  const ask = async (indexes: number[]) => {
    const prompt = `For each numbered client need below, choose the Toptal Management Consulting offerings that address it, and write one short sentence on how they help.

MC SERVICE OFFERING CATALOG
Offerings are listed as "Practice > Offering": description. Use the quoted string EXACTLY as written (including the "Practice > " prefix) in mcOffers.

${CATALOG_PROMPT}

Matching rules:
- Select the offerings whose DESCRIPTION most directly covers the need. Do not choose on name alone.
- Choose 1-3 offerings per need. Prefer the most specific offering over a generic one.
- "Change Management" and "Program & Portfolio Management" appear under every practice. Use them only as a secondary add-on to a more specific offering (at most one such generic offering per need), under the practice that fits the need.
- offerNarrative: 1-2 sentences on how the chosen offerings address the need. Refer to offerings by their offering name only (e.g. "Finance AI"), without the "Practice > " prefix. Include no figures and no facts. Never mention an offering that is not in the catalog.

NEEDS:
${indexes.map((i) => `${i}. ${needs[i].name} | signals: ${needs[i].signals.join("; ")} | ${needs[i].narrative}`).join("\n")}`;
    const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema: OFFERS_SCHEMA, temperature: 0, thinkingBudget: 0, attempts: 1, timeoutMs: clock.timeout(60_000, 10_000) });
    for (const row of list(safeJson(r.text)?.rows)) {
      const i = Number(row?.index);
      if (!indexes.includes(i)) continue;
      const mcOffers = [...new Set(list(row?.mcOffers).filter((o) => VALID_SET.has(o)))].slice(0, MAX_OFFERS_PER_NEED);
      if (!mcOffers.length) continue;
      const narr = typeof row?.offerNarrative === "string" ? row.offerNarrative.trim() : "";
      result[i] = { mcOffers, offerNarrative: /\d/.test(narr) ? "" : narr.replace(/\b[A-Z][A-Za-z &]+ > /g, "") };
    }
  };
  try {
    const all = needs.map((_, i) => i);
    await ask(all);
    const missing = all.filter((i) => !result[i]);
    if (missing.length && clock.remaining() > 25_000) await ask(missing);
  } catch (e) {
    warnings.push(`MC offer mapping failed (${(e as Error)?.message ?? e}).`);
  }
  return json({ ok: Object.keys(result).length > 0, offers: needs.map((_, i) => result[i] ?? null), warnings });
}

// 5. Final assembly: re-validate, drop needs without a valid offer, number only the sources actually cited.
async function v2Report(body: Any) {
  const state = readState(body?.state);
  if (!state) return json({ error: "Missing or invalid research state. Start again." }, 400);
  const byId = new Map(state.evidence.map((e) => [e.id, e]));
  const dropped: Dropped[] = list(body?.dropped).slice(0, 300).map((d) => ({ path: String(d?.path ?? ""), reason: String(d?.reason ?? ""), text: String(d?.text ?? "").slice(0, 400) }));
  const warnings = [...state.warnings, ...list(body?.clientWarnings).map(String).slice(0, 40)];

  const overview = checkItem(body?.overview, "overview", byId, dropped);
  const challenges = dedupe(list(body?.challenges).map((c, i) => checkItem(c, `challenges[${i}]`, byId, dropped)).filter((c): c is Item => !!c), "challenges", dropped).slice(0, 5);
  const initiatives = dedupe(list(body?.initiatives).map((c, i) => checkItem(c, `initiatives[${i}]`, byId, dropped)).filter((c): c is Item => !!c), "initiatives", dropped).slice(0, 5);
  const offers = list(body?.offers);
  const needs = list(body?.needs).slice(0, 8).flatMap((n, i) => {
    const need = checkNeed(n, `needs[${i}]`, byId, dropped);
    const o = offers[i];
    const mcOffers = [...new Set(list(o?.mcOffers).filter((x) => VALID_SET.has(x)))].slice(0, MAX_OFFERS_PER_NEED);
    if (!need) return [];
    if (!mcOffers.length) {
      dropped.push({ path: `needs[${i}]`, reason: "no valid catalog offer", text: need.name });
      return [];
    }
    return [{ ...need, mcOffers, offerNarrative: typeof o?.offerNarrative === "string" ? o.offerNarrative.trim() : "" }];
  });

  // Number sources in order of first citation so the Sources list only holds what the text cites.
  const remap = new Map<number, number>();
  const cite = (ids: number[]) => {
    const nums = [...new Set(ids.flatMap((id) => byId.get(id)?.sourceIds ?? []))].map((sid) => {
      if (!remap.has(sid)) remap.set(sid, remap.size + 1);
      return remap.get(sid)!;
    }).sort((a, b) => a - b);
    return nums.length ? " " + nums.map((n) => `[${n}]`).join(" ") : "";
  };
  const fmt = (it: Item) => it.text + cite(it.basedOn);
  const out = {
    overview: overview ? fmt(overview) : "",
    challenges: challenges.map(fmt),
    initiatives: initiatives.map(fmt),
    needs: needs.map((n) => ({
      name: n.name,
      signals: n.signals,
      mcOffers: n.mcOffers,
      narrative: `${n.narrative}${cite(n.basedOn)}${n.offerNarrative ? " " + n.offerNarrative : ""}`,
    })),
  };
  const byNew = new Map([...remap.entries()].map(([oldId, newId]) => [newId, oldId]));
  const srcById = new Map(state.sources.map((s) => [s.id, s]));
  const sources = [...byNew.entries()].sort((a, b) => a[0] - b[0]).map(([newId, oldId]) => ({
    id: newId, title: srcById.get(oldId)?.title ?? `Source ${newId}`, url: srcById.get(oldId)?.url ?? "",
  }));

  if (out.challenges.length < 3) warnings.push(`Only ${out.challenges.length} challenge(s) passed validation.`);
  if (out.initiatives.length < 3) warnings.push(`Only ${out.initiatives.length} initiative(s) passed validation.`);
  if (out.needs.length < 5) warnings.push(`Only ${out.needs.length} need(s) passed validation.`);
  if (!out.overview) warnings.push("No overview passed validation.");

  console.log(JSON.stringify({ sub: state.subIndustryName, evidence: state.evidence.length, sources: sources.length, dropped: dropped.length }));
  return json({
    ...out,
    sources,
    researchedAt: new Date().toISOString(),
    quality: {
      scans: list(body?.scanLog).slice(0, 20).map((x) => ({ topic: String(x?.topic ?? "").slice(0, 60), status: String(x?.status ?? "").slice(0, 20), ms: Number(x?.ms) || 0, segments: Number(x?.segments) || 0, retried: !!x?.retried })),
      evidenceByTopic: Object.fromEntries([...new Set(state.evidence.map((e) => e.topic))].map((t) => [t, state.evidence.filter((e) => e.topic === t).length])),
      evidenceCount: state.evidence.length,
      sourceCount: sources.length,
      droppedCount: dropped.length,
      dropped: dropped.slice(0, 100),
      warnings,
      models: { research: FLASH_MODEL, synthesis: `${PRO_MODEL} (falls back to ${FLASH_MODEL})` },
    },
  });
}

// Only signed-in Toptal accounts may run research. The page sends the user's Supabase session token;
// we ask Supabase Auth who it belongs to. Set REQUIRE_SIGN_IN=false to switch the check off.
async function authorize(req: Request): Promise<Response | null> {
  if (Deno.env.get("REQUIRE_SIGN_IN") === "false") return null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const apikey = req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (!supabaseUrl || !/^bearer\s+\S+/i.test(auth)) {
    return json({ error: "Please sign in with your Toptal Google account to run research." }, 401);
  }
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey, Authorization: auth }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      await res.body?.cancel();
      return json({ error: "Your sign-in has expired. Sign out, sign back in, and try again." }, 401);
    }
    const email = String((await res.json())?.email ?? "").toLowerCase();
    const domains = (Deno.env.get("ALLOWED_EMAIL_DOMAINS") ?? "toptal.com").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
    if (!domains.some((d) => email.endsWith("@" + d))) return json({ error: "Industry Insights refresh is limited to Toptal accounts." }, 403);
    return null;
  } catch {
    return json({ error: "Could not verify your sign-in. Try again in a moment." }, 503);
  }
}


// The previous single-call refresh (no research). Kept so an older admin page keeps working until it is updated.
async function legacyRefresh(GEMINI_API_KEY: string, body: Any): Promise<Response> {
  try {
    const { subIndustryId, subIndustryName, industryName } = body;
    if (!subIndustryId || !subIndustryName || !industryName) {
      return new Response(
        JSON.stringify({ error: "subIndustryId, subIndustryName, and industryName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are an expert management consulting industry analyst. Generate comprehensive industry insights for the sub-sector "${subIndustryName}" within the "${industryName}" industry.

MC SERVICE OFFERING CATALOG
Each need must be mapped ONLY to offerings from this catalog. Offerings are listed as "Practice > Offering": description. Use the quoted string EXACTLY as written (including the "Practice > " prefix).

${CATALOG_PROMPT}

Matching rules:
- For each need, select the offerings whose DESCRIPTION most directly covers that need. Do not choose on name alone.
- Choose 1-3 offerings per need. Prefer the most specific offering over a generic one.
- "Change Management" and "Program & Portfolio Management" appear under every practice. Use them only as a secondary add-on to a more specific offering (at most one such generic offering per need), and pick the one under the practice that fits the need.
- In the narrative, refer to offerings by their offering name only (e.g. "Finance AI"), without the "Practice > " prefix. Never mention any offering that is not in the catalog.

Return a JSON object with this exact structure:
{
  "overview": "A 2-3 sentence strategic overview of the sub-sector's current state, key pressures, and transformation imperatives.",
  "challenges": ["Challenge 1: Description...", "Challenge 2: Description...", "Challenge 3: Description..."],
  "initiatives": ["Initiative 1: Description...", "Initiative 2: Description...", "Initiative 3: Description...", "Initiative 4: Description..."],
  "needs": [
    {
      "name": "Short need title (5-8 words)",
      "signals": ["Signal 1", "Signal 2", "Signal 3", "Signal 4", "Signal 5"],
      "mcOffers": ["Exact catalog string 1", "Exact catalog string 2"],
      "narrative": "A 2-3 sentence sales narrative explaining how the mapped MC offerings address this need."
    }
  ]
}

Requirements:
- 3-5 challenges, each with a bold title followed by a colon and description
- 3-5 initiatives, each with a bold title followed by a colon and description
- 5-8 needs, each with 3-5 signals, 1-3 mcOffers (exact catalog strings ONLY), and a compelling narrative
- Use current 2025-2026 market data, trends, and statistics where possible
- Focus on actionable intelligence that helps sales teams position consulting services`;

    // Up to two attempts: retry once if any need comes back with no valid catalog offer.
    // If the schema is rejected (400), fall back to prompt + validation only.
    let useSchema = true;
    let result: { insights: any; needsRetry: boolean } | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      let res = await callGeminiLegacy(GEMINI_API_KEY, prompt, useSchema);
      if (!res.ok && res.status === 400 && useSchema) {
        console.error("Gemini rejected responseSchema, retrying without it:", res.errorText);
        useSchema = false;
        res = await callGeminiLegacy(GEMINI_API_KEY, prompt, false);
      }
      if (!res.ok) {
        console.error("Gemini API error:", res.status, res.errorText);
        return new Response(
          JSON.stringify({ error: `Gemini API error: ${res.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      result = sanitize(JSON.parse(res.text));
      if (!result.needsRetry) break;
      console.error(`Attempt ${attempt + 1}: a need had no valid catalog offer`);
    }

    // After the last attempt, drop any need that still has no valid offer rather than
    // returning off-catalog names.
    const insights = {
      ...result!.insights,
      needs: result!.insights.needs.filter((n: Need) => n.mcOffers.length > 0),
    };

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Legacy refresh error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const denied = await authorize(req);
  if (denied) return denied;

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY is not configured" }, 500);
    let body: Any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Request body must be JSON" }, 400);
    }
    const clock = makeClock(TIME_BUDGET_MS);
    switch (body?.step) {
      case "scan": return await v2Scan(GEMINI_API_KEY, body, clock);
      case "ledger": return await v2Ledger(body, clock);
      case "synth": return await v2Synth(GEMINI_API_KEY, body, clock);
      case "offers": return await v2Offers(GEMINI_API_KEY, body, clock);
      case "report": return await v2Report(body);
    }
    return await legacyRefresh(GEMINI_API_KEY, body);
  } catch (e) {
    console.error("Edge function error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
