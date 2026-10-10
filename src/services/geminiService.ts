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
    strategicInitiativeGroups?: {
      group: string;
      subgroups: { name: string; items: { name: string; description: string }[] }[];
    }[];
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

export const RESEARCH_STAGES = ["Researching sources", "Extracting and verifying facts", "Writing analysis"] as const;

// The report is built in three chained calls so each stays under Supabase's 150s request limit.
// Each step returns `state`, which the next step needs.
async function callStep(body: Record<string, unknown>) {
  if (!supabase) {
    throw new Error("Backend not configured. This feature requires a published deployment with Lovable Cloud enabled.");
  }
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await supabase.functions.invoke("gemini-research", { body });
    if (!error) {
      if (data?.error) throw new Error(data.error);
      return data;
    }
    // functions.invoke hides the response body on non-2xx; the function puts a readable message in it.
    const res = (error as { context?: Response }).context;
    const status = res?.status;
    const retryable = attempt === 0 && (!status || status === 502 || status === 503);
    if (!retryable) {
      const detail = await res?.json?.().catch(() => null);
      throw new Error(detail?.error || error.message || "Failed to perform research");
    }
  }
}

export async function performResearch(
  companyName: string,
  deepResearch: boolean = true,
  onStage?: (stage: number) => void,
): Promise<ResearchResult> {
  onStage?.(0);
  const research = await callStep({ step: "research", companyName, deepResearch });
  onStage?.(1);
  const facts = await callStep({ step: "facts", state: research.state });
  onStage?.(2);
  return (await callStep({ step: "analysis", state: facts.state, deepResearch })) as ResearchResult;
}
// Testing pipeline automation fix