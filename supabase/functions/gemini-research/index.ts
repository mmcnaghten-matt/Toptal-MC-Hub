import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const resHeaders = { ...corsHeaders, "Content-Type": "application/json" };

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
1. Executive Summary: TL;DR for leadership, 2-3 key trends, competitive positioning (Leader/Challenger/Niche), and the "Big Opportunity".
2. Market Overview: Definition of the playground, TAM/SAM/SOM metrics, segmentation, and drivers/inhibitors.
3. Competitive Landscape: List of direct, indirect, and potential entrants.
4. Competitor Deep Dives: Detailed profiles for the top 3-5 competitors (Revenue, Headcount, Activity, Value Prop, Gap Analysis, Pricing).
5. Strategic Frameworks: Detailed SWOT, Porter's Five Forces, and PESTLE analysis.
6. Customer & Win-Loss Insights: Sentiment analysis, win/loss reasons, and unmet needs.
7. Recommendations: Strategic roadmap for Product, Marketing, and Resource Allocation.
8. MC Service Opportunities: Map the target company's initiatives and needs to specific Management Consulting (MC) service offerings (e.g., Digital Transformation, Operational Excellence, Strategic Growth, M&A Advisory, Change Management). Identify specific sales opportunities.

Provide specific, high-quality insights. Return the result as a valid JSON object with these exact keys:
executiveSummary (with tldr, keyTrends array, competitivePositioning, bigOpportunity),
marketOverview (with definition, metrics {tam, sam, som}, segmentation array, drivers array, inhibitors array),
competitiveLandscape (with directCompetitors array, indirectCompetitors array, potentialEntrants array),
competitorDeepDives (array of {name, profile {revenue, headcount, activity}, strengths array, valueProposition, gapAnalysis, pricingModel}),
strategicFrameworks (with swot {strengths, weaknesses, opportunities, threats arrays}, portersFiveForces {buyerPower, supplierPower, competitiveRivalry, threatOfSubstitution, threatOfNewEntry}, pestle {political, economic, social, technological, legal, environmental}),
customerInsights (with sentiment, winLossReasons, unmetNeeds),
recommendations (with product array, marketing array, resourceAllocation, roadmap),
mcOpportunities (array of {initiative, need, serviceOffering, rationale}).`;

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
