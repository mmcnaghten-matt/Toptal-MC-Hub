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

export async function performResearch(companyName: string, deepResearch: boolean = true): Promise<ResearchResult> {
  if (!supabase) {
    throw new Error("Backend not configured. This feature requires a published deployment with Lovable Cloud enabled.");
  }

  const { data, error } = await supabase.functions.invoke("gemini-research", {
    body: { companyName, deepResearch },
  });

  if (error) {
    throw new Error(error.message || "Failed to perform research");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ResearchResult;
}
// Testing pipeline automation fix