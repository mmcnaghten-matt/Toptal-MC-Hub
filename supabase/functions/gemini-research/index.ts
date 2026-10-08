import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const resHeaders = { ...corsHeaders, "Content-Type": "application/json" };

// Official MC taxonomy: L2 practice > L3 offering, with the canonical L3 description.
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

type Opportunity = { initiative: string; need: string; serviceOffering: string; rationale: string };

// Re-map rows whose serviceOffering is not in the catalog. Uses a small focused call with an
// enum-constrained schema; never throws (the main report must not fail because of this).
async function repairOfferings(apiKey: string, rows: Opportunity[], indexes: number[]): Promise<Map<number, string>> {
  const fixes = new Map<number, string>();
  try {
    const list = indexes
      .map((i) => `${i}. Initiative: ${rows[i].initiative} | Need: ${rows[i].need} | Rationale: ${rows[i].rationale}`)
      .join("\n");
    const prompt = `For each numbered sales opportunity, choose the ONE catalog offering whose description most directly covers the need. Use the offering string exactly as written.

${CATALOG_PROMPT}

Opportunities:
${list}

Return a JSON array of {"index": <number>, "serviceOffering": "<exact catalog string>"}.`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  index: { type: "INTEGER" },
                  serviceOffering: { type: "STRING", format: "enum", enum: VALID_OFFERS },
                },
                required: ["index", "serviceOffering"],
              },
            },
          },
        }),
      },
    );
    if (!res.ok) {
      console.error("Offering repair call failed:", res.status, await res.text());
      return fixes;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const arr = text ? JSON.parse(text) : [];
    for (const r of Array.isArray(arr) ? arr : []) {
      if (indexes.includes(r?.index) && VALID_SET.has(r?.serviceOffering)) fixes.set(r.index, r.serviceOffering);
    }
  } catch (e) {
    console.error("Offering repair error:", e);
  }
  return fixes;
}

// Guarantee every returned opportunity maps to a catalog offering. Off-catalog rows are re-mapped
// once; anything still invalid is dropped rather than shown with an off-taxonomy name.
async function normalizeOpportunities(apiKey: string, raw: unknown): Promise<Opportunity[]> {
  const rows: Opportunity[] = (Array.isArray(raw) ? raw : []).filter((r) => r && typeof r === "object");
  const bad = rows.map((_, i) => i).filter((i) => !VALID_SET.has(rows[i].serviceOffering));
  if (bad.length > 0) {
    console.error(`${bad.length} opportunity row(s) had an off-catalog offering; repairing`);
    const fixes = await repairOfferings(apiKey, rows, bad);
    fixes.forEach((offer, i) => { rows[i] = { ...rows[i], serviceOffering: offer }; });
  }
  return rows.filter((r) => VALID_SET.has(r.serviceOffering));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 200, headers: resHeaders }
      );
    }

    const { companyName, deepResearch = true } = await req.json();
    if (!companyName) {
      return new Response(
        JSON.stringify({ error: "companyName is required" }),
        { status: 400, headers: resHeaders }
      );
    }

    const model = deepResearch ? "gemini-2.5-pro" : "gemini-2.5-flash";

    const prompt = `Perform a deep-dive, professional market and competitive research report on the company: "${companyName}".

Structure the report into these specific sections:
1. Executive Summary: TL;DR for leadership (weave in a brief reference to the company's recent financial performance and top strategic priorities), 2-3 key trends, competitive positioning (Leader/Challenger/Niche), and the "Big Opportunity".
2. Business Performance & Strategic Initiatives: Summarise the company's recent financial/business performance — revenue trajectory, growth rates, margin trends, and notable results from the last 1-2 years. Then list the company's key strategic initiatives currently underway; for each provide a concise name and a 2-3 sentence description of what it is and why it matters.
3. Market Overview: Definition of the playground, TAM/SAM/SOM metrics, segmentation, and drivers/inhibitors.
4. Competitive Landscape: List of direct, indirect, and potential entrants.
5. Competitor Deep Dives: Detailed profiles for the top 3-5 competitors (Revenue, Headcount, Activity, Value Prop, Gap Analysis, Pricing).
6. Strategic Frameworks: Detailed SWOT, Porter's Five Forces, and PESTLE analysis.
7. Customer & Win-Loss Insights: Sentiment analysis, win/loss reasons, and unmet needs.
8. Recommendations: Strategic roadmap for Product, Marketing, and Resource Allocation.
9. MC Service Opportunities: Map the target company's initiatives and needs to Toptal Management Consulting (MC) service offerings from the catalog below ONLY. Identify specific sales opportunities.

MC SERVICE OFFERING CATALOG
Offerings are listed as "Practice > Offering": description. Use the quoted string EXACTLY as written (including the "Practice > " prefix).

${CATALOG_PROMPT}

Mapping rules for section 9:
- Select the offering whose DESCRIPTION most directly covers the need. Do not choose on name alone.
- Each row maps one initiative/need to exactly ONE offering. If an initiative needs more than one offering, add more rows.
- Prefer the most specific offering. "Change Management" and "Program & Portfolio Management" appear under every practice; use them only as an add-on row to a more specific offering, under the practice that fits.
- In each rationale, refer to the offering by its offering name only (e.g. "Finance AI"), without the "Practice > " prefix. Never mention an offering that is not in the catalog.

Provide specific, high-quality insights. Return the result as a valid JSON object with these exact keys:
executiveSummary (with tldr, keyTrends array, competitivePositioning, bigOpportunity),
businessPerformance (with financialHighlights string, recentMetrics array of concise metric strings, strategicInitiatives array of {name, description}),
marketOverview (with definition, metrics {tam, sam, som}, segmentation array, drivers array, inhibitors array),
competitiveLandscape (with directCompetitors array, indirectCompetitors array, potentialEntrants array),
competitorDeepDives (array of {name, profile {revenue, headcount, activity}, strengths array, valueProposition, gapAnalysis, pricingModel}),
strategicFrameworks (with swot {strengths, weaknesses, opportunities, threats arrays}, portersFiveForces {buyerPower, supplierPower, competitiveRivalry, threatOfSubstitution, threatOfNewEntry}, pestle {political, economic, social, technological, legal, environmental}),
customerInsights (with sentiment, winLossReasons, unmetNeeds),
recommendations (with product array, marketing array, resourceAllocation, roadmap),
mcOpportunities (array of {initiative, need, serviceOffering, rationale} where serviceOffering is an exact catalog string such as "Finance > Finance AI").`;

    // Retry up to 3 times on transient errors
    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt + 1}...`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error(`Attempt ${attempt + 1} - Gemini API error:`, apiResponse.status, errorText);
        lastError = `${apiResponse.status}`;

        // Don't retry on client errors (4xx)
        if (apiResponse.status >= 400 && apiResponse.status < 500) {
          return new Response(
            JSON.stringify({ error: `Gemini API error: ${apiResponse.status}` }),
            { status: 200, headers: resHeaders }
          );
        }
        continue; // retry on 5xx
      }

      const apiData = await apiResponse.json();
      const text = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = "No response from Gemini";
        console.error(`Attempt ${attempt + 1}: ${lastError}`);
        continue;
      }

      const parsed = JSON.parse(text);
      parsed.mcOpportunities = await normalizeOpportunities(GEMINI_API_KEY, parsed.mcOpportunities);

      const sources = apiData.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
          title: chunk.web?.title || "Source",
          url: chunk.web?.uri || "",
        }))
        .filter((s: any) => s.url) || [];

      return new Response(
        JSON.stringify({ ...parsed, companyName, sources }),
        { headers: resHeaders }
      );
    }

    // All retries exhausted
    return new Response(
      JSON.stringify({ error: `AI service temporarily unavailable after 3 attempts. Please try again shortly.` }),
      { status: 200, headers: resHeaders }
    );

  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: resHeaders }
    );
  }
});
