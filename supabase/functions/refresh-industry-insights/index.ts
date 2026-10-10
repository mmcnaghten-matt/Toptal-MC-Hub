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
type Source = { id: number; title: string; url: string; tier?: number };
// tier: 1 primary (regulators, statistical agencies, company releases), 2 major press/analysts, 3 everything else.
type Evidence = { id: number; topic: string; text: string; sourceIds: number[]; tier?: number; srcTiers?: number[] };

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

// ---------- Source tiers ----------
// Evidence is only as good as its source. Known-bad types (social media, stock forums, content farms, law-firm
// marketing) are dropped before any synthesis; the rest are ranked so primary sources win when facts conflict.
const DOMAINS_EXCLUDED = [
  "facebook.com", "fb.com", "instagram.com", "x.com", "twitter.com", "reddit.com", "tiktok.com", "pinterest.com", "quora.com",
  "linkedin.com", "youtube.com", "youtu.be", "stocktwits.com", "koalagains.com", "capout.ai", "creately.com",
  ...(Deno.env.get("SOURCE_DENYLIST") ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean),
];
const DOMAINS_T1 = ["sec.gov", "europa.eu", "prnewswire.com", "businesswire.com", "globenewswire.com", "accesswire.com"];
const DOMAINS_T2 = [
  "reuters.com", "bloomberg.com", "wsj.com", "ft.com", "cnbc.com", "apnews.com", "nytimes.com", "washingtonpost.com", "barrons.com",
  "economist.com", "marketwatch.com", "fortune.com", "axios.com", "bbc.com", "theguardian.com", "politico.com",
  "gartner.com", "idc.com", "forrester.com", "mckinsey.com", "bcg.com", "bain.com", "deloitte.com", "pwc.com", "kpmg.com", "ey.com",
  "accenture.com", "statista.com", "spglobal.com", "moodys.com", "fitchratings.com", "morningstar.com", "grandviewresearch.com",
  "marketsandmarkets.com", "mordorintelligence.com", "fortunebusinessinsights.com", "precedenceresearch.com",
];
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
function sourceTier(url: string, title: string | undefined, companyRoot: string): 0 | 1 | 2 | 3 {
  const host = hostOf(url, title);
  if (!host) return 3;
  if (matchesDomain(host, DOMAINS_EXCLUDED)) return 0;
  if (LAW_FIRM_RE.test(host.replace(/[-.]/g, " ")) || LAW_FIRM_RE.test(title ?? "")) return 0;
  if (matchesDomain(host, DOMAINS_T1) || /\.(gov|mil)(\.[a-z]{2})?$/.test(host) || (companyRoot && matchesDomain(host, [companyRoot]))) return 1;
  if (matchesDomain(host, DOMAINS_T2)) return 2;
  return 3;
}

function buildLedger(
  results: { topic: string; r: GeminiResult }[],
  urlMap: Map<string, string>,
  existing?: { sources: Source[]; evidence: Evidence[] },
  companyWebsite?: string,
) {
  const companyRoot = rootDomainOf(companyWebsite);
  let droppedByTier = 0;
  const sources: Source[] = [...(existing?.sources ?? [])].map((x) => ({ ...x, tier: x.tier ?? (sourceTier(x.url, x.title, companyRoot) || 3) }));
  const tierOfSource = new Map<number, number>(sources.map((x) => [x.id, x.tier ?? 3]));
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
    const excludedChunks = new Set<number>();
    const chunkSrc = (meta.groundingChunks ?? []).map((c, ci) => {
      const raw = c.web?.uri;
      if (!raw) return null;
      const url = urlMap.get(raw) ?? raw;
      const tier = sourceTier(url, c.web?.title, companyRoot);
      if (tier === 0) {
        excludedChunks.add(ci);
        return null;
      }
      const key = normUrl(url);
      let id = srcIndex.get(key);
      if (!id) {
        id = sources.length + 1;
        sources.push({ id, title: c.web?.title ?? new URL(url).host, url, tier });
        tierOfSource.set(id, tier);
        srcIndex.set(key, id);
      }
      return id;
    });
    for (const s of meta.groundingSupports ?? []) {
      const text = (s.segment?.text ?? "").replace(/^[\s*-]+/, "").trim();
      if (text.length < 15 || /NOT FOUND/i.test(text) || /^(CONFIDENCE|OTHER_ENTITIES)\b/.test(text)) continue;
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
      evidence.push({ id: evidence.length + 1, topic, text, sourceIds: ids, tier: Math.min(...srcTiers), srcTiers });
    }
  }
  return { sources, evidence, searchSuggestions, queries: [...new Set(queries)], droppedByTier };
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
type Item = { text: string; basedOn: number[]; rejected?: boolean };
type State = {
  subIndustryName: string;
  industryName: string;
  /** Optional plain-words definition of what this sub-sector means in our model (authoritative). */
  scope: string;
  sources: Source[];
  evidence: Evidence[];
  queries: string[];
  warnings: string[];
  droppedByTier: number;
};
type Dropped = { path: string; reason: string; text: string };

const evidenceBlock = (ev: Evidence[]) => ev.map((e) => `E${e.id} [${e.topic}|T${e.tier ?? 2}] ${e.text}`).join("\n");

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
- Prefer primary sources (regulators, statistical agencies, company filings and press releases), then major news outlets and analyst or consulting firms. Avoid social media, stock-forum or stock-data aggregator pages, vendor marketing blogs and law-firm sites.
- Prefer sources from the last 24 months.
- Distinguish claims by companies from independent reporting by analysts, regulators or the press.
- If you cannot find something, write one line "NOT FOUND: <item>". Incomplete answers are expected and fine.
- No recommendations, opinions, or analysis.`;

// ---------- Validation ----------
const WINDOW_MONTHS = 24;
const cutoffYear = () => new Date(Date.now() - WINDOW_MONTHS * 30.44 * 86_400_000).getFullYear();

const evidenceFor = (ids: unknown, byId: Map<number, Evidence>): Evidence[] =>
  [...new Set(list(ids).map(Number))].map((id) => byId.get(id)).filter((e): e is Evidence => !!e);

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

// Why a statement cannot stand on its cited evidence, or null if it can.
function textReason(text: string, ev: Evidence[]): string | null {
  if (!figuresSupported(text, ev, true)) return "figure not present in cited evidence";
  if (!quantityWordsSupported(text, ev)) return "quantity wording not supported by cited evidence";
  if ((text.match(FIN_FIGURE) ?? []).length > 0 && !ev.some((e) => (e.tier ?? 2) <= 2)) return "figure needs a primary or major-press/analyst source";
  return null;
}

type Kind = "interpretive" | "event";
type Verdict = { reason: string; repairable: boolean } | null;
// interpretive (overview, challenges, need narratives): no age rule. event (initiatives): must be inside the research window.
// A figure/quantity/source problem is "repairable": the statement can be rewritten without the unsupported detail.
function judge(text: string, ev: Evidence[], kind: Kind): Verdict {
  const r = textReason(text, ev);
  if (r) return { reason: r, repairable: true };
  if (kind === "event") {
    const years = (text.match(/\b20\d\d\b/g) ?? []).map(Number);
    if (years.length && Math.max(...years) < cutoffYear()) return { reason: `older than ${WINDOW_MONTHS} months`, repairable: false };
  }
  return null;
}

// Strict check used when assembling the final report (no rewriting at that point).
function checkItem(it: Any, path: string, byId: Map<number, Evidence>, dropped: Dropped[], reg?: { path: string; item: Item }[], kind: Kind = "interpretive"): Item | null {
  const text = typeof it?.text === "string" ? it.text.trim() : "";
  if (!text) return null;
  const evAll = evidenceFor(it?.basedOn, byId);
  const ev = evAll.filter((e) => e.sourceIds.length > 0);
  const v = !evAll.length ? { reason: "no evidence cited" } : !ev.length ? { reason: "no source attached to the cited evidence" } : judge(text, ev, kind);
  if (v) {
    dropped.push({ path, reason: v.reason, text });
    return null;
  }
  const item: Item = { text, basedOn: ev.map((e) => e.id) };
  reg?.push({ path, item });
  return item;
}

// One batched call: rewrite statements that failed on a figure, quantity word or source so they no longer need it.
async function repairTexts(apiKey: string, rows: { text: string; reason: string; evidence: string[] }[], timeoutMs: number): Promise<string[]> {
  const prompt = `Each numbered STATEMENT below was rejected because of the problem named under it. Rewrite each statement so that it keeps the same point but contains NO number, percentage, dollar amount, quantity word (such as "over half", "majority", "doubled") or date that is not stated in its EVIDENCE. Describe the issue qualitatively instead. Keep the same style: if the statement starts with "Short title: description", keep that format. Do not add any new fact. If the point cannot stand without the unsupported detail, return an empty string.

${rows.map((r, i) => `STATEMENT ${i}: ${r.text}\nPROBLEM: ${r.reason}\nEVIDENCE:\n${r.evidence.map((e) => `- ${e}`).join("\n")}`).join("\n\n")}

Return one {"index", "text"} per statement.`;
  const schema = arr(obj({ index: { type: "INTEGER" }, text: STR }));
  const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, timeoutMs, temperature: 0, thinkingBudget: 0, attempts: 1 });
  const out: string[] = rows.map(() => "");
  for (const x of list(safeJson(r.text))) {
    const i = Number(x?.index);
    if (i >= 0 && i < rows.length && typeof x?.text === "string") out[i] = x.text.trim();
  }
  return out;
}

type Repaired = { path: string; before: string; after: string };

// Validate raw model items; items that fail only on figures/quantities/sources are rewritten once and re-checked.
async function vetItems(
  apiKey: string, raw: Any[], prefix: string, byId: Map<number, Evidence>, kind: Kind,
  dropped: Dropped[], reg: { path: string; item: Item }[], repaired: Repaired[], clock: ReturnType<typeof makeClock>,
): Promise<Item[]> {
  const accepted: { i: number; item: Item }[] = [];
  const fixable: { i: number; path: string; text: string; ev: Evidence[]; basedOn: number[]; reason: string }[] = [];
  raw.forEach((it, i) => {
    const path = `${prefix}[${i}]`;
    const text = typeof it?.text === "string" ? it.text.trim() : "";
    if (!text) return;
    const evAll = evidenceFor(it?.basedOn, byId);
    const ev = evAll.filter((e) => e.sourceIds.length > 0);
    if (!evAll.length) return void dropped.push({ path, reason: "no evidence cited", text });
    if (!ev.length) return void dropped.push({ path, reason: "no source attached to the cited evidence", text });
    const v = judge(text, ev, kind);
    if (!v) {
      const item: Item = { text, basedOn: ev.map((e) => e.id) };
      reg.push({ path, item });
      accepted.push({ i, item });
    } else if (v.repairable) {
      fixable.push({ i, path, text, ev, basedOn: ev.map((e) => e.id), reason: v.reason });
    } else {
      dropped.push({ path, reason: v.reason, text });
    }
  });
  let rewrites: string[] = [];
  if (fixable.length && clock.remaining() > 40_000) {
    try {
      rewrites = await repairTexts(apiKey, fixable.map((f) => ({ text: f.text, reason: f.reason, evidence: f.ev.map((e) => e.text) })), Math.min(25_000, clock.remaining() - 20_000));
    } catch (e) {
      console.error("Repair failed:", e);
    }
  }
  fixable.forEach((f, k) => {
    const nt = rewrites[k];
    if (nt && !judge(nt, f.ev, kind)) {
      const item: Item = { text: nt, basedOn: f.basedOn };
      reg.push({ path: f.path, item });
      accepted.push({ i: f.i, item });
      repaired.push({ path: f.path, before: f.text, after: nt });
    } else {
      dropped.push({ path: f.path, reason: `${f.reason} (could not be rewritten)`, text: f.text });
    }
  });
  return accepted.sort((a, b) => a.i - b.i).map((x) => x.item);
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

type NeedIn = { name: string; signals: string[]; narrative: string; basedOn: number[]; item?: Item };

// Signals are buyer-observable symptoms; a signal quoting a figure must match the evidence. Needs with fewer than 2 are dropped.
function finalizeNeed(
  n: Any, name: string, narrative: string, ev: Evidence[], path: string, dropped: Dropped[], reg?: { path: string; item: Item }[],
): NeedIn | null {
  const signals = list(n?.signals).map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean).filter((sg, i) => {
    if (figuresSupported(sg, ev, true)) return true;
    dropped.push({ path: `${path}.signals[${i}]`, reason: "figure not present in cited evidence", text: sg });
    return false;
  }).slice(0, 5);
  if (signals.length < 2) {
    dropped.push({ path, reason: "fewer than 2 usable signals", text: name });
    return null;
  }
  const item: Item = { text: narrative, basedOn: ev.map((e) => e.id) };
  reg?.push({ path: `${path}.narrative`, item });
  return { name, signals, narrative, basedOn: ev.map((e) => e.id), item };
}

// Strict check used when assembling the final report.
function checkNeed(n: Any, path: string, byId: Map<number, Evidence>, dropped: Dropped[], reg?: { path: string; item: Item }[]): NeedIn | null {
  const name = typeof n?.name === "string" ? n.name.trim() : "";
  const narrative = typeof n?.narrative === "string" ? n.narrative.trim() : "";
  if (!name || !narrative) return null;
  const evAll = evidenceFor(n?.basedOn, byId);
  const ev = evAll.filter((e) => e.sourceIds.length > 0);
  const v = !evAll.length ? { reason: "no evidence cited" } : !ev.length ? { reason: "no source attached to the cited evidence" } : judge(narrative, ev, "interpretive");
  if (v) {
    dropped.push({ path, reason: v.reason, text: `${name}: ${narrative}` });
    return null;
  }
  return finalizeNeed(n, name, narrative, ev, path, dropped, reg);
}

// Validate raw needs; a narrative that fails only on a figure/quantity/source is rewritten once and re-checked.
async function vetNeeds(
  apiKey: string, raw: Any[], byId: Map<number, Evidence>, dropped: Dropped[], reg: { path: string; item: Item }[],
  repaired: Repaired[], clock: ReturnType<typeof makeClock>,
): Promise<NeedIn[]> {
  const out: { i: number; need: NeedIn }[] = [];
  const fixable: { i: number; path: string; n: Any; name: string; text: string; ev: Evidence[]; reason: string }[] = [];
  raw.forEach((n, i) => {
    const path = `needs[${i}]`;
    const name = typeof n?.name === "string" ? n.name.trim() : "";
    const narrative = typeof n?.narrative === "string" ? n.narrative.trim() : "";
    if (!name || !narrative) return;
    const evAll = evidenceFor(n?.basedOn, byId);
    const ev = evAll.filter((e) => e.sourceIds.length > 0);
    if (!evAll.length) return void dropped.push({ path, reason: "no evidence cited", text: `${name}: ${narrative}` });
    if (!ev.length) return void dropped.push({ path, reason: "no source attached to the cited evidence", text: `${name}: ${narrative}` });
    const v = judge(narrative, ev, "interpretive");
    if (!v) {
      const need = finalizeNeed(n, name, narrative, ev, path, dropped, reg);
      if (need) out.push({ i, need });
    } else if (v.repairable) {
      fixable.push({ i, path, n, name, text: narrative, ev, reason: v.reason });
    } else {
      dropped.push({ path, reason: v.reason, text: `${name}: ${narrative}` });
    }
  });
  let rewrites: string[] = [];
  if (fixable.length && clock.remaining() > 40_000) {
    try {
      rewrites = await repairTexts(apiKey, fixable.map((f) => ({ text: f.text, reason: f.reason, evidence: f.ev.map((e) => e.text) })), Math.min(25_000, clock.remaining() - 20_000));
    } catch (e) {
      console.error("Repair failed:", e);
    }
  }
  fixable.forEach((f, k) => {
    const nt = rewrites[k];
    if (nt && !judge(nt, f.ev, "interpretive")) {
      const need = finalizeNeed(f.n, f.name, nt, f.ev, f.path, dropped, reg);
      if (need) {
        out.push({ i: f.i, need });
        repaired.push({ path: `${f.path}.narrative`, before: f.text, after: nt });
      }
    } else {
      dropped.push({ path: f.path, reason: `${f.reason} (could not be rewritten)`, text: `${f.name}: ${f.text}` });
    }
  });
  return out.sort((a, b) => a.i - b.i).map((x) => x.need);
}

// Verifier: each synthesised statement is checked against its cited evidence; unsupported ones are removed.
async function verifyItems(apiKey: string, reg: { path: string; item: Item }[], byId: Map<number, Evidence>, dropped: Dropped[], timeoutMs: number): Promise<string> {
  const items = reg.slice(0, 120);
  if (!items.length) return "no statements to check";
  const prompt = `For each numbered CLAIM, judge whether the EVIDENCE listed under it supports it. The claims are analysis written from the evidence, so reasonable synthesis is fine.
"supported": the evidence supports the claim, and any number, quantity (including words like "over half" or "majority"), date, name or event in it appears in the evidence.
"partial": mostly supported, but the wording is somewhat stronger than the evidence.
"unsupported": the claim states a specific number, quantity, date, name or event that the evidence does not contain, contradicts the evidence, or is about a different industry or sub-sector. General statements and reasonable inferences that follow from the evidence are NOT unsupported.

${items.map((x, i) => `CLAIM ${i}: ${x.item.text}\nEVIDENCE:\n${x.item.basedOn.map((id) => `- ${byId.get(id)?.text}`).join("\n")}`).join("\n\n")}

Return one {"index", "verdict"} per claim.`;
  const schema = arr(obj({ index: { type: "INTEGER" }, verdict: { type: "STRING", format: "enum", enum: ["supported", "partial", "unsupported"] } }));
  const r = await callGemini(apiKey, { model: FLASH_MODEL, prompt, schema, timeoutMs, temperature: 0, thinkingBudget: 0, attempts: 1 });
  let checked = 0;
  for (const v of list(safeJson(r.text))) {
    const x = items[Number(v?.index)];
    if (!x) continue;
    checked++;
    if (v.verdict === "unsupported") {
      x.item.rejected = true;
      dropped.push({ path: x.path, reason: "verifier: not supported by cited evidence", text: x.item.text });
    }
  }
  return `checked ${checked} of ${reg.length} statements`;
}

// The page sends state back to us, so rebuild it field by field.
function readState(raw: Any, allowEmpty = false): State | null {
  if (!raw || typeof raw !== "object") return null;
  const evidence: Evidence[] = list(raw.evidence).slice(0, MAX_EVIDENCE).flatMap((e) =>
    typeof e?.text === "string" && Number.isInteger(e?.id)
      ? [{
        id: e.id, topic: String(e.topic ?? "").slice(0, 60), text: e.text.slice(0, 2000), sourceIds: list(e.sourceIds).filter((n) => Number.isInteger(n)),
        tier: [1, 2, 3].includes(e.tier) ? e.tier : 2, srcTiers: list(e.srcTiers).map((n) => ([1, 2, 3].includes(n) ? n : 3)),
      }]
      : []
  );
  if (!evidence.length && !allowEmpty) return null;
  const sources: Source[] = list(raw.sources).slice(0, 600).flatMap((x) =>
    Number.isInteger(x?.id)
      ? [{ id: x.id, title: String(x.title ?? "").slice(0, 300), url: String(x.url ?? "").slice(0, 2000), tier: [1, 2, 3].includes(x.tier) ? x.tier : 3 }]
      : []
  );
  return {
    subIndustryName: String(raw.subIndustryName ?? "").slice(0, 200),
    industryName: String(raw.industryName ?? "").slice(0, 200),
    scope: String(raw.scope ?? "").slice(0, 800),
    sources,
    evidence,
    queries: list(raw.queries).map(String).slice(0, 100),
    warnings: list(raw.warnings).map(String).slice(0, 50),
    droppedByTier: Number(raw.droppedByTier) || 0,
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
  const state: State = { subIndustryName: n.sub, industryName: n.industry, scope: n.scope, sources: ledger.sources, evidence: ledger.evidence, queries: ledger.queries, warnings, droppedByTier: ledger.droppedByTier };
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
4. Prefer developments from the last ${WINDOW_MONTHS} months.
4a. Evidence lines carry a source tier (T1 primary: regulators, statistical agencies, company releases; T2 major press and analyst or consulting firms; T3 other). Rest conclusions on T1 and T2 evidence; statistics and figures must come from T1 or T2. Do not combine figures reported on different bases, years or geographies into one statement. Write a company's or vendor's own marketing claim as that party's claim. Investment commentary ("undervalued", price targets) is not a sector development. Do not state quantities in words ("over half", "majority", "doubled") unless the cited evidence states them.
4b. The overview, challenges, initiatives and need narratives are YOUR interpretation of what the evidence implies. Cite in basedOn the evidence that motivates each one, but do not force a statistic into it: include a number, percentage or dollar amount ONLY when it is essential and appears exactly in the cited evidence; otherwise describe the issue qualitatively.`;

const OVERVIEW_SCHEMA = obj({ overview: OPT_ITEM, challenges: arr(ITEM) });
const INITIATIVES_SCHEMA = obj({ initiatives: arr(ITEM) });
const NEEDS_SCHEMA = obj({
  needs: arr(obj({ name: STR, signals: arr(STR), narrative: STR, basedOn: INTS })),
});

// 3. Synthesis from the evidence only. Items are validated, rewritten once if only a figure/quantity/source is the problem,
// then verified against their cited evidence, so later parts and the report build on checked text.
// `exclude` + `want` ask for additional items on angles not yet covered (the page's top-up when a list is thin).
async function v2Synth(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  const part = body?.part as "overview" | "initiatives" | "needs";
  if (!state || !["overview", "initiatives", "needs"].includes(part)) return json({ error: "Missing or invalid research state or part." }, 400);
  const today = todayStr();
  const byId = new Map(state.evidence.map((e) => [e.id, e]));
  const dropped: Dropped[] = [];
  const warnings: string[] = [];
  const repaired: Repaired[] = [];
  const reg: { path: string; item: Item }[] = [];
  const exclude = list(body?.exclude).map(String).slice(0, 30);
  const want = Math.min(8, Math.max(0, Number(body?.want) || 0));
  const topup = want > 0;
  const avoid = topup ? `\nALREADY ACCEPTED (do not repeat or rephrase these; cover different angles of the evidence):\n${exclude.map((t) => `- ${t}`).join("\n")}\n` : "";
  const TITLE = `each "Short title: description" (title of 2-5 words, then a colon, then 1-2 sentences)`;
  const RESERVE = 55_000; // time kept for the rewrite and verification that follow generation

  // Verify what survived validation; drop unsupported items. Returns a short log line.
  const verify = async (): Promise<string> => {
    if (clock.remaining() < 30_000) return "skipped (time budget)";
    try {
      return await verifyItems(apiKey, reg, byId, dropped, Math.min(30_000, clock.remaining() - 10_000));
    } catch (e) {
      warnings.push(`Verifier failed (${(e as Error)?.message ?? e}); statements are unchecked.`);
      return "failed";
    }
  };
  const keep = (xs: Item[]) => xs.filter((x) => !x.rejected);

  try {
    if (part === "overview") {
      const prompt = topup
        ? `${SYNTH_HEAD(state, today)}${avoid}
5. challenges: propose ${want + 2} ADDITIONAL challenges the sub-sector faces, on angles NOT covered by the accepted ones above, ${TITLE}. Leave overview null.`
        : `${SYNTH_HEAD(state, today)}
5. overview: 2-3 sentences on the sub-sector's current state, key pressures and transformation imperatives.
6. challenges: propose 7-9 candidate challenges the sub-sector faces (more than will be kept; the weakest are discarded), ${TITLE}.`;
      const raw = await structured(apiKey, clock, warnings, "Synthesis (overview)", prompt, OVERVIEW_SCHEMA, true, 0.3, RESERVE);
      const overviewArr = topup ? [] : await vetItems(apiKey, [raw?.overview], "overview", byId, "interpretive", dropped, reg, repaired, clock);
      const challengesAll = dedupe(await vetItems(apiKey, list(raw?.challenges), "challenges", byId, "interpretive", dropped, reg, repaired, clock), "challenges", dropped);
      const verifier = await verify();
      return json({ part, ok: true, overview: keep(overviewArr)[0] ?? null, challenges: keep(challengesAll).slice(0, 8), repaired, verifier, dropped, warnings });
    }
    if (part === "initiatives") {
      const prompt = topup
        ? `${SYNTH_HEAD(state, today)}${avoid}
5. initiatives: propose ${want + 2} ADDITIONAL things organizations in this sub-sector are actually doing now, on angles NOT covered by the accepted ones above, ${TITLE}. Describe what is being done, not what should be done.`
        : `${SYNTH_HEAD(state, today)}
5. initiatives: propose 6-8 candidate things organizations in this sub-sector are actually doing now (programs, investments, partnerships, operating-model changes), ${TITLE}. Describe what is being done, not what should be done. More than will be kept; the weakest are discarded.`;
      const raw = await structured(apiKey, clock, warnings, "Synthesis (initiatives)", prompt, INITIATIVES_SCHEMA, true, 0.3, RESERVE);
      const all = dedupe(await vetItems(apiKey, list(raw?.initiatives), "initiatives", byId, "event", dropped, reg, repaired, clock), "initiatives", dropped);
      const verifier = await verify();
      return json({ part, ok: true, initiatives: keep(all).slice(0, 8), repaired, verifier, dropped, warnings });
    }
    // needs: derived from the validated challenges and initiatives
    const challenges = list(body?.challenges).map((c) => (typeof c?.text === "string" ? c.text : "")).filter(Boolean).slice(0, 8);
    const initiatives = list(body?.initiatives).map((c) => (typeof c?.text === "string" ? c.text : "")).filter(Boolean).slice(0, 8);
    if (!challenges.length && !initiatives.length) return json({ part, ok: false, needs: [], dropped, warnings: ["No validated challenges or initiatives to derive needs from."] });
    const prompt = `${SYNTH_HEAD(state, today)}${avoid}

VALIDATED CHALLENGES:
${challenges.map((c, i) => `C${i + 1}. ${c}`).join("\n") || "(none)"}

VALIDATED INITIATIVES:
${initiatives.map((c, i) => `I${i + 1}. ${c}`).join("\n") || "(none)"}

5. needs: ${topup ? `propose ${want + 2} ADDITIONAL needs, different from the accepted ones above` : "propose 9-10 candidate needs (more than will be kept; the weakest are discarded)"} of organizations in this sub-sector. Each must follow from at least one challenge or initiative above; do not invent unrelated needs, and do not describe consulting services.
6. name: 5-8 words naming the need in business terms. signals: 3-5 short, observable things a seller could listen for in a conversation with a prospect (symptoms, not statistics; do not invent figures). narrative: 2-3 sentences on why this need matters now for the sub-sector, interpreting the cited evidence (no statistic unless it is exactly in the evidence); do NOT mention consulting offerings or services. basedOn: the E numbers the narrative rests on.`;
    const raw = await structured(apiKey, clock, warnings, "Synthesis (needs)", prompt, NEEDS_SCHEMA, true, 0.3, RESERVE);
    const seen = new Set<string>(exclude.map((t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "")));
    const vetted = await vetNeeds(apiKey, list(raw?.needs), byId, dropped, reg, repaired, clock);
    const verifier = await verify();
    const needs = vetted.filter((n) => !n.item?.rejected).filter((n) => {
      const k = n.name.toLowerCase().replace(/[^a-z0-9 ]/g, "");
      if (seen.has(k)) {
        dropped.push({ path: "needs", reason: "duplicate of an earlier need", text: n.name });
        return false;
      }
      seen.add(k);
      return true;
    }).slice(0, 10);
    return json({ part, ok: true, needs, repaired, verifier, dropped, warnings });
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

// ---------- Source titles ----------
// Best effort: replace a source's domain-only title with the page's own <title>. Never blocks the report for long.
async function fetchTitles(sources: Source[], budgetMs: number): Promise<void> {
  const deadline = Date.now() + budgetMs;
  const decode = (t: string) => t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
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
    const title = m ? decode(m[1]).replace(/\s+/g, " ").trim() : "";
    if (title && !/^(just a moment|access denied|attention required|403|404|forbidden|robot|captcha)/i.test(title)) {
      const host = hostOf(src.url, src.title);
      src.title = `${title.slice(0, 150)}${host ? ` — ${host}` : ""}`;
    }
  }));
}

// 5. Final assembly: re-validate, drop needs without a valid offer, number only the sources actually cited.
async function v2Report(apiKey: string, body: Any, clock: ReturnType<typeof makeClock>) {
  const state = readState(body?.state);
  if (!state) return json({ error: "Missing or invalid research state. Start again." }, 400);
  const byId = new Map(state.evidence.map((e) => [e.id, e]));
  const dropped: Dropped[] = list(body?.dropped).slice(0, 300).map((d) => ({ path: String(d?.path ?? ""), reason: String(d?.reason ?? ""), text: String(d?.text ?? "").slice(0, 400) }));
  const warnings = [...state.warnings, ...list(body?.clientWarnings).map(String).slice(0, 40)];

  const reg: { path: string; item: Item }[] = [];
  let overview = checkItem(body?.overview, "overview", byId, dropped, reg);
  let challenges = dedupe(list(body?.challenges).map((c, i) => checkItem(c, `challenges[${i}]`, byId, dropped, reg)).filter((c): c is Item => !!c), "challenges", dropped).slice(0, 5);
  let initiatives = dedupe(list(body?.initiatives).map((c, i) => checkItem(c, `initiatives[${i}]`, byId, dropped, reg, "event")).filter((c): c is Item => !!c), "initiatives", dropped).slice(0, 5);
  const offers = list(body?.offers);
  let needs = list(body?.needs).slice(0, 10).flatMap((n, i) => {
    const need = checkNeed(n, `needs[${i}]`, byId, dropped, reg);
    const o = offers[i];
    const mcOffers = [...new Set(list(o?.mcOffers).filter((x) => VALID_SET.has(x)))].slice(0, MAX_OFFERS_PER_NEED);
    if (!need) return [];
    if (!mcOffers.length) {
      dropped.push({ path: `needs[${i}]`, reason: "no valid catalog offer", text: need.name });
      return [];
    }
    return [{ ...need, mcOffers, offerNarrative: typeof o?.offerNarrative === "string" ? o.offerNarrative.trim() : "" }];
  });

  // Statements were already verified in the synth parts (and rewritten once if a figure was the only problem);
  // the report re-validates deterministically, trims to the final sizes and assembles.
  const verifier = list(body?.verifierLog).map((x) => String(x).slice(0, 120)).slice(0, 8).join("; ") || "not run";
  const repairedLog = list(body?.repaired).slice(0, 40).map((r) => ({ path: String(r?.path ?? ""), before: String(r?.before ?? "").slice(0, 400), after: String(r?.after ?? "").slice(0, 400) }));
  const topUps = list(body?.topUps).map((x) => String(x).slice(0, 120)).slice(0, 6);
  needs = needs.slice(0, 8);

  // Number sources in order of first citation so the Sources list only holds what the text cites.
  // At most 3 citations per statement: best source tier first, then sources shared by several cited facts, then earliest.
  const remap = new Map<number, number>();
  const cite = (ids: number[]) => {
    const score = new Map<number, { tier: number; n: number }>();
    for (const id of ids) {
      const e = byId.get(id);
      if (!e) continue;
      e.sourceIds.forEach((sid, i) => {
        const t = e.srcTiers?.[i] ?? e.tier ?? 3;
        const cur = score.get(sid);
        if (cur) {
          cur.tier = Math.min(cur.tier, t);
          cur.n++;
        } else {
          score.set(sid, { tier: t, n: 1 });
        }
      });
    }
    const top = [...score.entries()].sort((a, b) => a[1].tier - b[1].tier || b[1].n - a[1].n || a[0] - b[0]).slice(0, 3).map(([sid]) => sid);
    const nums = top.map((sid) => {
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
  const sources: Source[] = [...byNew.entries()].sort((a, b) => a[0] - b[0]).map(([newId, oldId]) => ({
    id: newId, title: srcById.get(oldId)?.title ?? `Source ${newId}`, url: srcById.get(oldId)?.url ?? "", tier: srcById.get(oldId)?.tier ?? 3,
  }));
  // Real page titles for the sources that are cited (best effort; the domain stays as fallback).
  await fetchTitles(sources, Math.min(8_000, Math.max(0, clock.remaining() - 8_000)));
  const tierCounts = { primary: 0, major: 0, other: 0 };
  for (const src of sources) tierCounts[src.tier === 1 ? "primary" : src.tier === 2 ? "major" : "other"]++;

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
      sourcesDroppedByType: state.droppedByTier,
      sourceTiers: tierCounts,
      verifier,
      repaired: repairedLog,
      topUps,
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
      case "report": return await v2Report(GEMINI_API_KEY, body, clock);
    }
    return await legacyRefresh(GEMINI_API_KEY, body);
  } catch (e) {
    console.error("Edge function error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
