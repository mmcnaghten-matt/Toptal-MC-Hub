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

async function callGemini(apiKey: string, prompt: string, useSchema: boolean) {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subIndustryId, subIndustryName, industryName } = await req.json();
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
      let res = await callGemini(GEMINI_API_KEY, prompt, useSchema);
      if (!res.ok && res.status === 400 && useSchema) {
        console.error("Gemini rejected responseSchema, retrying without it:", res.errorText);
        useSchema = false;
        res = await callGemini(GEMINI_API_KEY, prompt, false);
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
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
