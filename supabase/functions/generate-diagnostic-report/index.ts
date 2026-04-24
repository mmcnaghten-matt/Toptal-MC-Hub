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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      diagnostic_id,
      response_id,
      respondent,
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

    // Build dimension summary for the prompt
    const dimensionSummary = score_summary
      ? Object.entries(score_summary as Record<string, number>)
          .map(([dim, score]) => `${dim}: ${score.toFixed(2)}/5.0`)
          .join(", ")
      : "N/A";

    // Build answer detail for the prompt
    const answerDetail = Array.isArray(questions)
      ? questions
          .map((q: { id: string; text: string; dimension: string }) =>
            `[${q.dimension}] ${q.text} → ${answers[q.id] ?? 'N/A'}/5`
          )
          .join("\n")
      : "N/A";

    const respondentInfo = respondent
      ? `${respondent.full_name}, ${respondent.job_title} (${respondent.department})`
      : "Unknown respondent";

    const prompt = `You are an expert AI strategy consultant. Analyze the following AI maturity assessment results and generate a comprehensive, actionable report.

Assessment: ${diagnostic_title}
Respondent: ${respondentInfo}

Dimension Scores:
${dimensionSummary}

Individual Responses:
${answerDetail}

Generate a detailed maturity report following the exact JSON schema below. Be specific, actionable, and tailored to this respondent's actual scores.

Maturity levels:
- Initial (avg score 1.0–1.9): Ad hoc, no formal AI practice
- Developing (2.0–2.9): Some experimentation, limited scale
- Defined (3.0–3.4): Documented processes, growing capability
- Managed (3.5–4.4): Systematic, measured, scaling
- Optimizing (4.5–5.0): Continuous improvement, industry-leading`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: "You are an expert AI transformation consultant generating structured maturity assessment reports.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "produce_maturity_report",
              description: "Return a structured AI maturity assessment report",
              parameters: {
                type: "object",
                required: ["maturity_level", "overall_score", "executive_summary", "dimension_insights", "priority_actions", "roadmap"],
                additionalProperties: false,
                properties: {
                  maturity_level: {
                    type: "string",
                    enum: ["Initial", "Developing", "Defined", "Managed", "Optimizing"],
                  },
                  overall_score: { type: "number", description: "Average score across all dimensions, 1–5" },
                  executive_summary: { type: "string", description: "2-3 paragraph executive summary" },
                  dimension_insights: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["dimension", "score", "strength", "gap", "recommendation"],
                      additionalProperties: false,
                      properties: {
                        dimension: { type: "string" },
                        score: { type: "number" },
                        strength: { type: "string" },
                        gap: { type: "string" },
                        recommendation: { type: "string" },
                      },
                    },
                  },
                  priority_actions: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["action", "rationale", "timeframe", "impact"],
                      additionalProperties: false,
                      properties: {
                        action: { type: "string" },
                        rationale: { type: "string" },
                        timeframe: {
                          type: "string",
                          enum: ["Quick Win", "Short-term", "Medium-term", "Long-term"],
                        },
                        impact: { type: "string" },
                      },
                    },
                  },
                  roadmap: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["phase", "label", "initiatives"],
                      additionalProperties: false,
                      properties: {
                        phase: { type: "string", description: "e.g. 'Phase 1 (0–3 months)'" },
                        label: { type: "string", description: "Short phase title" },
                        initiatives: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "produce_maturity_report" } },
      }),
    });

    if (!response.ok) {
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

    const content = JSON.parse(toolCall.function.arguments);

    // Store via service role (bypasses RLS)
    const { error: insertError } = await supabase
      .from("diagnostic_recommendations")
      .insert({
        diagnostic_id,
        response_id,
        content,
        model_used: "google/gemini-2.5-pro",
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
