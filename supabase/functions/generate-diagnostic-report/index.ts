import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      diagnostic_id,
      response_id,
      diagnostic_title,
      questions,
      answers,
      score_summary,
    } = await req.json();

    if (!diagnostic_id || !response_id || !answers) {
      return new Response(
        JSON.stringify({ error: "diagnostic_id, response_id, and answers are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotent — return existing recommendation if already generated
    const { data: existing } = await supabase
      .from("diagnostic_recommendations")
      .select("content")
      .eq("response_id", response_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify(existing.content),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute overall score and maturity level
    const totalScore = Object.values(answers as Record<string, number>).reduce(
      (sum: number, v: unknown) => sum + (Number(v) || 0), 0
    );
    let maturityLevel: string;
    if (totalScore <= 15) maturityLevel = "Foundational";
    else if (totalScore <= 30) maturityLevel = "Developing";
    else if (totalScore <= 45) maturityLevel = "Integrated";
    else if (totalScore <= 60) maturityLevel = "Predictive";
    else maturityLevel = "Optimized & Adaptive";

    // Build dimension score summary
    const dimensionSummary = score_summary
      ? Object.entries(score_summary as Record<string, number>)
          .map(([dim, score]) => `  ${dim}: ${(score as number).toFixed(1)}/5.0`)
          .join("\n")
      : "  N/A";

    // Build detailed answer narrative using option text
    const answerDetail = Array.isArray(questions)
      ? questions
          .map((q: { id: string; text: string; dimension: string; options?: string[] }) => {
            const idx = (answers as Record<string, number>)[q.id] ?? 0;
            const optionText = q.options?.[idx] ?? `Level ${idx}`;
            return `[${q.dimension}] ${q.text}\n  → ${optionText}`;
          })
          .join("\n\n")
      : "N/A";

    const prompt = `You are an expert AI transformation consultant. Analyze the following AI maturity assessment results for "${diagnostic_title}".

Overall maturity: ${maturityLevel} (score: ${totalScore}/72)

Pillar scores (1–5 scale):
${dimensionSummary}

Detailed responses:
${answerDetail}

Based on the weakest pillars and biggest gaps, generate exactly 3 high-impact, specific strategic recommendations tailored to this organization's situation. Each recommendation must be actionable and clearly linked to the assessment data.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            required: ["maturity_level", "recommendations"],
            properties: {
              maturity_level: { type: "string" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  required: ["title", "rationale", "strategic_action", "expected_impact"],
                  properties: {
                    title: { type: "string" },
                    rationale: { type: "string" },
                    strategic_action: { type: "string" },
                    expected_impact: { type: "string" },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${aiResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("No text in Gemini response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "Gemini did not return content" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = JSON.parse(text);

    // Store via service role (bypasses RLS)
    const { error: insertError } = await supabase
      .from("diagnostic_recommendations")
      .insert({
        diagnostic_id,
        response_id,
        content,
        model_used: "gemini-2.5-pro",
      });

    if (insertError) {
      console.error("Failed to insert recommendation:", insertError);
    }

    return new Response(
      JSON.stringify(content),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-diagnostic-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
