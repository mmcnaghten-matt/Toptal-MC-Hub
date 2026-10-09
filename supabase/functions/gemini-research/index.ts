// Market Intelligence Report — Supabase Edge Function (Deno)
//
// Pipeline (every factual statement must trace back to a Google Search result):
//   0. Resolve the company (grounded)        → stops early if the entity is ambiguous / not found
//   1. Research, 6 topics in parallel (grounded, plain text)
//   2. Evidence ledger                        → ONLY text segments Google attributes to a search result
//                                               (groundingSupports) are kept; everything else is discarded
//   3. Structure (no tools, JSON schema)      → facts call + analysis call, both limited to the ledger
//   4. Deterministic validators               → invalid citations, hedged "facts", figures not in the
//                                               cited evidence, analysis with no evidence basis → dropped
//   5. Verifier (LLM)                         → each sourced fact checked against its cited evidence
//   6. MC offering normalisation              → every opportunity maps to the official catalog
//
// Empty sections are expected. A field with no evidence comes back as "Not found in public sources."
// The response keeps the previous top-level shape (so the current UI keeps working) and adds:
//   sources, evidence, claims, quality, entity, searchSuggestions.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ---------- Configuration (override with Supabase secrets; see setup notes) ----------
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRO_MODEL = Deno.env.get("GEMINI_PRO_MODEL") ?? "gemini-2.5-pro";
const FLASH_MODEL = Deno.env.get("GEMINI_FLASH_MODEL") ?? "gemini-2.5-flash";
// Supabase returns 504 if no response is sent within 150s, so the whole pipeline is budgeted below that.
const TIME_BUDGET_MS = Number(Deno.env.get("REPORT_TIME_BUDGET_MS") ?? "140000");
const MIN_EVIDENCE_WARN = 10;
const MAX_EVIDENCE = 300;
const MAX_PER_TOPIC = 45; // per research topic, so big companies don't fill the ledger with the first topics
const MAX_VERIFY = 120;
const NF = "Not found in public sources.";
const NOT_GENERATED = "Not generated: this analysis step failed or timed out. Try again.";

// ---------- Official MC taxonomy: L2 practice > L3 offering ----------
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
const CATALOG_PROMPT = L2_ORDER.map(
  (l2) =>
    `${l2.toUpperCase()}\n` +
    CATALOG.filter((c) => c.l2 === l2).map((c) => `- "${offerKey(c)}": ${c.description}`).join("\n"),
).join("\n\n");

// ---------- Types ----------
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
type Claim = {
  text: string | null;
  status: "sourced" | "not_found";
  evidenceIds: number[];
  verification?: "supported" | "partial" | "unchecked";
};
type Item = { text: string; basedOn: number[] };
type Named = { name: string; evidenceIds: number[] };
type Entity = {
  name: string;
  website: string;
  headquarters: string;
  description: string;
  ownership: string;
  confidence: string;
  otherEntities: string;
};
type Ctx = {
  byId: Map<number, Evidence>;
  evidence: Evidence[];
  dropped: { path: string; reason: string; text: string }[];
  sourced: { path: string; claim: Claim }[];
};

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

// ---------- Step 0: entity resolution ----------
async function resolveEntity(apiKey: string, companyName: string, website: string | undefined, today: string, timeoutMs: number) {
  const prompt = `Today is ${today}. Use Google Search to identify the company "${companyName}"${website ? ` whose website is ${website}` : ""}.
Answer in exactly this format, one field per line, nothing else:
NAME: <official company name>
WEBSITE: <official domain>
HEADQUARTERS: <city, country>
DESCRIPTION: <one factual sentence: what the company sells and to whom>
OWNERSHIP: <public (exchange: ticker) | private | subsidiary of X>
CONFIDENCE: <high | medium | low>
OTHER_ENTITIES: <none, or other notable organisations that share this name>
Write UNKNOWN for any field you cannot confirm from search results. Do not guess.`;
  const result = await callGemini(apiKey, { model: FLASH_MODEL, prompt, grounded: true, timeoutMs, temperature: 0 });
  const f: Record<string, string> = {};
  for (const line of result.text.split("\n")) {
    const m = line.match(/^[\s*_-]*([A-Z_]+)[\s*_]*:\s*(.+)$/);
    if (m) f[m[1]] = m[2].replace(/\*+/g, "").trim();
  }
  const entity: Entity = {
    name: f.NAME ?? "UNKNOWN",
    website: website ?? f.WEBSITE ?? "UNKNOWN",
    headquarters: f.HEADQUARTERS ?? "UNKNOWN",
    description: f.DESCRIPTION ?? "UNKNOWN",
    ownership: f.OWNERSHIP ?? "UNKNOWN",
    confidence: (f.CONFIDENCE ?? "low").toLowerCase(),
    otherEntities: f.OTHER_ENTITIES ?? "none",
  };
  const grounded = (result.meta?.groundingChunks?.length ?? 0) > 0;
  let error: string | null = null;
  if (!grounded) error = `Could not find "${companyName}" in search results. Check the spelling or add the company website.`;
  else if (entity.name === "UNKNOWN" || entity.description === "UNKNOWN" || entity.confidence.startsWith("low")) {
    error = `Could not confidently identify "${companyName}". Add the company website (companyWebsite) and try again.`;
  }
  return { entity, result, error };
}

// ---------- Step 1: grounded research ----------
const TOPICS = [
  {
    key: "profile",
    label: "Products & business model",
    ask: "What the company sells and to whom: products/services and their names, business model and how it makes money, customer segments, notable customers or partners, product launches and partnerships in the last 24 months, founders and current CEO.",
  },
  {
    key: "performance",
    label: "Financial performance & funding",
    ask: "Revenue and revenue growth (with fiscal period), profitability or margins, funding rounds (date, amount, round type, lead investors), total funding, valuation, employee headcount, and growth rankings or awards that state growth figures. If the company is public, the last two fiscal years of reported results.",
  },
  {
    key: "strategy",
    label: "Strategic initiatives",
    ask: "Strategic priorities and initiatives announced or underway in the last 24 months: new products, market or geographic expansion, acquisitions, partnerships, AI or technology programs, restructuring, leadership changes, and executives' public statements about priorities.",
  },
  {
    key: "market",
    label: "Market",
    ask: "The market(s) the company competes in: how analysts define it, published market-size estimates (figure, year, geography, publisher), growth-rate forecasts, segments, and drivers and headwinds named by analysts or industry publications.",
  },
  {
    key: "competitors",
    label: "Competitors",
    ask: "Companies named as competitors or alternatives to this company by analysts, comparison or review sites, press coverage, or the company itself. For up to 5 of the most frequently named: revenue, headcount, recent activity (last 24 months), value proposition, and pricing model, each with source and date.",
  },
  {
    key: "customer",
    label: "Customer voice",
    ask: "Published customer evidence: ratings and recurring themes in reviews on software review sites, case studies, testimonials, published customer outcomes, complaints, and reasons customers give for choosing or leaving the company. Report only what sources state; do not characterise overall sentiment unless a source does.",
  },
];

const entityBlock = (e: Entity) =>
  `COMPANY: ${e.name} | website: ${e.website} | HQ: ${e.headquarters} | ${e.ownership}\nWHAT IT DOES: ${e.description}`;

const researchPrompt = (ask: string, e: Entity, today: string) => `Today is ${today}.
${entityBlock(e)}
Every fact must be about this exact company, not a similarly named organisation.

RESEARCH TASK: ${ask}

Rules:
- Use Google Search. Report only facts stated in the search results. Never estimate, extrapolate, or fill gaps from memory.
- Write short, self-contained sentences with ONE fact each. Name the company in each sentence, and for any figure give its date or period and who reported it (e.g. "Acme raised $12M in a Series A in March 2024, according to TechCrunch.").
- Prefer sources from the last 24 months for metrics and news.
- Distinguish company claims ("the company says...") from independent reporting.
- If you cannot find something, write one line "NOT FOUND: <item>". Incomplete answers are expected and fine.
- No recommendations, opinions, or analysis.`;

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

function buildLedger(results: { topic: string; r: GeminiResult }[], urlMap: Map<string, string>) {
  const sources: Source[] = [];
  const srcIndex = new Map<string, number>();
  const evidence: Evidence[] = [];
  const seen = new Set<string>();
  const searchSuggestions: string[] = [];
  const queries: string[] = [];
  const perTopic = new Map<string, number>();

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
      if (evidence.length >= MAX_EVIDENCE || (perTopic.get(topic) ?? 0) >= MAX_PER_TOPIC) break;
      perTopic.set(topic, (perTopic.get(topic) ?? 0) + 1);
      evidence.push({ id: evidence.length + 1, topic, text, sourceIds: ids });
    }
  }
  return { sources, evidence, searchSuggestions, queries: [...new Set(queries)] };
}

// ---------- Step 2: schemas + structuring prompts ----------
const STR = { type: "STRING" };
const INTS = { type: "ARRAY", items: { type: "INTEGER" } };
const arr = (items: Any) => ({ type: "ARRAY", items });
const obj = (properties: Record<string, Any>, required = Object.keys(properties)) => ({ type: "OBJECT", properties, required });
const CLAIM = obj({
  text: { type: "STRING", nullable: true },
  status: { type: "STRING", format: "enum", enum: ["sourced", "not_found"] },
  evidenceIds: INTS,
});
const ITEM = obj({ text: STR, basedOn: INTS });
const OPT_ITEM = { ...ITEM, nullable: true };
const NAMED = obj({ name: STR, evidenceIds: INTS });

const FACTS_SCHEMA = obj({
  businessPerformance: obj({
    financialHighlights: arr(CLAIM),
    recentMetrics: arr(CLAIM),
    strategicInitiatives: arr(obj({ name: STR, description: CLAIM })),
  }),
  marketOverview: obj({
    definition: CLAIM,
    tam: CLAIM,
    sam: CLAIM,
    segmentation: arr(CLAIM),
    drivers: arr(CLAIM),
    inhibitors: arr(CLAIM),
  }),
  competitiveLandscape: obj({ directCompetitors: arr(NAMED), indirectCompetitors: arr(NAMED), potentialEntrants: arr(NAMED) }),
  competitorDeepDives: arr(
    obj({
      name: STR,
      revenue: CLAIM,
      headcount: CLAIM,
      activity: CLAIM,
      valueProposition: CLAIM,
      pricingModel: CLAIM,
      strengths: arr(CLAIM),
    }),
  ),
  customerInsights: obj({ sentiment: CLAIM, winLossReasons: arr(CLAIM), unmetNeeds: arr(CLAIM) }),
});

const ANALYSIS_SCHEMA = obj({
  executiveSummary: obj({
    tldr: OPT_ITEM,
    keyTrends: arr(ITEM),
    competitivePositioning: obj({
      label: { type: "STRING", format: "enum", enum: ["Leader", "Challenger", "Niche", "Insufficient evidence"] },
      rationale: OPT_ITEM,
    }),
    bigOpportunity: OPT_ITEM,
  }),
  somEstimate: OPT_ITEM,
  competitorGaps: arr(obj({ competitor: STR, text: STR, basedOn: INTS })),
  swot: obj({ strengths: arr(ITEM), weaknesses: arr(ITEM), opportunities: arr(ITEM), threats: arr(ITEM) }),
  portersFiveForces: obj({
    buyerPower: OPT_ITEM,
    supplierPower: OPT_ITEM,
    competitiveRivalry: OPT_ITEM,
    threatOfSubstitution: OPT_ITEM,
    threatOfNewEntry: OPT_ITEM,
  }),
  pestle: obj({
    political: OPT_ITEM,
    economic: OPT_ITEM,
    social: OPT_ITEM,
    technological: OPT_ITEM,
    legal: OPT_ITEM,
    environmental: OPT_ITEM,
  }),
  recommendations: obj({ product: arr(ITEM), marketing: arr(ITEM), resourceAllocation: OPT_ITEM, roadmap: OPT_ITEM }),
  mcOpportunities: arr(obj({ initiative: STR, need: STR, serviceOffering: STR, rationale: STR, basedOn: INTS })),
});

// Analysis runs as two smaller calls (faster, and keeps each schema well within Gemini's limits).
const CORE_SCHEMA = obj(
  Object.fromEntries(Object.entries(ANALYSIS_SCHEMA.properties).filter(([k]) => k !== "recommendations" && k !== "mcOpportunities")),
);
const RECS_SCHEMA = obj({
  recommendations: ANALYSIS_SCHEMA.properties.recommendations,
  mcOpportunities: ANALYSIS_SCHEMA.properties.mcOpportunities,
});

const evidenceBlock = (ev: Evidence[]) => ev.map((e) => `E${e.id} [${e.topic}] ${e.text}`).join("\n");

const factsPrompt = (e: Entity, ev: Evidence[], today: string) => `You are building the fact base of a market-intelligence report. Today is ${today}.
${entityBlock(e)}

EVIDENCE (format: E<id> [topic] text). This is the ONLY information you may use:
${evidenceBlock(ev)}

Rules:
1. A claim with status "sourced" must list in evidenceIds the E numbers (as integers, e.g. 12) that directly state it. Do not cite evidence that is merely related.
2. Restate the evidence faithfully. Copy every number, date, currency amount and percentage exactly as written in the cited evidence, with the period it refers to. Never compute, convert, round, add up, or estimate.
3. If no evidence supports a field, return status "not_found", text null, evidenceIds []. In lists, include only supported items; an empty list is a correct answer.
4. No hedging. A statement that needs "likely", "probably", "may", "could" or "expected to" is not a fact; leave it out.
5. Attribute self-reported figures in the text ("the company says...", "according to a company press release...").
6. tam / sam: only market-size estimates that appear in the evidence, with publisher, year and geography in the text. Never derive one. If the only estimate is the company's own, say so.
7. competitiveLandscape: only companies the evidence names as competitors or alternatives. competitorDeepDives: at most 5, chosen from those.
8. customerInsights: cite only [customer] evidence (reviews, case studies, testimonials, published outcomes). Otherwise not_found. Never infer sentiment.
9. strategicInitiatives: only initiatives the evidence shows the company announced or is executing; short name plus a one-sentence description.`;

const analysisPrompt = (e: Entity, ev: Evidence[], today: string, part: "core" | "recs") => {
  const head = `You are a management consultant writing the analytical sections of a market-intelligence report. Today is ${today}.
${entityBlock(e)}

EVIDENCE (format: E<id> [topic] text). This is the ONLY information you may rely on:
${evidenceBlock(ev)}

Rules:
1. Every item must list in basedOn the E numbers (integers) it rests on. If you cannot point to evidence for an item, leave it out: null for single fields, [] for lists. Fewer, well-grounded items beat filling every slot, but do use the evidence you have: a well-documented company should get a full analysis.
2. Judgement and synthesis are expected, but introduce no new facts: no figures, percentages, budgets, targets, dates, names, customers or events that are not in the cited evidence.`;
  if (part === "core") {
    return `${head}
3. executiveSummary.tldr: 3-4 sentences for leadership on the company's position, recent performance and priorities.
4. competitivePositioning.label is "Insufficient evidence" unless evidence about market position (scale, share, rankings, comparisons) supports a label; give the rationale.
5. somEstimate: only if the evidence contains a published market size AND evidence on the company's scale. Call it an estimate and show the reasoning. Otherwise null.
6. competitorGaps: one per competitor named in the evidence, contrasting it with ${e.name} on evidenced differences only.`;
  }
  return `${head}
3. recommendations: product, marketing and resource-allocation recommendations for ${e.name}, each tied to evidence. No numeric budgets, splits or targets.
4. mcOpportunities: map evidenced initiatives and needs of ${e.name} to Toptal Management Consulting offerings from the catalog below ONLY. Do not propose a need the evidence does not show (e.g. fundraising support requires evidence of fundraising plans).

MC SERVICE OFFERING CATALOG
Offerings are listed as "Practice > Offering": description. Use the quoted string EXACTLY as written (including the "Practice > " prefix) in serviceOffering.

${CATALOG_PROMPT}

Mapping rules for mcOpportunities:
- Select the offering whose DESCRIPTION most directly covers the need. Do not choose on name alone.
- Each row maps one initiative/need to exactly ONE offering. If an initiative needs more than one offering, add more rows.
- Prefer the most specific offering. "Change Management" and "Program & Portfolio Management" appear under every practice; use them only as an add-on row to a more specific offering, under the practice that fits.
- In each rationale, refer to the offering by its offering name only (e.g. "Finance AI"). Never mention an offering that is not in the catalog.`;
};

// ---------- Step 3: deterministic validators ----------
const HEDGE_I = /\b(likely|probably|presumably|possibly|potentially|appears to|seems to|expected to|is believed to)\b/i;
const HEDGE_CS = /\b(may|might|could)\b/; // case-sensitive so "May 2024" is not flagged

const numVal = (t: string) => String(Number(t.replace(/,/g, "")));
const numTokens = (s: string) => (s.match(/\d+(?:[.,]\d+)*/g) ?? []).map(numVal);
// Financial-looking figures only (used for analysis text, where ordinary numbers like "two" or "Q3" are fine)
const FIN_NUM = /[$€£]\s?\d[\d,.]*|\d[\d,.]*\s?(?:%|percent|×|x\b|k\b|m\b|bn?\b|million|billion|thousand)/gi;

function figuresSupported(text: string, ev: Evidence[], financialOnly: boolean): boolean {
  const hay = new Set(numTokens(ev.map((e) => e.text).join(" ")));
  const needles = financialOnly ? (text.match(FIN_NUM) ?? []).flatMap(numTokens) : numTokens(text);
  return needles.every((n) => hay.has(n));
}

const validEvidence = (ids: unknown, ctx: Ctx, topics?: string[]) =>
  [...new Set(Array.isArray(ids) ? ids : [])]
    .map((id) => ctx.byId.get(Number(id)))
    .filter((e): e is Evidence => !!e && (!topics || topics.includes(e.topic)));

const notFound = (): Claim => ({ text: null, status: "not_found", evidenceIds: [] });

function checkClaim(c: Any, path: string, ctx: Ctx, topics?: string[]): Claim {
  if (c?.status !== "sourced") return notFound();
  const text = typeof c.text === "string" ? c.text.trim() : "";
  const ev = validEvidence(c.evidenceIds, ctx, topics);
  const reason = !text
    ? "empty text"
    : !ev.length
    ? topics ? `no valid ${topics.join("/")} evidence cited` : "no valid evidence cited"
    : HEDGE_I.test(text) || HEDGE_CS.test(text)
    ? "hedged language in a factual field"
    : !figuresSupported(text, ev, false)
    ? "figure not present in cited evidence"
    : null;
  if (reason) {
    ctx.dropped.push({ path, reason, text });
    return notFound();
  }
  const claim: Claim = { text, status: "sourced", evidenceIds: ev.map((e) => e.id), verification: "unchecked" };
  ctx.sourced.push({ path, claim });
  return claim;
}

function checkItem(it: Any, path: string, ctx: Ctx): Item | null {
  const text = typeof it?.text === "string" ? it.text.trim() : "";
  if (!text) return null;
  const ev = validEvidence(it.basedOn, ctx);
  const reason = !ev.length ? "no evidence basis" : !figuresSupported(text, ev, true) ? "figure not present in cited evidence" : null;
  if (reason) {
    ctx.dropped.push({ path, reason, text });
    return null;
  }
  return { text, basedOn: ev.map((e) => e.id) };
}

const list = (a: unknown): Any[] => (Array.isArray(a) ? a : []);

function validateFacts(raw: Any, ctx: Ctx) {
  const f = raw ?? {};
  const claims = (a: unknown, p: string, topics?: string[]) =>
    list(a).map((c, i) => checkClaim(c, `${p}[${i}]`, ctx, topics)).filter((c) => c.status === "sourced");
  const mentioned = (name: string) => ctx.evidence.some((e) => e.text.toLowerCase().includes(name.toLowerCase()));
  const named = (a: unknown, p: string): Named[] =>
    list(a).flatMap((n, i) => {
      const name = typeof n?.name === "string" ? n.name.trim() : "";
      if (!name) return [];
      const ev = validEvidence(n.evidenceIds, ctx).filter((e) => e.text.toLowerCase().includes(name.toLowerCase()));
      if (!ev.length) {
        ctx.dropped.push({ path: `${p}[${i}]`, reason: "competitor not named in cited evidence", text: name });
        return [];
      }
      return [{ name, evidenceIds: ev.map((e) => e.id) }];
    });

  const bp = f.businessPerformance ?? {};
  const mo = f.marketOverview ?? {};
  const cl = f.competitiveLandscape ?? {};
  const ci = f.customerInsights ?? {};
  const CUSTOMER = ["customer"];

  return {
    businessPerformance: {
      financialHighlights: claims(bp.financialHighlights, "businessPerformance.financialHighlights"),
      recentMetrics: claims(bp.recentMetrics, "businessPerformance.recentMetrics"),
      strategicInitiatives: list(bp.strategicInitiatives)
        .map((s, i) => ({
          name: typeof s?.name === "string" ? s.name.trim() : "",
          description: checkClaim(s?.description, `businessPerformance.strategicInitiatives[${i}]`, ctx),
        }))
        .filter((s) => s.name && s.description.status === "sourced"),
    },
    marketOverview: {
      definition: checkClaim(mo.definition, "marketOverview.definition", ctx),
      tam: checkClaim(mo.tam, "marketOverview.tam", ctx),
      sam: checkClaim(mo.sam, "marketOverview.sam", ctx),
      segmentation: claims(mo.segmentation, "marketOverview.segmentation"),
      drivers: claims(mo.drivers, "marketOverview.drivers"),
      inhibitors: claims(mo.inhibitors, "marketOverview.inhibitors"),
    },
    competitiveLandscape: {
      directCompetitors: named(cl.directCompetitors, "competitiveLandscape.directCompetitors"),
      indirectCompetitors: named(cl.indirectCompetitors, "competitiveLandscape.indirectCompetitors"),
      potentialEntrants: named(cl.potentialEntrants, "competitiveLandscape.potentialEntrants"),
    },
    competitorDeepDives: list(f.competitorDeepDives)
      .slice(0, 5)
      .map((d, i) => {
        const p = `competitorDeepDives[${i}]`;
        return {
          name: typeof d?.name === "string" ? d.name.trim() : "",
          revenue: checkClaim(d?.revenue, `${p}.revenue`, ctx),
          headcount: checkClaim(d?.headcount, `${p}.headcount`, ctx),
          activity: checkClaim(d?.activity, `${p}.activity`, ctx),
          valueProposition: checkClaim(d?.valueProposition, `${p}.valueProposition`, ctx),
          pricingModel: checkClaim(d?.pricingModel, `${p}.pricingModel`, ctx),
          strengths: claims(d?.strengths, `${p}.strengths`),
        };
      })
      .filter((d) => d.name && mentioned(d.name)),
    customerInsights: {
      sentiment: checkClaim(ci.sentiment, "customerInsights.sentiment", ctx, CUSTOMER),
      winLossReasons: claims(ci.winLossReasons, "customerInsights.winLossReasons", CUSTOMER),
      unmetNeeds: claims(ci.unmetNeeds, "customerInsights.unmetNeeds", CUSTOMER),
    },
  };
}
type Facts = ReturnType<typeof validateFacts>;

function validateAnalysis(raw: Any, ctx: Ctx) {
  const a = raw ?? {};
  const one = (x: unknown, p: string) => checkItem(x, p, ctx);
  const many = (x: unknown, p: string) => list(x).map((it, i) => one(it, `${p}[${i}]`)).filter((it): it is Item => !!it);
  const es = a.executiveSummary ?? {};
  const pos = es.competitivePositioning ?? {};
  const rationale = one(pos.rationale, "executiveSummary.competitivePositioning.rationale");
  const label = rationale && ["Leader", "Challenger", "Niche"].includes(pos.label) ? pos.label : "Insufficient evidence";
  const pf = a.portersFiveForces ?? {};
  const pe = a.pestle ?? {};
  const sw = a.swot ?? {};
  const rc = a.recommendations ?? {};

  return {
    executiveSummary: {
      tldr: one(es.tldr, "executiveSummary.tldr"),
      keyTrends: many(es.keyTrends, "executiveSummary.keyTrends"),
      competitivePositioning: { label, rationale },
      bigOpportunity: one(es.bigOpportunity, "executiveSummary.bigOpportunity"),
    },
    somEstimate: one(a.somEstimate, "somEstimate"),
    competitorGaps: list(a.competitorGaps).flatMap((g, i) => {
      const item = one(g, `competitorGaps[${i}]`);
      const competitor = typeof g?.competitor === "string" ? g.competitor.trim() : "";
      return item && competitor ? [{ competitor, ...item }] : [];
    }),
    swot: {
      strengths: many(sw.strengths, "swot.strengths"),
      weaknesses: many(sw.weaknesses, "swot.weaknesses"),
      opportunities: many(sw.opportunities, "swot.opportunities"),
      threats: many(sw.threats, "swot.threats"),
    },
    portersFiveForces: {
      buyerPower: one(pf.buyerPower, "portersFiveForces.buyerPower"),
      supplierPower: one(pf.supplierPower, "portersFiveForces.supplierPower"),
      competitiveRivalry: one(pf.competitiveRivalry, "portersFiveForces.competitiveRivalry"),
      threatOfSubstitution: one(pf.threatOfSubstitution, "portersFiveForces.threatOfSubstitution"),
      threatOfNewEntry: one(pf.threatOfNewEntry, "portersFiveForces.threatOfNewEntry"),
    },
    pestle: {
      political: one(pe.political, "pestle.political"),
      economic: one(pe.economic, "pestle.economic"),
      social: one(pe.social, "pestle.social"),
      technological: one(pe.technological, "pestle.technological"),
      legal: one(pe.legal, "pestle.legal"),
      environmental: one(pe.environmental, "pestle.environmental"),
    },
    recommendations: {
      product: many(rc.product, "recommendations.product"),
      marketing: many(rc.marketing, "recommendations.marketing"),
      resourceAllocation: one(rc.resourceAllocation, "recommendations.resourceAllocation"),
      roadmap: one(rc.roadmap, "recommendations.roadmap"),
    },
    mcOpportunities: list(a.mcOpportunities).flatMap((o, i) => {
      const item = one({ text: o?.rationale, basedOn: o?.basedOn }, `mcOpportunities[${i}]`);
      if (!item || typeof o?.initiative !== "string" || typeof o?.need !== "string") return [];
      return [{
        initiative: o.initiative.trim(),
        need: o.need.trim(),
        serviceOffering: String(o.serviceOffering ?? ""),
        rationale: item.text,
        basedOn: item.basedOn,
      }];
    }),
  };
}
type Analysis = ReturnType<typeof validateAnalysis>;
type Opportunity = Analysis["mcOpportunities"][number];

// ---------- Step 4: verifier ----------
async function verifyClaims(apiKey: string, ctx: Ctx, timeoutMs: number): Promise<string> {
  const items = ctx.sourced.filter((s) => s.claim.status === "sourced").slice(0, MAX_VERIFY);
  if (!items.length) return "no sourced claims";
  const prompt = `For each numbered CLAIM, judge whether the EVIDENCE listed under it supports it.
"supported": every part of the claim, including numbers, dates, names and attribution, is stated in the evidence.
"partial": the core is supported, but a detail is missing or slightly overstated.
"unsupported": the evidence does not state it, contradicts it, or is about a different company.

${items
    .map((s, i) =>
      `CLAIM ${i}: ${s.claim.text}\nEVIDENCE:\n${s.claim.evidenceIds.map((id) => `- ${ctx.byId.get(id)?.text}`).join("\n")}`
    )
    .join("\n\n")}

Return one {"index", "verdict"} per claim.`;
  const schema = arr(obj({ index: { type: "INTEGER" }, verdict: { type: "STRING", format: "enum", enum: ["supported", "partial", "unsupported"] } }));
  const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, timeoutMs, temperature: 0, thinkingBudget: 0, attempts: 1 });
  const verdicts = list(safeJson(r.text));
  let checked = 0;
  for (const v of verdicts) {
    const s = items[Number(v?.index)];
    if (!s) continue;
    checked++;
    if (v.verdict === "unsupported") {
      ctx.dropped.push({ path: s.path, reason: "verifier: not supported by cited evidence", text: s.claim.text ?? "" });
      Object.assign(s.claim, notFound());
      delete s.claim.verification;
    } else {
      s.claim.verification = v.verdict === "partial" ? "partial" : "supported";
    }
  }
  return `checked ${checked} of ${ctx.sourced.length} sourced claims`;
}

// Re-apply list filtering after the verifier may have turned claims into not_found.
function pruneFacts(f: Facts): Facts {
  const ok = (c: Claim) => c.status === "sourced";
  return {
    businessPerformance: {
      financialHighlights: f.businessPerformance.financialHighlights.filter(ok),
      recentMetrics: f.businessPerformance.recentMetrics.filter(ok),
      strategicInitiatives: f.businessPerformance.strategicInitiatives.filter((s) => ok(s.description)),
    },
    marketOverview: {
      ...f.marketOverview,
      segmentation: f.marketOverview.segmentation.filter(ok),
      drivers: f.marketOverview.drivers.filter(ok),
      inhibitors: f.marketOverview.inhibitors.filter(ok),
    },
    competitiveLandscape: f.competitiveLandscape,
    competitorDeepDives: f.competitorDeepDives
      .map((d) => ({ ...d, strengths: d.strengths.filter(ok) }))
      .filter((d) => [d.revenue, d.headcount, d.activity, d.valueProposition, d.pricingModel].some(ok) || d.strengths.length > 0),
    customerInsights: {
      sentiment: f.customerInsights.sentiment,
      winLossReasons: f.customerInsights.winLossReasons.filter(ok),
      unmetNeeds: f.customerInsights.unmetNeeds.filter(ok),
    },
  };
}

// ---------- Step 5: MC offering normalisation ----------
async function repairOfferings(apiKey: string, rows: Opportunity[], indexes: number[], timeoutMs: number) {
  const fixes = new Map<number, string>();
  try {
    const items = indexes
      .map((i) => `${i}. Initiative: ${rows[i].initiative} | Need: ${rows[i].need} | Rationale: ${rows[i].rationale}`)
      .join("\n");
    const prompt = `For each numbered sales opportunity, choose the ONE catalog offering whose description most directly covers the need. Use the offering string exactly as written.

${CATALOG_PROMPT}

Opportunities:
${items}`;
    const schema = arr(obj({ index: { type: "INTEGER" }, serviceOffering: { type: "STRING", format: "enum", enum: VALID_OFFERS } }));
    const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, timeoutMs, temperature: 0, thinkingBudget: 0, attempts: 1 });
    for (const x of list(safeJson(r.text))) {
      if (indexes.includes(x?.index) && VALID_SET.has(x?.serviceOffering)) fixes.set(x.index, x.serviceOffering);
    }
  } catch (e) {
    console.error("Offering repair failed:", e);
  }
  return fixes;
}

async function normalizeOpportunities(apiKey: string, rows: Opportunity[], timeoutMs: number): Promise<Opportunity[]> {
  const bad = rows.map((_, i) => i).filter((i) => !VALID_SET.has(rows[i].serviceOffering));
  if (bad.length) {
    const fixes = await repairOfferings(apiKey, rows, bad, timeoutMs);
    fixes.forEach((offer, i) => (rows[i] = { ...rows[i], serviceOffering: offer }));
  }
  return rows.filter((r) => VALID_SET.has(r.serviceOffering));
}

// ---------- Legacy (previous UI) shape, with [n] citations into `sources` ----------
type Placeholders = { facts: string; core: string; recs: string };
function toLegacy(f: Facts, a: Analysis, mc: Opportunity[], ctx: Ctx, ph: Placeholders) {
  const cite = (evIds: number[]) => {
    const s = [...new Set(evIds.flatMap((id) => ctx.byId.get(id)?.sourceIds ?? []))].sort((x, y) => x - y);
    return s.length ? " " + s.map((n) => `[${n}]`).join("") : "";
  };
  const fc = (c: Claim) =>
    c.status === "sourced" && c.text
      ? c.text + cite(c.evidenceIds) + (c.verification === "partial" ? " (partially verified)" : "")
      : ph.facts;
  const fcs = (xs: Claim[]) => (xs.length ? xs.map(fc) : [ph.facts]);
  const fcj = (xs: Claim[]) => (xs.length ? xs.map(fc).join(" ") : ph.facts);
  const fi = (i: Item | null, empty = ph.core) => (i ? i.text + cite(i.basedOn) : empty);
  const fis = (xs: Item[], empty = ph.core) => (xs.length ? xs.map((x) => fi(x)) : [empty]);
  const names = (xs: Named[]) => (xs.length ? xs.map((n) => n.name + cite(n.evidenceIds)) : [ph.facts]);
  const gapFor = (name: string) => {
    const g = a.competitorGaps.find((x) =>
      x.competitor.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(x.competitor.toLowerCase())
    );
    return g ? fi(g) : ph.core;
  };

  return {
    executiveSummary: {
      tldr: fi(a.executiveSummary.tldr),
      keyTrends: fis(a.executiveSummary.keyTrends),
      competitivePositioning: a.executiveSummary.competitivePositioning.label,
      bigOpportunity: fi(a.executiveSummary.bigOpportunity),
    },
    businessPerformance: {
      financialHighlights: fcj(f.businessPerformance.financialHighlights),
      recentMetrics: fcs(f.businessPerformance.recentMetrics),
      strategicInitiatives: f.businessPerformance.strategicInitiatives.map((s) => ({ name: s.name, description: fc(s.description) })),
    },
    marketOverview: {
      definition: fc(f.marketOverview.definition),
      metrics: { tam: fc(f.marketOverview.tam), sam: fc(f.marketOverview.sam), som: fi(a.somEstimate) },
      segmentation: fcs(f.marketOverview.segmentation),
      drivers: fcs(f.marketOverview.drivers),
      inhibitors: fcs(f.marketOverview.inhibitors),
    },
    competitiveLandscape: {
      directCompetitors: names(f.competitiveLandscape.directCompetitors),
      indirectCompetitors: names(f.competitiveLandscape.indirectCompetitors),
      potentialEntrants: names(f.competitiveLandscape.potentialEntrants),
    },
    competitorDeepDives: f.competitorDeepDives.map((d) => ({
      name: d.name,
      profile: { revenue: fc(d.revenue), headcount: fc(d.headcount), activity: fc(d.activity) },
      strengths: fcs(d.strengths),
      valueProposition: fc(d.valueProposition),
      gapAnalysis: gapFor(d.name),
      pricingModel: fc(d.pricingModel),
    })),
    strategicFrameworks: {
      swot: {
        strengths: fis(a.swot.strengths),
        weaknesses: fis(a.swot.weaknesses),
        opportunities: fis(a.swot.opportunities),
        threats: fis(a.swot.threats),
      },
      portersFiveForces: {
        buyerPower: fi(a.portersFiveForces.buyerPower),
        supplierPower: fi(a.portersFiveForces.supplierPower),
        competitiveRivalry: fi(a.portersFiveForces.competitiveRivalry),
        threatOfSubstitution: fi(a.portersFiveForces.threatOfSubstitution),
        threatOfNewEntry: fi(a.portersFiveForces.threatOfNewEntry),
      },
      pestle: {
        political: fi(a.pestle.political),
        economic: fi(a.pestle.economic),
        social: fi(a.pestle.social),
        technological: fi(a.pestle.technological),
        legal: fi(a.pestle.legal),
        environmental: fi(a.pestle.environmental),
      },
    },
    customerInsights: {
      sentiment: fc(f.customerInsights.sentiment),
      winLossReasons: fcj(f.customerInsights.winLossReasons),
      unmetNeeds: fcj(f.customerInsights.unmetNeeds),
    },
    recommendations: {
      product: fis(a.recommendations.product, ph.recs),
      marketing: fis(a.recommendations.marketing, ph.recs),
      resourceAllocation: fi(a.recommendations.resourceAllocation, ph.recs),
      roadmap: fi(a.recommendations.roadmap, ph.recs),
    },
    mcOpportunities: mc.map((o) => ({
      initiative: o.initiative,
      need: o.need,
      serviceOffering: o.serviceOffering,
      rationale: o.rationale + cite(o.basedOn),
    })),
  };
}

function sectionCoverage(f: Facts, a: Analysis, mc: Opportunity[]) {
  const s = (c: Claim) => c.status === "sourced";
  const sections: Record<string, boolean> = {
    executiveSummary: !!(a.executiveSummary.tldr || a.executiveSummary.bigOpportunity || a.executiveSummary.keyTrends.length),
    businessPerformance: f.businessPerformance.financialHighlights.length + f.businessPerformance.recentMetrics.length +
        f.businessPerformance.strategicInitiatives.length > 0,
    marketOverview: s(f.marketOverview.definition) || s(f.marketOverview.tam) || f.marketOverview.drivers.length > 0,
    competitiveLandscape: f.competitiveLandscape.directCompetitors.length + f.competitiveLandscape.indirectCompetitors.length > 0,
    competitorDeepDives: f.competitorDeepDives.length > 0,
    strategicFrameworks: Object.values(a.swot).some((x) => x.length > 0),
    customerInsights: s(f.customerInsights.sentiment) || f.customerInsights.winLossReasons.length + f.customerInsights.unmetNeeds.length > 0,
    recommendations: a.recommendations.product.length + a.recommendations.marketing.length > 0,
    mcOpportunities: mc.length > 0,
  };
  const populated = Object.values(sections).filter(Boolean).length;
  return { sections, populated, coverage: Math.round((populated / Object.keys(sections).length) * 100) / 100 };
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "GEMINI_API_KEY is not configured" }, 500);

  let body: Any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }
  const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
  const companyWebsite = typeof body?.companyWebsite === "string" && body.companyWebsite.trim() ? body.companyWebsite.trim() : undefined;
  const deepResearch = body?.deepResearch !== false;
  if (!companyName || companyName.length > 200) return json({ error: "companyName is required (max 200 characters)" }, 400);

  const clock = makeClock(TIME_BUDGET_MS);
  const today = new Date().toISOString().slice(0, 10);
  const warnings: string[] = [];
  const timings: Record<string, number> = {};
  const tick = (label: string, t0: number) => (timings[label] = Date.now() - t0);

  try {
    // 0. Entity
    let t0 = Date.now();
    const ent = await resolveEntity(apiKey, companyName, companyWebsite, today, clock.timeout(30_000, 100_000));
    tick("entity", t0);
    if (ent.error) return json({ error: ent.error, entity: ent.entity }, 422);
    const entity = ent.entity;
    if (!companyWebsite && !/^(none|unknown)?$/i.test(entity.otherEntities.trim())) {
      warnings.push(`Other organisations share this name (${entity.otherEntities}). Confirm the website ${entity.website} is the right company.`);
    }

    // 1. Research (parallel, grounded)
    t0 = Date.now();
    const researchModel = deepResearch ? PRO_MODEL : FLASH_MODEL;
    const researchTimeout = clock.timeout(deepResearch ? 60_000 : 45_000, 70_000);
    const settled = await Promise.allSettled(
      TOPICS.map((tp) =>
        callGemini(apiKey, { model: researchModel, prompt: researchPrompt(tp.ask, entity, today), grounded: true, timeoutMs: researchTimeout, attempts: 2 })
      ),
    );
    tick("research", t0);
    const results: { topic: string; r: GeminiResult }[] = [{ topic: "profile", r: ent.result }];
    settled.forEach((s, i) => {
      if (s.status === "fulfilled") results.push({ topic: TOPICS[i].key, r: s.value });
      else warnings.push(`Research on "${TOPICS[i].label}" failed (${(s.reason as Error)?.message ?? s.reason}); related sections may be empty.`);
    });

    // 2. Evidence ledger
    t0 = Date.now();
    const uris = results.flatMap((x) => (x.r.meta?.groundingChunks ?? []).map((c) => c.web?.uri).filter((u): u is string => !!u));
    const urlMap = await resolveRedirects(uris, Math.min(6000, Math.max(1500, clock.remaining() - 50_000)));
    const ledger = buildLedger(results, urlMap);
    tick("ledger", t0);
    if (!ledger.evidence.length) {
      return json({ error: "Search returned no citable evidence for this company, so no report was produced.", entity, warnings }, 422);
    }
    if (ledger.evidence.length < MIN_EVIDENCE_WARN) {
      warnings.push(`Only ${ledger.evidence.length} citable facts were found; expect most sections to be empty.`);
    }
    const ctx: Ctx = { byId: new Map(ledger.evidence.map((e) => [e.id, e])), evidence: ledger.evidence, dropped: [], sourced: [] };

    // 3. Structure (no tools; evidence-only). Three calls in parallel; each falls back to Flash if the
    //    preferred model fails or times out, so one slow call can't blank out whole sections.
    t0 = Date.now();
    const structured = async (label: string, prompt: string, schema: Any, preferPro: boolean, temperature: number) => {
      const usePro = preferPro && clock.remaining() > 60_000;
      try {
        const r = await callGemini(apiKey, {
          model: usePro ? PRO_MODEL : FLASH_MODEL, prompt, schema, temperature, attempts: 1,
          timeoutMs: usePro ? clock.timeout(40_000, 35_000) : clock.timeout(45_000, 18_000),
        });
        const parsed = safeJson(r.text);
        if (parsed) return parsed;
        throw new Error("invalid JSON");
      } catch (e) {
        if (!usePro || clock.remaining() < 25_000) throw e;
        console.error(`${label}: ${PRO_MODEL} failed (${(e as Error).message}); retrying with ${FLASH_MODEL}`);
        warnings.push(`${label}: fell back to ${FLASH_MODEL} (${(e as Error).message}).`);
        const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, temperature, attempts: 1, timeoutMs: clock.timeout(40_000, 18_000) });
        const parsed = safeJson(r.text);
        if (!parsed) throw new Error("invalid JSON");
        return parsed;
      }
    };
    const [factsRes, coreRes, recsRes] = await Promise.allSettled([
      structured("Fact extraction", factsPrompt(entity, ledger.evidence, today), FACTS_SCHEMA, false, 0.1),
      structured("Analysis", analysisPrompt(entity, ledger.evidence, today, "core"), CORE_SCHEMA, deepResearch, 0.3),
      structured("Recommendations", analysisPrompt(entity, ledger.evidence, today, "recs"), RECS_SCHEMA, deepResearch, 0.3),
    ]);
    tick("structure", t0);
    const value = (r: PromiseSettledResult<Any>, label: string) => {
      if (r.status === "fulfilled") return r.value;
      warnings.push(`${label} failed (${(r.reason as Error)?.message ?? r.reason}); its sections show "${NOT_GENERATED}"`);
      return null;
    };
    const rawFacts = value(factsRes, "Fact extraction");
    const rawCore = value(coreRes, "Analysis");
    const rawRecs = value(recsRes, "Recommendations");
    const rawAnalysis = { ...(rawCore ?? {}), recommendations: rawRecs?.recommendations, mcOpportunities: rawRecs?.mcOpportunities };
    const placeholders: Placeholders = {
      facts: rawFacts ? NF : NOT_GENERATED,
      core: rawCore ? NF : NOT_GENERATED,
      recs: rawRecs ? NF : NOT_GENERATED,
    };

    // 4. Deterministic validation
    const factsValidated = validateFacts(rawFacts, ctx);
    const analysis = validateAnalysis(rawAnalysis, ctx);

    // 5. Verifier + MC normalisation (parallel)
    t0 = Date.now();
    const left = clock.remaining();
    const [verifyRes, mcRes] = await Promise.allSettled([
      left > 15_000
        ? verifyClaims(apiKey, ctx, Math.min(30_000, left - 6_000))
        : Promise.resolve("skipped (time budget)"),
      normalizeOpportunities(apiKey, analysis.mcOpportunities, Math.min(15_000, Math.max(3_000, left - 6_000))),
    ]);
    tick("verify", t0);
    const verifier = verifyRes.status === "fulfilled" ? verifyRes.value : `failed (${(verifyRes.reason as Error)?.message})`;
    if (!verifier.startsWith("checked") && verifier !== "no sourced claims") {
      warnings.push(`Verifier ${verifier}; sourced claims are marked "unchecked".`);
    }
    const mc = mcRes.status === "fulfilled" ? mcRes.value : [];

    const facts = pruneFacts(factsValidated);
    const cov = sectionCoverage(facts, analysis, mc);
    const sourcedClaims = ctx.sourced.filter((s) => s.claim.status === "sourced").length;
    console.log(JSON.stringify({ company: entity.name, timings, evidence: ledger.evidence.length, sourcedClaims, dropped: ctx.dropped.length }));

    return json({
      companyName,
      entity,
      ...toLegacy(facts, analysis, mc, ctx, placeholders),
      sources: ledger.sources,
      evidence: ledger.evidence,
      claims: { facts, analysis: { ...analysis, mcOpportunities: mc } },
      quality: {
        steps: { facts: !!rawFacts, analysis: !!rawCore, recommendations: !!rawRecs },
        evidenceByTopic: Object.fromEntries(TOPICS.map((tp) => [tp.key, ledger.evidence.filter((e) => e.topic === tp.key).length])),
        coverage: cov.coverage,
        sectionsPopulated: cov.populated,
        sections: cov.sections,
        evidenceCount: ledger.evidence.length,
        sourceCount: ledger.sources.length,
        sourcedClaims,
        droppedCount: ctx.dropped.length,
        dropped: ctx.dropped,
        verifier,
        warnings,
        searchQueries: ledger.queries,
        models: { research: researchModel, facts: FLASH_MODEL, analysis: deepResearch ? `${PRO_MODEL} (falls back to ${FLASH_MODEL})` : FLASH_MODEL },
        timingsMs: timings,
      },
      searchSuggestions: ledger.searchSuggestions,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Report pipeline error:", e, { timings });
    return json({ error: e instanceof Error ? e.message : "Unknown error", warnings }, 502);
  }
});
