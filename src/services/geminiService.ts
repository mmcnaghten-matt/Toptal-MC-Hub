import { supabase } from "@/integrations/supabase/client";

export interface ResearchResult {
  companyName: string;
  executiveSummary: {
    tldr: string;
    keyTrends: string[];
    competitivePositioning: string;
    bigOpportunity: string;
  };
  businessPerformance: {
    financialHighlights: string;
    recentMetrics: string[];
    strategicInitiatives: { name: string; description: string }[];
  };
  marketOverview: {
    definition: string;
    metrics: { tam: string; sam: string; som: string };
    segmentation: string[];
    drivers: string[];
    inhibitors: string[];
  };
  competitiveLandscape: {
    directCompetitors: string[];
    indirectCompetitors: string[];
    potentialEntrants: string[];
  };
  competitorDeepDives: {
    name: string;
    profile: { revenue: string; headcount: string; activity: string };
    strengths: string[];
    valueProposition: string;
    gapAnalysis: string;
    pricingModel: string;
  }[];
  strategicFrameworks: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    portersFiveForces: {
      buyerPower: string;
      supplierPower: string;
      competitiveRivalry: string;
      threatOfSubstitution: string;
      threatOfNewEntry: string;
    };
    pestle: {
      political: string;
      economic: string;
      social: string;
      technological: string;
      legal: string;
      environmental: string;
    };
  };
  customerInsights: {
    sentiment: string;
    winLossReasons: string;
    unmetNeeds: string;
  };
  recommendations: {
    product: string[];
    marketing: string[];
    resourceAllocation: string;
    roadmap: string;
  };
  mcOpportunities: {
    initiative: string;
    need: string;
    serviceOffering: string;
    rationale: string;
  }[];
  sources: { title: string; url: string }[];
}

// Cloud Run service (no 150s limit). When unset, fall back to the Supabase edge function.
const RESEARCH_URL = (import.meta.env.VITE_RESEARCH_URL as string | undefined)?.replace(/\/$/, "");

export async function performResearch(companyName: string, deepResearch: boolean = true): Promise<ResearchResult> {
  if (RESEARCH_URL) {
    const res = await fetch(RESEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, deepResearch }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.error) {
      throw new Error(body?.error || `Research request failed (HTTP ${res.status})`);
    }
    return body as ResearchResult;
  }

  if (!supabase) {
    throw new Error("Backend not configured. This feature requires a published deployment with Lovable Cloud enabled.");
  }

  // Supabase Free plan caps requests at 150s, which the Pro-model pipeline can exceed: always use fast mode here.
  const { data, error } = await supabase.functions.invoke("gemini-research", {
    body: { companyName, deepResearch: false },
  });

  if (error) {
    // functions.invoke hides the response body on non-2xx; the function puts a readable message in it.
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.error || error.message || "Failed to perform research");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ResearchResult;
}
// Testing pipeline automation fix