import { supabase } from "@/integrations/supabase/client";
import { runResearch, type ProgressChip } from "./researchPipeline";

export type { ProgressChip };

export interface MarketRow {
  segment: string;
  geography: string;
  year: number;
  value: string;
  publisher: string;
  cite: string;
}

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
    metrics: { tam: string; tamRows?: MarketRow[] };
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
  quality?: {
    scans?: { topic: string; status: string; ms: number; segments: number; retried: boolean }[];
    warnings?: string[];
    droppedCount?: number;
    dropped?: { path: string; reason: string; text: string }[];
    evidenceByTopic?: Record<string, number>;
    competitors?: { name: string; kind: string; evidenceCount: number; fieldsFound: number }[];
    sectionsOk?: Record<string, boolean>;
    verifier?: string;
  };
}

// One request to the research function. Errors carry the HTTP status so the pipeline can decide whether to retry.
async function callStep(body: Record<string, unknown>) {
  if (!supabase) {
    throw new Error("Backend not configured. This feature requires a published deployment with Lovable Cloud enabled.");
  }
  const { data, error } = await supabase.functions.invoke("gemini-research", { body });
  if (error) {
    // functions.invoke hides the response body on non-2xx; the function puts a readable message in it.
    const res = (error as { context?: Response }).context;
    const detail = await res?.json?.().catch(() => null);
    throw Object.assign(new Error(detail?.error || error.message || "Failed to perform research"), { status: res?.status });
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// The report is built from many small independent requests (see researchPipeline.ts).
export async function performResearch(
  companyName: string,
  deepResearch: boolean = true,
  onProgress?: (chips: ProgressChip[]) => void,
): Promise<ResearchResult> {
  return (await runResearch({ call: callStep, companyName, deepResearch, onProgress })) as ResearchResult;
}
// Testing pipeline automation fix