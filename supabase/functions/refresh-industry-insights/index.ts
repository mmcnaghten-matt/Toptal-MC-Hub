import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MC_SERVICE_OFFERINGS = [
  "Growth Strategy Consulting",
  "Digital Strategy Consulting",
  "Product Strategy Consulting",
  "AI Consulting",
  "Business Transformation Consulting",
  "Risk Management Consulting",
  "Risk Assessment Services",
  "Business Continuity Consulting",
  "Customer Experience Consulting",
  "Finance Transformation Consulting",
  "M&A Consulting",
  "M&A Due Diligence",
  "Post-Merger Integration Consulting",
  "Performance Improvement Consulting",
  "Performance Improvement",
  "Cost Reduction Consulting",
  "Supply Chain Consulting",
  "Inventory Management Services",
  "Workforce Transformation",
  "Workforce Transformation Consulting",
  "Change Management Consulting",
  "Sales Transformation Consulting",
  "Customer Service Consulting",
  "Commercial Excellence Consulting",
  "Pricing Consulting",
  "Responsible AI Consulting",
  "CFO Consulting",
  "Organizational Design Consulting",
  "Corporate Strategy Consulting",
  "Procurement Consulting",
  "Leadership Development Services",
  "Learning & Development Consulting",
  "Talent Management Consulting",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
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

    const systemPrompt = `You are an expert management consulting industry analyst. You produce structured industry intelligence for sales teams at a top-tier consulting firm. Your output must be precise, actionable, and current.`;

    const prompt = `Generate comprehensive industry insights for the sub-sector "${subIndustryName}" within the "${industryName}" industry.

IMPORTANT: Map needs to ONLY these MC Service Offerings (use exact names):
${MC_SERVICE_OFFERINGS.map(s => `- ${s}`).join("\n")}

Produce a JSON response with this exact structure:
{
  "overview": "A 2-3 sentence strategic overview of the sub-sector's current state, key pressures, and transformation imperatives.",
  "challenges": ["Challenge 1: Description...", "Challenge 2: Description...", "Challenge 3: Description..."],
  "initiatives": ["Initiative 1: Description...", "Initiative 2: Description...", "Initiative 3: Description...", "Initiative 4: Description..."],
  "needs": [
    {
      "name": "Short need title (5-8 words)",
      "signals": ["Signal 1", "Signal 2", "Signal 3", "Signal 4", "Signal 5"],
      "mcOffers": ["Exact MC Service Offering Name 1", "Exact MC Service Offering Name 2"],
      "narrative": "A 2-3 sentence sales narrative explaining how the mapped MC offerings address this need. Be specific about value propositions and expected outcomes."
    }
  ]
}

Requirements:
- 3-5 challenges, each with a bold title followed by a colon and description
- 3-5 initiatives, each with a bold title followed by a colon and description
- 5-8 needs, each with 3-5 signals, 2-4 mcOffers (from the list above ONLY), and a compelling narrative
- Use current 2025-2026 market data, trends, and statistics where possible
- Focus on actionable intelligence that helps sales teams position consulting services
- Each need's mcOffers must use EXACT names from the provided list`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "produce_industry_insights",
              description: "Return structured industry insights for a sub-sector",
              parameters: {
                type: "object",
                properties: {
                  overview: { type: "string", description: "2-3 sentence strategic overview" },
                  challenges: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 industry challenges"
                  },
                  initiatives: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 strategic initiatives"
                  },
                  needs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        signals: { type: "array", items: { type: "string" } },
                        mcOffers: { type: "array", items: { type: "string" } },
                        narrative: { type: "string" }
                      },
                      required: ["name", "signals", "mcOffers", "narrative"]
                    },
                    description: "5-8 industry needs with signals, MC offers, and narratives"
                  }
                },
                required: ["overview", "challenges", "initiatives", "needs"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "produce_industry_insights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI gateway error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI did not return structured output" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const insights = JSON.parse(toolCall.function.arguments);

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
