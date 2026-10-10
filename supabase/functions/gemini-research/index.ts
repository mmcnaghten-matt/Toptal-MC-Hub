// Market Intelligence Report — Supabase Edge Function (Deno)
//
// Runs as three chained requests (step: "research" -> "facts" -> "analysis") so each stays under the 150s limit.
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
const MAX_EVIDENCE = 500;
// Per research topic, so big companies don't fill the ledger with the first topics.
const topicCap = (topic: string) => (topic.startsWith("strategy_") ? 30 : topic.startsWith("competitor:") ? 25 : 40);
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

// ---------- Strategic initiative taxonomy (fixed groups so reports are consistent) ----------
const INITIATIVE_GROUPS: { group: string; subs: { name: string; description: string }[] }[] = [
  {
    group: "Mergers, Acquisitions & Partnerships (Inorganic Growth)",
    subs: [
      { name: "M&A Activity", description: "acquisitions of competitors or tech tuck-ins" },
      { name: "Divestitures & Spinoffs", description: "selling non-core business units or spinning out subsidiaries" },
      { name: "Joint Ventures & Strategic Alliances", description: "major partnerships, co-development agreements, or exclusive distribution rights" },
    ],
  },
  {
    group: "Market Strategy, Growth & Innovation (Organic Growth)",
    subs: [
      { name: "Product & Service Launches", description: "major new product lines, software releases, or subscription models" },
      { name: "Market Expansion", description: "entering new geographic regions or targeting new customer segments" },
      { name: "R&D and Innovation", description: "significant investments in emerging technologies (e.g. generative AI integration, patent acquisitions)" },
      { name: "Go-to-Market (GTM) Shifts", description: "moving from B2B to direct-to-consumer, or overhauling pricing and packaging" },
    ],
  },
  {
    group: "Operational Transformation & Technology",
    subs: [
      { name: "Supply Chain & Manufacturing", description: "nearshoring, new manufacturing facilities, or supplier diversification" },
      { name: "Digital Transformation", description: "cloud migrations, ERP implementations, or automating core processes" },
      { name: "Cost Optimization", description: "facility closures, vendor consolidation, or lean management rollouts (distinct from financial engineering)" },
      { name: "Operating Model Shifts", description: "e.g. from a decentralized regional model to a centralized global service model" },
    ],
  },
  {
    group: "Organizational & Leadership Dynamics",
    subs: [
      { name: "C-Suite & Board Transitions", description: "a new CEO or CFO, or activist investors appointed to the board" },
      { name: "Workforce Restructuring", description: "significant headcount reductions, hiring freezes, or large talent drives in specific skill sets" },
      { name: "Culture & Design", description: "moving to a matrix organization, permanent remote/hybrid models, or major unionization events" },
    ],
  },
  {
    group: "Financial Strategy & Capital Allocation",
    subs: [
      { name: "Shareholder Returns", description: "initiating or cutting dividends, or authorizing large share buyback programs" },
      { name: "Capital Structure", description: "issuing new debt, debt refinancing, or secondary equity offerings" },
      { name: "Resource Allocation", description: "significant shifts in capital expenditure budgets, e.g. cutting marketing spend to fund real estate" },
    ],
  },
  {
    group: "ESG, Regulatory & Corporate Governance",
    subs: [
      { name: "Environmental Initiatives", description: "carbon neutral commitments, transition to renewable energy, or sustainable packaging rollouts" },
      { name: "Governance & Compliance", description: "responses to regulatory investigations (DOJ, SEC, FTC), settling major lawsuits, or new ethical oversight committees" },
    ],
  },
];
const SUBGROUP_NAMES = INITIATIVE_GROUPS.flatMap((g) => g.subs.map((x) => x.name));
const SUBGROUP_TO_GROUP = new Map(INITIATIVE_GROUPS.flatMap((g) => g.subs.map((x) => [x.name, g.group] as const)));
const INITIATIVE_WINDOW_MONTHS = 24;
const groupsPrompt = (idx: number[]) =>
  idx.map((i) => {
    const g = INITIATIVE_GROUPS[i];
    return `${g.group}\n` + g.subs.map((x) => `- ${x.name}: ${x.description}`).join("\n");
  }).join("\n\n");

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
  ...[[0, 1], [2, 3], [4, 5]].map((idx, n) => ({
    key: `strategy_${n + 1}`,
    label: "Strategic initiatives",
    ask: `Significant strategic initiatives announced or started in the last ${INITIATIVE_WINDOW_MONTHS} months, organised by the categories below. For each sub-category list the significant initiatives: what happened, when (month and year), and who reported it. Skip minor items. If a sub-category has nothing significant, write one line "NOT FOUND: <sub-category>".\n\n${groupsPrompt(idx)}`,
  })),
  {
    key: "market",
    label: "Market",
    ask: "The market(s) the company competes in: how analysts define it, published market-size estimates (figure, year, geography, publisher), growth-rate forecasts, segments, and drivers and headwinds named by analysts or industry publications.",
  },
  {
    key: "competitors",
    label: "Competitors",
    ask: "Companies named as competitors or alternatives to this company by analysts, comparison or review sites, press coverage, or the company itself. List the most frequently named, who named them, and the market or segment in which they compete.",
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
const MARKET = obj({ segment: STR, geography: STR, year: { type: "INTEGER", nullable: true }, value: STR, publisher: STR, evidenceIds: INTS });

const FACTS_SCHEMA = obj({
  businessPerformance: obj({
    financialHighlights: arr(CLAIM),
    recentMetrics: arr(CLAIM),
    strategicInitiatives: arr(obj({
      group: { type: "STRING", format: "enum", enum: INITIATIVE_GROUPS.map((g) => g.group) },
      subgroup: { type: "STRING", format: "enum", enum: SUBGROUP_NAMES },
      name: STR,
      description: CLAIM,
    })),
  }),
  marketOverview: obj({
    definition: CLAIM,
    tam: arr(MARKET),
    sam: arr(MARKET),
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
      pricingModel: CLAIM,
      description: OPT_ITEM,
      strengths: arr(ITEM),
    }),
  ),
  customerInsights: obj({ sentiment: CLAIM, sentimentThemes: arr(CLAIM), winReasons: arr(CLAIM), lossReasons: arr(CLAIM), unmetNeeds: arr(CLAIM) }),
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
  performanceSummary: arr(ITEM),
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
const CORE1_SCHEMA = obj({
  executiveSummary: ANALYSIS_SCHEMA.properties.executiveSummary,
  performanceSummary: ANALYSIS_SCHEMA.properties.performanceSummary,
  somEstimate: ANALYSIS_SCHEMA.properties.somEstimate,
  competitorGaps: ANALYSIS_SCHEMA.properties.competitorGaps,
});
const FRAMEWORKS_SCHEMA = obj({
  swot: ANALYSIS_SCHEMA.properties.swot,
  portersFiveForces: ANALYSIS_SCHEMA.properties.portersFiveForces,
  pestle: ANALYSIS_SCHEMA.properties.pestle,
});
const RECS_SCHEMA = obj({
  recommendations: ANALYSIS_SCHEMA.properties.recommendations,
  mcOpportunities: ANALYSIS_SCHEMA.properties.mcOpportunities,
});

const evidenceBlock = (ev: Evidence[]) => ev.map((e) => `E${e.id} [${e.topic}] ${e.text}`).join("\n");

const factsPrompt = (e: Entity, ev: Evidence[], today: string, competitors?: string[]) => `You are building the fact base of a market-intelligence report. Today is ${today}.
${entityBlock(e)}

EVIDENCE (format: E<id> [topic] text). This is the ONLY information you may use:
${evidenceBlock(ev)}

Rules:
1. A claim with status "sourced" must list in evidenceIds the E numbers (as integers, e.g. 12) that directly state it. Do not cite evidence that is merely related.
2. Restate the evidence faithfully. Copy every number, date, currency amount and percentage exactly as written in the cited evidence, with the period it refers to. Never compute, convert, round, add up, or estimate.
3. If no evidence supports a field, return status "not_found", text null, evidenceIds []. In lists, include only supported items; an empty list is a correct answer.
4. No hedging. A statement that needs "likely", "probably", "may", "could" or "expected to" is not a fact; leave it out.
5. Attribute self-reported figures in the text ("the company says...", "according to a company press release...").
6. tam / sam are lists of published market-size estimates, ONE entry per market segment or product line (a large company can serve several). Report only the most recent ACTUAL estimate for a segment, never a forecast or projection for a future year; if the evidence has several years or publishers for a segment, give only the most recent year and prefer a global figure. Fields: segment (short name of the market), geography, year, value (copied as written in the evidence, e.g. "$48.2B"), publisher (the research firm or source named in the evidence), evidenceIds. Never derive, convert, add up or estimate a figure. If the only estimate is the company's own, name the company as publisher. Empty list if there is none.
7. competitiveLandscape: only companies the evidence names as competitors or alternatives. competitorDeepDives: ${
  competitors?.length ? `exactly these competitors, in this order, one entry each: ${competitors.join("; ")}.` : "at most 5, chosen from those competitors."
} For each: revenue, headcount, activity and pricingModel are strict claims (rules 1-5; not_found if no evidence). description is ONE or TWO sentences on what that competitor sells and how it positions itself; strengths are 3 to 5 short items (at most 12 words each), each an advantage the evidence attributes to that competitor. For description and strengths, cite in basedOn the E numbers about THAT competitor (evidence tagged [competitor:<name>] is about it); they are summaries of the evidence, so they may use general wording, but add no figures, names or events that are not in the cited evidence.
8. customerInsights: cite only [customer] evidence (reviews, case studies, testimonials, published outcomes). Otherwise not_found or an empty list. Never infer sentiment. Style: sentiment is ONE headline sentence of at most 25 words. sentimentThemes, winReasons, lossReasons and unmetNeeds are lists with at most 5 items each; one idea per item, at most 25 words, starting with a 2-4 word bold label ("**Ease of use:** reviewers on G2 praise setup speed."). winReasons are reasons customers choose the company; lossReasons are reasons customers leave or choose a competitor.
9. strategicInitiatives: only SIGNIFICANT initiatives the evidence shows the company announced or started in the last ${INITIATIVE_WINDOW_MONTHS} months. For each, set subgroup to exactly one of these sub-categories and group to the group it belongs to, give a short name, and a one-sentence description that includes the month and year from the evidence. At most 3 per sub-category, most recent first. A sub-category with nothing significant gets no entries.

SUB-CATEGORIES
${groupsPrompt([0, 1, 2, 3, 4, 5])}`;

const analysisPrompt = (e: Entity, ev: Evidence[], today: string, part: "core" | "frameworks" | "recs") => {
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
6. competitorGaps: one per competitor named in the evidence, contrasting it with ${e.name} on evidenced differences only.
7. performanceSummary: 2-3 short paragraphs (at most 130 words in total), each its own array item with basedOn. Paragraph 1: scale and growth (revenue and revenue growth, with fiscal period). Paragraph 2: profitability (net income or margins). Paragraph 3: valuation and funding (market capitalization, valuation, funding). Weave in one clause on what this implies for the company's position. Write flowing prose, not a list, and omit a paragraph the evidence cannot support. Use only figures present in the cited evidence, with their periods; never compute totals or ratios.`;
  }
  if (part === "frameworks") {
    return `${head}
3. swot: up to 4 short items per quadrant (strengths and weaknesses are internal to ${e.name}; opportunities and threats are external), each resting on the cited evidence.
4. portersFiveForces: for each force write 1-2 sentences assessing how strong that force is for ${e.name} and why, resting on the cited evidence (buyers, suppliers, existing rivals, substitutes, new entrants). Use null only if the evidence says nothing relevant.
5. pestle: for each factor (political, economic, social, technological, legal, environmental) write 1-2 sentences on how it affects ${e.name}, resting on the cited evidence. Use null for a factor the evidence does not touch.`;
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

type MarketEntry = { segment: string; geography: string; year: number; value: string; publisher: string; claim: Claim };

// Display-only tidy: abbreviate unit words without touching any digit, so number validation stays valid.
const tidyValue = (v: string) =>
  v.replace(/\bUS\$|\bUSD\s*/gi, "$").replace(/(\d)\s*(trillion|billion|million)\b/gi, (_m, d, u) => d + u[0].toUpperCase()).trim();

// For sorting only: the first number in a value with its magnitude suffix.
function magnitude(v: string): number {
  const m = v.match(/(\d[\d,]*(?:\.\d+)?)\s*(trillion|billion|million|thousand|tn|bn|mn|[tbmk])?/i);
  if (!m) return -Infinity;
  const mult: Record<string, number> = { t: 1e12, tn: 1e12, trillion: 1e12, b: 1e9, bn: 1e9, billion: 1e9, m: 1e6, mn: 1e6, million: 1e6, k: 1e3, thousand: 1e3 };
  return Number(m[1].replace(/,/g, "")) * (mult[(m[2] ?? "").toLowerCase()] ?? 1);
}

const PUBLISHER_RANK = ["gartner", "idc", "forrester", "mckinsey", "statista", "grand view research", "marketsandmarkets", "mordor", "fortune business insights", "precedence research"];
const SEGMENT_FILLER = new Set(["market", "markets", "global", "worldwide", "industry", "industries", "size", "the", "of"]);
const segmentKey = (name: string) =>
  name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter((w) => w && !SEGMENT_FILLER.has(w)).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w)).join(" ");

// One row per segment: latest year, then global over regional, then better-known publisher, then first seen.
// Largest segments first, at most 5.
function latestPerSegment(entries: MarketEntry[]): MarketEntry[] {
  const geoRank = (g: string) => (/global|worldwide|world/i.test(g) ? 0 : 1);
  const pubRank = (p: string) => {
    const i = PUBLISHER_RANK.findIndex((x) => p.toLowerCase().includes(x));
    return i < 0 ? 99 : i;
  };
  const best = new Map<string, { e: MarketEntry; i: number }>();
  entries.forEach((e, i) => {
    const key = segmentKey(e.segment) || e.segment.toLowerCase();
    const cur = best.get(key);
    const better = !cur || e.year > cur.e.year ||
      (e.year === cur.e.year && (geoRank(e.geography) < geoRank(cur.e.geography) ||
        (geoRank(e.geography) === geoRank(cur.e.geography) && pubRank(e.publisher) < pubRank(cur.e.publisher))));
    if (better) best.set(key, { e, i });
  });
  return [...best.values()]
    .sort((a, b) => magnitude(b.e.value) - magnitude(a.e.value) || a.i - b.i)
    .map((x) => x.e)
    .slice(0, 5);
}

function validateFacts(raw: Any, ctx: Ctx, competitorNames?: string[]) {
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

  // Initiatives: valid sub-category, inside the time window, at most 3 per sub-category.
  const cutoffYear = new Date(Date.now() - INITIATIVE_WINDOW_MONTHS * 30.44 * 86_400_000).getFullYear();
  const initiatives = (a: unknown) => {
    const perSub = new Map<string, number>();
    return list(a).flatMap((s, i) => {
      const path = `businessPerformance.strategicInitiatives[${i}]`;
      const name = typeof s?.name === "string" ? s.name.trim() : "";
      const subgroup = typeof s?.subgroup === "string" ? s.subgroup : "";
      const group = SUBGROUP_TO_GROUP.get(subgroup);
      if (!name) return [];
      if (!group) {
        ctx.dropped.push({ path, reason: "unknown initiative category", text: name });
        return [];
      }
      const description = checkClaim(s?.description, path, ctx);
      if (description.status !== "sourced") return [];
      const years = (description.text!.match(/\b20\d\d\b/g) ?? []).map(Number);
      if (years.length && Math.max(...years) < cutoffYear) {
        ctx.dropped.push({ path, reason: `older than ${INITIATIVE_WINDOW_MONTHS} months`, text: description.text! });
        Object.assign(description, notFound());
        delete description.verification;
        return [];
      }
      const n = perSub.get(subgroup) ?? 0;
      if (n >= 3) return [];
      perSub.set(subgroup, n + 1);
      return [{ group, subgroup, name, description }];
    });
  };

  const thisYear = new Date().getFullYear();
  const marketEntries = (a: unknown, p: string): MarketEntry[] =>
    list(a).flatMap((m, i) => {
      const path = `${p}[${i}]`;
      const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
      const segment = str(m?.segment);
      const value = str(m?.value);
      const publisher = str(m?.publisher);
      const geography = str(m?.geography) || "Not stated";
      const year = Number(m?.year);
      const reason = !segment || !publisher ? "missing segment or publisher"
        : !/\d/.test(value) ? "value has no figure"
        : !Number.isInteger(year) || year < 1990 ? "missing year"
        : year > thisYear ? "forecast year, not a current estimate"
        : null;
      const text = `${segment} (${geography}, ${year}): ${value}, ${publisher}`;
      if (reason) {
        ctx.dropped.push({ path, reason, text });
        return [];
      }
      const claim = checkClaim({ text, status: "sourced", evidenceIds: m?.evidenceIds }, path, ctx);
      return claim.status === "sourced" ? [{ segment, geography, year, value: tidyValue(value), publisher, claim }] : [];
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
      strategicInitiatives: initiatives(bp.strategicInitiatives),
    },
    marketOverview: {
      definition: checkClaim(mo.definition, "marketOverview.definition", ctx),
      tam: marketEntries(mo.tam, "marketOverview.tam"),
      sam: marketEntries(mo.sam, "marketOverview.sam"),
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
      .flatMap((d, i) => {
        const p = `competitorDeepDives[${i}]`;
        let name = typeof d?.name === "string" ? d.name.trim() : "";
        if (!name) return [];
        if (competitorNames?.length) {
          // Only the competitors identified in the competitors step (keeps results stable between runs).
          const lc = name.toLowerCase();
          const match = competitorNames.find((c) => c.toLowerCase() === lc) ??
            competitorNames.find((c) => c.toLowerCase().includes(lc) || lc.includes(c.toLowerCase()));
          if (!match) {
            ctx.dropped.push({ path: p, reason: "competitor not in the identified list", text: name });
            return [];
          }
          name = match;
        } else if (!mentioned(name)) {
          return [];
        }
        // description / strengths: evidence-backed summaries about THIS competitor (no hedging or verifier test).
        const topic = `competitor:${name}`.toLowerCase();
        const about = (it: Any, path: string): Item | null => {
          const text = typeof it?.text === "string" ? it.text.trim() : "";
          if (!text) return null;
          const ev = validEvidence(it.basedOn, ctx).filter(
            (e) => e.topic.toLowerCase() === topic || e.text.toLowerCase().includes(name.toLowerCase()),
          );
          const reason = !ev.length
            ? "no evidence about this competitor cited"
            : !figuresSupported(text, ev, true)
            ? "figure not present in cited evidence"
            : null;
          if (reason) {
            ctx.dropped.push({ path, reason, text });
            return null;
          }
          return { text, basedOn: ev.map((e) => e.id) };
        };
        return [{
          name,
          revenue: checkClaim(d?.revenue, `${p}.revenue`, ctx),
          headcount: checkClaim(d?.headcount, `${p}.headcount`, ctx),
          activity: checkClaim(d?.activity, `${p}.activity`, ctx),
          pricingModel: checkClaim(d?.pricingModel, `${p}.pricingModel`, ctx),
          description: about(d?.description, `${p}.description`),
          strengths: list(d?.strengths).slice(0, 5).map((x, si) => about(x, `${p}.strengths[${si}]`)).filter((x): x is Item => !!x),
        }];
      }),
    customerInsights: {
      sentiment: checkClaim(ci.sentiment, "customerInsights.sentiment", ctx, CUSTOMER),
      sentimentThemes: claims(ci.sentimentThemes, "customerInsights.sentimentThemes", CUSTOMER).slice(0, 5),
      winReasons: claims(ci.winReasons, "customerInsights.winReasons", CUSTOMER).slice(0, 5),
      lossReasons: claims(ci.lossReasons, "customerInsights.lossReasons", CUSTOMER).slice(0, 5),
      unmetNeeds: claims(ci.unmetNeeds, "customerInsights.unmetNeeds", CUSTOMER).slice(0, 5),
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
    performanceSummary: many(a.performanceSummary, "performanceSummary").slice(0, 3),
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
      tam: latestPerSegment(f.marketOverview.tam.filter((e) => ok(e.claim))),
      sam: latestPerSegment(f.marketOverview.sam.filter((e) => ok(e.claim))),
      segmentation: f.marketOverview.segmentation.filter(ok),
      drivers: f.marketOverview.drivers.filter(ok),
      inhibitors: f.marketOverview.inhibitors.filter(ok),
    },
    competitiveLandscape: f.competitiveLandscape,
    competitorDeepDives: f.competitorDeepDives.filter(
      (d) => [d.revenue, d.headcount, d.activity, d.pricingModel].some(ok) || !!d.description || d.strengths.length > 0,
    ),
    customerInsights: {
      sentiment: f.customerInsights.sentiment,
      sentimentThemes: f.customerInsights.sentimentThemes.filter(ok),
      winReasons: f.customerInsights.winReasons.filter(ok),
      lossReasons: f.customerInsights.lossReasons.filter(ok),
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
  const bullets = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  const fcj = (xs: Claim[]) => (xs.length ? bullets(xs.map(fc)) : ph.facts);
  const fi = (i: Item | null, empty = ph.core) => (i ? i.text + cite(i.basedOn) : empty);
  const fis = (xs: Item[], empty = ph.core) => (xs.length ? xs.map((x) => fi(x)) : [empty]);
  const names = (xs: Named[]) => (xs.length ? xs.map((n) => n.name + cite(n.evidenceIds)) : [ph.facts]);
  const marketLine = (e: MarketEntry) => `**${e.segment}** (${e.geography}, ${e.year}): ${e.value}, ${e.publisher}${cite(e.claim.evidenceIds)}`;
  const marketRow = (e: MarketEntry) => ({
    segment: e.segment, geography: e.geography, year: e.year, value: e.value, publisher: e.publisher, cite: cite(e.claim.evidenceIds).trim(),
  });
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
      financialHighlights: a.performanceSummary.length
        ? a.performanceSummary.map((p) => fi(p)).join("\n\n")
        : fcj(f.businessPerformance.financialHighlights),
      recentMetrics: fcs(f.businessPerformance.recentMetrics),
      strategicInitiatives: f.businessPerformance.strategicInitiatives.map((s) => ({ name: s.name, description: fc(s.description) })),
      strategicInitiativeGroups: INITIATIVE_GROUPS.map((g) => ({
        group: g.group,
        subgroups: g.subs
          .map((sub) => ({
            name: sub.name,
            items: f.businessPerformance.strategicInitiatives
              .filter((s) => s.subgroup === sub.name)
              .map((s) => ({ name: s.name, description: fc(s.description) })),
          }))
          .filter((sg) => sg.items.length),
      })).filter((g) => g.subgroups.length),
    },
    marketOverview: {
      definition: fc(f.marketOverview.definition),
      metrics: {
        tam: f.marketOverview.tam.length ? bullets(f.marketOverview.tam.map(marketLine)) : ph.facts,
        sam: f.marketOverview.sam.length ? bullets(f.marketOverview.sam.map(marketLine)) : ph.facts,
        som: a.somEstimate ? bullets([fi(a.somEstimate)]) : ph.core,
        tamRows: f.marketOverview.tam.map(marketRow),
        samRows: f.marketOverview.sam.map(marketRow),
      },
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
      strengths: d.strengths.length ? d.strengths.map((x) => fi(x)) : [ph.facts],
      valueProposition: d.description ? fi(d.description) : ph.facts,
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
      sentiment: (() => {
        const head = f.customerInsights.sentiment.status === "sourced" ? fc(f.customerInsights.sentiment) : "";
        const themes = f.customerInsights.sentimentThemes.length ? bullets(f.customerInsights.sentimentThemes.map(fc)) : "";
        return [head, themes].filter(Boolean).join("\n\n") || ph.facts;
      })(),
      // JSON string; the page's WinLossColumns renders it as two columns.
      winLossReasons: f.customerInsights.winReasons.length || f.customerInsights.lossReasons.length
        ? JSON.stringify({ wins: f.customerInsights.winReasons.map(fc), losses: f.customerInsights.lossReasons.map(fc) })
        : ph.facts,
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
        f.businessPerformance.strategicInitiatives.length + a.performanceSummary.length > 0,
    marketOverview: s(f.marketOverview.definition) || f.marketOverview.tam.length > 0 || f.marketOverview.drivers.length > 0,
    competitiveLandscape: f.competitiveLandscape.directCompetitors.length + f.competitiveLandscape.indirectCompetitors.length > 0,
    competitorDeepDives: f.competitorDeepDives.length > 0,
    strategicFrameworks: Object.values(a.swot).some((x) => x.length > 0),
    customerInsights: s(f.customerInsights.sentiment) ||
        f.customerInsights.sentimentThemes.length + f.customerInsights.winReasons.length + f.customerInsights.lossReasons.length +
            f.customerInsights.unmetNeeds.length > 0,
    recommendations: a.recommendations.product.length + a.recommendations.marketing.length > 0,
    mcOpportunities: mc.length > 0,
  };
  const populated = Object.values(sections).filter(Boolean).length;
  return { sections, populated, coverage: Math.round((populated / Object.keys(sections).length) * 100) / 100 };
}

// ---------- Pipeline steps ----------
// The report is built in three chained requests (research -> facts -> analysis) so each one stays under
// Supabase's 150s request limit. The page passes the `state` returned by one step into the next.
type State = {
  companyName: string;
  entity: Entity;
  sources: Source[];
  evidence: Evidence[];
  queries: string[];
  searchSuggestions: string[];
  warnings: string[];
  timings: Record<string, number>;
  researchModel: string;
  // set by the competitors step
  competitors?: Competitor[];
  // set by the facts step
  facts?: Facts;
  factsOk?: boolean;
  dropped?: Ctx["dropped"];
  verifier?: string;
  sourcedClaims?: number;
};
type Competitor = { name: string; kind: "direct" | "indirect" };
type StepResult = { ok: true; state: State } | { ok: false; status: number; body: Any };

const todayStr = () => new Date().toISOString().slice(0, 10);
const makeCtx = (evidence: Evidence[], dropped: Ctx["dropped"] = []): Ctx => ({
  byId: new Map(evidence.map((e) => [e.id, e])),
  evidence,
  dropped,
  sourced: [],
});

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

// Step 1: resolve the company, run the grounded research, build the evidence ledger.
async function stepResearch(
  apiKey: string, p: { companyName: string; companyWebsite?: string; deepResearch: boolean }, clock: ReturnType<typeof makeClock>,
): Promise<StepResult> {
  const today = todayStr();
  const warnings: string[] = [];
  const timings: Record<string, number> = {};
  const tick = (label: string, t0: number) => (timings[label] = Date.now() - t0);

  let t0 = Date.now();
  const ent = await resolveEntity(apiKey, p.companyName, p.companyWebsite, today, clock.timeout(30_000, 100_000));
  tick("entity", t0);
  if (ent.error) return { ok: false, status: 422, body: { error: ent.error, entity: ent.entity } };
  const entity = ent.entity;
  if (!p.companyWebsite && !/^(none|unknown)?$/i.test(entity.otherEntities.trim())) {
    warnings.push(`Other organisations share this name (${entity.otherEntities}). Confirm the website ${entity.website} is the right company.`);
  }

  t0 = Date.now();
  const researchModel = p.deepResearch ? PRO_MODEL : FLASH_MODEL;
  const researchTimeout = clock.timeout(p.deepResearch ? 90_000 : 60_000, 30_000);
  const settled = await Promise.allSettled(
    TOPICS.map((tp) =>
      callGemini(apiKey, { model: researchModel, prompt: researchPrompt(tp.ask, entity, today), grounded: true, timeoutMs: researchTimeout, attempts: 2, temperature: 0 })
    ),
  );
  tick("research", t0);
  const results: { topic: string; r: GeminiResult }[] = [{ topic: "profile", r: ent.result }];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") results.push({ topic: TOPICS[i].key, r: s.value });
    else warnings.push(`Research on "${TOPICS[i].label}" failed (${(s.reason as Error)?.message ?? s.reason}); related sections may be empty.`);
  });

  t0 = Date.now();
  const uris = results.flatMap((x) => (x.r.meta?.groundingChunks ?? []).map((c) => c.web?.uri).filter((u): u is string => !!u));
  const urlMap = await resolveRedirects(uris, Math.min(6000, Math.max(1500, clock.remaining() - 20_000)));
  const ledger = buildLedger(results, urlMap);
  tick("ledger", t0);
  if (!ledger.evidence.length) {
    return { ok: false, status: 422, body: { error: "Search returned no citable evidence for this company, so no report was produced.", entity, warnings } };
  }
  if (ledger.evidence.length < MIN_EVIDENCE_WARN) {
    warnings.push(`Only ${ledger.evidence.length} citable facts were found; expect most sections to be empty.`);
  }
  return {
    ok: true,
    state: {
      companyName: p.companyName, entity, sources: ledger.sources, evidence: ledger.evidence, queries: ledger.queries,
      searchSuggestions: ledger.searchSuggestions, warnings, timings, researchModel,
    },
  };
}

// Step 2: identify the main competitors, then research each one with its own focused search.
// One broad search for all competitors gave shallow, inconsistent coverage, especially for very large companies.
async function identifyCompetitors(apiKey: string, state: State, today: string, clock: ReturnType<typeof makeClock>) {
  const company = state.entity.name;
  const clean = (names: unknown, evText: string) => {
    const seen = new Set<string>([company.toLowerCase()]);
    return list(names).flatMap((n) => {
      const name = typeof n === "string" ? n.replace(/\*+/g, "").trim() : "";
      const key = name.toLowerCase();
      if (name.length < 2 || name.length > 80 || seen.has(key) || !evText.includes(key)) return [];
      seen.add(key);
      return [name];
    });
  };
  const ev = state.evidence.filter((e) => e.topic === "competitors" || e.topic === "profile");
  const evText = ev.map((e) => e.text.toLowerCase()).join("\n");
  let direct: string[] = [];
  let indirect: string[] = [];
  const extra: { topic: string; r: GeminiResult }[] = [];

  if (ev.length) {
    const prompt = `${entityBlock(state.entity)}

From the evidence below, list the companies it names as DIRECT competitors of ${company} (same market, same customers), most prominent first (at most 5), and up to 3 INDIRECT competitors or alternatives. Use ONLY company names that appear in the evidence, exactly as written. Company names, not products. Exclude ${company} and its subsidiaries.

EVIDENCE:
${evidenceBlock(ev)}`;
    const schema = obj({ direct: arr(STR), indirect: arr(STR) });
    try {
      const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, temperature: 0, thinkingBudget: 0, attempts: 1, timeoutMs: clock.timeout(25_000, 100_000) });
      const j = safeJson(r.text);
      direct = clean(j?.direct, evText).slice(0, 5);
      indirect = clean(j?.indirect, evText).slice(0, 3);
    } catch (e) {
      console.error("Competitor identification (evidence) failed:", e);
    }
  }
  if (direct.length < 3) {
    // Not enough named in the evidence: ask a grounded search directly.
    try {
      const prompt = `Today is ${today}.
${entityBlock(state.entity)}
Use Google Search. Name the 5 companies most frequently cited by analysts, comparison sites or press as DIRECT competitors of ${company}, then up to 3 INDIRECT competitors or alternatives. Company names only. Answer one per line in exactly this format:
DIRECT: <company name>
INDIRECT: <company name>`;
      const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, grounded: true, temperature: 0, timeoutMs: clock.timeout(30_000, 90_000), attempts: 1 });
      const lines = r.text.split("\n");
      const pick = (tag: string) => lines.map((l) => l.match(new RegExp(`^[\\s*_-]*${tag}[\\s*_]*:\\s*(.+)$`, "i"))?.[1]).filter((x): x is string => !!x);
      const seen = new Set([...direct, ...indirect].map((n) => n.toLowerCase()).concat(company.toLowerCase()));
      const add = (names: string[], into: string[], max: number) => {
        for (const n0 of names) {
          const n = n0.replace(/\*+/g, "").trim();
          if (n.length >= 2 && n.length <= 80 && !seen.has(n.toLowerCase()) && into.length < max) {
            seen.add(n.toLowerCase());
            into.push(n);
          }
        }
      };
      add(pick("DIRECT"), direct, 5);
      add(pick("INDIRECT"), indirect, 3);
      extra.push({ topic: "competitors", r });
    } catch (e) {
      console.error("Competitor identification (search) failed:", e);
    }
  }
  const competitors: Competitor[] = [
    ...direct.map((name) => ({ name, kind: "direct" as const })),
    ...indirect.map((name) => ({ name, kind: "indirect" as const })),
  ].slice(0, 5);
  return { competitors, extra };
}

const competitorPrompt = (e: Entity, name: string, today: string) => `Today is ${today}.
${entityBlock(e)}
${name} is a competitor of ${e.name}. Every fact must be about ${name}, not a similarly named organisation.

RESEARCH TASK: Profile ${name} using Google Search:
- What it sells, to whom, and how it positions itself against competitors such as ${e.name}.
- Its key strengths and advantages as stated by analysts, press, reviews or the company itself (say who says so).
- Revenue (with fiscal period) and employee headcount.
- Notable activity in the last 24 months: products, acquisitions, partnerships, strategy shifts.
- Its pricing model.

Rules:
- Report only facts stated in the search results. Never estimate or fill gaps from memory.
- Write short, self-contained sentences with ONE fact each. Name ${name} in each sentence, and for any figure give its date or period and who reported it.
- If you cannot find something, write one line "NOT FOUND: <item>". Incomplete answers are expected and fine.
- No recommendations or opinions of your own.`;

async function profileCompetitor(apiKey: string, e: Entity, name: string, today: string, model: string, totalMs: number): Promise<GeminiResult> {
  const deadline = Date.now() + totalMs;
  const run = (ms: number) =>
    callGemini(apiKey, { model, prompt: competitorPrompt(e, name, today), grounded: true, temperature: 0, timeoutMs: ms, attempts: 2 });
  const first = await run(Math.min(40_000, totalMs));
  // Thin result: try once more and keep whichever came back with more cited segments.
  if ((first.meta?.groundingSupports?.length ?? 0) < 3 && deadline - Date.now() > 15_000) {
    try {
      const second = await run(deadline - Date.now());
      if ((second.meta?.groundingSupports?.length ?? 0) > (first.meta?.groundingSupports?.length ?? 0)) return second;
    } catch {
      // keep the first result
    }
  }
  return first;
}

async function stepCompetitors(apiKey: string, state: State, deepResearch: boolean, clock: ReturnType<typeof makeClock>): Promise<StepResult> {
  const warnings = [...state.warnings];
  const timings = { ...state.timings };
  const today = todayStr();

  let t0 = Date.now();
  const { competitors, extra } = await identifyCompetitors(apiKey, state, today, clock);
  timings.competitorsIdentify = Date.now() - t0;
  if (!competitors.length) {
    warnings.push("No competitors could be identified, so competitor deep dives rely on general research only.");
    return { ok: true, state: { ...state, warnings, timings, competitors: [] } };
  }

  t0 = Date.now();
  const model = deepResearch && clock.remaining() > 100_000 ? PRO_MODEL : FLASH_MODEL;
  const budget = clock.timeout(70_000, 25_000);
  const settled = await Promise.allSettled(competitors.map((c) => profileCompetitor(apiKey, state.entity, c.name, today, model, budget)));
  timings.competitorsResearch = Date.now() - t0;
  const results: { topic: string; r: GeminiResult }[] = [...extra];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") results.push({ topic: `competitor:${competitors[i].name}`, r: r.value });
    else warnings.push(`Research on competitor "${competitors[i].name}" failed (${(r.reason as Error)?.message ?? r.reason}).`);
  });

  t0 = Date.now();
  const uris = results.flatMap((x) => (x.r.meta?.groundingChunks ?? []).map((c) => c.web?.uri).filter((u): u is string => !!u));
  const urlMap = await resolveRedirects(uris, Math.min(6000, Math.max(1500, clock.remaining() - 20_000)));
  const ledger = buildLedger(results, urlMap, { sources: state.sources, evidence: state.evidence });
  timings.competitorsLedger = Date.now() - t0;

  return {
    ok: true,
    state: {
      ...state,
      sources: ledger.sources,
      evidence: ledger.evidence,
      queries: [...new Set([...state.queries, ...ledger.queries])],
      searchSuggestions: [...state.searchSuggestions, ...ledger.searchSuggestions],
      warnings,
      timings,
      competitors,
    },
  };
}

// Step 3: extract the facts from the ledger, validate them, and have the verifier check each one.
async function stepFacts(apiKey: string, state: State, clock: ReturnType<typeof makeClock>): Promise<StepResult> {
  const warnings = [...state.warnings];
  const timings = { ...state.timings };
  const ctx = makeCtx(state.evidence);
  const competitorNames = state.competitors?.length ? state.competitors.map((c) => c.name) : undefined;

  let t0 = Date.now();
  let rawFacts: Any = null;
  try {
    rawFacts = await structured(apiKey, clock, warnings, "Fact extraction", factsPrompt(state.entity, state.evidence, todayStr(), competitorNames), FACTS_SCHEMA, false, 0, 50_000);
  } catch (e) {
    warnings.push(`Fact extraction failed (${(e as Error)?.message ?? e}); its sections show "${NOT_GENERATED}"`);
  }
  timings.facts = Date.now() - t0;
  const factsValidated = validateFacts(rawFacts, ctx, competitorNames);

  t0 = Date.now();
  const left = clock.remaining();
  let verifier: string;
  try {
    verifier = left > 15_000 ? await verifyClaims(apiKey, ctx, Math.min(40_000, left - 6_000)) : "skipped (time budget)";
  } catch (e) {
    verifier = `failed (${(e as Error)?.message})`;
  }
  timings.verify = Date.now() - t0;
  if (!verifier.startsWith("checked") && verifier !== "no sourced claims") {
    warnings.push(`Verifier ${verifier}; sourced claims are marked "unchecked".`);
  }

  return {
    ok: true,
    state: {
      ...state, warnings, timings, facts: pruneFacts(factsValidated), factsOk: !!rawFacts, dropped: ctx.dropped, verifier,
      sourcedClaims: ctx.sourced.filter((s) => s.claim.status === "sourced").length,
    },
  };
}

// Step 4: analysis + recommendations + MC opportunities, then assemble the final report.
async function stepAnalysis(apiKey: string, state: State, deepResearch: boolean, clock: ReturnType<typeof makeClock>) {
  const facts = state.facts!;
  const warnings = [...state.warnings];
  const timings = { ...state.timings };
  const ctx = makeCtx(state.evidence, [...(state.dropped ?? [])]);
  const today = todayStr();

  let t0 = Date.now();
  const [coreRes, recsRes] = await Promise.allSettled([
    structured(apiKey, clock, warnings, "Analysis", analysisPrompt(state.entity, state.evidence, today, "core"), CORE_SCHEMA, deepResearch, 0.3, 20_000),
    structured(apiKey, clock, warnings, "Recommendations", analysisPrompt(state.entity, state.evidence, today, "recs"), RECS_SCHEMA, deepResearch, 0.3, 20_000),
  ]);
  timings.analysis = Date.now() - t0;
  const value = (r: PromiseSettledResult<Any>, label: string) => {
    if (r.status === "fulfilled") return r.value;
    warnings.push(`${label} failed (${(r.reason as Error)?.message ?? r.reason}); its sections show "${NOT_GENERATED}"`);
    return null;
  };
  const rawCore = value(coreRes, "Analysis");
  const rawRecs = value(recsRes, "Recommendations");
  const rawAnalysis = { ...(rawCore ?? {}), recommendations: rawRecs?.recommendations, mcOpportunities: rawRecs?.mcOpportunities };
  const placeholders: Placeholders = {
    facts: state.factsOk ? NF : NOT_GENERATED,
    core: rawCore ? NF : NOT_GENERATED,
    recs: rawRecs ? NF : NOT_GENERATED,
  };

  const analysis = validateAnalysis(rawAnalysis, ctx);
  t0 = Date.now();
  const left = clock.remaining();
  let mc: Opportunity[] = [];
  try {
    mc = await normalizeOpportunities(apiKey, analysis.mcOpportunities, Math.min(15_000, Math.max(3_000, left - 6_000)));
  } catch (e) {
    console.error("MC normalisation failed:", e);
  }
  timings.mc = Date.now() - t0;

  const cov = sectionCoverage(facts, analysis, mc);
  const sourcedClaims = state.sourcedClaims ?? 0;
  console.log(JSON.stringify({ company: state.entity.name, timings, evidence: state.evidence.length, sourcedClaims, dropped: ctx.dropped.length }));

  return {
    companyName: state.companyName,
    entity: state.entity,
    ...toLegacy(facts, analysis, mc, ctx, placeholders),
    sources: state.sources,
    evidence: state.evidence,
    claims: { facts, analysis: { ...analysis, mcOpportunities: mc } },
    quality: {
      steps: { facts: !!state.factsOk, analysis: !!rawCore, recommendations: !!rawRecs },
      evidenceByTopic: Object.fromEntries(TOPICS.map((tp) => [tp.key, state.evidence.filter((e) => e.topic === tp.key).length])),
      competitors: (state.competitors ?? []).map((c) => {
        const d = facts.competitorDeepDives.find((x) => x.name === c.name);
        const has = (cl: Claim) => cl.status === "sourced";
        return {
          name: c.name,
          kind: c.kind,
          evidenceCount: state.evidence.filter((e) => e.topic === `competitor:${c.name}`).length,
          fieldsFound: d
            ? [has(d.revenue), has(d.headcount), has(d.activity), has(d.pricingModel), !!d.description, d.strengths.length > 0].filter(Boolean).length
            : 0,
        };
      }),
      coverage: cov.coverage,
      sectionsPopulated: cov.populated,
      sections: cov.sections,
      evidenceCount: state.evidence.length,
      sourceCount: state.sources.length,
      sourcedClaims,
      droppedCount: ctx.dropped.length,
      dropped: ctx.dropped,
      verifier: state.verifier ?? "not run",
      warnings,
      searchQueries: state.queries,
      models: { research: state.researchModel, facts: FLASH_MODEL, analysis: deepResearch ? `${PRO_MODEL} (falls back to ${FLASH_MODEL})` : FLASH_MODEL },
      timingsMs: timings,
    },
    searchSuggestions: state.searchSuggestions,
    generatedAt: new Date().toISOString(),
  };
}

// ---------- Section pipeline (v2): small independent requests, orchestrated by the page ----------
// entity -> scan (one per topic) -> ledger -> [identify -> competitor scans -> ledger] -> facts_section (one per
// section) -> analysis_part (core / frameworks / recs) -> report. Each request has its own 150s budget and the page
// retries only the piece that failed. The older research/competitors/facts/analysis steps remain for older pages.
type Section = "performance" | "strategy" | "market" | "competitors" | "customer";
const SECTIONS: Section[] = ["performance", "strategy", "market", "competitors", "customer"];
type Slice = { topic: string; status: "ok" | "thin" | "failed"; ms: number; error?: string; meta: GroundingMeta | null };

const SECTION_TOPICS: Record<Section, (t: string) => boolean> = {
  performance: (t) => t === "profile" || t === "performance",
  strategy: (t) => t === "profile" || t.startsWith("strategy_"),
  market: (t) => t === "profile" || t === "market",
  competitors: (t) => t === "competitors" || t.startsWith("competitor:"),
  customer: (t) => t === "customer",
};
const FP = FACTS_SCHEMA.properties;
const SECTION_SCHEMAS: Record<Section, Any> = {
  performance: obj({ businessPerformance: obj({ financialHighlights: FP.businessPerformance.properties.financialHighlights, recentMetrics: FP.businessPerformance.properties.recentMetrics }) }),
  strategy: obj({ businessPerformance: obj({ strategicInitiatives: FP.businessPerformance.properties.strategicInitiatives }) }),
  market: obj({ marketOverview: FP.marketOverview }),
  competitors: obj({ competitiveLandscape: FP.competitiveLandscape, competitorDeepDives: FP.competitorDeepDives }),
  customer: obj({ customerInsights: FP.customerInsights }),
};

const FACT_BASE_RULES = `Rules:
1. A claim with status "sourced" must list in evidenceIds the E numbers (as integers, e.g. 12) that directly state it. Do not cite evidence that is merely related.
2. Restate the evidence faithfully. Copy every number, date, currency amount and percentage exactly as written in the cited evidence, with the period it refers to. Never compute, convert, round, add up, or estimate.
3. If no evidence supports a field, return status "not_found", text null, evidenceIds []. In lists, include only supported items; an empty list is a correct answer.
4. No hedging. A statement that needs "likely", "probably", "may", "could" or "expected to" is not a fact; leave it out.
5. Attribute self-reported figures in the text ("the company says...", "according to a company press release...").`;

const FACT_SECTION_RULES: Record<Section, (competitors?: string[]) => string> = {
  performance: () =>
    `6. businessPerformance.financialHighlights: the company's key financial results, ONE fact per claim: revenue with its fiscal period and growth, net income or margins, market capitalization or valuation, funding. recentMetrics: other short metrics (headcount, customers, subscribers, units shipped), one per claim.`,
  strategy: () =>
    `6. strategicInitiatives: only SIGNIFICANT initiatives the evidence shows the company announced or started in the last ${INITIATIVE_WINDOW_MONTHS} months. For each, set subgroup to exactly one of these sub-categories and group to the group it belongs to, give a short name, and a one-sentence description that includes the month and year from the evidence. At most 3 per sub-category, most recent first. A sub-category with nothing significant gets no entries.

SUB-CATEGORIES
${groupsPrompt([0, 1, 2, 3, 4, 5])}`,
  market: () =>
    `6. definition: one sentence on how analysts define the market(s) the company competes in. segmentation, drivers, inhibitors: short claims named by analysts or industry publications.
7. tam / sam are lists of published market-size estimates, ONE entry per market segment or product line (a large company can serve several). Report only the most recent ACTUAL estimate for a segment, never a forecast or projection for a future year; if the evidence has several years or publishers for a segment, give only the most recent year and prefer a global figure. Fields: segment (short name of the market), geography, year, value (copied as written in the evidence, e.g. "$48.2B"), publisher (the research firm or source named in the evidence), evidenceIds. Never derive, convert, add up or estimate a figure. If the only estimate is the company's own, name the company as publisher. Empty list if there is none.`,
  competitors: (competitors) =>
    `6. competitiveLandscape: only companies the evidence names as competitors or alternatives. competitorDeepDives: ${
      competitors?.length ? `exactly these competitors, in this order, one entry each: ${competitors.join("; ")}.` : "at most 5, chosen from those competitors."
    } For each: revenue, headcount, activity and pricingModel are strict claims (rules 1-5; not_found if no evidence). description is ONE or TWO sentences on what that competitor sells and how it positions itself; strengths are 3 to 5 short items (at most 12 words each), each an advantage the evidence attributes to that competitor. For description and strengths, cite in basedOn the E numbers about THAT competitor (evidence tagged [competitor:<name>] is about it); they are summaries of the evidence, so they may use general wording, but add no figures, names or events that are not in the cited evidence.`,
  customer: () =>
    `6. customerInsights: cite only [customer] evidence (reviews, case studies, testimonials, published outcomes). Otherwise not_found or an empty list. Never infer sentiment. Style: sentiment is ONE headline sentence of at most 25 words. sentimentThemes, winReasons, lossReasons and unmetNeeds are lists with at most 5 items each; one idea per item, at most 25 words, starting with a 2-4 word bold label ("**Ease of use:** reviewers on G2 praise setup speed."). winReasons are reasons customers choose the company; lossReasons are reasons customers leave or choose a competitor.`,
};

const factsSectionPrompt = (e: Entity, ev: Evidence[], today: string, section: Section, competitors?: string[]) =>
  `You are building one section of the fact base of a market-intelligence report. Today is ${today}.
${entityBlock(e)}

EVIDENCE (format: E<id> [topic] text). This is the ONLY information you may use:
${evidenceBlock(ev)}

${FACT_BASE_RULES}
${FACT_SECTION_RULES[section](competitors)}`;

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

function readEntity(raw: Any): Entity | null {
  if (!raw || typeof raw !== "object" || typeof raw.name !== "string") return null;
  const s = (v: unknown) => String(v ?? "UNKNOWN").slice(0, 500);
  return { name: s(raw.name), website: s(raw.website), headquarters: s(raw.headquarters), description: s(raw.description), ownership: s(raw.ownership), confidence: s(raw.confidence), otherEntities: s(raw.otherEntities) };
}

// Request 1: resolve the company.
async function v2Entity(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
  const website = typeof body?.companyWebsite === "string" && body.companyWebsite.trim() ? body.companyWebsite.trim() : undefined;
  if (!companyName || companyName.length > 200) return json({ error: "companyName is required (max 200 characters)" }, 400);
  const t0 = Date.now();
  const ent = await resolveEntity(apiKey, companyName, website, todayStr(), clock.timeout(60_000, 10_000));
  if (ent.error) return json({ error: ent.error, entity: ent.entity }, 422);
  const warnings: string[] = [];
  if (!website && !/^(none|unknown)?$/i.test(ent.entity.otherEntities.trim())) {
    warnings.push(`Other organisations share this name (${ent.entity.otherEntities}). Confirm the website ${ent.entity.website} is the right company.`);
  }
  return json({ entity: ent.entity, slice: sliceOf("profile", ent.result, Date.now() - t0), warnings });
}

// Request 2: one grounded scan for one topic (or one competitor). A failed scan is returned as data.
async function v2Scan(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const entity = readEntity(body?.entity);
  if (!entity) return json({ error: "Missing or invalid entity." }, 400);
  const today = todayStr();
  let topic: string;
  let prompt: string;
  if (body?.topic === "competitor") {
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
    if (!name) return json({ error: "Missing competitor name." }, 400);
    topic = `competitor:${name}`;
    prompt = competitorPrompt(entity, name, today);
  } else {
    const tp = TOPICS.find((t) => t.key === body?.topic);
    if (!tp) return json({ error: "Unknown scan topic." }, 400);
    topic = tp.key;
    prompt = researchPrompt(tp.ask, entity, today);
  }
  const t0 = Date.now();
  const deadline = t0 + clock.timeout(110_000, 10_000);
  const run = (ms: number) => callGemini(apiKey, { model: FLASH_MODEL, prompt, grounded: true, temperature: 0, timeoutMs: ms, attempts: 2 });
  try {
    let best = await run(Math.min(70_000, deadline - Date.now()));
    // Thin result: try once more and keep whichever came back with more cited segments.
    if ((best.meta?.groundingSupports?.length ?? 0) < 3 && deadline - Date.now() > 20_000) {
      try {
        const second = await run(deadline - Date.now());
        if ((second.meta?.groundingSupports?.length ?? 0) > (best.meta?.groundingSupports?.length ?? 0)) best = second;
      } catch {
        // keep the first result
      }
    }
    return json({ slice: sliceOf(topic, best, Date.now() - t0) });
  } catch (e) {
    return json({ slice: sliceOf(topic, null, Date.now() - t0, (e as Error)?.message ?? String(e)) });
  }
}

// Request 3: turn scan slices into the evidence ledger. With `state`, extend it (ids and sources stay stable).
async function v2Ledger(body: Any, clock: ReturnType<typeof makeClock>) {
  const base = body?.state ? readState(body.state, true) : null;
  const entity = base?.entity ?? readEntity(body?.entity);
  if (!entity) return json({ error: "Missing or invalid entity." }, 400);
  const slices = readSlices(body?.slices);
  const results = slices.filter((x) => x.meta).map((x) => ({ topic: x.topic, r: { text: "", meta: x.meta } as GeminiResult }));
  const uris = results.flatMap((x) => (x.r.meta?.groundingChunks ?? []).map((c) => c.web?.uri).filter((u): u is string => !!u));
  const urlMap = await resolveRedirects(uris, Math.min(8000, Math.max(1500, clock.remaining() - 30_000)));
  const ledger = buildLedger(results, urlMap, base ? { sources: base.sources, evidence: base.evidence } : undefined);
  if (!ledger.evidence.length) {
    return json({ error: "Search returned no citable evidence for this company, so no report was produced.", entity }, 422);
  }
  const warnings = [...(base?.warnings ?? [])];
  if (!base && ledger.evidence.length < MIN_EVIDENCE_WARN) {
    warnings.push(`Only ${ledger.evidence.length} citable facts were found; expect most sections to be empty.`);
  }
  const state: State = {
    companyName: base?.companyName ?? String(body?.companyName ?? entity.name).slice(0, 200),
    entity,
    sources: ledger.sources,
    evidence: ledger.evidence,
    queries: [...new Set([...(base?.queries ?? []), ...ledger.queries])],
    searchSuggestions: [...(base?.searchSuggestions ?? []), ...ledger.searchSuggestions],
    warnings,
    timings: base?.timings ?? {},
    researchModel: FLASH_MODEL,
    competitors: base?.competitors,
  };
  return json({ state });
}

// Request 4: identify the main competitors from the evidence (grounded fallback if too few).
async function v2Identify(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  if (!state) return json({ error: "Missing or invalid research state. Start the report again." }, 400);
  const { competitors, extra } = await identifyCompetitors(apiKey, state, todayStr(), clock);
  const slices = extra.map((x) => sliceOf(x.topic, x.r, 0));
  return json({ competitors, slices });
}

// Request 5: facts for ONE section, from only that section's evidence, validated and verified.
async function v2FactsSection(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  const section = body?.section as Section;
  if (!state || !SECTIONS.includes(section)) return json({ error: "Missing or invalid research state or section." }, 400);
  const ev = state.evidence.filter((e) => SECTION_TOPICS[section](e.topic));
  const ctx = makeCtx(ev);
  const warnings: string[] = [];
  const competitorNames = section === "competitors" && state.competitors?.length ? state.competitors.map((c) => c.name) : undefined;
  if (!ev.length) {
    return json({ section, ok: true, empty: true, facts: pruneFacts(validateFacts({}, ctx)), dropped: [], verifier: "no evidence", sourcedClaims: 0, warnings });
  }
  let raw: Any = null;
  try {
    raw = await structured(apiKey, clock, warnings, `Fact extraction (${section})`, factsSectionPrompt(state.entity, ev, todayStr(), section, competitorNames), SECTION_SCHEMAS[section], false, 0, 50_000);
  } catch (e) {
    warnings.push(`Fact extraction (${section}) failed (${(e as Error)?.message ?? e}).`);
  }
  const validated = validateFacts(raw, ctx, competitorNames);
  const left = clock.remaining();
  let verifier: string;
  try {
    verifier = left > 15_000 ? await verifyClaims(apiKey, ctx, Math.min(40_000, left - 6_000)) : "skipped (time budget)";
  } catch (e) {
    verifier = `failed (${(e as Error)?.message})`;
  }
  if (!verifier.startsWith("checked") && verifier !== "no sourced claims") warnings.push(`Verifier ${verifier} for ${section}; claims are marked "unchecked".`);
  return json({
    section, ok: !!raw, facts: pruneFacts(validated), dropped: ctx.dropped, verifier,
    sourcedClaims: ctx.sourced.filter((x) => x.claim.status === "sourced").length, warnings,
  });
}

// Request 6: one analysis part (raw model output; validated later in `report`).
async function v2AnalysisPart(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  const part = body?.part as "core" | "frameworks" | "recs";
  if (!state || !["core", "frameworks", "recs"].includes(part)) return json({ error: "Missing or invalid research state or part." }, 400);
  const schema = part === "core" ? CORE1_SCHEMA : part === "frameworks" ? FRAMEWORKS_SCHEMA : RECS_SCHEMA;
  const warnings: string[] = [];
  try {
    const raw = await structured(apiKey, clock, warnings, `Analysis (${part})`, analysisPrompt(state.entity, state.evidence, todayStr(), part), schema, body?.deepResearch !== false, 0.3, 10_000);
    return json({ part, ok: true, raw, warnings });
  } catch (e) {
    return json({ part, ok: false, raw: null, warnings: [...warnings, `Analysis (${part}) failed (${(e as Error)?.message ?? e}).`] });
  }
}

// Replace the "not found" placeholder with "not generated" inside the parts of the report that a failed step feeds.
const swapPlaceholder = (v: Any): Any =>
  v === NF ? NOT_GENERATED : Array.isArray(v) ? v.map(swapPlaceholder) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swapPlaceholder(x)])) : v;

// Request 7: merge everything, validate the analysis, map MC offerings and assemble the report.
async function v2Report(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  if (!state) return json({ error: "Missing or invalid research state. Start the report again." }, 400);
  const deepResearch = body?.deepResearch !== false;
  const parts: Any[] = list(body?.parts);
  const okSection = (sec: Section) => {
    const p = parts.find((x) => x?.section === sec);
    return !!p && p.ok === true && !!p.facts;
  };

  // Merge the per-section facts into one Facts object.
  const facts: Facts = validateFacts({}, makeCtx([]));
  const take = (sec: Section) => parts.find((x) => x?.section === sec && x?.ok === true && x?.facts)?.facts;
  const perf = take("performance"), strat = take("strategy"), mkt = take("market"), comp = take("competitors"), cust = take("customer");
  if (perf) {
    facts.businessPerformance.financialHighlights = list(perf.businessPerformance?.financialHighlights);
    facts.businessPerformance.recentMetrics = list(perf.businessPerformance?.recentMetrics);
  }
  if (strat) facts.businessPerformance.strategicInitiatives = list(strat.businessPerformance?.strategicInitiatives);
  if (mkt?.marketOverview) facts.marketOverview = { ...facts.marketOverview, ...mkt.marketOverview };
  if (comp) {
    facts.competitiveLandscape = { ...facts.competitiveLandscape, ...comp.competitiveLandscape };
    facts.competitorDeepDives = list(comp.competitorDeepDives);
  }
  if (cust?.customerInsights) facts.customerInsights = { ...facts.customerInsights, ...cust.customerInsights };

  const dropped: Ctx["dropped"] = parts.flatMap((p) => list(p?.dropped)).slice(0, 500);
  const ctx = makeCtx(state.evidence, dropped);
  const raws = body?.raw ?? {};
  const rawCore = raws.core ?? null, rawFrameworks = raws.frameworks ?? null, rawRecs = raws.recs ?? null;
  const analysis = validateAnalysis({ ...(rawCore ?? {}), ...(rawFrameworks ?? {}), recommendations: rawRecs?.recommendations, mcOpportunities: rawRecs?.mcOpportunities }, ctx);

  const warnings = [...state.warnings, ...list(body?.clientWarnings).map(String).slice(0, 40), ...parts.flatMap((p) => list(p?.warnings).map(String))];
  const left = clock.remaining();
  let mc: Opportunity[] = [];
  try {
    mc = await normalizeOpportunities(apiKey, analysis.mcOpportunities, Math.min(25_000, Math.max(3_000, left - 8_000)));
  } catch (e) {
    console.error("MC normalisation failed:", e);
  }

  const placeholders: Placeholders = { facts: NF, core: NF, recs: rawRecs ? NF : NOT_GENERATED };
  const cov = sectionCoverage(facts, analysis, mc);
  const sourcedClaims = parts.reduce((n, p) => n + (Number(p?.sourcedClaims) || 0), 0);
  const verifiers = parts.map((p) => (typeof p?.verifier === "string" ? `${p.section}: ${p.verifier}` : "")).filter(Boolean);
  const scanLog = list(body?.scanLog).slice(0, 40).map((x) => ({
    topic: String(x?.topic ?? "").slice(0, 120), status: String(x?.status ?? "").slice(0, 20), ms: Number(x?.ms) || 0,
    segments: Number(x?.segments) || 0, retried: !!x?.retried,
  }));

  const report: Any = {
    companyName: state.companyName,
    entity: state.entity,
    ...toLegacy(facts, analysis, mc, ctx, placeholders),
    sources: state.sources,
    evidence: state.evidence,
    claims: { facts, analysis: { ...analysis, mcOpportunities: mc } },
    quality: {
      steps: { facts: SECTIONS.every(okSection), analysis: !!rawCore && !!rawFrameworks, recommendations: !!rawRecs },
      sectionsOk: Object.fromEntries(SECTIONS.map((sec) => [sec, okSection(sec)])),
      scans: scanLog,
      evidenceByTopic: Object.fromEntries([...new Set(state.evidence.map((e) => e.topic))].map((t) => [t, state.evidence.filter((e) => e.topic === t).length])),
      competitors: (state.competitors ?? []).map((c) => {
        const d = facts.competitorDeepDives.find((x) => x.name === c.name);
        const has = (cl: Claim) => cl.status === "sourced";
        return {
          name: c.name, kind: c.kind, evidenceCount: state.evidence.filter((e) => e.topic === `competitor:${c.name}`).length,
          fieldsFound: d ? [has(d.revenue), has(d.headcount), has(d.activity), has(d.pricingModel), !!d.description, d.strengths.length > 0].filter(Boolean).length : 0,
        };
      }),
      coverage: cov.coverage,
      sectionsPopulated: cov.populated,
      sections: cov.sections,
      evidenceCount: state.evidence.length,
      sourceCount: state.sources.length,
      sourcedClaims,
      droppedCount: dropped.length,
      dropped,
      verifier: verifiers.join("; ") || "not run",
      warnings,
      searchQueries: state.queries,
      models: { research: FLASH_MODEL, facts: FLASH_MODEL, analysis: deepResearch ? `${PRO_MODEL} (falls back to ${FLASH_MODEL})` : FLASH_MODEL },
    },
    searchSuggestions: state.searchSuggestions,
    generatedAt: new Date().toISOString(),
  };

  // Sections whose step failed say "Not generated" instead of "Not found".
  const swap = (obj: Any, keys: string[]) => keys.forEach((k) => { if (obj && k in obj) obj[k] = swapPlaceholder(obj[k]); });
  if (!okSection("performance")) {
    swap(report.businessPerformance, ["recentMetrics"]);
    if (!analysis.performanceSummary.length) swap(report.businessPerformance, ["financialHighlights"]);
  }
  if (!okSection("strategy")) swap(report.businessPerformance, ["strategicInitiatives", "strategicInitiativeGroups"]);
  if (!okSection("market")) swap(report, ["marketOverview"]);
  if (!okSection("competitors")) {
    swap(report, ["competitiveLandscape"]);
    report.competitorDeepDives = swapPlaceholder(report.competitorDeepDives);
  }
  if (!okSection("customer")) swap(report, ["customerInsights"]);
  if (!rawCore) {
    swap(report, ["executiveSummary"]);
    if (analysis.performanceSummary.length === 0 && okSection("performance")) swap(report.businessPerformance, ["financialHighlights"]);
    report.marketOverview.metrics.som = swapPlaceholder(report.marketOverview.metrics.som);
    report.competitorDeepDives.forEach((d: Any) => { d.gapAnalysis = swapPlaceholder(d.gapAnalysis); });
  }
  if (!rawFrameworks) swap(report, ["strategicFrameworks"]);

  console.log(JSON.stringify({ company: state.entity.name, evidence: state.evidence.length, scans: scanLog.length, sourcedClaims, dropped: dropped.length }));
  return json(report);
}

// The page sends the state back to us, so treat it as untrusted input and rebuild it field by field.
function readState(raw: Any, allowEmpty = false): State | null {
  if (!raw || typeof raw !== "object" || !raw.entity || typeof raw.entity.name !== "string") return null;
  const evidence: Evidence[] = list(raw.evidence).slice(0, MAX_EVIDENCE).flatMap((e) =>
    typeof e?.text === "string" && Number.isInteger(e?.id)
      ? [{ id: e.id, topic: String(e.topic ?? ""), text: e.text.slice(0, 2000), sourceIds: list(e.sourceIds).filter((n) => Number.isInteger(n)) }]
      : []
  );
  if (!evidence.length && !allowEmpty) return null;
  const s = (v: unknown) => String(v ?? "UNKNOWN").slice(0, 500);
  const en = raw.entity;
  return {
    ...raw,
    companyName: String(raw.companyName ?? en.name).slice(0, 200),
    entity: {
      name: s(en.name), website: s(en.website), headquarters: s(en.headquarters), description: s(en.description),
      ownership: s(en.ownership), confidence: s(en.confidence), otherEntities: s(en.otherEntities),
    },
    evidence,
    sources: list(raw.sources),
    queries: list(raw.queries),
    searchSuggestions: list(raw.searchSuggestions),
    warnings: list(raw.warnings).map(String),
    timings: raw.timings && typeof raw.timings === "object" ? raw.timings : {},
    researchModel: String(raw.researchModel ?? FLASH_MODEL),
    competitors: Array.isArray(raw.competitors)
      ? list(raw.competitors).flatMap((c): Competitor[] =>
        typeof c?.name === "string" && c.name.trim()
          ? [{ name: c.name.trim().slice(0, 80), kind: c.kind === "indirect" ? "indirect" : "direct" }]
          : []
      ).slice(0, 5)
      : undefined,
  };
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
    if (!domains.some((d) => email.endsWith("@" + d))) return json({ error: "Client Insights research is limited to Toptal accounts." }, 403);
    return null;
  } catch {
    return json({ error: "Could not verify your sign-in. Try again in a moment." }, 503);
  }
}

// ---------- Handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const denied = await authorize(req);
  if (denied) return denied;

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "GEMINI_API_KEY is not configured" }, 500);

  let body: Any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be JSON" }, 400);
  }
  const step = body?.step;
  const deepResearch = body?.deepResearch !== false;
  const clock = makeClock(TIME_BUDGET_MS);

  try {
    if (step === "entity") return await v2Entity(apiKey, body, clock);
    if (step === "scan") return await v2Scan(apiKey, body, clock);
    if (step === "ledger") return await v2Ledger(body, clock);
    if (step === "identify") return await v2Identify(apiKey, body, clock);
    if (step === "facts_section") return await v2FactsSection(apiKey, body, clock);
    if (step === "analysis_part") return await v2AnalysisPart(apiKey, body, clock);
    if (step === "report") return await v2Report(apiKey, body, clock);

    if (step === "competitors" || step === "facts" || step === "analysis") {
      const state = readState(body?.state);
      if (!state) return json({ error: "Missing or invalid research state. Start the report again." }, 400);
      if (step === "competitors") {
        const r = await stepCompetitors(apiKey, state, deepResearch, clock);
        return r.ok ? json({ state: r.state }) : json(r.body, r.status);
      }
      if (step === "facts") {
        const r = await stepFacts(apiKey, state, clock);
        return r.ok ? json({ state: r.state }) : json(r.body, r.status);
      }
      if (!state.facts) return json({ error: "Facts step has not run. Start the report again." }, 400);
      return json(await stepAnalysis(apiKey, state, deepResearch, clock));
    }

    const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
    const companyWebsite = typeof body?.companyWebsite === "string" && body.companyWebsite.trim() ? body.companyWebsite.trim() : undefined;
    if (!companyName || companyName.length > 200) return json({ error: "companyName is required (max 200 characters)" }, 400);

    if (step === "research") {
      const r = await stepResearch(apiKey, { companyName, companyWebsite, deepResearch }, clock);
      return r.ok ? json({ state: r.state }) : json(r.body, r.status);
    }

    // No step: run everything in one request (older page versions). Fast mode only, to stay under 150s.
    const r1 = await stepResearch(apiKey, { companyName, companyWebsite, deepResearch: false }, clock);
    if (!r1.ok) return json(r1.body, r1.status);
    const r2 = await stepFacts(apiKey, r1.state, clock);
    if (!r2.ok) return json(r2.body, r2.status);
    return json(await stepAnalysis(apiKey, r2.state, false, clock));
  } catch (e) {
    console.error("Report pipeline error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 502);
  }
});
