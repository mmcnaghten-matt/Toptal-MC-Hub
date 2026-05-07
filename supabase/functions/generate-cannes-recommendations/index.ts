import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers, categories, totalScore, maturityLevel, maturityName, companyName } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const categoryScores = categories.map((c: { name: string; score: number }) => `- ${c.name}: ${c.score}/5`).join("\n");

    const prompt = `You are a strategic consultant specializing in media & entertainment fan/audience platform strategy.

A company "${companyName}" completed a Fan/Audience Platform Diagnostic assessment.

Overall Score: ${totalScore}/40
Maturity Level: Level ${maturityLevel} - ${maturityName}

Category Scores:
${categoryScores}

Based on these results, generate exactly 3 strategic recommendations. Focus on their weakest areas (lowest scores) first. Each recommendation must be specific to their scores and maturity level.

Return a JSON array with exactly 3 objects, each having:
- "title": A concise recommendation title (5-8 words)
- "rationale": Why this matters given their specific scores (2-3 sentences)
- "actions": An array of 2-3 specific strategic actions to take
- "impact": Expected business impact if implemented (1-2 sentences)

Return ONLY the JSON array, no other text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error", fallback: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let recommendations;
    try {
      let cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      // Fix common Gemini JSON issues: trailing commas, missing brackets
      cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
      recommendations = JSON.parse(cleaned);
    } catch {
      // Try to extract valid JSON array via regex
      try {
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          const fixed = arrayMatch[0].replace(/,\s*([}\]])/g, "$1");
          recommendations = JSON.parse(fixed);
        } else {
          throw new Error("No array found");
        }
      } catch {
        console.error("Failed to parse Gemini response:", content);
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response", fallback: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Recommendation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
