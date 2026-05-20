import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const resHeaders = { ...corsHeaders, "Content-Type": "application/json" };

interface Signal {
  id: string;
  tag: string;
  shortLabel: string;
  quote: string;
  hub: string;
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

    const { userText, buyerRole, signals } = await req.json();

    if (!userText || typeof userText !== "string" || !userText.trim()) {
      return new Response(
        JSON.stringify({ error: "userText is required" }),
        { status: 400, headers: resHeaders }
      );
    }

    if (!Array.isArray(signals) || signals.length === 0) {
      return new Response(
        JSON.stringify({ error: "signals array is required" }),
        { status: 400, headers: resHeaders }
      );
    }

    const signalLines = (signals as Signal[])
      .map((s) => `${s.id} | ${s.tag} | ${s.shortLabel} | "${s.quote}"`)
      .join("\n");

    const prompt = `You are a management consulting service signal matcher.
A sales professional has described a client's business challenge. Identify which predefined buying signal best matches.

Buyer role: ${buyerRole ?? "not specified"}
Sales professional's description: "${userText.trim()}"

Available signals (id | tag | shortLabel | verbatim quote):
${signalLines}

Rules:
- Choose the SINGLE best match based on semantic similarity of the core business problem
- Consider the buyer role context to break ties (e.g. CFO context → prefer finance signals)
- Return ONLY valid JSON with exactly these four keys:
  {
    "signalId": "ft2",
    "signalTag": "Slow Close Cycle",
    "hubName": "Finance Transformation",
    "reason": "One concise sentence of 20 words or fewer explaining why this is the best match."
  }`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
      const errText = await apiResponse.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI matching service unavailable. Please try the dropdown instead." }),
        { status: 200, headers: resHeaders }
      );
    }

    const geminiData = await apiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "No response from AI. Please try again." }),
        { status: 200, headers: resHeaders }
      );
    }

    let parsed: { signalId: string; signalTag: string; hubName: string; reason: string };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("Failed to parse Gemini JSON:", rawText);
      return new Response(
        JSON.stringify({ error: "Could not parse AI response. Please try again." }),
        { status: 200, headers: resHeaders }
      );
    }

    // Validate that the returned signalId actually exists in the signals list
    const validIds = (signals as Signal[]).map((s) => s.id);
    if (!parsed.signalId || !validIds.includes(parsed.signalId)) {
      return new Response(
        JSON.stringify({ error: "AI returned an unrecognised signal. Please try again or use the dropdown." }),
        { status: 200, headers: resHeaders }
      );
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: resHeaders });
  } catch (err) {
    console.error("match-hub-signal error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 200, headers: resHeaders }
    );
  }
});
