import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REFERENCE_CONTEXT = `
# M&E Platform Maturity Diagnostic Model — Reference Knowledge

## Executive Summary
The M&E sector faces an existential crisis. Traditional linear revenue streams are in irreversible decline, challenged by hyper-capitalized digital platforms. The core tension is between entrenched legacy models and the imperative to transform into agile, AI-powered, multi-sided platforms (MSPs) that orchestrate decentralized ecosystems of creators, consumers, and advertisers.

## Six Pillars of Maturity

### Pillar 1: Ecosystem Strategy & Orchestration
Evaluates the shift from a linear "pipe" to a modular ecosystem managing interdependencies between creators, consumers, and advertisers. Key concepts: multi-sided platforms, network effects (same-side and cross-side), strategic subsidies to solve "chicken-and-egg" problems, platform immunity from individual product failures, leadership as "Chief Inspiration Officer."

### Pillar 2: Data Mastery
Assesses use of integrated data pipelines and AI to move from reactive reporting to proactive, intelligent decision-making. Key concepts: data debt, cloud-native architectures, Digital Twin modeling, MLOps, ethical AI governance, bias mitigation, lineage tracking. Organizations often start with high data debt—low-quality, siloed data with no accurate metadata.

### Pillar 3: Content Lifecycle & AI Augmentation
Evaluates evolution from centralized production to a collaborative "Human-AI" content innovation loop. Key concepts: Innovation Toolkits for user-generated content, GenAI augmenting creative strategy (transforming up to 50% of working hours), AI-driven content discovery replacing traditional search, modular/tagged content assets, real-time translation and accessibility.

### Pillar 4: Monetization & Value Capture Systems
Transitioning from one-sided revenue models to sophisticated "asymmetric pricing." Key concepts: charging the "money side" (advertisers) while subsidizing the "subsidy side" (consumers), closed-loop measurement, predictive attribution, Digital Equity for creators, dynamic price elasticity, real-time price optimization based on VUCA market signals.

### Pillar 5: Architecture & Technological Interoperability
Measuring the move from rigid silos to "Open Digital Architecture" (ODA). Key concepts: Cloud-Edge Continuum, standardized external-facing APIs, self-healing infrastructure, Platform Center of Excellence (COE), competing/modular vendor components, zero-touch automation.

### Pillar 6: Governance, Trust & Community
Assessing the platform's role as a "regulator" fostering "social-first" communities. Key concepts: meta-moderation, blockchain for royalty distribution, community data integrated with CRM, Digital Equity and responsible AI, strategic automated content moderation.

## Five Maturity Levels
- Level 1 (Foundational): Operates as a one-way reseller. High risk of "Digital Darwinism" due to siloed data and manual processes.
- Level 2 (Developing): Recognizes platform value but lacks cohesive strategy. High "data debt" and localized digital pilots.
- Level 3 (Integrated): Processes are documented and aligned. A "single source of truth" exists; cloud-native shifts underway.
- Level 4 (Predictive): Uses advanced analytics and ML to forecast demand. Governance is a strategic capability.
- Level 5 (Optimized & Adaptive): Acts as a proactive intelligent engine leveraging network effects and AI-human collaboration for exponential growth.

## Key Strategic Themes from Market Intelligence
- Consumer Behavioral Shift: Modern audiences prioritize active participation over passive consumption, seeking personalized, interactive experiences.
- Creator Empowerment: Creators demand more control over IP, monetization, and direct audience relationships. Platforms must shift from content ownership to ecosystem enablement.
- Subscription Fatigue: Consumers are overwhelmed by rigid subscription models. Flexible monetization (micropayments, token-gated access, dynamic pricing) is essential.
- AI/ML as Competitive Differentiator: AI enables hyper-personalization, intelligent content recommendations, dynamic monetization at scale, and operational efficiency.
- Niche Community Building: Specialized platforms with curated content and robust community features drive strong loyalty and network effects.
- Digital Darwinism Risk: Organizations clinging to linear, proprietary models will see audiences, creators, and ad revenue migrate to dynamic platforms.
- Digital Equity: Organizations must own direct relationships with communities and empower creators with transparent data they can use as business collateral.

## Strategic Opportunity Areas
1. AI-Powered Niche Content & Community Hubs — aggregate and curate hyper-personalized content for specific niches with community features.
2. Creator Empowerment & Flexible Monetization Platforms — comprehensive tools for direct audience engagement, transparent revenue sharing, flexible monetization.
3. Interactive Storytelling & Participatory Event Platforms — interactive narratives, live participatory events, AR/VR experiences.
4. M&E Ecosystem Orchestrator Toolkit — modular tools for managing governance, onboarding, content moderation, and analytics across MSPs.
5. Adaptive Content Personalization & Discovery Co-Pilot — AI co-pilot for content strategists to understand trends, predict performance, recommend content mixes.
`;

const PILLAR_NAMES = [
  "Ecosystem Strategy & Orchestration",
  "Data Mastery",
  "Content Lifecycle & AI Augmentation",
  "Monetization & Value Capture Systems",
  "Architecture & Technological Interoperability",
  "Governance, Trust & Community",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pillarScores, responses, pillarQuestions } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a summary of the user's survey results
    const scoreSummary = PILLAR_NAMES.map(
      (name, i) => `- ${name}: ${pillarScores[i]}/5`
    ).join("\n");

    const overallAvg =
      Math.round(
        (pillarScores.reduce((a: number, b: number) => a + b, 0) /
          pillarScores.length) *
          10
      ) / 10;

    // Build response details
    let responseDetails = "";
    if (pillarQuestions) {
      responseDetails = "\n\n## Detailed Survey Responses:\n";
      for (const pillar of pillarQuestions) {
        responseDetails += `\n### ${pillar.pillarName}\n`;
        for (const q of pillar.questions) {
          responseDetails += `- Q: ${q.questionText}\n  A: ${q.selectedOption}\n`;
        }
      }
    }

    const systemPrompt = `You are an expert strategic advisor specializing in Media & Entertainment digital transformation and multi-sided platform (MSP) strategy. You have deep knowledge of platform maturity models and the M&E industry landscape.

${REFERENCE_CONTEXT}

Your task is to analyze survey results from an M&E organization's platform maturity assessment and provide exactly 3 strategic recommendations. Each recommendation should:
1. Be specific and actionable, not generic
2. Directly address the organization's weakest areas (lowest scoring pillars)
3. Reference specific concepts, frameworks, or strategies from the reference knowledge
4. Include a clear rationale tied to the survey responses
5. Suggest concrete next steps

Format your response as exactly 3 recommendations using this structure for each:

**Recommendation [1/2/3]: [Title]**

**Rationale:** [Why this matters based on their scores and responses]

**Strategic Action:** [Specific, actionable steps they should take]

**Expected Impact:** [What improvement this will drive]

Keep each recommendation concise but substantive (3-5 sentences per section). Focus on the most impactful improvements that will accelerate their platform maturity journey.`;

    const userPrompt = `Here are the survey results for an M&E organization's Platform Maturity Assessment:

## Pillar Scores (out of 5):
${scoreSummary}

## Overall Maturity Score: ${overallAvg}/5
${responseDetails}

Based on these results, provide 3 strategic recommendations to improve their platform maturity. Focus especially on their weakest areas and provide actionable, strategic guidance that references the maturity model framework.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Failed to generate recommendations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ recommendations: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
