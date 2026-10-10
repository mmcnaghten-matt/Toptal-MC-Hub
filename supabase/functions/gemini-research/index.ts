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
// Replaced with the git commit when the function is copied for deployment; shown in the Research log so you can see which build ran.
const BUILD = "__BUILD__";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRO_MODEL = Deno.env.get("GEMINI_PRO_MODEL") ?? "gemini-2.5-pro";
const FLASH_MODEL = Deno.env.get("GEMINI_FLASH_MODEL") ?? "gemini-2.5-flash";
// Supabase returns 504 if no response is sent within 150s, so the whole pipeline is budgeted below that.
const TIME_BUDGET_MS = Number(Deno.env.get("REPORT_TIME_BUDGET_MS") ?? "140000");
const MIN_EVIDENCE_WARN = 10;
const MAX_EVIDENCE = 500;
// Per research topic, so big companies don't fill the ledger with the first topics.
const topicCap = (topic: string) => (topic === "market" ? 80 : topic.startsWith("market:") ? 35 : topic.startsWith("strategy_") ? 30 : topic.startsWith("competitor:") ? 25 : 40);
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
// kinds: what sort of site a source is (peer_list, seller, review, lookalike); flags on evidence = kinds shared by ALL of its sources.
// page: what the source page itself says about dates (filled by the verify_evidence step).
type PageInfo = { read: boolean; title?: string; pub?: string; my?: string[]; years?: number[]; bot?: boolean };
/** A page as read by the verify step: its dates plus the text (never stored) used to check that it says what is cited. */
type PageRead = PageInfo & { text?: string; truncated?: boolean; finalUrl?: string };
type Source = { id: number; title: string; url: string; tier?: number; kinds?: string[]; page?: PageInfo };
// tier: 1 primary (filings, regulators, company releases), 2 major press/analysts, 3 everything else. srcTiers aligns with sourceIds.
type Evidence = { id: number; topic: string; text: string; sourceIds: number[]; tier?: number; srcTiers?: number[]; flags?: string[]; dateChecked?: boolean;
  /** How well each cited page's text supports the row (0..1, -1 = could not be judged); aligned with sourceIds. */
  srcSupport?: number[] };
type Claim = {
  text: string | null;
  status: "sourced" | "not_found";
  evidenceIds: number[];
  verification?: "supported" | "partial" | "unchecked";
};
type Item = { text: string; basedOn: number[]; rejected?: boolean };
type Named = { name: string; evidenceIds: number[] };
type Entity = {
  name: string;
  website: string;
  headquarters: string;
  description: string;
  ownership: string;
  confidence: string;
  otherEntities: string;
  /** Current reporting segments (from the latest annual report / IR site) and businesses sold or discontinued. */
  segments?: { name: string; description: string; /** latest fiscal-year net sales in dollars, when found */ revenue?: number }[];
  divested?: { name: string; date: string; terms?: string[] }[];
  /** Names, products, plants and brands of every business the company has sold (also older sales). Used only to filter evidence. */
  footprint?: string[];
  /** Brands and subsidiaries the company owns (for example an acquired business): never competitors. */
  owned?: { name: string; what: string }[];
};
type Ctx = {
  byId: Map<number, Evidence>;
  evidence: Evidence[];
  dropped: { path: string; reason: string; text: string }[];
  sourced: { path: string; claim: Claim }[];
  /** Analysis items (synthesised text), registered so a verifier pass can check them against their cited evidence. */
  items: { path: string; item: Item }[];
  /** The company, for validators that need its segments. */
  entity?: Entity;
  /** Weakest source tier allowed to support a financial result: 1 for public companies (filings, IR, wires), 2 otherwise. */
  finMaxTier: 1 | 2;
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

// The company's CURRENT reporting segments and the businesses it has sold or discontinued. Market research is then done
// per current segment, and market figures for a divested business are not shown as current.
const FOOTPRINT_STOP = new Set([
  "products", "product", "materials", "material", "building", "business", "reinforcements", "reinforcement", "composites", "composite",
  "insulation", "roofing", "doors", "windows", "shingles", "manufacturing", "facility", "facilities", "plants", "plant", "brands", "brand",
  "distribution", "residential", "commercial", "industrial", "fiberglass", "fibreglass", "glass", "fiber", "fibre", "yarns", "rovings",
  "construction", "infrastructure", "other", "various", "none", "unknown", "company", "operations", "segment", "three", "several",
]);
/**
 * Distinctive terms of a sold business, used to drop evidence that treats it as current: its full name, brand and plant names
 * ("Norandex", "Taloja"), and specific product phrases ("vinyl siding"). Generic words, places and single common words are
 * left out so that evidence about the rest of the company is never removed.
 */
function footprintTerms(name: string, ...lists: string[]): string[] {
  const out = new Set<string>();
  const clean = (raw: string) => raw.replace(/\*+|[()]/g, " ").replace(/\s+/g, " ").trim();
  const addName = (raw: string) => {
    const t = clean(raw).toLowerCase();
    if (t.length < 4 || t.length > 60 || /^(not found|unknown|none)/.test(t)) return;
    // The business's own name: a phrase, or a distinctive single word (not a generic product word).
    if (t.includes(" ") || (t.length >= 8 && !FOOTPRINT_STOP.has(t))) out.add(t);
  };
  addName(name);
  for (const l of lists) {
    for (const rawPart of l.split(/[,;]/)) {
      const part = clean(rawPart);
      // "Norandex/Reynolds distribution business", "Taloja plant": the capitalised brand or plant name in front of the noun.
      for (const m of part.matchAll(/((?:[A-Z][a-z]{4,}\/)*[A-Z][a-z]{4,})\s+(?:distribution|brands?|plants?|facilit(?:y|ies)|sites?|mills?|factory|campus|works|business)\b/g)) {
        m[1].split("/").forEach((x) => out.add(x.toLowerCase()));
      }
      // A specific product phrase of two to four words with no generic words ("vinyl siding").
      const words = part.toLowerCase().split(/\s+/).filter(Boolean);
      if (words.length >= 2 && words.length <= 4 && part.length <= 40 && !words.some((w) => FOOTPRINT_STOP.has(w.replace(/[^a-z]/g, "")))) out.add(words.join(" "));
    }
  }
  return [...out].slice(0, 14);
}

async function resolveSegments(apiKey: string, e: Entity, today: string, timeoutMs: number) {
  const prompt = `Today is ${today}. Use Google Search for the company "${e.name}" (${e.website}, ${e.ownership}).
Find (1) its CURRENT reporting segments or, if it does not report segments, its major product lines, from its latest annual report (Form 10-K or equivalent) or investor-relations site, with each segment's latest fiscal-year net sales; and (2) businesses it has SOLD, spun off or discontinued in the last 36 months, with the month and year, plus any older sale that sources still associate with the company (for example a business sold years ago whose products are still mentioned alongside it).
Answer one item per line in exactly this format, nothing else:
SEGMENT: <segment name> | <one line: what it sells> | <latest fiscal-year net sales with unit and year, for example $2,125 million (FY2025)>
DIVESTED: <business name> | <month year it was sold or closed> | <what it made> | <its plants, sites and brand names, comma separated>
OWNED: <name of a company, brand or subsidiary it owns, acquired in the last 5 years> | <what it makes>
Write "NOT FOUND" if you cannot find segments. Do not guess.`;
  const result = await callGemini(apiKey, { model: FLASH_MODEL, prompt, grounded: true, timeoutMs, temperature: 0, attempts: 1 });
  const rows = (tag: string) =>
    result.text.split("\n").flatMap((line) => {
      const m = line.match(new RegExp(`^[\\s*_-]*${tag}[\\s*_]*:\\s*(.+)$`, "i"));
      if (!m) return [];
      const [a, ...rest] = m[1].replace(/\*+/g, "").split("|").map((x) => x.trim());
      const name = a;
      return name && name.length <= 80 && !/^(not found|unknown|none)/i.test(name) ? [{ name, rest }] : [];
    });
  const dollars = (text: string) => {
    const v = magnitude(text);
    if (!Number.isFinite(v) || v <= 0) return undefined;
    // "2,125" with no unit is a figure in millions in a segment table.
    return /(trillion|billion|million|thousand|\d\s?[tbmk]\b)/i.test(text) ? v : v < 1e5 ? v * 1e6 : v;
  };
  const segments = rows("SEGMENT").slice(0, 6).map((r) => ({
    name: r.name, description: (r.rest[0] ?? "").slice(0, 200), ...(dollars(r.rest[1] ?? "") ? { revenue: dollars(r.rest[1]) } : {}),
  }));
  const sold = rows("DIVESTED").slice(0, 6).map((r) => ({
    name: r.name, date: (r.rest[0] ?? "").slice(0, 80), terms: footprintTerms(r.name, r.rest[1] ?? "", r.rest[2] ?? ""),
  }));
  const owned = rows("OWNED").slice(0, 8).map((r) => ({ name: r.name, what: (r.rest[0] ?? "").slice(0, 120) }));
  return { segments, divested: sold, owned, result };
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
    ask: "Revenue and revenue growth (with fiscal period), profitability or margins, funding rounds (date, amount, round type, lead investors), total funding, valuation, employee headcount, and growth rankings or awards that state growth figures. If the company is public, use its SEC filings and its investor-relations and newsroom pages: the last two fiscal years of reported results, the latest quarter's reported and adjusted results (say which is which), and any acquisitions or divestitures in the last 24 months that explain changes in revenue or headcount. Do not use stock-data websites.",
  },
  ...[[0, 1], [2, 3], [4, 5]].map((idx, n) => ({
    key: `strategy_${n + 1}`,
    label: "Strategic initiatives",
    ask: `Significant strategic initiatives announced or started in the last ${INITIATIVE_WINDOW_MONTHS} months, organised by the categories below. For each sub-category list the significant initiatives: what happened, when (month and year), and who reported it. Skip minor items. If a sub-category has nothing significant, write one line "NOT FOUND: <sub-category>".\n\n${groupsPrompt(idx)}`,
  })),
  {
    key: "market",
    label: "Market",
    ask: "The markets the company competes in. For EACH of the company's major product or business segments (for example smartphones, PCs, wearables and services for a consumer electronics company): how analysts define the market, the latest published market-size estimate (figure, year, geography, publisher), its growth, and the drivers and headwinds analysts or industry publications name for that market. Also cover industry-wide drivers and headwinds.",
  },
  {
    key: "competitors",
    label: "Competitors",
    ask: "Companies named as competitors or alternatives to this company by analysts, comparison or review sites, press coverage, or the company itself. List the most frequently named, who named them, and the market or segment in which they compete.",
  },
  {
    key: "customer_praise",
    label: "Customer voice: praise",
    ask: "Published evidence of what customers like: ratings and recurring praise themes in reviews on independent review sites, case studies, testimonials from named customers, published customer outcomes, and reasons customers give for choosing the company. Do NOT use pages of dealers, contractors, installers or distributors who sell the product: that is their marketing, not customer evidence. Report only what sources state; do not characterise overall sentiment unless a source does.",
  },
  {
    key: "customer_complaints",
    label: "Customer voice: complaints",
    ask: "Published evidence of what customers criticise: complaints and reviews on BBB, ConsumerAffairs, Trustpilot, Sitejabber and similar sites (search them by name), warranty or claims disputes, product defects or recalls, class actions and court filings, regulator complaints, and reasons customers give for leaving or switching. Do NOT use pages of dealers, contractors, installers or distributors who sell the product. Report only what sources state; if you find no complaints, write one line \"NOT FOUND: customer complaints\".",
  },
];

const marketSegmentAsk = (segment: string) =>
  `The market for the company's "${segment}" business: how analysts define it, and the latest published market-size estimates. Report EVERY independent estimate you find (figure, year, geography, publisher), from at least two different publishers if they exist, with the market's growth rate and the drivers and headwinds analysts or industry publications name for it. Only cover this segment, not the company's other segments or businesses it has sold.`;

const entityBlock = (e: Entity) =>
  `COMPANY: ${e.name} | website: ${e.website} | HQ: ${e.headquarters} | ${e.ownership}\nWHAT IT DOES: ${e.description}` +
  (e.segments?.length ? `\nCURRENT SEGMENTS: ${e.segments.map((x) => x.name).join("; ")}` : "") +
  (e.divested?.length
    ? `\nSOLD OR DISCONTINUED (no longer part of the company; never present these as current businesses or markets it serves): ${e.divested.map((x) => `${x.name}${x.date ? ` (${x.date})` : ""}${(x.terms?.length ?? 0) > 1 ? `, including ${(x.terms ?? []).slice(1, 6).join(", ")}` : ""}`).join("; ")}`
    : "");

const researchPrompt = (ask: string, e: Entity, today: string) => `Today is ${today}.
${entityBlock(e)}
Every fact must be about this exact company, not a similarly named organisation.

RESEARCH TASK: ${ask}

Rules:
- Use Google Search. Report only facts stated in the search results. Never estimate, extrapolate, or fill gaps from memory.
- Write short, self-contained sentences with ONE fact each. Name the company in each sentence, and for any figure give its date or period and who reported it (e.g. "Acme raised $12M in a Series A in March 2024, according to TechCrunch.").
- Prefer primary sources (SEC filings, the company's investor-relations pages and press releases, regulators), then major news outlets and analyst firms. Avoid social media, stock-forum or stock-data aggregator pages, vendor marketing blogs and law-firm sites.
- Prefer sources from the last 24 months for metrics and news.
- Give the date of every event exactly as the source states it. If a source does not state the year of an event, write "date not stated" for that event. Never assume the current year, and never turn an undated or old item into a recent one. Date an event by when it HAPPENED, not by when a filing or article reported it ("as reported in the 10-K filed on February 25, 2026" is not the event date); if you only know the report date, write "event date not stated".
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

// ---------- Text hygiene ----------
// Search snippets and page titles arrive with HTML entities ("&ldquo;", "&#174;") and sometimes with UTF-8 punctuation that
// was decoded with the wrong character set (an em dash shown as ",Äî"). Clean both so no source line shows them.
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ldquo: "\u201c", rdquo: "\u201d", lsquo: "\u2018", rsquo: "\u2019",
  ndash: "\u2013", mdash: "\u2014", hellip: "\u2026", reg: "\u00ae", copy: "\u00a9", trade: "\u2122", deg: "\u00b0", middot: "\u00b7",
  bull: "\u2022", eacute: "\u00e9", egrave: "\u00e8", aacute: "\u00e1", uuml: "\u00fc", ouml: "\u00f6", auml: "\u00e4", ntilde: "\u00f1",
  szlig: "\u00df", euro: "\u20ac", pound: "\u00a3", yen: "\u00a5", cent: "\u00a2", laquo: "\u00ab", raquo: "\u00bb", times: "\u00d7",
};
const MOJIBAKE: [RegExp, string][] = [
  [/(?:\u00e2\u20ac\u201d|\u201a\u00c4\u00ee|,\u00c4\u00ee)/g, "\u2014"], // em dash
  [/(?:\u00e2\u20ac\u201c|\u201a\u00c4\u00ec|,\u00c4\u00ec)/g, "\u2013"], // en dash
  [/(?:\u00e2\u20ac\u2122|\u201a\u00c4\u00f4|,\u00c4\u00f4)/g, "\u2019"], // right single quote
  [/(?:\u00e2\u20ac\u0153|\u201a\u00c4\u00fa|,\u00c4\u00fa)/g, "\u201c"], // left double quote
  [/(?:\u00e2\u20ac\u009d|\u201a\u00c4\u00f9|,\u00c4\u00f9)/g, "\u201d"], // right double quote
  [/\u00c2(?=[\u00a0-\u00bf])/g, ""],
];
function cleanText(t: string): string {
  let out = t;
  for (const [re, rep] of MOJIBAKE) out = out.replace(re, rep);
  // Twice, so "&amp;ldquo;" (double-encoded) also resolves.
  for (let i = 0; i < 2; i++) {
    out = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 31 && code < 0x110000 ? String.fromCodePoint(code) : m;
      }
      return NAMED_ENTITIES[e.toLowerCase()] ?? m;
    });
  }
  return out.replace(/[\u00a0\u2007\u202f]/g, " ").replace(/[\u200b-\u200d\ufeff]/g, "");
}
// Source titles are also reduced to plain punctuation so no font or export path can garble them.
const plainTitle = (t: string) =>
  cleanText(t).replace(/[\u2013\u2014]/g, " - ").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\u2026/g, "...").replace(/\s+/g, " ").trim();

// ---------- Source tiers ----------
// Evidence is only as good as its source. Known-bad types (social media, stock forums, content farms, law-firm
// marketing) are dropped before any synthesis; the rest are ranked so primary sources win when facts conflict.
const DOMAINS_EXCLUDED = [
  "facebook.com", "fb.com", "instagram.com", "x.com", "twitter.com", "reddit.com", "tiktok.com", "pinterest.com", "quora.com",
  "linkedin.com", "youtube.com", "youtu.be", "stocktwits.com", "koalagains.com", "capout.ai", "creately.com",
  // Stock-data aggregators: trailing ratios and "analysis" computed by third parties (often on a different basis than the
  // company reports, e.g. including impairments) must never feed the financial story.
  "stockanalysis.com", "wallstreetzen.com", "fullratio.com", "macrotrends.net", "companiesmarketcap.com", "gurufocus.com",
  "simplywall.st", "stockscan.io", "marketbeat.com", "finance.yahoo.com", "seekingalpha.com", "investing.com", "tipranks.com",
  "zacks.com", "ycharts.com", "finbox.com", "alphaspread.com", "stockinvest.us", "revelio.com", "reveliolabs.com", "reportlinker.com",
  "csimarket.com", "tradingview.com", "stocktitan.net", "marketscreener.com", "kalkinemedia.com", "marketchameleon.com", "tradingeconomics.com",
  "stockcharts.com", "barchart.com", "last10k.com", "macroaxis.com", "digrin.com", "valueinvesting.io", "financecharts.com", "dividend.com",
  "stockdividendscreener.com", "stockrow.com", "stockopedia.com", "morningstar.in", "marketbeat.com", "streetinsider.com", "tickertech.com",
  // Conference and event marketing sites
  "iqpc.com", "iqpc.co.uk",
  // Job and employee-review sites: not evidence about a company's strengths or products
  "indeed.com", "glassdoor.com", "ziprecruiter.com", "simplyhired.com", "monster.com", "comparably.com",
  // Algorithmic peer lists and company-profile databases (they pair companies by name or industry code)
  "owler.com", "craft.co", "growjo.com", "leadiq.com", "zoominfo.com", "similarweb.com", "cbinsights.com", "tracxn.com",
  "globaldata.com", "rocketreach.co", "dnb.com", "buzzfile.com", "datanyze.com", "apollo.io", "pitchbook.com",
  ...(Deno.env.get("SOURCE_DENYLIST") ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean),
];
const DOMAINS_T1 = ["sec.gov", "europa.eu", "prnewswire.com", "businesswire.com", "globenewswire.com", "accesswire.com", "q4cdn.com"];
// Algorithmic peer lists and company-profile databases: they pair companies by name or industry code, so they are not
// evidence that one company competes with another.
const DOMAINS_PEER_LISTS = [
  "comparably.com", "owler.com", "craft.co", "growjo.com", "leadiq.com", "zoominfo.com", "similarweb.com", "cbinsights.com",
  "tracxn.com", "globaldata.com", "rocketreach.co", "dnb.com", "buzzfile.com", "datanyze.com", "apollo.io", "pitchbook.com",
];
// Review, complaint and court sites: valid evidence of what customers criticise.
const DOMAINS_REVIEW = [
  "bbb.org", "consumeraffairs.com", "trustpilot.com", "sitejabber.com", "pissedconsumer.com", "complaintsboard.com", "yelp.com",
  "g2.com", "capterra.com", "trustradius.com", "softwareadvice.com", "gartner.com", "consumerreports.org", "courtlistener.com",
  "classaction.org", "cpsc.gov", "ftc.gov", "justia.com", "angi.com", "homeadvisor.com", "reviews.com",
];
// Plaintiff-firm and securities-investigation marketing: it can support "a law firm announced an investigation", not
// "an investigation was opened" or "a lawsuit was filed".
const DOMAINS_LEGAL_MARKETING = [
  "zlk.com", "classaction.org", "rosenlegal.com", "pomerantzlaw.com", "glancylaw.com", "bragarlaw.com", "bernlieb.com", "kahnswick.com",
  "faruqilaw.com", "ktmc.com", "hagens.com", "rgrdlaw.com", "johnsonfistel.com", "gainsbenjamin.com", "levilaw.com", "schallfirm.com",
  "zlk.com", "glasserlaw.com", "blockleviton.com", "bfalaw.com", "kmllp.com", "gpm-law.com", "portnoylaw.com", "howardsmithlaw.com", "lawsuit-submission.com",
];
const LEGAL_HOST_RE = /(lawfirm|lawyers?|attorneys?|llp|litigation|classaction|classlaw|[a-z]law\.(com|net|org)|law(group|offices?|firm|yers))/i;
const LEGAL_TITLE_RE = /(investigation|class action|investors? (alert|notice)|you may be entitled|contact (us|an attorney)|lawsuit submission|join the class action|shareholder (?:alert|lawsuit|investigation))/i;
// Pages that sell or install the product (dealers, contractors, distributors): marketing, not customer evidence.
const SELLER_RE = /(preferred[ -]contractor|certified[ -]contractor|authori[sz]ed (dealer|distributor|installer)|roofing (company|contractor|services?|co\b)|\broofers?\b|\bcontractors?\b|\binstallers?\b|\bdealers?\b|distribut(or|ion)\b|\bsupply\b|\bexteriors?\b|home ?improvement)/i;
// Host names run words together ("smithroofingcontractors.com"), so they are matched without word boundaries.
const NOT_CUSTOMER_RE = /(asbestos|mesothelioma|securities (class action|fraud|litigation)|shareholder|investor (alert|lawsuit)|bankruptcy trust|personal[- ]injury|shipyard)/i;
const SELLER_HOST_RE = /(contractor|roofer|roofing|installer|dealer|distribut|supply(?!chain)|exterior|reseller|homeimprovement)/i;
const sellerLike = (host: string, title?: string) => SELLER_HOST_RE.test(host.replace(/[-.]/g, "")) || SELLER_RE.test(title ?? "");
// Bot-check and error pages: nobody can audit what they say.
const BOT_CHECK_TITLE_RE = /^(just a moment|access denied|attention required|human verification|verify(ing)? you are human|are you a (human|robot)|security check|checking your browser|please wait|enable javascript|one more step|pardon our interruption|request blocked|403|404|forbidden|robot|captcha)/i;
const DOMAINS_T2 = [
  "reuters.com", "bloomberg.com", "wsj.com", "ft.com", "cnbc.com", "apnews.com", "nytimes.com", "washingtonpost.com", "barrons.com",
  "economist.com", "marketwatch.com", "fortune.com", "axios.com", "bbc.com", "theguardian.com", "politico.com",
  "gartner.com", "idc.com", "forrester.com", "mckinsey.com", "bcg.com", "bain.com", "deloitte.com", "pwc.com", "kpmg.com", "ey.com",
  "accenture.com", "statista.com", "spglobal.com", "moodys.com", "fitchratings.com", "morningstar.com", "grandviewresearch.com",
  "marketsandmarkets.com", "mordorintelligence.com", "fortunebusinessinsights.com", "precedenceresearch.com",
  // More market-research firms, so legitimate market-size estimates are not left in the lowest tier
  "futuremarketinsights.com", "databridgemarketresearch.com", "verifiedmarketresearch.com", "alliedmarketresearch.com", "imarcgroup.com",
  "technavio.com", "transparencymarketresearch.com", "polarismarketresearch.com", "coherentmarketinsights.com", "freedoniagroup.com",
  "ibisworld.com", "euromonitor.com", "mintel.com", "frost.com", "businessresearchinsights.com", "datamintelligence.com", "researchandmarkets.com",
];
const PEER_PATH_RE = /(\/|-)(top|leading|key|major|best)[-_a-z0-9]*(companies|players|manufacturers|vendors|brands|competitors)\b|\/competitors?(\/|$)|company-list|market-share-leaders|\/alternatives?(\/|-|$)|competitors-and-alternatives/;
const STOCK_HOST_RE = /(stock(?!holm|ton|port|well)|ticker|screener|marketcap|dividend|tradingview|equityresearch)/i;
const LAW_FIRM_RE = /(law ?firm|lawfirm|attorneys?|lawyers?|lawsuit|mesothelioma|asbestos)/i;
const matchesDomain = (host: string, list: string[]) => list.some((d) => host === d || host.endsWith("." + d));

function hostOf(url: string, title?: string): string {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    // not a URL
  }
  // Unresolved grounding redirects: Google puts the site's domain in the title.
  if ((!host || /vertexaisearch|googleusercontent|(^|\.)google\.com$/.test(host)) && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(title ?? "")) {
    host = (title as string).toLowerCase().replace(/^www\./, "");
  }
  return host;
}

// "www.owenscorning.com", "[x](https://investors.owenscorning.com)" -> "owenscorning.com"
function rootDomainOf(text?: string): string {
  const m = (text ?? "").match(/(?:[a-z0-9-]+\.)+[a-z]{2,}/gi);
  if (!m) return "";
  const labels = m[m.length - 1].toLowerCase().replace(/^www\./, "").split(".");
  const n = labels.length >= 3 && labels[labels.length - 1].length === 2 && ["co", "com", "org", "net", "gov", "ac"].includes(labels[labels.length - 2]) ? 3 : 2;
  return labels.slice(-n).join(".");
}

/** 0 = excluded, 1 = primary, 2 = major press / analysts, 3 = everything else. */
function sourceTier(url: string, title: string | undefined, companyRoot: string, topic = ""): 0 | 1 | 2 | 3 {
  const host = hostOf(url, title);
  if (!host) return 3;
  if (matchesDomain(host, DOMAINS_EXCLUDED)) return 0;
  // Complaint research may use class-action and court coverage, which the law-firm filter would otherwise remove.
  const complaints = topic === "customer_complaints";
  if (LAW_FIRM_RE.test(host.replace(/[-.]/g, " ")) || (!complaints && LAW_FIRM_RE.test(title ?? ""))) {
    if (!(complaints && matchesDomain(host, DOMAINS_REVIEW))) return 0;
  }
  // Pages that sell the product say nothing reliable about customer satisfaction.
  if (topic.startsWith("customer") && !matchesDomain(host, DOMAINS_REVIEW) && !(companyRoot && matchesDomain(host, [companyRoot])) &&
      sellerLike(host, title)) return 0;
  if (matchesDomain(host, DOMAINS_T1) || /\.(gov|mil)(\.[a-z]{2})?$/.test(host) || (companyRoot && matchesDomain(host, [companyRoot]))) return 1;
  if (matchesDomain(host, DOMAINS_T2)) return 2;
  // Stock-data and ticker sites that are not on the list by name (the name of the site gives it away).
  if (STOCK_HOST_RE.test(host.split(".").slice(-2, -1)[0] ?? "")) return 0;
  return 3;
}

// The brand token of a name or domain: "Owens Corning" / "owenscorning.com" -> "owenscorning".
const brandToken = (s: string) =>
  s.toLowerCase().replace(/\.(com|net|org|co|io|us)\b.*$/, "").replace(/\b(inc|corp|corporation|company|ltd|llc|plc|holdings|group|incorporated)\b\.?/g, "").replace(/[^a-z0-9]/g, "");

/**
 * What sort of site a source is. A look-alike is a domain whose name contains the brand but is not the brand's own site
 * (e.g. "johnsmanvilleus.com" for Johns Manville): it often belongs to a marketing or SEO operator.
 */
function sourceKinds(url: string, title: string | undefined, companyRoot: string, brand?: string): string[] {
  const host = hostOf(url, title);
  if (!host) return [];
  const kinds: string[] = [];
  let path = "";
  try {
    path = decodeURIComponent(new URL(url).pathname).toLowerCase();
  } catch {
    // unresolved link: no path to inspect
  }
  // "Top companies in X", "competitors of X" and "alternatives to X" pages pair companies by name or industry code; they are
  // peer lists even when they sit on a respectable research-firm domain.
  if (matchesDomain(host, DOMAINS_PEER_LISTS) || PEER_PATH_RE.test(path)) kinds.push("peer_list");
  if (matchesDomain(host, DOMAINS_REVIEW)) kinds.push("review");
  if (matchesDomain(host, DOMAINS_LEGAL_MARKETING) || (LEGAL_HOST_RE.test(host) || LEGAL_HOST_RE.test(host.replace(/-/g, ""))) || (LEGAL_TITLE_RE.test(title ?? "") && !matchesDomain(host, DOMAINS_T1) && !matchesDomain(host, DOMAINS_T2))) kinds.push("legal_marketing");
  const ownSite = companyRoot && matchesDomain(host, [companyRoot]);
  if (!ownSite && !matchesDomain(host, DOMAINS_T1) && !matchesDomain(host, DOMAINS_T2) && sellerLike(host, title)) kinds.push("seller");
  const token = brandToken(brand ?? "");
  if (token.length >= 4) {
    const label = host.split(".").slice(-2, -1)[0] ?? "";
    const squashed = label.replace(/[^a-z0-9]/g, "");
    if (squashed === token) kinds.push("own_site");
    else if (!ownSite && token.length >= 6 && squashed.includes(token)) kinds.push("lookalike");
  }
  return kinds;
}

function buildLedger(
  results: { topic: string; r: GeminiResult }[],
  urlMap: Map<string, string>,
  existing?: { sources: Source[]; evidence: Evidence[] },
  companyWebsite?: string,
  companyName?: string,
) {
  const companyRoot = rootDomainOf(companyWebsite);
  let droppedByTier = 0;
  const sources: Source[] = [...(existing?.sources ?? [])].map((x) => ({ ...x, tier: x.tier ?? (sourceTier(x.url, x.title, companyRoot) || 3) }));
  const tierOfSource = new Map<number, number>(sources.map((x) => [x.id, x.tier ?? 3]));
  const kindsOfSource = new Map<number, string[]>(sources.map((x) => [x.id, x.kinds ?? []]));
  const srcIndex = new Map<string, number>(sources.map((x) => [normUrl(x.url), x.id]));
  const evidence: Evidence[] = [...(existing?.evidence ?? [])];
  const seen = new Set<string>(evidence.map((e) => `${e.topic}|${e.text.toLowerCase()}`));
  const searchSuggestions: string[] = [];
  const queries: string[] = [];
  const perTopic = new Map<string, number>();
  for (const e of evidence) perTopic.set(e.topic, (perTopic.get(e.topic) ?? 0) + 1);
  // Ids never repeat, even after the verify step has removed rows.
  let nextId = evidence.reduce((m, e) => Math.max(m, e.id), 0) + 1;

  for (const { topic, r } of results) {
    const meta = r.meta;
    if (!meta) continue;
    if (meta.searchEntryPoint?.renderedContent) searchSuggestions.push(meta.searchEntryPoint.renderedContent);
    queries.push(...(meta.webSearchQueries ?? []));
    const excludedChunks = new Set<number>();
    const chunkSrc = (meta.groundingChunks ?? []).map((c, ci) => {
      const raw = c.web?.uri;
      if (!raw) return null;
      const url = urlMap.get(raw) ?? raw;
      const tier = sourceTier(url, c.web?.title, companyRoot, topic);
      if (tier === 0) {
        excludedChunks.add(ci);
        return null;
      }
      const key = normUrl(url);
      let id = srcIndex.get(key);
      if (!id) {
        id = sources.length + 1;
        const kinds = sourceKinds(url, c.web?.title, companyRoot, topic.startsWith("competitor:") ? topic.slice(11) : companyName);
        sources.push({ id, title: plainTitle(c.web?.title ?? "") || new URL(url).host, url, tier, ...(kinds.length ? { kinds } : {}) });
        tierOfSource.set(id, tier);
        kindsOfSource.set(id, kinds);
        srcIndex.set(key, id);
      }
      return id;
    });
    for (const s of meta.groundingSupports ?? []) {
      const text = cleanText(s.segment?.text ?? "").replace(/^[\s*-]+/, "").trim();
      if (text.length < 15 || /NOT FOUND/i.test(text) || /^(CONFIDENCE|OTHER_ENTITIES)\b/.test(text)) continue;
      // Customer themes are about product or service experience; legacy liabilities and investor litigation are not.
      if (topic.startsWith("customer") && NOT_CUSTOMER_RE.test(text)) continue;
      const ids = [...new Set((s.groundingChunkIndices ?? []).map((i) => chunkSrc[i]).filter((x): x is number => x != null))];
      if (!ids.length) {
        if ((s.groundingChunkIndices ?? []).some((i) => excludedChunks.has(i))) droppedByTier++;
        continue;
      }
      const k = `${topic}|${text.toLowerCase()}`;
      if (seen.has(k)) continue;
      seen.add(k);
      if (evidence.length >= MAX_EVIDENCE || (perTopic.get(topic) ?? 0) >= topicCap(topic)) break; // this topic is full (later topics still get their share)
      perTopic.set(topic, (perTopic.get(topic) ?? 0) + 1);
      const srcTiers = ids.map((id) => tierOfSource.get(id) ?? 3);
      // A flag applies only when every source behind the fact has it (one good source rescues the fact).
      const flags = (kindsOfSource.get(ids[0]) ?? []).filter((k) => ids.every((id) => (kindsOfSource.get(id) ?? []).includes(k)));
      evidence.push({ id: nextId++, topic, text, sourceIds: ids, tier: Math.min(...srcTiers), srcTiers, ...(flags.length ? { flags } : {}) });
    }
  }
  return { sources, evidence, searchSuggestions, queries: [...new Set(queries)], droppedByTier };
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
    // The label is derived in code from explicit market ranks, so the same evidence always gives the same label.
    competitivePositioning: obj({
      segmentRanks: arr(obj({ segment: STR, rank: { type: "INTEGER" }, basis: STR, basedOn: INTS })),
    }),
    bigOpportunity: OPT_ITEM,
  }),
  performanceSummary: arr(ITEM),
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

// The analysis never sees evidence from pages published more than 18 months ago: it cannot describe the company today.
const currentEvidence = (ev: Evidence[]) => ev.filter((e) => !e.flags?.includes("stale"));
const evidenceBlock = (ev: Evidence[]) =>
  ev.map((e) => `E${e.id} [${e.topic}|T${e.tier ?? 2}${e.flags?.includes("stale") ? "|OLD" : ""}] ${e.text}`).join("\n");

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
6. tam is a list of published market-size estimates, ONE entry per market segment or product line (a large company can serve several). Report only the most recent ACTUAL estimate for a segment, never a forecast or projection for a future year; if the evidence has several years or publishers for a segment, give only the most recent year and prefer a global figure. Fields: segment (short name of the market), geography, year, value (copied as written in the evidence, e.g. "$48.2B"), publisher (the research firm or source named in the evidence), evidenceIds. Never derive, convert, add up or estimate a figure. If the only estimate is the company's own, name the company as publisher. Empty list if there is none.
7. competitiveLandscape: only companies the evidence names as competitors or alternatives. competitorDeepDives: ${
  competitors?.length ? `exactly these competitors, in this order, one entry each: ${competitors.join("; ")}.` : "at most 5, chosen from those competitors."
} For each: revenue, headcount, activity and pricingModel are strict claims (rules 1-5; not_found if no evidence). description is ONE or TWO sentences on what that competitor sells and how it positions itself; strengths are 3 to 5 short items (at most 12 words each), each an advantage the evidence attributes to that competitor. For description and strengths, cite in basedOn the E numbers about THAT competitor (evidence tagged [competitor:<name>] is about it); they are summaries of the evidence, so they may use general wording, but add no figures, names or events that are not in the cited evidence.
8. customerInsights: cite only [customer] evidence (reviews, case studies, testimonials, published outcomes). Otherwise not_found or an empty list. Never infer sentiment. Style: sentiment is ONE headline sentence of at most 25 words. sentimentThemes, winReasons, lossReasons and unmetNeeds are lists with at most 5 items each; one idea per item, at most 25 words, starting with a 2-4 word bold label ("**Ease of use:** reviewers on G2 praise setup speed."). winReasons are things customers praise about the company; lossReasons are things customers criticise or complain about (review themes, NOT win/loss data).
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
2. Judgement and synthesis are expected, but introduce no new facts: no figures, percentages, budgets, targets, dates, names, customers or events that are not in the cited evidence.
2a. Evidence lines carry a source tier (T1 primary, T2 major press and analysts, T3 other). Rest conclusions on T1 and T2 evidence. Do not draw a trend or conclusion from a single aggregator figure, or from figures reported on different bases (original versus restated, total versus continuing operations). Write a company's own marketing claims as that company's claim. Investment commentary ("undervalued", price targets) is not a strength. Do not state quantities in words ("over half", "majority", "doubled") unless the cited evidence states them.
2b. Financial interpretation. (i) When revenue, headcount or margins changed because of an acquisition or divestiture that the evidence mentions, say so and name the deal and date; never present acquired growth as organic, and never call a deal-driven jump or fall a trend or a weakness. (ii) Never compare or combine adjusted and reported (GAAP) figures, or figures from different periods or bases; name the basis of every margin or earnings figure. (iii) Do not use margins or ratios computed by third-party websites; use only figures the company itself reported. (iv) Describe only the company's current businesses (the CURRENT SEGMENTS in the company block); a business listed as sold is history, not a current strength, opportunity or market. (v) Figures "from continuing operations" already exclude any business that was sold, in both periods: a divestiture can never explain a change in them. Explain such changes only with acquisitions, prices, volumes, organic growth or currency, as the evidence says.
2c. Dates and sources. Use an event's date only as the cited evidence states it, never infer a year, and do not turn an undated item into a current one. Evidence tagged OLD (source published more than 18 months ago) cannot support statements about the company's current position, threats or ESG goals. Do not describe an expectation or target whose period has already ended as upcoming. A statement resting on a law firm's or plaintiff firm's page must say that the firm announced or alleged it ("a law firm announced an investigation into..."); a lawsuit or investigation may be stated as fact only when a filing (10-K, SEC document) or major press cited alongside it says so.
2c1. Never conclude that a company lacks a product, capability or position because the evidence does not mention it; state only what the evidence says. When the same matter (an investigation, a rating, a program) appears in more than one place, word it the same way each time.
2d. Never write evidence ids (such as E12) in any text field; they belong only in basedOn. Do not analyse or recommend colour launches (including "colour of the year"), SKUs, awards, rankings or report publications. Do not describe a business, plant or product listed as sold or discontinued (SOLD OR DISCONTINUED in the company block, or its plants and brands) as part of the company today or as a model to roll out.`;
  if (part === "core") {
    return `${head}
3. executiveSummary.tldr: 3-4 sentences for leadership on the company's position, recent performance and priorities.
4. competitivePositioning.segmentRanks: ONLY where the evidence explicitly states the company's market rank in a segment ("largest", "second-largest", "number one in ...", "#3"). One entry per segment: segment (the exact current segment name), rank (1 = largest or number one, 2 = second-largest, 3 = third...), basis (the evidence's statement of that rank, restated in one sentence), basedOn. Never infer a rank from revenue size, share figures or adjectives such as "strong" or "leading player". An empty list is correct when the evidence states no rank.
5. competitorGaps: one per competitor named in the evidence, contrasting it with ${e.name} on evidenced differences only.
6. performanceSummary: 2-3 short paragraphs (at most 130 words in total), each its own array item with basedOn. Paragraph 1: scale and growth (revenue and revenue growth, with fiscal period). Paragraph 2: profitability (net income or margins). Paragraph 3: valuation and funding (market capitalization, valuation, funding). Weave in one clause on what this implies for the company's position. Write flowing prose, not a list, and omit a paragraph the evidence cannot support. Use only figures present in the cited evidence, with their periods; never compute totals or ratios.`;
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

const validEvidence = (ids: unknown, ctx: Ctx, topics?: string[]) =>
  [...new Set(Array.isArray(ids) ? ids : [])]
    .map((id) => ctx.byId.get(Number(id)))
    .filter((e): e is Evidence => !!e && (!topics || topics.some((t) => e.topic === t || (t.endsWith("*") && e.topic.startsWith(t.slice(0, -1))))));

// A statement resting only on plaintiff-firm marketing must say a firm announced or alleged it.
const ATTRIBUTION_RE = /\b(law firms?|plaintiff'?s? firms?|attorneys?|class[- ]action (complaint|filing)|alleg\w+|announced an investigation)\b/i;
const onlyLegalMarketing = (ev: Evidence[]) => ev.length > 0 && ev.every((e) => e.flags?.includes("legal_marketing"));
// Any statement about litigation needs a filing or major-press source, or must be worded as a law firm's claim: plaintiff-firm
// pages recruit clients, and one stray primary citation beside them must not turn their allegations into facts.
const LITIGATION_RE = /\b(lawsuits?|class[- ]actions?|securities (?:fraud|litigation|claims?)|investigations?|litigation|sued|alleg\w+|settlements?)\b/i;
// The non-legal source must itself state the litigation: a filing that mentions something else cannot turn a law firm's
// allegation into a fact.
const litigationUnsupported = (text: string, ev: Evidence[]) =>
  (onlyLegalMarketing(ev) && !ATTRIBUTION_RE.test(text)) ||
  (LITIGATION_RE.test(text) && !ATTRIBUTION_RE.test(text) &&
    !ev.some((e) => (e.tier ?? 3) <= 2 && !e.flags?.includes("legal_marketing") && LITIGATION_RE.test(e.text)));

// Statement rules added after QC: absence is not evidence; a divestiture cannot explain continuing-operations figures; figures
// that are not financial-looking ("nearing 40 years", "130 mph") must still come from the cited evidence.
const ABSENCE_RE = /\b(not mentioned (?:in|by)|no mention of|absent from|not listed (?:in|on|among)|is not (?:found|present) in)\b/i;
const CONT_OPS_RE = /continuing operations?/i;
const DIVEST_CAUSE_RE = /\b(reflect\w*|driven by|due to|result\w* (?:of|from)|attribut\w+ to|because of|primarily (?:from|due to)|follow\w*)\b[^.]{0,100}\b(sale|divestiture|divestment|disposal|sold)\b[^.]{0,60}\b(business|unit|segment|operations)\b/i;
function plainNumbersSupported(text: string, ev: Evidence[]): boolean {
  const hay = ev.map((e) => e.text).join(" ");
  const hayNums = [...hay.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, "")));
  const rest = text.replace(new RegExp(FIN_FIGURE.source, "gi"), " "); // financial-looking figures are checked separately
  for (const m of rest.matchAll(/\b\d[\d,]*(?:\.\d+)?\b/g)) {
    const v = Number(m[0].replace(/,/g, ""));
    if (!Number.isFinite(v) || v < 10 || /^(?:19|20)\d\d$/.test(m[0])) continue;
    if (/^-?[KQkq]\b/.test(rest.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 3))) continue; // 10-K, 10-Q
    if (!hayNums.some((h) => Math.abs(h - v) <= 0.05 * Math.max(h, v))) return false;
  }
  return true;
}
const divestitureExplainsContinuing = (text: string, ev: Evidence[]) =>
  FIN_TERMS.test(text) && DIVEST_CAUSE_RE.test(text) && (CONT_OPS_RE.test(text) || ev.some((e) => CONT_OPS_RE.test(e.text)));

// Pipeline-internal evidence references ("(E37, E47)") must never reach client text.
const EVIDENCE_REF_RE = /\s*[(\[]\s*(?:(?:based on|see|per|from|evidence)\s+)?E\d+(?:\s*(?:,|;|&|and)\s*E\d+)*\s*[)\]]/gi;
const stripEvidenceRefs = (t: string) => t.replace(EVIDENCE_REF_RE, "").replace(/\bE\d+(?:\s*,\s*E\d+)+\b/g, "").replace(/\s{2,}/g, " ").trim();

// Not strategic and not a customer review theme: colour or SKU launches, awards and rankings, report publications.
const MATERIALITY_RE = /\b(colou?rs?|shades?|SKUs?|awards?|award-winning|ranked|rankings?|recogni[sz]ed|best places to work|women'?s choice|colou?r of the year)\b|\b(published|releas\w+|issued|unveiled)\s+(?:its |the |a |an )?[^.]{0,40}\b(sustainability|esg|annual|impact|citizenship) report\b/i;
const AWARD_RE = /\b(awards?|award-winning|ranked|rankings?|recogni[sz]ed|best places to work|women'?s choice|best of)\b/i;
// Competitor claims must not rest on contractor blogs, job sites or review sites.
// Only sources that are known to be poor evidence about a competitor are refused (contractor and dealer blogs, review and
// legal-marketing sites, look-alikes); ordinary tier-3 sources such as the competitor's own site and trade press are fine.
const BAD_COMPETITOR_KINDS = ["seller", "review", "legal_marketing", "lookalike", "peer_list"];
const competitorEvidenceOK = (e: Evidence) =>
  !e.flags?.includes("stale") && ((e.tier ?? 3) <= 2 || !!e.flags?.includes("own_site") || !(e.flags ?? []).some((f) => BAD_COMPETITOR_KINDS.includes(f)));

const notFound = (): Claim => ({ text: null, status: "not_found", evidenceIds: [] });

function checkClaim(c: Any, path: string, ctx: Ctx, topics?: string[], opts?: { allowHedge?: boolean; primaryOnly?: boolean; competitor?: boolean }): Claim {
  if (c?.status !== "sourced") return notFound();
  const text = typeof c.text === "string" ? stripEvidenceRefs(c.text) : "";
  const evAny = validEvidence(c.evidenceIds, ctx, topics).filter((e) => !opts?.competitor || competitorEvidenceOK(e));
  // Financial results must rest on primary (T1) or major-press/analyst (T2) evidence, never on aggregators or blogs.
  const ev = opts?.primaryOnly ? evAny.filter((e) => (e.tier ?? 2) <= ctx.finMaxTier) : evAny;
  const reason = !text
    ? "empty text"
    : !ev.length
    ? opts?.primaryOnly && evAny.length
      ? ctx.finMaxTier === 1 ? "financial figure needs a primary source (filing, investor page or company release)" : "financial figure needs a primary or major-press source"
      : topics ? `no valid ${topics.join("/")} evidence cited` : "no valid evidence cited"
    : !opts?.allowHedge && (HEDGE_I.test(text) || HEDGE_CS.test(text))
    ? "hedged language in a factual field"
    : !figuresSupported(text, ev, false)
    ? "figure not present in cited evidence"
    : litigationUnsupported(text, ev)
    ? "law-firm claim needs attribution"
    : divestitureExplainsContinuing(text, ev)
    ? "a divestiture cannot explain a change in continuing-operations figures"
    : topics?.includes("customer*") && AWARD_RE.test(text)
    ? "award or ranking is not a customer review theme"
    : null;
  if (reason) {
    ctx.dropped.push({ path, reason, text });
    return notFound();
  }
  const claim: Claim = { text, status: "sourced", evidenceIds: ev.map((e) => e.id), verification: "unchecked" };
  ctx.sourced.push({ path, claim });
  return claim;
}

// Quantities stated in words ("over half", "majority", "doubled") carry no numeral for figuresSupported to check,
// so require the cited evidence to say something equivalent.
const QUANT_RE = /\b(over half|more than half|at least half|half of|the majority|a majority|majority of|most of|nearly all|almost all|a third|one[- ]third|two[- ]thirds|three[- ]quarters|doubled|tripled|quadrupled|halved|\d+[- ]fold)\b/i;
function quantityWordsSupported(text: string, ev: Evidence[]): boolean {
  const m = text.match(QUANT_RE);
  if (!m) return true;
  const phrase = m[0].toLowerCase();
  const hay = ev.map((e) => e.text.toLowerCase()).join(" ");
  if (hay.includes(phrase)) return true;
  if (/half|majority|most of|nearly all|almost all|three[- ]quarters/.test(phrase)) return /\b(half|majority|most|nearly all|almost all|three[- ]quarters|[5-9]\d(\.\d+)?\s?%)/.test(hay);
  if (/third/.test(phrase)) return /\b(third|3\d(\.\d+)?\s?%)/.test(hay);
  return /(doubl|tripl|quadrupl|halved|\d+[- ]fold|\b[2-9]x\b|\d{3,}\s?%)/.test(hay);
}

const FIN_TERMS = /\b(revenue|net sales|sales growth|margin|ebitda|net income|operating income|earnings|profit(ability)?|headcount|employees|workforce)\b/i;

function checkItem(it: Any, path: string, ctx: Ctx): Item | null {
  const text = typeof it?.text === "string" ? stripEvidenceRefs(it.text) : "";
  if (!text) return null;
  const evAll = validEvidence(it.basedOn, ctx);
  // Evidence that has a source attached, so the statement always renders with a visible citation.
  const ev = evAll.filter((e) => e.sourceIds.length > 0);
  const reason = !evAll.length
    ? "no evidence basis"
    : !ev.length
    ? "no source attached to the cited evidence"
    : !figuresSupported(text, ev, true)
    ? "figure not present in cited evidence"
    : !quantityWordsSupported(text, ev)
    ? "quantity wording not supported by cited evidence"
    : // a statement about the company's financial performance cannot rest on aggregators or blogs alone
      ((text.match(FIN_FIGURE) ?? []).length > 0 || FIN_TERMS.test(text)) && ev.some((e) => e.topic === "performance") &&
        !ev.some((e) => (e.tier ?? 2) <= ctx.finMaxTier)
    ? ctx.finMaxTier === 1 ? "financial statement needs a primary source (filing, investor page or company release)" : "financial statement needs a primary or major-press source"
    : litigationUnsupported(text, ev)
    ? "law-firm claim needs attribution"
    : ABSENCE_RE.test(text)
    ? "absence of evidence is not evidence"
    : !plainNumbersSupported(text, ev)
    ? "figure not present in cited evidence"
    : divestitureExplainsContinuing(text, ev)
    ? "a divestiture cannot explain a change in continuing-operations figures"
    : /^(recommendations|mcOpportunities)/.test(path) && MATERIALITY_RE.test(text)
    ? "colour, SKU, award or report publication is not material"
    : null;
  if (reason) {
    ctx.dropped.push({ path, reason, text });
    return null;
  }
  const item: Item = { text, basedOn: ev.map((e) => e.id) };
  ctx.items.push({ path, item });
  return item;
}

const list = (a: unknown): Any[] => (Array.isArray(a) ? a : []);

type MarketEntry = { segment: string; geography: string; year: number; value: string; publisher: string; claim: Claim; varies?: boolean; scope?: number };

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

// One row per segment, largest first, at most 5. For each segment the candidates are the latest estimates (global over
// regional, one per publisher). When publishers agree to within 25% the best-known publisher's figure is shown; when they
// disagree the row shows the range and says so, because market-research estimates of one market often differ several-fold.
function latestPerSegment(entries: MarketEntry[]): MarketEntry[] {
  const geoRank = (g: string) => (/global|worldwide|world/i.test(g) ? 0 : 1);
  const pubRank = (p: string) => {
    const i = PUBLISHER_RANK.findIndex((x) => p.toLowerCase().includes(x));
    return i < 0 ? 99 : i;
  };
  const groups = new Map<string, { e: MarketEntry; i: number }[]>();
  entries.forEach((e, i) => {
    const key = segmentKey(e.segment) || e.segment.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), { e, i }]);
  });
  const out: { e: MarketEntry; size: number; i: number }[] = [];
  for (const rows of groups.values()) {
    const minScope = Math.min(...rows.map((r) => r.e.scope ?? 0));
    const closest = rows.filter((r) => (r.e.scope ?? 0) === minScope);
    const maxYear = Math.max(...closest.map((r) => r.e.year));
    let cands = closest.filter((r) => r.e.year >= maxYear - 1);
    if (cands.some((r) => geoRank(r.e.geography) === 0)) cands = cands.filter((r) => geoRank(r.e.geography) === 0);
    const byPublisher = new Map<string, { e: MarketEntry; i: number }>();
    for (const r of cands) {
      const k = r.e.publisher.toLowerCase().trim();
      const cur = byPublisher.get(k);
      if (!cur || r.e.year > cur.e.year) byPublisher.set(k, r);
    }
    const uniq = [...byPublisher.values()];
    const best = [...uniq].sort((a, b) =>
      b.e.year - a.e.year || geoRank(a.e.geography) - geoRank(b.e.geography) || pubRank(a.e.publisher) - pubRank(b.e.publisher) || a.i - b.i
    )[0];
    const sized = uniq.map((r) => ({ r, m: magnitude(r.e.value) })).filter((x) => Number.isFinite(x.m) && x.m > 0).sort((a, b) => a.m - b.m);
    const lo = sized[0], hi = sized[sized.length - 1];
    if (sized.length >= 2 && (hi.m - lo.m) / hi.m > 0.25) {
      const evidenceIds = [...new Set(sized.flatMap((x) => x.r.e.claim.evidenceIds))];
      out.push({
        e: {
          segment: best.e.segment,
          geography: best.e.geography,
          year: Math.max(...sized.map((x) => x.r.e.year)),
          value: `${lo.r.e.value} to ${hi.r.e.value}`,
          publisher: `estimates vary by source: ${lo.r.e.publisher} (${lo.r.e.value}), ${hi.r.e.publisher} (${hi.r.e.value})`,
          claim: { ...best.e.claim, evidenceIds },
          varies: true,
        },
        size: hi.m,
        i: best.i,
      });
    } else {
      out.push({ e: best.e, size: magnitude(best.e.value), i: best.i });
    }
  }
  return out.sort((a, b) => b.size - a.size || a.i - b.i).map((x) => x.e).slice(0, 5);
}

// Does a market-size row's segment name refer to one of these business names? (shared significant word)
const segmentWords = (name: string) => segmentKey(name).split(" ").filter((w) => w.length > 3);
const sameSegment = (rowSegment: string, names: string[]) => {
  const words = new Set(segmentWords(rowSegment));
  return names.some((n) => segmentWords(n).some((w) => words.has(w)));
};

// A strategic initiative is something that happened: these verbs carry an action, "announced"/"focused"/"reshaping" alone do not.
const STRONG_EVENT_RE = /\b(acqui\w+|sold|sell|sale|divest\w*|open(?:ed|s|ing)|clos(?:e|ed|es|ing|ure)|launch\w*|appoint\w*|elect\w*|named|sign\w*|terminat\w*|amend\w*|issu\w+|authori[sz]\w*|declar\w*|complet\w*|establish\w*|built|construct\w*|build(?:s|ing)? (?:a|an|the|new|its)\b|merge\w*|restructur\w*|approv\w*|unveil\w*|began|begin|start\w*|raised|expanded|increased capacity|partner\w*|joint venture|agreement|lay(?:ing|s|ed)? off|layoffs?|cut(?:ting)? (?:jobs|positions)|ceas\w+ production|shut\w*)\b/i;
const INITIATIVE_STOP = new Set([
  "company", "corporation", "announced", "completed", "agreed", "opened", "closed", "reported", "according", "business", "million", "billion",
  "january", "february", "march", "april", "june", "july", "august", "september", "october", "november", "december", "north", "america",
  "american", "europe", "european", "united", "states", "chief", "officer", "president", "board", "directors", "effective", "expected", "will", "with", "from",
]);
// One headcount: when several employee figures are reported, keep the latest period only.
function latestHeadcount(cs: Claim[], ctx: Ctx): Claim[] {
  const HEAD = /\b(employees|headcount|workforce|people)\b/i;
  const year = (c: Claim) => Math.max(0, ...((c.text ?? "").match(/\b20\d\d\b/g) ?? []).map(Number));
  const heads = cs.filter((c) => HEAD.test(c.text ?? ""));
  if (heads.length < 2) return cs;
  const best = heads.reduce((a, b) => (year(b) > year(a) ? b : a));
  for (const c of heads) if (c !== best) ctx.dropped.push({ path: "businessPerformance.recentMetrics", reason: "older employee figure (a later one is shown)", text: c.text ?? "" });
  return cs.filter((c) => !heads.includes(c) || c === best);
}

// A leadership heading must name the person in full ("Brian Chambers named CFO"), not "Election of DeVito".
function leadershipHeading(subgroup: string, name: string, description: string): string {
  if (subgroup !== "C-Suite & Board Transitions") return name;
  const fullName = /\b[A-Z][a-z]+ (?:[A-Z]\.? )?[A-Z][A-Za-z'-]+\b/.test(name.replace(/\b(Owens Corning|Chief|Executive|Financial|Operating|Officer|Board|President|Director|Election|Appointment)\b/g, ""));
  if (fullName) return name;
  return description.replace(/^[^A-Za-z]+/, "").split(/,|;| effective | to succeed /i)[0].split(/\s+/).slice(0, 12).join(" ");
}

function validateFacts(raw: Any, ctx: Ctx, competitorNames?: string[], opts?: { entity?: Entity; landscape?: Competitor[]; rejectedNames?: string[]; sources?: Source[]; competitors?: Competitor[] }) {
  const f = raw ?? {};
  const claims = (a: unknown, p: string, topics?: string[], opts?: { allowHedge?: boolean; primaryOnly?: boolean; competitor?: boolean }) =>
    list(a).map((c, i) => checkClaim(c, `${p}[${i}]`, ctx, topics, opts)).filter((c) => c.status === "sourced");
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
      // An announced initiative can itself be conditional ("expected to exceed $30B"), so hedging is allowed here.
      const description = checkClaim(s?.description, path, ctx, undefined, { allowHedge: true });
      if (description.status !== "sourced") return [];
      if (!STRONG_EVENT_RE.test(description.text!) && !(/\binvest\w*/i.test(description.text!) && /\d/.test(description.text!))) {
        ctx.dropped.push({ path, reason: "not a discrete event (no action with a date or object)", text: description.text! });
        Object.assign(description, notFound());
        delete description.verification;
        return [];
      }
      if (MATERIALITY_RE.test(`${name} ${description.text}`)) {
        ctx.dropped.push({ path, reason: "colour, SKU, award or report publication is not a strategic initiative", text: description.text! });
        Object.assign(description, notFound());
        delete description.verification;
        return [];
      }
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
      return [{ group, subgroup, name: leadershipHeading(subgroup, name, description.text!), description }];
    });
  };
  // The same event reported under two themes (a plant closure under both Cost Optimization and Workforce, an appointment
  // under both Leadership and Governance) is one initiative. Same facility, person or company and the same date.
  const mergeInitiatives = <T extends { name: string; subgroup: string; description: Claim }>(items: T[]): T[] => {
    const companyWords = new Set(`${opts?.entity?.name ?? ""}`.toLowerCase().split(/\W+/));
    const props = (t: string) =>
      new Set((t.match(/\b[A-Z][A-Za-z0-9&'-]{3,}\b/g) ?? []).filter((w) => !companyWords.has(w.toLowerCase()) && !INITIATIVE_STOP.has(w.toLowerCase())).map((w) => w.toLowerCase()));
    const tierOf = (c: Claim) => Math.min(...c.evidenceIds.map((id) => ctx.byId.get(id)?.tier ?? 3), 3);
    const kept: { item: T; props: Set<string>; dates: string[] }[] = [];
    for (const item of items) {
      const text = item.description.text ?? "";
      const cur = { item, props: props(text), dates: monthYears(text) };
      const dup = kept.find((k) => {
        const shared = [...cur.props].filter((w) => k.props.has(w)).length;
        const sameDate = !cur.dates.length || !k.dates.length || cur.dates.some((d) => k.dates.includes(d));
        return shared >= 2 && sameDate;
      });
      if (!dup) {
        kept.push(cur);
        continue;
      }
      ctx.dropped.push({ path: "businessPerformance.strategicInitiatives", reason: "same event reported under another theme", text });
      const better = tierOf(cur.item.description) < tierOf(dup.item.description);
      const evidenceIds = [...new Set([...dup.item.description.evidenceIds, ...cur.item.description.evidenceIds])];
      if (better) dup.item = cur.item;
      dup.item.description.evidenceIds = evidenceIds;
      dup.props = new Set([...dup.props, ...cur.props]);
    }
    return kept.map((k) => k.item);
  };

  // Descriptive market text (definition, drivers, inhibitors, segmentation): evidence-backed summaries. Hedged wording is
  // fine, but each needs valid cited evidence and any financial figure must appear in it. Not sent to the verifier.
  const summaryClaim = (it: Any, path: string): Claim => {
    const text = typeof it?.text === "string" ? stripEvidenceRefs(it.text) : "";
    if (!text) return notFound();
    const ev = validEvidence(it?.basedOn ?? it?.evidenceIds, ctx);
    const reason = !ev.length ? "no valid evidence cited" : !figuresSupported(text, ev, true) ? "figure not present in cited evidence" : null;
    if (reason) {
      ctx.dropped.push({ path, reason, text });
      return notFound();
    }
    return { text, status: "sourced", evidenceIds: ev.map((e) => e.id), verification: "unchecked" };
  };
  // One sentence per current segment, joined; the single-sentence form is still accepted from older prompts.
  const marketDefinition = (): Claim => {
    const mo0 = f.marketOverview ?? {};
    const items = list(mo0.definitions).slice(0, 4).map((it, i) => summaryClaim(it, `marketOverview.definitions[${i}]`)).filter((c) => c.status === "sourced");
    if (!items.length) return summaryClaim(mo0.definition, "marketOverview.definition");
    return { text: items.map((c) => c.text).join(" "), status: "sourced", evidenceIds: [...new Set(items.flatMap((c) => c.evidenceIds))], verification: "unchecked" };
  };
  const summaries = (a: unknown, p: string) =>
    list(a).map((c, i) => summaryClaim(c, `${p}[${i}]`)).filter((c) => c.status === "sourced").slice(0, 6);

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
      // Market figures must belong to a business the company is in today, not one it has sold.
      const current = opts?.entity?.segments?.map((x) => x.name) ?? [];
      const sold = opts?.entity?.divested?.map((x) => x.name) ?? [];
      const segReason = segment && sold.length && sameSegment(segment, sold) && !sameSegment(segment, current)
        ? "market for a business the company has sold"
        : segment && current.length && !sameSegment(segment, current)
        ? "market does not match a current reporting segment"
        : null;
      if (segReason) {
        ctx.dropped.push({ path, reason: segReason, text });
        return [];
      }
      // Map the row to the company's own segment (one canonical name, one capitalisation); a closer name ranks higher, so
      // "Windows & Doors" and "Exterior Doors" do not sit beside "Doors".
      const segs = opts?.entity?.segments ?? [];
      let canonical = segment;
      let scope = 0;
      let segRevenue: number | undefined;
      for (const sg of segs) {
        if (!sameSegment(segment, [sg.name])) continue;
        const extra = segmentWords(segment).filter((w) => !segmentWords(sg.name).includes(w)).length;
        if (canonical === segment || extra < scope) {
          canonical = sg.name.charAt(0).toUpperCase() + sg.name.slice(1);
          scope = extra;
          segRevenue = sg.revenue;
        }
      }
      // A market cannot be smaller than the company's own sales in it (global figures only; a regional market may be).
      const mag = magnitude(value);
      if (segRevenue && Number.isFinite(mag) && mag > 0 && mag < segRevenue && /global|worldwide|world|not stated/i.test(geography)) {
        ctx.dropped.push({ path, reason: "market smaller than the company's own sales in it", text });
        return [];
      }
      if (reason) {
        ctx.dropped.push({ path, reason, text });
        return [];
      }
      const claim = checkClaim({ text, status: "sourced", evidenceIds: m?.evidenceIds }, path, ctx);
      if (claim.status !== "sourced") return [];
      // A market size is a research firm's estimate: it must rest on a primary or major-press/research-firm source.
      if (!claim.evidenceIds.some((id) => (ctx.byId.get(id)?.tier ?? 3) <= 2)) {
        ctx.dropped.push({ path, reason: "market size needs a research firm or major-press source", text });
        Object.assign(claim, notFound());
        return [];
      }
      // The cited page must be about this market: its address or title carries a word of the segment name. This catches a
      // roofing figure cited to a "conveying equipment market" page.
      const words = segmentWords(canonical);
      if (opts?.sources?.length && words.length) {
        const cited = claim.evidenceIds.flatMap((id) => ctx.byId.get(id)?.sourceIds ?? []);
        const pages = cited.map((id) => opts.sources!.find((x) => x.id === id)).filter((x): x is Source => !!x && /^https?:/.test(x.url) && !x.url.includes("grounding-api-redirect"));
        const about = (src: Source) => {
          let slug = "";
          try {
            slug = decodeURIComponent(new URL(src.url).pathname).replace(/[-_/.]+/g, " ");
          } catch {
            return true;
          }
          // A real page title wins over the address: a roofing-looking address with a "Conveying Equipment" title is the wrong page.
          const hay = segmentKey(src.page?.title ? src.page.title : `${slug} ${src.title ?? ""}`);
          return words.some((w) => hay.includes(w));
        };
        if (pages.length && !pages.some(about)) {
          ctx.dropped.push({ path, reason: "cited page is about a different market", text });
          Object.assign(claim, notFound());
          return [];
        }
      }
      return [{ segment: canonical, geography, year, value: tidyValue(value), publisher, claim, scope }];
    });

  const bp = f.businessPerformance ?? {};
  const mo = f.marketOverview ?? {};
  const cl = f.competitiveLandscape ?? {};
  const ci = f.customerInsights ?? {};
  const CUSTOMER = ["customer*"];

  return {
    businessPerformance: {
      financialHighlights: claims(bp.financialHighlights, "businessPerformance.financialHighlights", undefined, { primaryOnly: true }),
      recentMetrics: latestHeadcount(claims(bp.recentMetrics, "businessPerformance.recentMetrics", undefined, { primaryOnly: true }), ctx),
      strategicInitiatives: mergeInitiatives(initiatives(bp.strategicInitiatives)),
    },
    marketOverview: {
      definition: marketDefinition(),
      tam: marketEntries(mo.tam, "marketOverview.tam"),
      segmentation: summaries(mo.segmentation, "marketOverview.segmentation"),
      drivers: summaries(mo.drivers, "marketOverview.drivers"),
      inhibitors: summaries(mo.inhibitors, "marketOverview.inhibitors"),
    },
    competitiveLandscape: opts?.landscape?.length
      // The validated list decides who is a competitor; the model only supplies potential entrants.
      ? {
        directCompetitors: opts.landscape.filter((c) => c.kind === "direct" && c.evidenceIds?.length).map((c) => ({ name: c.brands?.length ? `${c.name} (${c.brands.join(", ")})` : c.name, evidenceIds: c.evidenceIds! })),
        indirectCompetitors: opts.landscape.filter((c) => c.kind === "indirect" && c.evidenceIds?.length).map((c) => ({ name: c.brands?.length ? `${c.name} (${c.brands.join(", ")})` : c.name, evidenceIds: c.evidenceIds! })),
        potentialEntrants: named(cl.potentialEntrants, "competitiveLandscape.potentialEntrants").filter(
          (n) => !(opts.rejectedNames ?? []).some((r) => r.toLowerCase() === n.name.toLowerCase()),
        ),
      }
      : {
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
            (e) => (e.topic.toLowerCase() === topic || e.text.toLowerCase().includes(name.toLowerCase())) && competitorEvidenceOK(e),
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
        const parent = opts?.competitors?.find((c) => competitorKey(c.name) === competitorKey(name))?.parent;
        return [{
          name,
          ...(parent ? { parent } : {}),
          revenue: checkClaim(d?.revenue, `${p}.revenue`, ctx, undefined, { primaryOnly: true, competitor: true }),
          headcount: checkClaim(d?.headcount, `${p}.headcount`, ctx, undefined, { primaryOnly: true, competitor: true }),
          activity: checkClaim(d?.activity, `${p}.activity`, ctx, undefined, { competitor: true }),
          pricingModel: checkClaim(d?.pricingModel, `${p}.pricingModel`, ctx, undefined, { competitor: true }),
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
  // Positioning comes only from explicit rank evidence: #1 Leader, #2-3 Challenger, otherwise Niche, for the company's largest
  // ranked segment. The cited basis of that rank is the rationale.
  const RANK_WORDS: [(r: number) => boolean, RegExp][] = [
    [(r) => r === 1, /(?<!(?:second|third|fourth|fifth)[- ])\b(?:largest|biggest)\b|\b(?:number one|no\.? ?1|#\s?1|market leader)\b/i],
    [(r) => r === 2, /\b(second|number two|no\.? ?2|#\s?2)\b/i],
    [(r) => r === 3, /\b(third|number three|no\.? ?3|#\s?3)\b/i],
    [(r) => r >= 4, /\b(fourth|fifth|sixth|seventh|no\.? ?\d+|#\s?\d+)\b/i],
  ];
  const segDefs = ctx.entity?.segments ?? [];
  const ranks = list(pos.segmentRanks).flatMap((r, i) => {
    const path = `executiveSummary.competitivePositioning.segmentRanks[${i}]`;
    const rank = Number(r?.rank);
    const item = checkItem({ text: r?.basis, basedOn: r?.basedOn }, path, ctx);
    if (!item) return [];
    // A rank is a claim about market position: stock-data and blog pages cannot carry it.
    if (!item.basedOn.some((id) => (ctx.byId.get(id)?.tier ?? 3) <= 2)) {
      ctx.dropped.push({ path, reason: "rank needs a primary or major-press source", text: item.text });
      ctx.items = ctx.items.filter((x) => x.item !== item);
      return [];
    }
    if (!Number.isInteger(rank) || rank < 1 || rank > 20 || !RANK_WORDS.some(([ok, re]) => ok(rank) && re.test(item.text))) {
      ctx.dropped.push({ path, reason: "rank not stated in the cited evidence", text: item.text });
      ctx.items = ctx.items.filter((x) => x.item !== item);
      return [];
    }
    const sg = segDefs.find((x) => typeof r?.segment === "string" && sameSegment(r.segment, [x.name]));
    return [{ segment: sg ? capFirst(sg.name) : String(r?.segment ?? "").trim(), revenue: sg?.revenue ?? 0, rank, item }];
  });
  // Largest ranked segment by revenue; without revenue figures, the best rank.
  const primary: (typeof ranks)[number] | undefined = [...ranks].sort((x, y) => y.revenue - x.revenue || x.rank - y.rank)[0];
  const rationale: Item | null = primary ? primary.item : null;
  const tier = !primary ? "Insufficient evidence" : primary.rank === 1 ? "Leader" : primary.rank <= 3 ? "Challenger" : "Niche";
  const label: string = primary && primary.segment ? `${tier} in ${primary.segment}` : tier;
  const pf = a.portersFiveForces ?? {};
  const pe = a.pestle ?? {};
  const sw = a.swot ?? {};
  const rc = a.recommendations ?? {};

  return {
    executiveSummary: {
      tldr: one(es.tldr, "executiveSummary.tldr"),
      keyTrends: many(es.keyTrends, "executiveSummary.keyTrends"),
      competitivePositioning: { label, rationale, ranks: ranks.map((x) => ({ segment: x.segment, rank: x.rank, basis: x.item.text })) },
      bigOpportunity: one(es.bigOpportunity, "executiveSummary.bigOpportunity"),
    },
    performanceSummary: many(a.performanceSummary, "performanceSummary").slice(0, 3),
    competitorGaps: list(a.competitorGaps).flatMap((g, i) => {
      const item = one(g, `competitorGaps[${i}]`);
      const competitor = typeof g?.competitor === "string" ? g.competitor.trim() : "";
      return item && competitor ? [Object.assign(item, { competitor })] : [];
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
        item,
      }];
    }),
  };
}
type Analysis = ReturnType<typeof validateAnalysis>;
type Opportunity = Analysis["mcOpportunities"][number];

// ---------- Step 4: verifier ----------
async function verifyClaims(apiKey: string, ctx: Ctx, timeoutMs: number, mode: "facts" | "analysis" = "facts"): Promise<string> {
  const items = ctx.sourced.filter((s) => s.claim.status === "sourced").slice(0, MAX_VERIFY);
  if (!items.length) return "no sourced claims";
  const rubric = mode === "facts"
    ? `"supported": every part of the claim, including numbers, dates, names and attribution, is stated in the evidence.
"partial": the core is supported, but a detail is missing or slightly overstated.
"unsupported": the evidence does not state it, contradicts it, or is about a different company.`
    : `These claims are analysis written from the evidence, so reasonable synthesis is fine.
"supported": the evidence supports the claim, and any number, quantity (including words like "over half" or "majority"), date, name or event in it appears in the evidence.
"partial": mostly supported, but the wording is somewhat stronger than the evidence.
"unsupported": the claim states a number, quantity, date, name or event that the evidence does not contain, contradicts the evidence, or is about a different company or business.`;
  const prompt = `For each numbered CLAIM, judge whether the EVIDENCE listed under it supports it.
${rubric}

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

// Remove analysis items the verifier judged unsupported (flagged `rejected`).
function applyRejections(a: Analysis): void {
  const keep = <T extends Item | null>(x: T): T | null => (x && !x.rejected ? x : null);
  const keepAll = (xs: Item[]) => xs.filter((x) => !x.rejected);
  const es = a.executiveSummary;
  es.tldr = keep(es.tldr);
  es.bigOpportunity = keep(es.bigOpportunity);
  es.keyTrends = keepAll(es.keyTrends);
  es.competitivePositioning.rationale = keep(es.competitivePositioning.rationale);
  if (!es.competitivePositioning.rationale) es.competitivePositioning.label = "Insufficient evidence";
  a.performanceSummary = keepAll(a.performanceSummary);
  a.competitorGaps = a.competitorGaps.filter((g) => !g.rejected);
  for (const k of ["strengths", "weaknesses", "opportunities", "threats"] as const) a.swot[k] = keepAll(a.swot[k]);
  for (const k of Object.keys(a.portersFiveForces) as (keyof Analysis["portersFiveForces"])[]) a.portersFiveForces[k] = keep(a.portersFiveForces[k]);
  for (const k of Object.keys(a.pestle) as (keyof Analysis["pestle"])[]) a.pestle[k] = keep(a.pestle[k]);
  a.recommendations.product = keepAll(a.recommendations.product);
  a.recommendations.marketing = keepAll(a.recommendations.marketing);
  a.recommendations.resourceAllocation = keep(a.recommendations.resourceAllocation);
  a.recommendations.roadmap = keep(a.recommendations.roadmap);
  a.mcOpportunities = a.mcOpportunities.filter((o) => !o.item.rejected);
}

// Number the citations in the final text 1..n in order of first appearance, and keep only the sources actually cited.
const NO_RENUMBER = new Set(["sources", "claims", "quality", "entity", "evidence", "searchSuggestions", "generatedAt", "companyName"]);
function renumberCitations(report: Any, sources: Source[]): Any {
  const map = new Map<number, number>();
  const order: number[] = [];
  const rewrite = (v: Any): Any => {
    if (typeof v === "string") {
      return v.replace(/\[(\d+)\]/g, (_m, d) => {
        const id = Number(d);
        if (!map.has(id)) {
          map.set(id, map.size + 1);
          order.push(id);
        }
        return `[${map.get(id)}]`;
      });
    }
    if (Array.isArray(v)) return v.map(rewrite);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rewrite(x)]));
    return v;
  };
  const out: Any = {};
  for (const [k, v] of Object.entries(report)) out[k] = NO_RENUMBER.has(k) ? v : rewrite(v);
  const byId = new Map(sources.map((x) => [x.id, x]));
  out.sources = order.map((id) => byId.get(id) ?? { id, title: `Source ${id}`, url: "" });
  return out;
}

// The reader sees the page TITLE next to a market figure, and the title is only known once the sources' pages are fetched (after
// the report is assembled). A row whose cited pages are titled for another market ("Conveying Equipment Market Size" for
// Roofing) is removed here, and a source that only that row cited is taken out of the text.
function pruneMarketRows(report: Any): { removed: string[]; strip: Set<number> } {
  const rows: Any[] = report.marketOverview?.metrics?.tamRows ?? [];
  const sources: Source[] = report.sources ?? [];
  const removed: string[] = [];
  const dropNums = new Set<number>();
  const keep = rows.filter((r) => {
    const nums = [...String(r.cite ?? "").matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    const cited = nums.map((n) => sources[n - 1]).filter((x): x is Source => !!x);
    const words = segmentWords(String(r.segment ?? ""));
    if (!cited.length || !words.length) return true;
    const ok = cited.some((src) => {
      const titled = / - [^ ]+$/.test(src.title ?? "");
      let slug = "";
      try {
        slug = decodeURIComponent(new URL(src.url).pathname).replace(/[-_/.]+/g, " ");
      } catch {
        // no usable address
      }
      // A fetched title wins over the address: a roofing-looking address with a conveying-equipment title is the wrong page.
      const hay = segmentKey(titled ? (src.title ?? "").replace(/ - [^ ]+$/, "") : `${slug} ${src.title ?? ""}`);
      return words.some((w) => hay.includes(w));
    });
    if (!ok) {
      removed.push(`${r.segment}: ${cited.map((c) => c.title).join(" | ")}`);
      nums.forEach((n) => dropNums.add(n));
    }
    return ok;
  });
  if (!removed.length) return { removed, strip: new Set() };
  report.marketOverview.metrics.tamRows = keep;
  report.marketOverview.metrics.tam = keep.length
    ? keep.map((r) => `- **${r.segment}** (${r.geography}, ${r.year}): ${r.value}, ${r.publisher}${r.cite ? " " + r.cite : ""}`).join("\n")
    : NF;
  // Only sources that nothing else cites are taken out.
  const body = JSON.stringify(Object.fromEntries(Object.entries(report).filter(([k]) => !NO_RENUMBER.has(k))));
  const strip = new Set([...dropNums].filter((n) => !new RegExp(`\\[${n}\\]`).test(body)));
  return { removed, strip };
}

// Remove [n] markers (n in `drop`) from every statement; sources, claims, quality and entity are left alone.
function stripCitations(report: Any, drop: Set<number>): Any {
  const rewrite = (v: Any): Any => {
    if (typeof v === "string") return v.replace(/\s?\[(\d+)\]/g, (m, d) => (drop.has(Number(d)) ? "" : m));
    if (Array.isArray(v)) return v.map(rewrite);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rewrite(x)]));
    return v;
  };
  const out: Any = {};
  for (const [k, v] of Object.entries(report)) out[k] = NO_RENUMBER.has(k) ? v : rewrite(v);
  return out;
}

// Best effort: replace a source's domain-only title with the page's own <title>. Never blocks the report for long.
async function fetchTitles(sources: Source[], budgetMs: number): Promise<void> {
  const deadline = Date.now() + budgetMs;
  await Promise.allSettled(sources.map(async (src) => {
    if (!/^https?:/.test(src.url)) return;
    const left = deadline - Date.now();
    if (left < 500) return;
    const res = await fetch(src.url, {
      signal: AbortSignal.timeout(Math.min(4000, left)), redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MCHubBot/1.0)", Accept: "text/html" },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html") || !res.body) {
      await res.body?.cancel();
      return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let html = "";
    while (html.length < 48_000 && !/<\/title>/i.test(html)) {
      const { done, value } = await reader.read();
      if (done) break;
      html += dec.decode(value, { stream: true });
    }
    await reader.cancel();
    const m = html.match(/<title[^>]*>([\s\S]{2,300}?)<\/title>/i);
    const title = m ? plainTitle(m[1]) : "";
    if (title && BOT_CHECK_TITLE_RE.test(title)) {
      // The page served a bot check, so nobody can audit what it supposedly says.
      src.kinds = [...new Set([...(src.kinds ?? []), "unauditable"])];
    } else if (title) {
      const host = hostOf(src.url, src.title);
      src.title = `${title.slice(0, 150)}${host ? ` - ${host}` : ""}`;
    }
  }));
}

// ---------- Date integrity ----------
// The evidence ledger holds the research model's SUMMARY of a page, and a model summarising an undated or old article tends
// to write the current year. Every downstream check then passes. So a statement that carries a recent date is checked against
// the cited page itself: the page must show that date, or be a primary source that dates itself.
const MONTH_RE = "(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const monthNo = (m: string) => ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m.slice(0, 3).toLowerCase()) + 1;
const ymKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
const monthsOf = (ym: string) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7));

/** "July 17, 2026", "17 July 2026", "2026-07-17", "07/17/2026" -> "2026-07" (deduplicated). */
function monthYears(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(new RegExp(`\\b${MONTH_RE}\\.?\\s+(?:\\d{1,2}(?:st|nd|rd|th)?,?\\s+)?((?:19|20)\\d\\d)\\b`, "gi"))) out.add(ymKey(Number(m[2]), monthNo(m[1])));
  for (const m of text.matchAll(new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH_RE}\\.?,?\\s+((?:19|20)\\d\\d)\\b`, "gi"))) out.add(ymKey(Number(m[2]), monthNo(m[1])));
  for (const m of text.matchAll(/\b((?:19|20)\d\d)-(0[1-9]|1[0-2])-\d\d\b/g)) out.add(ymKey(Number(m[1]), Number(m[2])));
  for (const m of text.matchAll(/\b(0?[1-9]|1[0-2])\/\d{1,2}\/((?:19|20)\d\d)\b/g)) out.add(ymKey(Number(m[2]), Number(m[1])));
  return [...out];
}

/** The recent dates (last 3 years, up to next year) a statement asserts. */
function claimDates(text: string, curYear: number): { my: string[]; years: number[] } {
  const my = monthYears(text).filter((x) => Number(x.slice(0, 4)) >= curYear - 3 && Number(x.slice(0, 4)) <= curYear + 1);
  const years = [...new Set((text.match(/\b(?:19|20)\d\d\b/g) ?? []).map(Number))].filter((y) => y >= curYear - 3 && y <= curYear + 1);
  return { my, years };
}

const toYm = (v: string): string | undefined => {
  const iso = v.match(/^(\d{4})-(\d{2})/);
  if (iso) return ymKey(Number(iso[1]), Number(iso[2]));
  const t = Date.parse(v);
  return Number.isFinite(t) ? ymKey(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth() + 1) : undefined;
};

/** What a page says about its own date: publication date, dates in the body, years in the body (outside copyright and footers). */
function parsePage(html: string, url: string): PageRead {
  const title = plainTitle(html.match(/<title[^>]*>([\s\S]{1,300}?)<\/title>/i)?.[1] ?? "").slice(0, 200);
  const PUB_NAMES = new Set(["article:published_time", "og:published_time", "datepublished", "pubdate", "publishdate", "publish-date", "date", "dc.date", "dc.date.issued", "parsely-pub-date", "sailthru.date"]);
  let pub: string | undefined;
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = tag.match(/(?:property|name|itemprop)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (name && content && PUB_NAMES.has(name)) {
      pub = toYm(content);
      if (pub) break;
    }
  }
  pub ??= toYm(html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1] ?? "");
  pub ??= toYm(html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1] ?? "");
  const urlDate = url.match(/\/((?:19|20)\d\d)\/(0[1-9]|1[0-2])(?:\/|$)/);
  if (!pub && urlDate) pub = ymKey(Number(urlDate[1]), Number(urlDate[2]));
  const text = cleanText(
    html.slice(0, 400_000)
      .replace(/<(script|style|noscript|nav|footer|header|aside|svg|form)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").replace(/(?:©|copyright)\s*(?:\(c\)\s*)?(?:19|20)\d\d(?:\s*[-–]\s*(?:19|20)\d\d)?/gi, " ");
  return {
    read: text.length >= 400,
    title: title || undefined,
    pub,
    my: monthYears(text).slice(0, 60),
    years: [...new Set((text.match(/\b(?:19|20)\d\d\b/g) ?? []).map(Number))].filter((y) => y >= 1990).slice(0, 40),
    ...(BOT_CHECK_TITLE_RE.test(title) ? { bot: true } : {}),
    text: text.toLowerCase().slice(0, 200_000),
  };
}

// Follows redirects (including Google's grounding links, whose real address is otherwise unknown) and returns the page's
// dates, title and text, plus the final address.
async function readPage(url: string, timeoutMs: number): Promise<PageRead> {
  if (!/^https?:/.test(url) || /\.pdf($|\?)/i.test(url) || timeoutMs < 500) return { read: false };
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs), redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MCHubBot/1.0)", Accept: "text/html" },
    });
    if (!res.ok || !/html/.test(res.headers.get("content-type") ?? "") || !res.body) {
      await res.body?.cancel();
      return { read: false };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let html = "";
    while (html.length < 300_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += dec.decode(value, { stream: true });
    }
    await reader.cancel();
    const finalUrl = res.url && res.url !== url ? res.url : undefined;
    const page = parsePage(html, finalUrl ?? url);
    return { ...page, truncated: html.length >= 300_000, ...(finalUrl ? { finalUrl } : {}) };
  } catch {
    return { read: false };
  }
}

type DateVerdict = "confirmed" | "contradicted" | "not_shown" | "unreadable";
function dateVerdict(claim: { my: string[]; years: number[] }, pages: PageInfo[]): DateVerdict {
  const read = pages.filter((p) => p.read);
  const confirms = (pg: PageInfo) =>
    claim.my.length
      ? !!pg.my?.some((m) => claim.my.includes(m)) || (!!pg.pub && claim.my.some((m) => Math.abs(monthsOf(pg.pub!) - monthsOf(m)) <= 6))
      : claim.years.some((y) => !!pg.years?.includes(y) || (!!pg.pub && Number(pg.pub.slice(0, 4)) === y));
  const minYear = Math.min(...claim.years);
  // An article published two or more years before the date it is said to report cannot be reporting it.
  const contradicts = (pg: PageInfo) => !!pg.pub && Number(pg.pub.slice(0, 4)) <= minYear - 2;
  if (read.some(confirms)) return "confirmed";
  if (read.some(contradicts)) return "contradicted";
  return read.length ? "not_shown" : "unreadable";
}

// Expectations and targets whose period has already ended read as news but are stale.
const FORECAST_RE = /\b(expected to|expects?|expected|projected|projects?|forecast(?:s|ed)?|guidance|anticipat\w+|outlook)\b/i;
// Not stale: results ("beat expectations"), events that already happened with a stale expectation attached, and relative
// periods ("over the next year") that run from the statement's own date.
const NOT_FORECAST_RE = /(than expected|in line with (?:its |the )?(?:expectations|guidance)|\bbeat\b|exceeded|exceeding|surpass\w*|\b(?:opened|completed|closed|acquired|launched|began|started|signed)\b|\bnext (?:year|quarter|\d+ months)\b|over the next|in the coming)/i;
const TARGET_RE = /\b(target|goal|aim|commit\w*|pledge\w*|ambition)\b[^.]{0,80}\bby (?:the end of )?((?:19|20)\d\d)\b/i;
const ACHIEVED_RE = /\b(achieved|met|reached|exceeded|delivered|completed)\b/i;
/** End of every period a statement refers to: quarters, halves, months, and bare years (not those already part of one of those). */
function periodEnds(text: string, curYear: number): Date[] {
  const ends: Date[] = [];
  const eom = (y: number, m: number) => new Date(Date.UTC(y, m, 0, 23, 59, 59));
  const ORD: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4 };
  let rest = text;
  const take = (re: RegExp, end: (m: RegExpMatchArray) => Date | null) => {
    rest = rest.replace(re, (...a) => {
      const d = end(a as unknown as RegExpMatchArray);
      if (d) ends.push(d);
      return " ";
    });
  };
  take(/\bQ([1-4])\s*(?:of\s*)?((?:19|20)\d\d)\b/gi, (m) => eom(Number(m[2]), Number(m[1]) * 3));
  take(/\b(first|second|third|fourth)[\s-]quarter(?: of)?\s*((?:19|20)\d\d)\b/gi, (m) => eom(Number(m[2]), ORD[m[1].toLowerCase()] * 3));
  take(/\bH([12])\s*((?:19|20)\d\d)\b/gi, (m) => eom(Number(m[2]), Number(m[1]) * 6));
  take(/\b(first|second)[\s-]half(?: of)?\s*((?:19|20)\d\d)\b/gi, (m) => eom(Number(m[2]), m[1].toLowerCase() === "first" ? 6 : 12));
  take(new RegExp(`\\b(?:\\d{1,2}(?:st|nd|rd|th)?\\s+)?${MONTH_RE}\\.?\\s+(?:\\d{1,2}(?:st|nd|rd|th)?,?\\s+)?((?:19|20)\\d\\d)\\b`, "gi"), (m) => eom(Number(m[2]), monthNo(m[1])));
  for (const m of rest.matchAll(/\b((?:19|20)\d\d)\b/g)) {
    const y = Number(m[1]);
    if (y >= curYear - 3) ends.push(eom(y, 12));
  }
  return ends;
}
function expiredForecast(text: string, now: Date): string | null {
  const curYear = now.getUTCFullYear();
  if (FORECAST_RE.test(text) && !NOT_FORECAST_RE.test(text)) {
    const ends = periodEnds(text, curYear);
    if (ends.length && Math.max(...ends.map((d) => d.getTime())) < now.getTime()) return "forecast whose period has passed";
  }
  const t = text.match(TARGET_RE);
  if (t && !ACHIEVED_RE.test(text) && new Date(Date.UTC(Number(t[2]), 11, 31, 23, 59, 59)).getTime() < now.getTime()) return "target date has passed";
  return null;
}

// Events that matter enough to need a primary-source confirmation when only secondary pages report them.
const MATERIAL_RE = /\b(acqui\w+|sale of|sell|sold|divest\w*|merger|merge[sd]?|settle\w*|appoint\w*|named (?:as )?(?:ceo|cfo|coo|president|chair)|steps? down|resign\w*|clos(?:e|es|ed|ure|ing) (?:of )?(?:its |the |a )?(?:plant|facility|factory|mill|site)|plant closure|restructur\w*|layoffs?|lawsuit|class action|recall\w*|investigation)\b/i;

async function corroborate(apiKey: string, state: State, text: string, maxTier: 1 | 2, claim: { my: string[]; years: number[] }, ms: number): Promise<boolean> {
  const prompt = `Today is ${todayStr()}.
${entityBlock(state.entity)}
Use Google Search. Find the company's own newsroom or press-release page, or an SEC filing${maxTier === 2 ? ", or a major news outlet (Reuters, Bloomberg, AP, WSJ, FT)" : ""}, that confirms this statement:
"${text.slice(0, 400)}"
Answer on one line, exactly: CONFIRMED | <date as the source states it> | <site name>
or, if you cannot find such a source: NOT CONFIRMED`;
  const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, grounded: true, temperature: 0, thinkingBudget: 0, attempts: 1, timeoutMs: ms });
  const line = r.text.split("\n").find((l) => /^\W*(NOT )?CONFIRMED/i.test(l.trim())) ?? "";
  if (!/^\W*CONFIRMED/i.test(line.trim())) return false;
  const root = rootDomainOf(state.entity.website);
  const good = (r.meta?.groundingChunks ?? []).some((c) => {
    const t = sourceTier(c.web?.uri ?? "", c.web?.title, root);
    return t >= 1 && t <= maxTier;
  });
  const years = (line.match(/\b(?:19|20)\d\d\b/g) ?? []).map(Number);
  return good && (!claim.years.length || years.some((y) => claim.years.includes(y)));
}

type DateLog = NonNullable<State["dateChecks"]>;
async function runPool<T>(items: T[], n: number, fn: (x: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

// ---------- Does the cited page say it? ----------
// A grounded sentence is linked to several pages, and the link is loose: a model summary of one page can be attached to a
// page that never mentions it. For each evidence row the distinctive terms (figures, names, rarer words) are looked up in the
// page text of each cited source; a row that none of its read sources supports is removed.
const SUPPORT_STOP = new Set([
  "according", "between", "company", "including", "several", "because", "through", "million", "billion", "percent", "during", "earnings",
  "however", "announced", "reported", "statement", "operations", "products", "services", "business", "segment", "across", "further", "include",
  "includes", "continued", "additional", "approximately", "expected", "following", "financial", "quarter", "annual", "delivered", "achieved",
]);
const stripAttribution = (t: string) => t.replace(/,?\s*(?:according to|as (?:reported|stated|noted|detailed|disclosed) (?:by|in|on)|per)\b[\s\S]*$/i, "");
function distinctiveTerms(text: string, skip: Set<string>): string[] {
  const nums: string[] = [], names: string[] = [], words: string[] = [];
  for (const m of text.matchAll(/\$?\d[\d,]*(?:\.\d+)?/g)) {
    const raw = m[0].replace(/[$,]/g, "");
    if (/^(?:19|20)\d\d$/.test(raw)) continue; // a year says nothing about the claim
    if (raw.replace(".", "").length >= 2) nums.push(raw);
  }
  for (const m of text.matchAll(/\b[A-Z][A-Za-z0-9&-]{3,}\b/g)) {
    const w = m[0].toLowerCase();
    if (!skip.has(w) && !SUPPORT_STOP.has(w)) names.push(w);
  }
  for (const m of text.toLowerCase().matchAll(/[a-z]{7,}/g)) if (!SUPPORT_STOP.has(m[0]) && !skip.has(m[0])) words.push(m[0]);
  return [...new Set([...nums, ...names, ...words])].slice(0, 6);
}
const SUPPORT_MIN = 0.3;

// The only date in a strategic-initiative statement is the date of the filing or article that reported it.
const REPORT_DATE_RE = /\b(?:as|per)\s+(?:reported|filed|disclosed|detailed|stated|noted|released|published)\s+(?:in|on|by)\b[^.]{0,80}?\b(?:19|20)\d\d\b|\b(?:filed|published|released)\s+(?:on|in)\b[^.]{0,60}?\b(?:19|20)\d\d\b/i;
const distinctDates = (t: string) => {
  const my = monthYears(t);
  return my.length || new Set(t.match(/\b(?:19|20)\d\d\b/g) ?? []).size;
};

// Request: check the evidence against the cited pages. Dates: drop what a page contradicts or does not show, keep what cannot
// be read, ask for primary-source confirmation of material events that only secondary pages report. Support: drop evidence
// that none of its read pages states. Bot-check pages and evidence about sold businesses are removed. Never fails the run.
async function v2VerifyEvidence(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  if (!state) return json({ error: "Missing or invalid research state. Start the report again." }, 400);
  const now = new Date();
  const cy = now.getUTCFullYear();
  const maxTier: 1 | 2 = isPublicCompany(state.entity) ? 1 : 2;
  const log: DateLog = state.dateChecks ?? { confirmed: 0, unverified: 0, corroborated: 0, dropped: [] };
  const drop = new Map<number, string>();
  const todo = state.evidence.filter((e) => !e.dateChecked);
  const srcById = new Map(state.sources.map((x) => [x.id, x]));
  const bestTier = (e: Evidence) => Math.min(...(e.srcTiers?.length ? e.srcTiers : [e.tier ?? 3]));

  // 1. Read the pages behind the evidence: dated statements first, then competitor rows, then other non-primary pages.
  const dated = todo.map((e) => ({ e, c: claimDates(e.text, cy) })).filter((x) => x.c.years.length > 0);
  const queue: Source[] = [];
  const queued = new Set<number>();
  const enqueue = (rows: Evidence[]) => {
    for (const e of rows) for (const sid of e.sourceIds) {
      const src = srcById.get(sid);
      if (src && !src.page && !queued.has(sid)) {
        queued.add(sid);
        queue.push(src);
      }
    }
  };
  enqueue(dated.map((x) => x.e));
  enqueue(todo.filter((e) => e.topic.startsWith("competitor:")));
  enqueue(todo.filter((e) => bestTier(e) > 1));
  const toRead = queue.slice(0, 150);
  const texts = new Map<number, { text: string; truncated: boolean }>();
  const deadline = Date.now() + Math.max(8_000, Math.min(55_000, clock.remaining() - 60_000));
  await runPool(toRead, 12, async (src) => {
    const pr = await readPage(src.url, Math.min(7_000, deadline - Date.now()));
    const { text, truncated, finalUrl, ...info } = pr;
    src.page = info;
    // Only a page with real content can say whether it states a claim (a script-only shell cannot).
    if (info.read && text) texts.set(src.id, { text, truncated: !!truncated });
    // A Google grounding link that could not be resolved earlier: keep the page's real address from here on.
    if (finalUrl && src.url.includes("grounding-api-redirect")) src.url = finalUrl;
  });
  log.pagesRead = (log.pagesRead ?? 0) + toRead.length;

  for (const { e, c } of dated) {
    const pages = e.sourceIds.map((id) => srcById.get(id)?.page).filter((p): p is PageInfo => !!p);
    const verdict = dateVerdict(c, pages);
    const best = bestTier(e);
    if (verdict === "confirmed") log.confirmed++;
    else if (verdict === "contradicted") drop.set(e.id, "date contradicts the cited page");
    else if (verdict === "not_shown") {
      // Review and complaint sites (BBB, Trustpilot...) are current listings that rarely print a date, so they are kept.
      if (best > 1 && !e.sourceIds.some((id) => srcById.get(id)?.kinds?.includes("review"))) drop.set(e.id, "the cited page does not show this date");
      else log.unverified++;
    } else {
      // The page could not be read (bot block, script-only page): that is not evidence against the date. Keep it as
      // unverified; material events still need a primary-source confirmation below.
      log.unverified++;
    }
  }

  // 1b. Pages that served a bot check cannot be audited; evidence resting only on them goes. Then the support check.
  const skip = new Set(`${state.entity.name}`.toLowerCase().split(/\W+/).filter(Boolean));
  for (const e of todo) {
    if (drop.has(e.id)) continue;
    const pages = e.sourceIds.map((id) => srcById.get(id)?.page);
    if (pages.length && pages.every((pg) => pg?.bot)) {
      drop.set(e.id, "the cited page is a bot-check page");
      continue;
    }
    const terms = distinctiveTerms(stripAttribution(e.text), skip);
    const support = e.sourceIds.map((sid, i) => {
      const tier = e.srcTiers?.[i] ?? e.tier ?? 3;
      const t = texts.get(sid);
      // Primary sources (long filings), unread, bot-check and truncated pages cannot be judged: -1 = unknown.
      if (tier <= 1 || !t || t.truncated || srcById.get(sid)?.page?.bot || terms.length < 3) return -1;
      return Math.round((terms.filter((w) => t.text.includes(w)).length / terms.length) * 100) / 100;
    });
    e.srcSupport = support;
    if (support.length && support.every((x) => x >= 0 && x < SUPPORT_MIN)) {
      drop.set(e.id, "the cited pages do not state this");
      log.supportDropped = (log.supportDropped ?? 0) + 1;
    }
  }

  // 2. Statements that are stale by their own words, undated or report-dated strategy items, evidence from old pages.
  for (const e of todo) {
    if (drop.has(e.id)) continue;
    const expired = expiredForecast(e.text, now);
    if (expired) drop.set(e.id, expired);
    else if (e.topic.startsWith("strategy_") && /date not stated|\bundated\b/i.test(e.text)) drop.set(e.id, "event has no stated date");
    else if (e.topic.startsWith("strategy_") && REPORT_DATE_RE.test(e.text) && distinctDates(e.text) <= 1 && !FORECAST_RE.test(e.text)) {
      drop.set(e.id, "dated by the report that mentioned it, not by when it happened");
    } else {
      const pubs = e.sourceIds.map((id) => srcById.get(id)?.page?.pub).filter((x): x is string => !!x);
      const isOld = pubs.length > 0 && pubs.length === e.sourceIds.length && pubs.every((pb) => monthsOf(pb) < cy * 12 + now.getUTCMonth() + 1 - 18);
      if (isOld && !claimDates(e.text, cy).years.length) e.flags = [...new Set([...(e.flags ?? []), "stale"])];
    }
  }

  // 2b. Evidence about a business the company has sold (its plants, brands, products) is not about the company today,
  // unless it describes the sale itself.
  const footprint = [...new Set([...(state.entity.footprint ?? []), ...(state.entity.divested ?? []).flatMap((d) => d.terms ?? [])])];
  if (footprint.length) {
    const re = new RegExp(`\\b(?:${footprint.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/s$/, "")).join("|")})s?\\b`, "i");
    const SALE_RE = /\b(sold|sale|sell|selling|divest\w*|spin[- ]?off|spun off|agreed to sell|completed the sale|buyer|acquired by|transferred to|exited?)\b/i;
    for (const e of todo) {
      if (drop.has(e.id) || e.topic === "segments" || e.topic.startsWith("competitor:")) continue;
      if (re.test(e.text) && !SALE_RE.test(e.text)) drop.set(e.id, "refers to a business the company has sold");
    }
  }

  // 3. Material events about the company that only secondary pages report need a primary-source confirmation.
  const warnings: string[] = [];
  const needs = dated.filter(({ e }) =>
    !drop.has(e.id) && !e.topic.startsWith("competitor:") && MATERIAL_RE.test(e.text) && bestTier(e) > maxTier
  ).slice(0, 12);
  log.materialChecked = (log.materialChecked ?? 0) + needs.length;
  if (needs.length && clock.remaining() > 25_000) {
    await runPool(needs, 4, async ({ e, c }) => {
      try {
        const ok = await corroborate(apiKey, state, e.text, maxTier, c, Math.min(30_000, clock.remaining() - 10_000));
        if (ok) log.corroborated++;
        else drop.set(e.id, "no primary-source confirmation of this event");
      } catch (err) {
        warnings.push(`Could not corroborate evidence E${e.id} (${(err as Error)?.message ?? err}).`);
      }
    });
  } else if (needs.length) {
    warnings.push(`${needs.length} material event(s) were not corroborated (time budget).`);
  }

  const kept = state.evidence.filter((e) => !drop.has(e.id)).map((e) => ({ ...e, dateChecked: true }));
  // A business listed as sold must still be backed by surviving evidence; otherwise every later prompt would repeat it.
  let entity = state.entity;
  if (entity.divested?.length) {
    const live = kept.filter((e) => !e.flags?.includes("stale") && !e.flags?.includes("legal_marketing"));
    const supported = (name: string) => {
      const words = segmentWords(name);
      return live.some((e) => e.topic !== "segments" && words.length > 0 && words.every((w) => segmentKey(e.text).includes(w)));
    };
    const keep = entity.divested.filter((d) => supported(d.name));
    for (const d of entity.divested) {
      if (!keep.includes(d)) log.dropped.push({ id: 0, reason: "business listed as sold has no verified supporting evidence", text: `${d.name}${d.date ? ` (${d.date})` : ""}` });
    }
    entity = { ...entity, divested: keep };
  }
  log.byTopic = { ...(log.byTopic ?? {}) };
  for (const e of state.evidence) {
    if (!drop.has(e.id)) continue;
    const key = `${e.topic.startsWith("market:") ? "market" : e.topic} :: ${drop.get(e.id)}`;
    log.byTopic[key] = (log.byTopic[key] ?? 0) + 1;
    if (log.dropped.length < 120) log.dropped.push({ id: e.id, reason: drop.get(e.id)!, text: e.text.slice(0, 240) });
  }
  return json({
    state: { ...state, entity, evidence: kept, sources: state.sources, dateChecks: log, warnings: [...state.warnings, ...warnings] },
    summary: { checked: todo.length, dated: dated.length, dropped: drop.size, pagesRead: toRead.length },
  });
}

// ---------- Legacy (previous UI) shape, with [n] citations into `sources` ----------
type Placeholders = { facts: string; core: string; recs: string };
// Is the customer evidence two-sided? Praise and complaints are researched separately, so an empty side means the
// sources found none (or only sellers' marketing, which is excluded), and the report must say so.
type EvidenceBalance = "balanced" | "praise_only" | "complaints_only" | "none" | "unknown";
function customerBalance(evidence: Evidence[], f: Facts): EvidenceBalance {
  const praiseEv = evidence.some((e) => e.topic === "customer_praise");
  const complaintEv = evidence.some((e) => e.topic === "customer_complaints");
  if (!praiseEv && !complaintEv) return evidence.some((e) => e.topic === "customer") ? "unknown" : "none";
  const ci = f.customerInsights;
  const praise = praiseEv && ci.winReasons.length > 0;
  const complaints = complaintEv && ci.lossReasons.length > 0;
  return praise && complaints ? "balanced" : praise ? "praise_only" : complaints ? "complaints_only" : "none";
}

function toLegacy(f: Facts, a: Analysis, mc: Opportunity[], ctx: Ctx, ph: Placeholders) {
  // At most 3 citations per statement: best source tier first, then sources shared by several cited facts, then earliest.
  const cite = (evIds: number[]) => {
    const score = new Map<number, { tier: number; n: number; sup: number }>();
    for (const id of evIds) {
      const e = ctx.byId.get(id);
      if (!e) continue;
      e.sourceIds.forEach((sid, i) => {
        const t = e.srcTiers?.[i] ?? e.tier ?? 3;
        const sup = e.srcSupport?.[i] ?? -1;
        const cur = score.get(sid);
        if (cur) {
          cur.tier = Math.min(cur.tier, t);
          cur.n++;
          cur.sup = Math.max(cur.sup, sup);
        } else {
          score.set(sid, { tier: t, n: 1, sup });
        }
      });
    }
    // A page that was read and does not state the claim is not shown while a page that does (or could not be read) is available.
    const all = [...score.entries()];
    const backed = all.filter(([, v]) => v.sup < 0 || v.sup >= SUPPORT_MIN);
    const top = (backed.length ? backed : all)
      .sort((a, b) => a[1].tier - b[1].tier || b[1].n - a[1].n || a[0] - b[0])
      .slice(0, 3)
      .map(([sid]) => sid)
      .sort((x, y) => x - y);
    return top.length ? " " + top.map((n) => `[${n}]`).join("") : "";
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
    ...(e.varies ? { varies: true } : {}),
  });
  const balance = customerBalance(ctx.evidence, f);
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
      positioningRationale: fi(a.executiveSummary.competitivePositioning.rationale, ""),
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
        tamRows: f.marketOverview.tam.map(marketRow),
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
      name: d.parent ? `${d.name} (${d.parent})` : d.name,
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
      evidenceBalance: balance,
      sentiment: (() => {
        const head = balance === "praise_only"
          ? "Only praise was found in published sources; no independent complaint evidence was found, so overall sentiment cannot be judged."
          : balance === "complaints_only"
          ? "Only complaints were found in published sources; no independent praise was found, so overall sentiment cannot be judged."
          : f.customerInsights.sentiment.status === "sourced" ? fc(f.customerInsights.sentiment) : "";
        const themes = f.customerInsights.sentimentThemes.length ? bullets(f.customerInsights.sentimentThemes.map(fc)) : "";
        return [head, themes].filter(Boolean).join("\n\n") || ph.facts;
      })(),
      // JSON string; the page's WinLossColumns renders it as two columns.
      winLossReasons: f.customerInsights.winReasons.length || f.customerInsights.lossReasons.length
        ? JSON.stringify({ wins: f.customerInsights.winReasons.map(fc), losses: f.customerInsights.lossReasons.map(fc), balance })
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
  /** Supports dropped because every source was an excluded type (social media, stock forums, ...). */
  droppedByTier?: number;
  /** What the verify_evidence step did: dates confirmed against pages, evidence dropped and why. */
  dateChecks?: {
    confirmed: number; unverified: number; corroborated: number; dropped: { id: number; reason: string; text: string }[]; byTopic?: Record<string, number>;
    /** Material events looked at for primary-source confirmation, and evidence removed because no read page states it. */
    materialChecked?: number; supportDropped?: number; pagesRead?: number;
  };
  // set by the competitors step: the competitors that get their own research, and the full validated list (max 10)
  competitors?: Competitor[];
  validatedCompetitors?: Competitor[];
  // set by the facts step
  facts?: Facts;
  factsOk?: boolean;
  dropped?: Ctx["dropped"];
  verifier?: string;
  sourcedClaims?: number;
};
type Competitor = { name: string; kind: "direct" | "indirect"; segment?: string; evidenceIds?: number[]; /** parent company when this is a brand of another listed competitor */ parent?: string; /** brands grouped under this competitor */ brands?: string[] };
type StepResult = { ok: true; state: State } | { ok: false; status: number; body: Any };

const todayStr = () => new Date().toISOString().slice(0, 10);
// Public companies publish audited results, so their financial claims must rest on those (T1: SEC filings, the company's
// investor pages and releases, wire services). Private companies have no filings, so major press (T2) is allowed too.
const isPublicCompany = (e?: Entity) => !!e && /\bpublic\b|\b(nyse|nasdaq|lse|tsx|euronext|xetra|asx|hkex|tse)\b/i.test(e.ownership) && !/\bprivate\b/i.test(e.ownership);
const makeCtx = (evidence: Evidence[], dropped: Ctx["dropped"] = [], entity?: Entity): Ctx => ({
  byId: new Map(evidence.map((e) => [e.id, e])),
  evidence,
  dropped,
  sourced: [],
  items: [],
  entity,
  finMaxTier: isPublicCompany(entity) ? 1 : 2,
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
  const ledger = buildLedger(results, urlMap, undefined, entity.website, entity.name);
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
// Candidates come from the evidence and from a per-segment search of the rivals named in annual reports and trade press.
// A classification pass then keeps only real competitors: peer-list sites pair companies by name or industry code, and
// customers, sales channels and suppliers show up in competitor lists too.
const COMPETITOR_UNUSABLE_FLAGS = ["peer_list", "lookalike", "legal_marketing"];
const usableForCompetitors = (e: Evidence) => !(e.flags ?? []).some((f) => COMPETITOR_UNUSABLE_FLAGS.includes(f));
const MAX_COMPETITORS = 10;
const MAX_DEEP_DIVES = 5;

// "ROCKWOOL International A/S", "Rockwool A/S" and "ROCKWOOL Group" are one company; so are "Johns Manville Corporation" and
// "Johns Manville", and "Compagnie de Saint-Gobain S.A." and "Saint-Gobain".
const NAME_SUFFIX = new Set([
  "corporation", "corp", "incorporated", "inc", "company", "co", "group", "holdings", "holding", "international", "intl", "industries", "plc",
  "ltd", "limited", "llc", "lp", "gmbh", "ag", "sa", "nv", "ab", "as", "oyj", "spa", "bv", "pty", "the",
]);
function competitorKey(name: string): string {
  const words = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " ").replace(/a\/s/g, " ")
    .replace(/[.,'’]/g, "").replace(/[-–&]/g, " ").replace(/^compagnie de /, "").split(/\s+/).filter(Boolean);
  while (words.length > 1 && NAME_SUFFIX.has(words[words.length - 1])) words.pop();
  while (words.length > 1 && words[0] === "the") words.shift();
  return words.join(" ");
}
function competitorDisplay(name: string): string {
  const words = name.replace(/\([^)]*\)/g, " ").replace(/^compagnie de /i, "").trim().split(/\s+/).filter(Boolean);
  const plain = (w: string) => w.toLowerCase().replace(/[.,'’/]/g, "");
  while (words.length > 1 && NAME_SUFFIX.has(plain(words[words.length - 1]))) words.pop();
  return words.join(" ").replace(/[,\s]+$/, "");
}
const capFirst = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

async function identifyCompetitors(apiKey: string, state: State, today: string, clock: ReturnType<typeof makeClock>) {
  const company = state.entity.name;
  const companyKey = competitorKey(company);
  const warnings: string[] = [];
  const segs = state.entity.segments ?? [];
  const canonicalSegment = (seg?: string) => {
    const sg = seg ? segs.find((x) => sameSegment(seg, [x.name])) : undefined;
    return sg ? capFirst(sg.name) : "";
  };
  const clean = (names: unknown, evText: string) => {
    const seen = new Set<string>([companyKey]);
    return list(names).flatMap((n) => {
      const name = typeof n === "string" ? n.replace(/\*+/g, "").trim() : "";
      const key = competitorKey(name);
      if (name.length < 2 || name.length > 80 || seen.has(key) || !(evText.includes(name.toLowerCase()) || evText.includes(competitorDisplay(name).toLowerCase()))) return [];
      seen.add(key);
      return [name];
    });
  };
  const ev = state.evidence.filter((e) => (e.topic === "competitors" || e.topic === "profile") && usableForCompetitors(e));
  let evText = ev.map((e) => e.text.toLowerCase()).join("\n");
  const candidates: { name: string; key: string; kind: "direct" | "indirect"; segment?: string }[] = [];
  const extra: { topic: string; r: GeminiResult }[] = [];
  // Businesses the company already owns (an acquired brand such as Masonite for Owens Corning) are part of it, not competitors.
  // They come from the segments step, from acquisitions the company's own evidence describes, and from its description.
  const owned = ownedBusinesses(state);
  const ownText = [state.entity.description, ...segs.map((x) => `${x.name} ${x.description}`)].join(" ").toLowerCase();
  const addCandidate = (name: string, kind: "direct" | "indirect", segment?: string) => {
    const display = competitorDisplay(name);
    const key = competitorKey(name);
    if (display.length < 2 || display.length > 80 || key === companyKey) return;
    if (key.length >= 5 && new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(ownText)) return;
    if ([...owned.keys()].some((o) => o.length >= 4 && (key === o || key.startsWith(o + " ") || o.startsWith(key + " ")))) return;
    // Same company under another name, or a subsidiary of one already listed ("Saint-Gobain ISOVER"): keep one, the parent's name.
    const dup = candidates.find((c) => c.key === key || c.key.startsWith(key + " ") || key.startsWith(c.key + " "));
    if (dup) {
      if (key.length < dup.key.length) {
        dup.name = display;
        dup.key = key;
      }
      return;
    }
    if (candidates.length < 18) candidates.push({ name: display, key, kind, segment });
  };

  // Names the evidence itself puts forward. Runs at the same time as the per-segment search below, so the step keeps enough
  // time for classification and a retry.
  const fromEvidence = async (): Promise<{ direct: string[]; indirect: string[] }> => {
    if (!ev.length) return { direct: [], indirect: [] };
    const prompt = `${entityBlock(state.entity)}

From the evidence below, list the companies it names as DIRECT competitors of ${company} (same market, same customers), most prominent first (at most 8), and up to 4 INDIRECT competitors or alternatives. Use ONLY company names that appear in the evidence, exactly as written there. Do not list ${company} itself or businesses it owns.

EVIDENCE:
${evidenceBlock(ev)}`;
    const schema = obj({ direct: arr(STR), indirect: arr(STR) });
    try {
      const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, temperature: 0, thinkingBudget: 0, attempts: 1, timeoutMs: clock.timeout(25_000, 100_000) });
      const j = safeJson(r.text);
      return { direct: clean(j?.direct, evText).slice(0, 8), indirect: clean(j?.indirect, evText).slice(0, 4) };
    } catch (e) {
      console.error("Competitor identification (evidence) failed:", e);
      return { direct: [], indirect: [] };
    }
  };

  // Rivals named in annual reports and trade press, one search per current segment. This is how a segment's main rival (the
  // one analysts always name) reaches the list even when comparison sites do not mention it.
  type Pick = { name: string; kind: "direct" | "indirect"; segment?: string };
  const recall = async (targets: { name: string; description?: string }[], count: number, ms: number): Promise<Pick[]> => {
    const found: Pick[] = [];
    const calls = targets.length
      ? targets.map((t) => `Today is ${today}.
${entityBlock(state.entity)}
Use Google Search. Name the ${count} main DIRECT competitors of ${company}'s ${t.name} business${t.description ? ` (${t.description})` : ""}: companies that sell a substitutable product or service to the same customers. Use the competition section of ${company}'s latest annual report or Form 10-K and industry or trade press.
Do not list customers, distributors, installers, suppliers, companies in unrelated industries, or companies that compete only in a business ${company} has sold. Company names only. Answer one per line in exactly this format:
DIRECT: <company name> | ${t.name}`)
      : [`Today is ${today}.
${entityBlock(state.entity)}
Use Google Search. Name the 5 companies most frequently cited by analysts, trade press or the company's annual report as DIRECT competitors of ${company}, then up to 3 INDIRECT competitors or alternatives. Do not list customers, distributors, installers or suppliers. Company names only. Answer one per line in exactly this format:
DIRECT: <company name> | <segment it competes in>
INDIRECT: <company name> | <segment it competes in>`];
    const results = await Promise.allSettled(calls.map((prompt) =>
      callGemini(apiKey, { model: FLASH_MODEL, prompt, grounded: true, temperature: 0, timeoutMs: ms, attempts: 1 })));
    for (const res of results) {
      if (res.status !== "fulfilled") {
        console.error("Competitor identification (search) failed:", res.reason);
        continue;
      }
      const r = res.value;
      const pick = (tag: string) =>
        r.text.split("\n").flatMap((l) => {
          const m = l.match(new RegExp(`^[\\s*_-]*${tag}[\\s*_]*:\\s*(.+)$`, "i"));
          if (!m) return [];
          const [name, seg] = m[1].replace(/\*+/g, "").split("|");
          return [{ name: name.trim(), segment: (seg ?? "").trim().slice(0, 80) || undefined }];
        });
      found.push(...pick("DIRECT").slice(0, 8).map((x) => ({ ...x, kind: "direct" as const })), ...pick("INDIRECT").slice(0, 6).map((x) => ({ ...x, kind: "indirect" as const })));
      evText += "\n" + r.text.toLowerCase();
      extra.push({ topic: "competitors", r });
    }
    return found;
  };
  const [fromEv, recalled] = await Promise.all([
    fromEvidence(),
    segs.length || ev.length === 0 ? recall(segs.slice(0, 4), 3, clock.timeout(35_000, 85_000)) : Promise.resolve([] as Pick[]),
  ]);
  fromEv.direct.forEach((n) => addCandidate(n, "direct"));
  fromEv.indirect.forEach((n) => addCandidate(n, "indirect"));
  recalled.forEach((x) => addCandidate(x.name, x.kind, x.segment));
  if (!segs.length && candidates.filter((c) => c.kind === "direct").length < 3 && ev.length > 0) {
    (await recall([], 5, clock.timeout(30_000, 60_000))).forEach((x) => addCandidate(x.name, x.kind, x.segment));
  }

  // Classification: keep only genuine competitors of the company's CURRENT businesses.
  type Class = "competitor" | "customer_channel" | "supplier" | "unrelated";
  const verdicts = new Map<string, { cls: Class; segment: string; reason: string; parent: string }>();
  const classify = async (cands: typeof candidates, ms: number) => {
    if (!cands.length) return;
    const snippets = (name: string) =>
      ev.filter((e) => e.text.toLowerCase().includes(name.toLowerCase())).slice(0, 2).map((e) => `  - ${e.text.slice(0, 220)}`).join("\n");
    const prompt = `${entityBlock(state.entity)}

Classify each candidate against ${company}'s CURRENT businesses${segs.length ? ` (${segs.map((x) => x.name).join("; ")})` : ""}.
- competitor: sells a substitutable product or service to the same kind of customers as at least one current business of ${company}.
- customer_channel: buys, distributes, resells, installs or contracts with ${company} (distributors, retailers, installers, contractors, builders).
- supplier: supplies ${company} with materials, equipment or services.
- unrelated: a business ${company} already owns (for example an acquired brand), shares only a similar name, serves a different market (for example cement or aggregates for a building-products company, or glass for a company that has sold its glass business), or competes only in a business ${company} has sold.
${owned.size ? `BUSINESSES ${company} OWNS (never competitors): ${[...owned.values()].join(", ")}.\n` : ""}Use what the evidence says and well-known facts about what each company does. For competitors, give the ONE current segment they compete in, exactly as named above. Give "parent": the parent company's name when the candidate is a subsidiary or brand of another company (for example CertainTeed is a Saint-Gobain company), otherwise an empty string.

CANDIDATES:
${cands.map((c, i) => `${i + 1}. ${c.name}${c.segment ? ` (named for: ${c.segment})` : ""}\n${snippets(c.name)}`).join("\n")}`;
    const schema = arr(obj({
      name: STR,
      classification: { type: "STRING", format: "enum", enum: ["competitor", "customer_channel", "supplier", "unrelated"] },
      segment: STR,
      reason: STR,
      parent: STR,
    }));
    try {
      const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, temperature: 0, thinkingBudget: 0, attempts: 1, timeoutMs: ms });
      for (const v of list(safeJson(r.text))) {
        if (typeof v?.name === "string") {
          verdicts.set(competitorKey(v.name), { cls: v.classification, segment: String(v.segment ?? "").slice(0, 80), reason: String(v.reason ?? "").slice(0, 200), parent: String(v.parent ?? "").slice(0, 80) });
        }
      }
    } catch (e) {
      console.error("Competitor classification failed:", e);
    }
  };
  await classify(candidates, clock.timeout(30_000, 60_000));
  // Anything the first call did not cover (or all of it, if the call failed) is classified again in smaller batches.
  const unclassified = () => candidates.filter((c) => !verdicts.has(c.key));
  for (let round = 0; round < 2 && unclassified().length && clock.remaining() > 40_000; round++) {
    const todo = unclassified();
    for (let i = 0; i < todo.length && clock.remaining() > 30_000; i += 8) await classify(todo.slice(i, i + 8), clock.timeout(25_000, 20_000));
  }
  if (candidates.length && !verdicts.size) warnings.push("Competitor classification did not complete; only candidates named by at least two sources are kept.");
  else if (unclassified().length) warnings.push(`${unclassified().length} competitor candidate(s) could not be classified and were left out.`);

  const decide = (c: (typeof candidates)[number]) => {
    const v = verdicts.get(c.key);
    if (!v) {
      // The classifier answered for others but not for this one: do not guess. Only when it did not run at all are direct candidates kept.
      if (verdicts.size) return { isCompetitor: false, segment: undefined, cls: "unclassified", reason: "the classification did not cover this candidate" };
      // No classification at all: only a candidate that two evidence rows name is kept.
      const named = ev.filter((e) => e.text.toLowerCase().includes(c.name.toLowerCase())).length;
      return { isCompetitor: c.kind === "direct" && named >= 2, segment: c.segment ? canonicalSegment(c.segment) || c.segment : undefined, cls: "unclassified", reason: named >= 2 ? "" : "named by fewer than two sources" };
    }
    const segment = canonicalSegment(v.segment) || canonicalSegment(c.segment);
    // With known segments, a competitor must compete in one of them (a glass maker is not a competitor of a company that sold its glass business).
    if (v.cls === "competitor" && segs.length && !segment) return { isCompetitor: false, segment: undefined, cls: "other_segment", reason: v.reason || "does not compete in a current segment" };
    return { isCompetitor: v.cls === "competitor", segment: segment || undefined, cls: v.cls, reason: v.reason };
  };

  // A current segment with no competitor gets one more, differently phrased search; its new candidates are classified too.
  const covered = () => new Set(candidates.map(decide).filter((d) => d.isCompetitor && d.segment).map((d) => d.segment));
  const missing = segs.slice(0, 4).filter((x) => !covered().has(capFirst(x.name)));
  if (missing.length && clock.remaining() > 55_000) {
    const before = candidates.length;
    (await recall(missing.map((x) => ({ name: x.name, description: x.description })), 5, clock.timeout(30_000, 45_000))).forEach((x) => addCandidate(x.name, x.kind, x.segment));
    await classify(candidates.slice(before), clock.timeout(25_000, 20_000));
  }

  const filter: { name: string; classification: string; kept: boolean; reason: string }[] = [];
  type Kept = { name: string; kind: "direct" | "indirect"; segment?: string; key: string; parentKey?: string; brands?: string[]; parentName?: string; grouped?: boolean };
  const kept: Kept[] = [];
  for (const c of candidates) {
    const d = decide(c);
    filter.push({ name: c.name, classification: d.cls, kept: d.isCompetitor, reason: d.reason });
    if (d.isCompetitor) {
      const pv = verdicts.get(c.key)?.parent;
      kept.push({ name: c.name, kind: c.kind, segment: d.segment, key: c.key, ...(pv ? { parentKey: competitorKey(pv) } : {}) });
    }
  }
  // A brand of another listed competitor is grouped under its parent: one competitor, brands in brackets.
  for (const k of kept) {
    const parent = k.parentKey ? kept.find((x) => x !== k && !x.grouped && x.key === k.parentKey) : undefined;
    if (parent) {
      parent.brands = [...(parent.brands ?? []), k.name];
      k.parentName = parent.name;
      k.grouped = true;
    }
  }
  const groups = kept.filter((k) => !k.grouped);
  // Direct first, then indirect, in the order they were named.
  const ordered = [...groups.filter((c) => c.kind === "direct"), ...groups.filter((c) => c.kind === "indirect")].slice(0, MAX_COMPETITORS);
  const evidenceFor = (names: string[]) =>
    ev.filter((e) => names.some((n) => e.text.toLowerCase().includes(n.toLowerCase()))).slice(0, 3).map((e) => e.id);
  const validated: Competitor[] = ordered.map((c) => ({
    name: c.name,
    kind: c.kind,
    ...(c.segment ? { segment: c.segment } : {}),
    ...(c.brands?.length ? { brands: c.brands } : {}),
    evidenceIds: evidenceFor([c.name, ...(c.brands ?? [])]),
  }));
  for (const sg of segs.slice(0, 4)) {
    if (!kept.some((c) => c.segment === capFirst(sg.name))) warnings.push(`No competitor could be confirmed for the ${sg.name} segment.`);
  }

  // Deep dives: at most 5, one direct competitor per segment first (the brand that competes in that segment), at most two per parent.
  const bySeg = new Map<string, Kept[]>();
  for (const c of kept.filter((x) => x.kind === "direct")) {
    const k = (c.segment ?? "").toLowerCase();
    bySeg.set(k, [...(bySeg.get(k) ?? []), c]);
  }
  const deep: Kept[] = [];
  const perGroup = new Map<string, number>();
  const take = (c: Kept) => {
    const g = c.parentName ?? c.name;
    if (deep.length >= MAX_DEEP_DIVES || (perGroup.get(g) ?? 0) >= 2 || deep.includes(c)) return;
    perGroup.set(g, (perGroup.get(g) ?? 0) + 1);
    deep.push(c);
  };
  for (let round = 0; deep.length < MAX_DEEP_DIVES && round < 5; round++) for (const group of bySeg.values()) if (group[round]) take(group[round]);
  for (const c of kept.filter((x) => x.kind === "indirect")) take(c);
  const competitors: Competitor[] = deep.map(({ name, kind, segment, parentName }) => ({ name, kind, ...(segment ? { segment } : {}), ...(parentName ? { parent: parentName } : {}) }));
  return { competitors, validated, extra, filter, warnings };
}

// Businesses the company owns, from the segments step and from acquisitions its own evidence describes ("Owens Corning completed
// its acquisition of Masonite"). Keys are competitorKey()s, values display names.
function ownedBusinesses(state: State): Map<string, string> {
  const out = new Map<string, string>();
  for (const o of state.entity.owned ?? []) out.set(competitorKey(o.name), competitorDisplay(o.name));
  const word = state.entity.name.split(/\s+/)[0].toLowerCase();
  const re = /\b(?:acquired|acquisition of|purchase of)\s+(?:the\s+)?([A-Z][A-Za-z0-9&.'-]*(?:\s+(?:[A-Z][A-Za-z0-9&.'-]*|of|de|and|&)){0,4})/g;
  for (const e of state.evidence) {
    if (e.topic === "competitors" || e.topic.startsWith("competitor:")) continue;
    const lower = e.text.toLowerCase();
    if (!word || !lower.includes(word)) continue;
    for (const m of e.text.matchAll(re)) {
      // The company must be named before the verb, so a competitor's acquisition is not read as the company's own.
      if (!lower.slice(0, m.index ?? 0).includes(word)) continue;
      const display = competitorDisplay(m[1].replace(/\s+(?:of|de|and|&)$/i, ""));
      const key = competitorKey(display);
      if (key && key.length >= 4 && !key.startsWith(word)) out.set(key, display);
    }
  }
  return out;
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
- Write short, self-contained sentences with ONE fact each. Name ${name} in each sentence, and for any figure give its date or period and who reported it. If a source does not state the year of an event, write "date not stated"; never assume the current year.
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
  const { competitors, validated, extra, warnings: idWarnings } = await identifyCompetitors(apiKey, state, today, clock);
  warnings.push(...idWarnings);
  timings.competitorsIdentify = Date.now() - t0;
  if (!competitors.length) {
    warnings.push("No competitors could be identified, so competitor deep dives rely on general research only.");
    return { ok: true, state: { ...state, warnings, timings, competitors: [], validatedCompetitors: validated } };
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
  const ledger = buildLedger(results, urlMap, { sources: state.sources, evidence: state.evidence }, state.entity.website, state.entity.name);
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
      validatedCompetitors: validated,
    },
  };
}

// Step 3: extract the facts from the ledger, validate them, and have the verifier check each one.
async function stepFacts(apiKey: string, state: State, clock: ReturnType<typeof makeClock>): Promise<StepResult> {
  const warnings = [...state.warnings];
  const timings = { ...state.timings };
  const ctx = makeCtx(state.evidence, [], state.entity);
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
  const ctx = makeCtx(state.evidence, [...(state.dropped ?? [])], state.entity);
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
type Section = "performance" | "strategy" | "market_size" | "market_dynamics" | "competitors" | "customer";
const SECTIONS: Section[] = ["performance", "strategy", "market_size", "market_dynamics", "competitors", "customer"];
type Slice = { topic: string; status: "ok" | "thin" | "failed"; ms: number; error?: string; meta: GroundingMeta | null };

const SECTION_TOPICS: Record<Section, (t: string) => boolean> = {
  performance: (t) => t === "profile" || t === "performance" || t === "segments",
  strategy: (t) => t === "profile" || t === "segments" || t.startsWith("strategy_"),
  // Market sections use market evidence only, so company descriptions cannot leak in as "market" facts.
  market_size: (t) => t === "market" || t.startsWith("market:"),
  market_dynamics: (t) => t === "market" || t.startsWith("market:"),
  competitors: (t) => t === "competitors" || t.startsWith("competitor:"),
  customer: (t) => t.startsWith("customer"),
};
const FP = FACTS_SCHEMA.properties;
const SECTION_SCHEMAS: Record<Section, Any> = {
  performance: obj({ businessPerformance: obj({ financialHighlights: FP.businessPerformance.properties.financialHighlights, recentMetrics: FP.businessPerformance.properties.recentMetrics }) }),
  strategy: obj({ businessPerformance: obj({ strategicInitiatives: FP.businessPerformance.properties.strategicInitiatives }) }),
  market_size: obj({ marketOverview: obj({ definitions: arr(ITEM), tam: FP.marketOverview.properties.tam }) }),
  market_dynamics: obj({ marketOverview: obj({ segmentation: arr(ITEM), drivers: arr(ITEM), inhibitors: arr(ITEM) }) }),
  competitors: obj({ competitiveLandscape: FP.competitiveLandscape, competitorDeepDives: FP.competitorDeepDives }),
  customer: obj({ customerInsights: FP.customerInsights }),
};

const FACT_BASE_RULES = `Rules:
1. A claim with status "sourced" must list in evidenceIds the E numbers (as integers, e.g. 12) that directly state it. Do not cite evidence that is merely related.
2. Restate the evidence faithfully. Copy every number, date, currency amount and percentage exactly as written in the cited evidence, with the period it refers to. Never compute, convert, round, add up, or estimate.
3. If no evidence supports a field, return status "not_found", text null, evidenceIds []. In lists, include only supported items; an empty list is a correct answer.
4. No hedging. A statement that needs "likely", "probably", "may", "could" or "expected to" is not a fact; leave it out.
5. Attribute self-reported figures in the text ("the company says...", "according to a company press release...").
5a. Evidence lines carry a source tier: T1 primary (filings, regulators, company releases), T2 major press and analysts, T3 everything else. Prefer T1 and T2. Financial results (revenue, income, margins, cash returned, market capitalization, headcount, funding) must come from T1 evidence for a public company (T1 or T2 for a private one). A fact whose only support is a company's own marketing is written as that company's claim ("GAF says..."). Never present investment commentary (valuation opinions, "undervalued", price targets) as a fact or a strength. Never combine figures reported on different bases (for example original versus restated, or total versus continuing operations) into one statement or range: use the most recent restated figure and say which basis it is.
5b. Dates. State an event's date only as the evidence states it; never infer a year. Skip any event whose evidence says the date is not stated. Evidence tagged OLD comes from a page published more than 18 months ago and cannot support a statement about the company's current position. Evidence from a law firm or plaintiff-firm page (a law firm's investigation notice or class-action solicitation) is a claim by that firm: write "a law firm announced an investigation into...", never "an investigation was opened" or "a lawsuit was filed".
5c. Never write evidence ids (such as E12) in any text field; they belong only in evidenceIds and basedOn. One initiative is ONE event with ONE date: never combine two announcements made on different dates into one item. Skip colour or SKU launches, awards, rankings, and publications of reports; name people in full ("Brian Chambers named CFO") in headings.`;

const FACT_SECTION_RULES: Record<Section, (competitors?: string[], landscape?: boolean) => string> = {
  performance: () =>
    `6. businessPerformance.financialHighlights: the company's key financial results, ONE fact per claim: revenue with its fiscal period and growth, net income or margins, market capitalization or valuation, funding. recentMetrics: other short metrics (headcount, customers, subscribers, units shipped), one per claim.
7. Say which basis a figure is on (reported or adjusted, full year or quarter) whenever the evidence says. If the evidence says growth, headcount or margin changed because of an acquisition, divestiture or one-off charge (such as an impairment), state that in the same claim or an adjacent claim. Never put a reported figure and an adjusted figure in the same claim. Do not state a ratio that the evidence only shows as computed by a third party. Figures "from continuing operations" exclude any sold business in both periods, so never attribute a change in them to a divestiture.`,
  strategy: () =>
    `6. strategicInitiatives: only SIGNIFICANT initiatives the evidence shows the company announced or started in the last ${INITIATIVE_WINDOW_MONTHS} months. For each, set subgroup to exactly one of these sub-categories and group to the group it belongs to, give a short name, and a one-sentence description that includes the month and year from the evidence. At most 3 per sub-category, most recent first. A sub-category with nothing significant gets no entries.

SUB-CATEGORIES
${groupsPrompt([0, 1, 2, 3, 4, 5])}`,
  market_size: () =>
    `6. marketOverview.definitions: ONE item per current segment of the company (at most 4): one sentence on how analysts define THAT market, from the evidence tagged [market:<segment>] (or [market] when it names the segment), with basedOn listing the E numbers it rests on. Leave out a segment whose evidence gives no definition; an empty list is correct then.
7. tam is a list of published market-size estimates, ONE entry per market segment or product line (a large company can serve several). Report only the most recent ACTUAL estimate for a segment, never a forecast or projection for a future year; if the evidence has several years or publishers for a segment, give only the most recent year and prefer a global figure. Fields: segment (short name of the market), geography, year, value (copied as written in the evidence, e.g. "$48.2B"), publisher (the research firm or source named in the evidence), evidenceIds. Never derive, convert, add up or estimate a figure. Empty list if there is none.
8. Market-size estimates from different research firms for the same market often disagree widely. When the evidence has estimates from more than one publisher for a segment, report each publisher's most recent estimate as its own entry (at most 3 per segment) so the reader can see the spread. Only report markets for the company's CURRENT SEGMENTS; never a market for a business listed as sold or discontinued.`,
  market_dynamics: () =>
    `6. drivers: factors that increase demand across the MARKET or industry (technology shifts, customer behaviour, regulation, economics) as stated by analysts or industry publications. inhibitors: factors that restrain growth of the market (saturation, regulation, supply constraints, competition, macro conditions). segmentation: how the market is divided (by product, customer type or geography).
7. These describe the market, never the company's own strengths, products, partnerships or customers. Each list has at most 5 items; one idea per item, at most 25 words. They are summaries of the evidence, so hedged wording is fine, but cite in basedOn the E numbers each item rests on and add no figures that are not in the cited evidence. Empty list if the evidence has none.`,
  competitors: (competitors, landscape) =>
    `6. competitiveLandscape: ${
      landscape
        ? "directCompetitors and indirectCompetitors are set by the system from a validated list: return empty lists for both. potentialEntrants: only companies the evidence names as new or likely entrants, otherwise an empty list."
        : "only companies the evidence names as competitors or alternatives."
    } competitorDeepDives: ${
      competitors?.length ? `exactly these competitors, in this order, one entry each: ${competitors.join("; ")}.` : "at most 5, chosen from those competitors."
    } For each: revenue, headcount, activity and pricingModel are strict claims (rules 1-5; not_found if no evidence). description is ONE or TWO sentences on what that competitor sells and how it positions itself; strengths are 3 to 5 short items (at most 12 words each), each an advantage the evidence attributes to that competitor. For description and strengths, cite in basedOn the E numbers about THAT competitor (evidence tagged [competitor:<name>] is about it); they are summaries of the evidence, so they may use general wording, but add no figures, names or events that are not in the cited evidence.`,
  customer: () =>
    `6. customerInsights: cite only [customer_praise] and [customer_complaints] evidence (reviews, complaints, case studies, testimonials, published outcomes). Otherwise not_found or an empty list. Never infer sentiment. Style: sentiment is ONE headline sentence of at most 25 words that reports what the sources say, and it may only describe overall sentiment as positive or negative if BOTH praise and complaint evidence exist; with only one side, say plainly that only praise (or only complaints) was found. sentimentThemes, winReasons, lossReasons and unmetNeeds are lists with at most 5 items each; one idea per item, at most 25 words, starting with a 2-4 word bold label ("**Ease of use:** reviewers on G2 praise setup speed."). winReasons are things customers praise about the company, drawn from [customer_praise] evidence; lossReasons are things customers criticise or complain about, drawn from [customer_complaints] evidence (warranty disputes, defects, class actions and court filings count). A seller's own marketing is a claim by the seller, never customer evidence. Customer themes are about product or service experience only: never asbestos or other legacy liabilities, securities or shareholder litigation, or lawsuits about the company's finances. Evidence from a law firm or plaintiff-firm page must be written as that firm's announcement or allegation. These are review themes from review and complaint sites, NOT win/loss data: never claim they explain why deals were won or lost.`,
};

const factsSectionPrompt = (e: Entity, ev: Evidence[], today: string, section: Section, competitors?: string[], landscape?: boolean) =>
  `You are building one section of the fact base of a market-intelligence report. Today is ${today}.
${entityBlock(e)}

EVIDENCE (format: E<id> [topic] text). This is the ONLY information you may use:
${evidenceBlock(ev)}

${FACT_BASE_RULES}
${FACT_SECTION_RULES[section](competitors, landscape)}`;

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
  return {
    name: s(raw.name), website: s(raw.website), headquarters: s(raw.headquarters), description: s(raw.description), ownership: s(raw.ownership),
    confidence: s(raw.confidence), otherEntities: s(raw.otherEntities), ...readSegments(raw),
  };
}
function readSegments(raw: Any): Pick<Entity, "segments" | "divested" | "footprint" | "owned"> {
  const t = (v: unknown, n: number) => String(v ?? "").slice(0, n).trim();
  return {
    segments: list(raw?.segments).slice(0, 6).flatMap((x) => (t(x?.name, 80)
      ? [{ name: t(x.name, 80), description: t(x?.description, 200), ...(Number.isFinite(Number(x?.revenue)) && Number(x.revenue) > 0 ? { revenue: Number(x.revenue) } : {}) }]
      : [])),
    divested: list(raw?.divested).slice(0, 6).flatMap((x) => (t(x?.name, 80)
      ? [{ name: t(x.name, 80), date: t(x?.date, 80), terms: list(x?.terms).map((y) => t(y, 60)).filter(Boolean).slice(0, 12) }]
      : [])),
    footprint: list(raw?.footprint).map((y) => t(y, 60)).filter(Boolean).slice(0, 40),
    owned: list(raw?.owned).slice(0, 8).flatMap((x) => (t(x?.name, 80) ? [{ name: t(x.name, 80), what: t(x?.what, 120) }] : [])),
  };
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
  // Current reporting segments (and anything sold), so market research follows the business as it is today.
  let segmentSlice: Slice | null = null;
  const t1 = Date.now();
  try {
    const seg = await resolveSegments(apiKey, ent.entity, todayStr(), clock.timeout(50_000, 5_000));
    ent.entity.segments = seg.segments;
    ent.entity.divested = seg.divested;
    ent.entity.footprint = [...new Set(seg.divested.flatMap((d) => d.terms ?? []))];
    ent.entity.owned = seg.owned;
    segmentSlice = sliceOf("segments", seg.result, Date.now() - t1);
    if (!seg.segments.length) warnings.push("Could not confirm the company's current reporting segments; market research is not split by segment.");
  } catch (e) {
    warnings.push(`Segment lookup failed (${(e as Error)?.message ?? e}); market research is not split by segment.`);
  }
  return json({ entity: ent.entity, slice: sliceOf("profile", ent.result, t1 - t0), segmentSlice, warnings });
}

// Request 2: one grounded scan for one topic (or one competitor). A failed scan is returned as data.
async function v2Scan(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const entity = readEntity(body?.entity);
  if (!entity) return json({ error: "Missing or invalid entity." }, 400);
  const today = todayStr();
  let topic: string;
  let prompt: string;
  if (body?.topic === "market_segment") {
    const segment = typeof body?.segment === "string" ? body.segment.trim().slice(0, 80) : "";
    if (!segment) return json({ error: "Missing segment name." }, 400);
    topic = `market:${segment}`;
    prompt = researchPrompt(marketSegmentAsk(segment), entity, today);
  } else if (body?.topic === "competitor") {
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
  const ledger = buildLedger(results, urlMap, base ? { sources: base.sources, evidence: base.evidence } : undefined, entity.website, entity.name);
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
    droppedByTier: (base?.droppedByTier ?? 0) + ledger.droppedByTier,
    competitors: base?.competitors,
    validatedCompetitors: base?.validatedCompetitors,
    dateChecks: base?.dateChecks,
  };
  return json({ state });
}

// Request 4: identify the main competitors from the evidence (grounded fallback if too few).
async function v2Identify(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  if (!state) return json({ error: "Missing or invalid research state. Start the report again." }, 400);
  const { competitors, validated, extra, filter, warnings } = await identifyCompetitors(apiKey, state, todayStr(), clock);
  const slices = extra.map((x) => sliceOf(x.topic, x.r, 0));
  return json({ competitors, validated, slices, filter, warnings });
}

// How much a section's validated facts contain (used to decide whether to retry an empty-looking result).
function sectionScore(section: Section, f: Facts): number {
  const sourced = (c: Claim) => (c.status === "sourced" ? 1 : 0);
  switch (section) {
    case "performance": return f.businessPerformance.financialHighlights.length + f.businessPerformance.recentMetrics.length;
    case "strategy": return f.businessPerformance.strategicInitiatives.length;
    case "market_size": return sourced(f.marketOverview.definition) + f.marketOverview.tam.length;
    case "market_dynamics": return f.marketOverview.segmentation.length + f.marketOverview.drivers.length + f.marketOverview.inhibitors.length;
    case "competitors": return f.competitorDeepDives.length + f.competitiveLandscape.directCompetitors.length + f.competitiveLandscape.indirectCompetitors.length;
    case "customer": {
      const c = f.customerInsights;
      return sourced(c.sentiment) + c.sentimentThemes.length + c.winReasons.length + c.lossReasons.length + c.unmetNeeds.length;
    }
  }
}

// Request 5: facts for ONE section, from only that section's evidence, validated and verified.
// If the result is empty although the section has plenty of evidence, extract once more and keep the richer result.
async function v2FactsSection(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  const section = body?.section as Section;
  if (!state || !SECTIONS.includes(section)) return json({ error: "Missing or invalid research state or section." }, 400);
  // Evidence that only peer-list or look-alike sites support cannot show who competes with whom.
  // Plaintiff-firm marketing can only support attributed customer-complaint statements, never facts about the business.
  // Evidence from a page published more than 18 months ago is not used for events (strategy).
  const ev = state.evidence.filter((e) =>
    SECTION_TOPICS[section](e.topic) && (section !== "competitors" || usableForCompetitors(e)) &&
    (section === "customer" || !e.flags?.includes("legal_marketing")) &&
    ((section !== "strategy" && section !== "customer") || !e.flags?.includes("stale"))
  );
  const warnings: string[] = [];
  const competitorNames = section === "competitors" && state.competitors?.length ? state.competitors.map((c) => c.name) : undefined;
  // Evidence ids are looked up now: rivals found by the annual-report search only reach the ledger after identification.
  const landscape = section === "competitors" && state.validatedCompetitors?.length
    ? state.validatedCompetitors.map((c) => {
      const names = [c.name, ...(c.brands ?? [])].map((n) => n.toLowerCase());
      return {
        ...c,
        evidenceIds: state.evidence
          .filter((e) => (e.topic === "competitors" || e.topic === "profile" || names.some((n) => e.topic.toLowerCase() === `competitor:${n}`)) &&
            usableForCompetitors(e) && names.some((n) => e.text.toLowerCase().includes(n)))
          .slice(0, 3).map((e) => e.id),
      };
    })
    : undefined;
  if (!ev.length) {
    return json({ section, ok: true, empty: true, facts: pruneFacts(validateFacts({}, makeCtx(ev, [], state.entity))), dropped: [], verifier: "no evidence", sourcedClaims: 0, warnings });
  }
  const prompt = factsSectionPrompt(state.entity, ev, todayStr(), section, competitorNames, !!landscape);
  const vOpts = { entity: state.entity, landscape, sources: state.sources, competitors: state.competitors };
  const attempt = async (temperature: number) => {
    const ctx = makeCtx(ev, [], state.entity);
    const w: string[] = [];
    let raw: Any = null;
    try {
      raw = await structured(apiKey, clock, w, `Fact extraction (${section})`, prompt, SECTION_SCHEMAS[section], false, temperature, 50_000);
    } catch (e) {
      w.push(`Fact extraction (${section}) failed (${(e as Error)?.message ?? e}).`);
    }
    const validated = validateFacts(raw, ctx, competitorNames, vOpts);
    return { ctx, raw, validated, w, score: sectionScore(section, pruneFacts(validated)) };
  };
  let best = await attempt(0);
  if (best.score === 0 && ev.length >= 12 && clock.remaining() > 70_000) {
    const second = await attempt(0.2);
    warnings.push(`Fact extraction (${section}) came back empty with ${ev.length} evidence items; retried.`);
    if (second.score > best.score || (!best.raw && second.raw)) best = second;
  }
  warnings.push(...best.w);
  const { ctx, raw, validated } = best;
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
    const raw = await structured(apiKey, clock, warnings, `Analysis (${part})`, analysisPrompt(state.entity, currentEvidence(state.evidence), todayStr(), part), schema, body?.deepResearch !== false, 0.3, 10_000);
    return json({ part, ok: true, raw, warnings });
  } catch (e) {
    return json({ part, ok: false, raw: null, warnings: [...warnings, `Analysis (${part}) failed (${(e as Error)?.message ?? e}).`] });
  }
}

// Replace the "not found" placeholder with "not generated" inside the parts of the report that a failed step feeds.
const swapPlaceholder = (v: Any): Any =>
  v === NF ? NOT_GENERATED : Array.isArray(v) ? v.map(swapPlaceholder) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swapPlaceholder(x)])) : v;

// The finished statements are read together once: two that contradict each other on a specific fact (a rating, a figure, a date)
// cannot both stand. The one with the weaker sources is dropped and both are logged; a statement that qualifies a figure
// ("110 mph standard, 130 mph with enhanced installation") does not contradict one that states only part of it.
type Contradiction = { kept: string; dropped: string; reason: string };
async function dropContradictions(apiKey: string, ctx: Ctx, timeoutMs: number): Promise<Contradiction[]> {
  const items = ctx.items.filter((x) => !x.item.rejected).slice(0, 160);
  if (items.length < 4) return [];
  const prompt = `Below are numbered statements from one report. List every PAIR that contradicts each other on a specific fact (a number, rating, date, ranking or yes/no fact about the same thing). Do NOT list pairs that differ only because one adds a condition, scope or qualifier (for example standard versus enhanced installation, one region versus another, one period versus another), or that are about different things.

${items.map((x, i) => `${i}. ${x.item.text}`).join("\n")}

Return one {"a", "b", "reason"} per contradicting pair; an empty list if there are none.`;
  const schema = arr(obj({ a: { type: "INTEGER" }, b: { type: "INTEGER" }, reason: STR }));
  const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, timeoutMs, temperature: 0, thinkingBudget: 0, attempts: 1 });
  const weakness = (it: Item) => Math.max(...it.basedOn.map((id) => ctx.byId.get(id)?.tier ?? 3), 0);
  const out: Contradiction[] = [];
  for (const pair of list(safeJson(r.text)).slice(0, 12)) {
    const a = items[Number(pair?.a)], b = items[Number(pair?.b)];
    if (!a || !b || a === b || a.item.rejected || b.item.rejected) continue;
    // Higher tier number = weaker; then fewer cited facts; then the later statement.
    const aWeaker = weakness(a.item) !== weakness(b.item) ? weakness(a.item) > weakness(b.item) : a.item.basedOn.length !== b.item.basedOn.length ? a.item.basedOn.length < b.item.basedOn.length : items.indexOf(a) > items.indexOf(b);
    const [keep, lose] = aWeaker ? [b, a] : [a, b];
    lose.item.rejected = true;
    ctx.dropped.push({ path: lose.path, reason: "contradicts another statement with stronger sources", text: lose.item.text });
    out.push({ kept: keep.item.text.slice(0, 240), dropped: lose.item.text.slice(0, 240), reason: String(pair?.reason ?? "").slice(0, 200) });
  }
  return out;
}

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
  const perf = take("performance"), strat = take("strategy"), msize = take("market_size"), mdyn = take("market_dynamics"), comp = take("competitors"), cust = take("customer");
  if (perf) {
    facts.businessPerformance.financialHighlights = list(perf.businessPerformance?.financialHighlights);
    facts.businessPerformance.recentMetrics = list(perf.businessPerformance?.recentMetrics);
  }
  if (strat) facts.businessPerformance.strategicInitiatives = list(strat.businessPerformance?.strategicInitiatives);
  if (msize?.marketOverview) {
    facts.marketOverview.definition = msize.marketOverview.definition ?? facts.marketOverview.definition;
    facts.marketOverview.tam = list(msize.marketOverview.tam);
  }
  if (mdyn?.marketOverview) {
    facts.marketOverview.segmentation = list(mdyn.marketOverview.segmentation);
    facts.marketOverview.drivers = list(mdyn.marketOverview.drivers);
    facts.marketOverview.inhibitors = list(mdyn.marketOverview.inhibitors);
  }
  if (comp) {
    facts.competitiveLandscape = { ...facts.competitiveLandscape, ...comp.competitiveLandscape };
    facts.competitorDeepDives = list(comp.competitorDeepDives);
  }
  if (cust?.customerInsights) facts.customerInsights = { ...facts.customerInsights, ...cust.customerInsights };

  const dropped: Ctx["dropped"] = parts.flatMap((p) => list(p?.dropped)).slice(0, 500);
  const ctx = makeCtx(state.evidence, dropped, state.entity);
  const raws = body?.raw ?? {};
  const rawCore = raws.core ?? null, rawFrameworks = raws.frameworks ?? null, rawRecs = raws.recs ?? null;
  const analysis = validateAnalysis({ ...(rawCore ?? {}), ...(rawFrameworks ?? {}), recommendations: rawRecs?.recommendations, mcOpportunities: rawRecs?.mcOpportunities }, ctx);

  const warnings = [...state.warnings, ...list(body?.clientWarnings).map(String).slice(0, 40), ...parts.flatMap((p) => list(p?.warnings).map(String))];
  const left = clock.remaining();
  // MC offer mapping and the analysis verifier run together; the verifier checks every analysis statement against
  // its cited evidence (numbers, quantity words, names) and removes the ones it cannot support.
  const wrappers = ctx.items.map((x) => ({ path: x.path, claim: { text: x.item.text, status: "sourced", evidenceIds: x.item.basedOn } as Claim, item: x.item }));
  const [mcRes, verRes] = await Promise.allSettled([
    normalizeOpportunities(apiKey, analysis.mcOpportunities, Math.min(25_000, Math.max(3_000, left - 8_000))),
    left > 30_000 ? verifyClaims(apiKey, { ...ctx, sourced: wrappers }, Math.min(40_000, left - 12_000), "analysis") : Promise.resolve("skipped (time budget)"),
  ]);
  wrappers.forEach((w) => {
    if (w.claim.status === "not_found") w.item.rejected = true;
  });
  const analysisVerifier = verRes.status === "fulfilled" ? verRes.value : `failed (${(verRes.reason as Error)?.message})`;
  if (!analysisVerifier.startsWith("checked") && analysisVerifier !== "no sourced claims") warnings.push(`Analysis verifier ${analysisVerifier}; analysis statements are unchecked.`);
  applyRejections(analysis);
  let contradictions: Contradiction[] = [];
  if (clock.remaining() > 30_000) {
    try {
      contradictions = await dropContradictions(apiKey, ctx, Math.min(25_000, clock.remaining() - 15_000));
      if (contradictions.length) applyRejections(analysis);
    } catch (e) {
      warnings.push(`Consistency check did not run (${(e as Error)?.message ?? e}).`);
    }
  }
  let mc: Opportunity[] = mcRes.status === "fulfilled" ? mcRes.value.filter((o) => !o.item.rejected) : [];
  if (mcRes.status === "rejected") console.error("MC normalisation failed:", mcRes.reason);

  const placeholders: Placeholders = { facts: NF, core: NF, recs: rawRecs ? NF : NOT_GENERATED };
  const cov = sectionCoverage(facts, analysis, mc);
  const sourcedClaims = parts.reduce((n, p) => n + (Number(p?.sourcedClaims) || 0), 0);
  const verifiers = parts.map((p) => (typeof p?.verifier === "string" ? `${p.section}: ${p.verifier}` : "")).filter(Boolean);
  const scanLog = list(body?.scanLog).slice(0, 40).map((x) => ({
    topic: String(x?.topic ?? "").slice(0, 120), status: String(x?.status ?? "").slice(0, 20), ms: Number(x?.ms) || 0,
    segments: Number(x?.segments) || 0, retried: !!x?.retried,
  }));

  let report: Any = {
    companyName: state.companyName,
    entity: state.entity,
    ...toLegacy(facts, analysis, mc, ctx, placeholders),
    sources: state.sources,
    claims: { facts, analysis: { ...analysis, mcOpportunities: mc.map(({ item: _item, ...o }) => o) } },
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
      sourcesDroppedByType: state.droppedByTier ?? 0,
      sourcedClaims,
      droppedCount: dropped.length,
      dropped,
      verifier: [...verifiers, `analysis: ${analysisVerifier}`].join("; "),
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
  if (!okSection("market_size")) {
    report.marketOverview.definition = swapPlaceholder(report.marketOverview.definition);
    report.marketOverview.metrics = swapPlaceholder(report.marketOverview.metrics);
  }
  if (!okSection("market_dynamics")) swap(report.marketOverview, ["segmentation", "drivers", "inhibitors"]);
  if (!okSection("competitors")) {
    swap(report, ["competitiveLandscape"]);
    report.competitorDeepDives = swapPlaceholder(report.competitorDeepDives);
  }
  if (!okSection("customer")) swap(report, ["customerInsights"]);
  if (!rawCore) {
    swap(report, ["executiveSummary"]);
    if (analysis.performanceSummary.length === 0 && okSection("performance")) swap(report.businessPerformance, ["financialHighlights"]);
    report.competitorDeepDives.forEach((d: Any) => { d.gapAnalysis = swapPlaceholder(d.gapAnalysis); });
  }
  if (!rawFrameworks) swap(report, ["strategicFrameworks"]);

  // Citations renumbered 1..n (only what the text cites), then real page titles for those sources.
  report = renumberCitations(report, state.sources);
  await fetchTitles(report.sources, Math.min(8_000, Math.max(0, clock.remaining() - 8_000)));
  // Sources whose page is a bot check cannot be audited: take their citations out and number the rest again.
  const unauditable = new Set<number>((report.sources as Source[]).flatMap((x, i) => ((x.kinds ?? []).includes("unauditable") ? [i + 1] : [])));
  if (unauditable.size) {
    const removed = (report.sources as Source[]).filter((_x, i) => unauditable.has(i + 1)).map((x) => x.url);
    report = renumberCitations(stripCitations(report, unauditable), (report.sources as Source[]).map((x, i) => ({ ...x, id: i + 1 })));
    report.quality.warnings = [...(report.quality.warnings ?? []), `${removed.length} source(s) showed a bot-check page instead of content, so their citations were removed.`];
  }
  // Market rows whose cited page is titled for another market
  const market = pruneMarketRows(report);
  if (market.removed.length) {
    report.quality.warnings = [...(report.quality.warnings ?? []), ...market.removed.map((m) => `Market row removed, its cited page is about another market (${m}).`)];
    if (market.strip.size) report = renumberCitations(stripCitations(report, market.strip), (report.sources as Source[]).map((x, i) => ({ ...x, id: i + 1 })));
  }
  report.quality.dateChecks = state.dateChecks ?? { confirmed: 0, unverified: 0, corroborated: 0, dropped: [] };
  // What the report says about how it was made: counts the page shows next to the plain-language method.
  const checkedClaims = [...parts.map((p) => p?.verifier), analysisVerifier]
    .reduce((n: number, v) => n + (typeof v === "string" ? Number(v.match(/checked (\d+) of/)?.[1] ?? 0) : 0), 0);
  const removedByDates = (state.dateChecks?.dropped ?? []).filter((d) => d.id > 0).length;
  report.quality.contradictions = contradictions;
  report.quality.methodStats = {
    evidenceFound: state.evidence.length + removedByDates,
    evidenceUsed: state.evidence.length,
    evidenceRemovedByChecks: removedByDates,
    claimsChecked: checkedClaims,
    claimsRemovedByVerifier: dropped.filter((d) => /^verifier/i.test(d.reason)).length,
    statementsDropped: dropped.length,
    // The settings and counts the method page describes, so it never says more than the run did.
    primarySources: (report.sources as Source[]).filter((x) => x.tier === 1).length,
    majorSources: (report.sources as Source[]).filter((x) => x.tier === 2).length,
    otherSources: (report.sources as Source[]).filter((x) => x.tier !== 1 && x.tier !== 2).length,
    blockedSourceHits: state.droppedByTier ?? 0,
    pagesRead: state.dateChecks?.pagesRead ?? 0,
    materialEventsChecked: state.dateChecks?.materialChecked ?? 0,
    materialEventsConfirmed: state.dateChecks?.corroborated ?? 0,
    evidenceRemovedByPageSupport: state.dateChecks?.supportDropped ?? 0,
    competitorsClassified: list(body?.competitorFilter).filter((x) => String(x?.classification ?? "") !== "unclassified").length,
    competitorCandidates: list(body?.competitorFilter).length,
    contradictionsRemoved: contradictions.length,
    windowMonths: INITIATIVE_WINDOW_MONTHS,
    staleMonths: 18,
  };
  report.quality.build = BUILD;
  // Every domain cited in the report, so a blocklist or a source rule can be confirmed from one list.
  const domainCount = new Map<string, { domain: string; count: number; tier: number; kinds: string[] }>();
  for (const src of report.sources as Source[]) {
    const domain = hostOf(src.url, src.title) || "unknown";
    const cur = domainCount.get(domain);
    if (cur) cur.count++;
    else domainCount.set(domain, { domain, count: 1, tier: src.tier ?? 3, kinds: src.kinds ?? [] });
  }
  report.quality.sourceDomains = [...domainCount.values()].sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
  report.quality.sourceFlags = (report.sources as Source[])
    .filter((x) => (x.kinds ?? []).some((k) => k === "lookalike" || k === "unauditable" || k === "peer_list" || k === "seller" || k === "legal_marketing"))
    .map((x) => ({ title: x.title.slice(0, 150), url: x.url, flags: (x.kinds ?? []).filter((k) => k !== "review") }));
  report.quality.competitorFilter = list(body?.competitorFilter).slice(0, 40).map((x) => ({
    name: String(x?.name ?? "").slice(0, 80), classification: String(x?.classification ?? "").slice(0, 30), kept: !!x?.kept, reason: String(x?.reason ?? "").slice(0, 200),
  }));
  const tierCounts = { primary: 0, major: 0, other: 0 };
  for (const src of report.sources as Source[]) tierCounts[src.tier === 1 ? "primary" : src.tier === 2 ? "major" : "other"]++;
  report.quality.sourceCount = report.sources.length;
  report.quality.sourceTiers = tierCounts;

  console.log(JSON.stringify({ company: state.entity.name, evidence: state.evidence.length, scans: scanLog.length, sourcedClaims, dropped: dropped.length, sources: report.sources.length }));
  return json(report);
}

function readPageInfo(p: Any): PageInfo {
  const ym = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}$/.test(v) ? v : undefined);
  return {
    read: p?.read === true,
    ...(p?.bot === true ? { bot: true } : {}),
    ...(typeof p?.title === "string" ? { title: p.title.slice(0, 200) } : {}),
    ...(ym(p?.pub) ? { pub: ym(p.pub) } : {}),
    my: list(p?.my).map(ym).filter((x): x is string => !!x).slice(0, 60),
    years: list(p?.years).filter((n) => Number.isInteger(n)).slice(0, 40),
  };
}

function readDateChecks(raw: Any): State["dateChecks"] {
  if (!raw || typeof raw !== "object") return undefined;
  const n = (v: unknown) => Math.max(0, Math.min(100000, Number(v) || 0));
  return {
    confirmed: n(raw.confirmed), unverified: n(raw.unverified), corroborated: n(raw.corroborated),
    materialChecked: n(raw.materialChecked), supportDropped: n(raw.supportDropped), pagesRead: n(raw.pagesRead),
    dropped: list(raw.dropped).slice(0, 120).map((d) => ({ id: Number(d?.id) || 0, reason: String(d?.reason ?? "").slice(0, 120), text: String(d?.text ?? "").slice(0, 240) })),
    byTopic: raw.byTopic && typeof raw.byTopic === "object"
      ? Object.fromEntries(Object.entries(raw.byTopic).slice(0, 80).map(([k, v]) => [String(k).slice(0, 120), n(v)]))
      : undefined,
  };
}

function readCompetitors(raw: Any[], max: number): Competitor[] {
  return list(raw).flatMap((c): Competitor[] =>
    typeof c?.name === "string" && c.name.trim()
      ? [{
        name: c.name.trim().slice(0, 80), kind: c.kind === "indirect" ? "indirect" : "direct",
        ...(typeof c.segment === "string" && c.segment.trim() ? { segment: c.segment.trim().slice(0, 80) } : {}),
        ...(typeof c.parent === "string" && c.parent.trim() ? { parent: c.parent.trim().slice(0, 80) } : {}),
        ...(Array.isArray(c.brands) ? { brands: list(c.brands).map((b) => String(b).trim().slice(0, 80)).filter(Boolean).slice(0, 6) } : {}),
        ...(Array.isArray(c.evidenceIds) ? { evidenceIds: list(c.evidenceIds).filter((n) => Number.isInteger(n)).slice(0, 5) } : {}),
      }]
      : []
  ).slice(0, max);
}

// The page sends the state back to us, so treat it as untrusted input and rebuild it field by field.
function readState(raw: Any, allowEmpty = false): State | null {
  if (!raw || typeof raw !== "object" || !raw.entity || typeof raw.entity.name !== "string") return null;
  const evidence: Evidence[] = list(raw.evidence).slice(0, MAX_EVIDENCE).flatMap((e) =>
    typeof e?.text === "string" && Number.isInteger(e?.id)
      ? [{
        id: e.id, topic: String(e.topic ?? ""), text: e.text.slice(0, 2000), sourceIds: list(e.sourceIds).filter((n) => Number.isInteger(n)),
        tier: [1, 2, 3].includes(e.tier) ? e.tier : 2, srcTiers: list(e.srcTiers).map((n) => ([1, 2, 3].includes(n) ? n : 3)),
        ...(Array.isArray(e.flags) ? { flags: list(e.flags).map((f) => String(f).slice(0, 20)).slice(0, 5) } : {}),
        ...(e.dateChecked === true ? { dateChecked: true } : {}),
        ...(Array.isArray(e.srcSupport) ? { srcSupport: list(e.srcSupport).map((n) => (Number.isFinite(Number(n)) ? Math.max(-1, Math.min(1, Number(n))) : -1)).slice(0, 12) } : {}),
      }]
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
      ownership: s(en.ownership), confidence: s(en.confidence), otherEntities: s(en.otherEntities), ...readSegments(en),
    },
    evidence,
    sources: list(raw.sources).slice(0, 800).flatMap((x): Source[] =>
      Number.isInteger(x?.id)
        ? [{
          id: x.id, title: String(x.title ?? "").slice(0, 300), url: String(x.url ?? "").slice(0, 2000), tier: [1, 2, 3].includes(x.tier) ? x.tier : 3,
          ...(Array.isArray(x.kinds) ? { kinds: list(x.kinds).map((k) => String(k).slice(0, 20)).slice(0, 5) } : {}),
          ...(x.page && typeof x.page === "object" ? { page: readPageInfo(x.page) } : {}),
        }]
        : []
    ),
    queries: list(raw.queries),
    searchSuggestions: list(raw.searchSuggestions),
    droppedByTier: Number(raw.droppedByTier) || 0,
    warnings: list(raw.warnings).map(String),
    timings: raw.timings && typeof raw.timings === "object" ? raw.timings : {},
    researchModel: String(raw.researchModel ?? FLASH_MODEL),
    competitors: Array.isArray(raw.competitors) ? readCompetitors(raw.competitors, MAX_DEEP_DIVES) : undefined,
    validatedCompetitors: Array.isArray(raw.validatedCompetitors) ? readCompetitors(raw.validatedCompetitors, MAX_COMPETITORS) : undefined,
    dateChecks: readDateChecks(raw.dateChecks),
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
    if (step === "verify_evidence") return await v2VerifyEvidence(apiKey, body, clock);
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
