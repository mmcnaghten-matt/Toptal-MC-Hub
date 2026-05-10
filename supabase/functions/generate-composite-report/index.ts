import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      diagnostic_title,
      questions,
      answers,
      score_summary,
      respondent_count,
      context_label,
    } = await req.json();

    if (!answers || !questions) {
      return new Response(
        JSON.stringify({ error: "answers and questions are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalScore = Object.values(answers as Record<string, number>).reduce(
      (sum: number, v: unknown) => sum + (Number(v) || 0), 0
    );
    const maxRaw = Array.isArray(questions)
      ? questions.reduce((sum: number, q: { options?: string[] }) => sum + ((q.options?.length ?? 1) - 1), 0)
      : 72;
    const pct = maxRaw > 0 ? totalScore / maxRaw : 0;
    let maturityLevel: string;
    if (pct < 0.21) maturityLevel = "Foundational";
    else if (pct < 0.42) maturityLevel = "Developing";
    else if (pct < 0.63) maturityLevel = "Integrated";
    else if (pct < 0.84) maturityLevel = "Predictive";
    else maturityLevel = "Optimized & Adaptive";

    const dimensionSummary = score_summary
      ? Object.entries(score_summary as Record<string, number>)
          .map(([dim, score]) => `  ${dim}: ${(score as number).toFixed(1)}/5.0`)
          .join("\n")
      : "  N/A";

    const answerDetail = Array.isArray(questions)
      ? questions
          .map((q: { id: string; text: string; dimension: string; options?: string[] }) => {
            const idx = (answers as Record<string, number>)[q.id] ?? 0;
            const optionText = q.options?.[idx] ?? `Level ${idx}`;
            return `[${q.dimension}] ${q.text}\n  → ${optionText}`;
          })
          .join("\n\n")
      : "N/A";

    const contextNote = context_label
      ? ` (${context_label})`
      : "";

    const prompt = `You are an expert AI transformation consultant. Analyze the following **composite** AI maturity assessment results for "${diagnostic_title}", representing averaged responses from ${respondent_count ?? "multiple"} respondents${contextNote}.

Overall composite maturity: ${maturityLevel} (averaged score: ${totalScore.toFixed(1)}/${maxRaw})

Composite pillar scores (1–5 scale, averaged across respondents):
${dimensionSummary}

Averaged detailed responses (rounded to nearest response option):
${answerDetail}

Based on the weakest pillars and biggest gaps in this composite profile, generate exactly 3 high-impact, specific strategic recommendations tailored to this group's collective situation. Each recommendation must be actionable and clearly linked to the composite assessment data.`;

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

    return new Response(
      JSON.stringify(content),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-composite-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
