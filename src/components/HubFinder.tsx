import { useState } from "react";
import { ExternalLink, FileText, BarChart3, LayoutGrid, Loader2, Wand2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type HubId = "growth" | "business" | "finance" | "perf" | "supply" | "workforce";
type Practice = "Strategy" | "Finance" | "Operations" | "People";

interface Hub {
  id: HubId;
  name: string;
  practice: Practice;
  rationale: string;
  docUrl: string;
  sellersSheetUrl: string;
  diagnosticUrl: string;
}

interface Signal {
  id: string;
  tag: string;
  shortLabel: string;
  quote: string;
  hub: HubId;
}

interface BuyerGroup {
  group: string;
  options: string[];
}

interface ServiceModule {
  name: string;
  challenge: string;
  objective: string;
  duration: string;
  outcomes: string[];
}

interface AdjacentService {
  name: string;
  type: "universal" | "secondary";
  docUrl?: string;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PRACTICE_COLORS: Record<Practice, string> = {
  Strategy:   "bg-primary/10 text-primary",
  Finance:    "bg-accent text-accent-foreground",
  Operations: "bg-destructive/10 text-destructive",
  People:     "bg-muted text-muted-foreground",
};

// ── Hub definitions ───────────────────────────────────────────────────────────

const hubs: Record<HubId, Hub> = {
  growth: {
    id: "growth",
    name: "Growth Strategy",
    practice: "Strategy",
    rationale: "Connect with our Growth Strategy practice to develop a structured expansion roadmap, align your marketing and sales teams, and unlock new market opportunities.",
    docUrl: "https://docs.google.com/presentation/d/1lN6S_ESoqT3ZLkBr7w5MP6rsnp8_974nxLIJhenJutk/edit?usp=sharing",
    sellersSheetUrl: "https://docs.google.com/document/d/15j8g5YQ7bdnigvMeR1eAgU2K5W9_EZMLG8Xs3OQVySc/edit?usp=sharing",
    diagnosticUrl: "/diagnostics/growth-strategy",
  },
  business: {
    id: "business",
    name: "Business Transformation",
    practice: "Strategy",
    rationale: "Connect with our Business Transformation practice to build a clear transformation vision, prioritize high-impact initiatives, and drive measurable results enterprise-wide.",
    docUrl: "https://docs.google.com/presentation/d/1Dk3zvl6pwuoew2Y2yi8X3k8gR8owBN5SeK-vNh3Vmf4/edit?usp=drive_link",
    sellersSheetUrl: "https://docs.google.com/document/d/1kKYqaVQqdZNEbw1q5HxsS-dX3Ce0a-4xdai6QpxnAS8/edit?usp=sharing",
    diagnosticUrl: "/diagnostics/business-transformation",
  },
  finance: {
    id: "finance",
    name: "Finance Transformation",
    practice: "Finance",
    rationale: "Connect with our Finance Transformation practice to modernize financial operations, eliminate manual bottlenecks, and elevate finance into a true strategic partner.",
    docUrl: "https://docs.google.com/presentation/d/1_incQcSAXJG5faq7hOjorbbjG4IoANs7VQTMg6tZdVk/edit?usp=drive_link",
    sellersSheetUrl: "https://docs.google.com/document/d/1fa7xf7L0V7417A8xEOfXLxhEF3sSchhRQMKhDtGpdsk/edit?usp=sharing",
    diagnosticUrl: "/diagnostics/finance-transformation",
  },
  perf: {
    id: "perf",
    name: "Performance Improvement",
    practice: "Operations",
    rationale: "Connect with our Performance Improvement practice to diagnose operational drag, eliminate value leakage, and deliver sustainable efficiency and EBITDA gains.",
    docUrl: "https://docs.google.com/presentation/d/1bKjSw5MgD5mzLbK-lMtIGoKXOwj09QH7fXRfOB9MLvY/edit?usp=drive_link",
    sellersSheetUrl: "https://docs.google.com/document/d/1lah0V9ttO_KdMhXPDT2k-6-FaGrPRT9TrYATtVteLI0/edit?usp=sharing",
    diagnosticUrl: "/diagnostics/performance-improvement",
  },
  supply: {
    id: "supply",
    name: "Supply Chain & Procurement",
    practice: "Operations",
    rationale: "Connect with our Supply Chain practice to build resilience, integrate digital capabilities, and optimize end-to-end logistics and procurement performance.",
    docUrl: "https://docs.google.com/presentation/d/1dn-i3M0XlWLs9t0F3PxIJeaNPIHBV5bluSgaasbaBFY/edit?usp=sharing",
    sellersSheetUrl: "https://docs.google.com/document/d/1JLsclhpbRlMiyiEEXGDxHK86azS9ittyOi6GCk-zwPQ/edit?usp=sharing",
    diagnosticUrl: "/diagnostics/supply-chain",
  },
  workforce: {
    id: "workforce",
    name: "Workforce Transformation",
    practice: "People",
    rationale: "Connect with our Workforce Transformation practice to align talent strategy, close skill gaps, and prepare your organization for the human-AI era.",
    docUrl: "https://docs.google.com/presentation/d/11xmJIF7nBPrY596wA3wXRqbmvHXv60q5qwRG4hLUuDo/edit?usp=sharing",
    sellersSheetUrl: "https://docs.google.com/document/d/1GjjF_7PxsKckocTSL9rRuVXQaHhpONNyzQAeaxHgspk/edit?usp=sharing",
    diagnosticUrl: "/diagnostics/workforce-transformation",
  },
};

// ── Adjacent services per hub (sourced from ConstellationDiagram edges) ───────
// Overview deck URLs from gtmMaterials in MCServices.tsx.
// Services with no dedicated overview deck appear name-only (no docUrl).

const HUB_ADJACENTS: Record<HubId, { universals: AdjacentService[]; secondaries: AdjacentService[] }> = {
  growth: {
    universals: [
      { name: "Change Management", type: "universal", docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link" },
      { name: "Digital Strategy",  type: "universal", docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing" },
      { name: "Risk & Compliance", type: "universal", docUrl: "https://docs.google.com/presentation/d/1AYj1Verb0kqX2K_BzlNa_C26gPIVPlUMiUI7dHvO7nc/edit?usp=drive_link" },
      // AI Consulting is not connected to Growth Strategy in the services web
    ],
    secondaries: [
      { name: "Product Strategy",            type: "secondary", docUrl: "https://docs.google.com/presentation/d/1IBYMMdmUUoPtPC2JMkSaa5j4k_xDqsP0aUgw2_UBl74/edit?usp=sharing" },
      { name: "Go-to-Market Consulting",     type: "secondary", docUrl: "https://docs.google.com/presentation/d/1D3Ffyb--yMt82ypsaj4J3Yg68TrZYzraWTyzhYY7SRo/edit?usp=sharing" },
      { name: "Customer Experience",         type: "secondary", docUrl: "https://docs.google.com/presentation/d/1DXkurtN5L74wXcpYM5RjcWHGyvM7kfOgzF6ZIboHKUc/edit?usp=drive_link" },
      { name: "M&A Consulting",              type: "secondary", docUrl: "https://docs.google.com/presentation/d/1kDU_9sQZ-wupu53099fIEgRrLSpNyco4uYcuuGBRNFc/edit?usp=drive_link" },
      { name: "Product Strategy Consulting", type: "secondary" }, // no dedicated overview deck
    ],
  },
  business: {
    universals: [
      { name: "Change Management", type: "universal", docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link" },
      { name: "Digital Strategy",  type: "universal", docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing" },
      { name: "AI Consulting",     type: "universal", docUrl: "https://docs.google.com/presentation/d/1P7sxLbSWMZuSFru7cOk1_qYlVV8sZU0Av0HBu3iXKR4/edit?usp=sharing" },
      { name: "Risk & Compliance", type: "universal", docUrl: "https://docs.google.com/presentation/d/1AYj1Verb0kqX2K_BzlNa_C26gPIVPlUMiUI7dHvO7nc/edit?usp=drive_link" },
    ],
    secondaries: [
      { name: "Customer Experience", type: "secondary", docUrl: "https://docs.google.com/presentation/d/1DXkurtN5L74wXcpYM5RjcWHGyvM7kfOgzF6ZIboHKUc/edit?usp=drive_link" },
    ],
  },
  finance: {
    universals: [
      { name: "Change Management", type: "universal", docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link" },
      { name: "Digital Strategy",  type: "universal", docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing" },
      { name: "AI Consulting",     type: "universal", docUrl: "https://docs.google.com/presentation/d/1P7sxLbSWMZuSFru7cOk1_qYlVV8sZU0Av0HBu3iXKR4/edit?usp=sharing" },
      { name: "Risk & Compliance", type: "universal", docUrl: "https://docs.google.com/presentation/d/1AYj1Verb0kqX2K_BzlNa_C26gPIVPlUMiUI7dHvO7nc/edit?usp=drive_link" },
    ],
    secondaries: [
      { name: "M&A Services",                type: "secondary", docUrl: "https://docs.google.com/presentation/d/1kDU_9sQZ-wupu53099fIEgRrLSpNyco4uYcuuGBRNFc/edit?usp=drive_link" },
      { name: "Corporate Finance Consulting", type: "secondary" }, // no dedicated overview deck
    ],
  },
  perf: {
    universals: [
      { name: "Change Management", type: "universal", docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link" },
      { name: "Digital Strategy",  type: "universal", docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing" },
      { name: "AI Consulting",     type: "universal", docUrl: "https://docs.google.com/presentation/d/1P7sxLbSWMZuSFru7cOk1_qYlVV8sZU0Av0HBu3iXKR4/edit?usp=sharing" },
      // Risk & Compliance is not connected to Performance Improvement in the services web
    ],
    secondaries: [],
  },
  supply: {
    universals: [
      { name: "Change Management", type: "universal", docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link" },
      { name: "Digital Strategy",  type: "universal", docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing" },
      { name: "AI Consulting",     type: "universal", docUrl: "https://docs.google.com/presentation/d/1P7sxLbSWMZuSFru7cOk1_qYlVV8sZU0Av0HBu3iXKR4/edit?usp=sharing" },
      { name: "Risk & Compliance", type: "universal", docUrl: "https://docs.google.com/presentation/d/1AYj1Verb0kqX2K_BzlNa_C26gPIVPlUMiUI7dHvO7nc/edit?usp=drive_link" },
    ],
    secondaries: [
      { name: "Inventory Management",    type: "secondary", docUrl: "https://docs.google.com/presentation/d/1i-FA39jVjQbCvMZJ-w4gT6A3AN1pEkqrsrNAzW92z_w/edit?usp=sharing" },
      { name: "Sustainability Consulting",type: "secondary" }, // no dedicated overview deck
    ],
  },
  workforce: {
    universals: [
      { name: "Change Management", type: "universal", docUrl: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link" },
      { name: "Digital Strategy",  type: "universal", docUrl: "https://docs.google.com/presentation/d/10mMIU1IY84quOUxZbo71bryJDa6BdHYzPqVi0iVOfHc/edit?usp=sharing" },
      { name: "AI Consulting",     type: "universal", docUrl: "https://docs.google.com/presentation/d/1P7sxLbSWMZuSFru7cOk1_qYlVV8sZU0Av0HBu3iXKR4/edit?usp=sharing" },
      { name: "Risk & Compliance", type: "universal", docUrl: "https://docs.google.com/presentation/d/1AYj1Verb0kqX2K_BzlNa_C26gPIVPlUMiUI7dHvO7nc/edit?usp=drive_link" },
    ],
    secondaries: [
      { name: "Organizational Design", type: "secondary" }, // no dedicated overview deck
      { name: "Talent Management",     type: "secondary" }, // no dedicated overview deck
    ],
  },
};

const HUB_ORDER: HubId[] = ["growth", "business", "finance", "perf", "supply", "workforce"];

// Hub priority order keyed by every buyer option — most relevant hub first
const BUYER_HUB_PRIORITY: Record<string, HubId[]> = {
  // Buying Center
  "Finance":                                   ["finance", "perf", "business", "supply", "growth", "workforce"],
  "Operations":                                ["perf", "supply", "business", "finance", "workforce", "growth"],
  "Supply Chain & Logistics":                  ["supply", "perf", "business", "finance", "growth", "workforce"],
  "Marketing & Sales":                         ["growth", "business", "perf", "workforce", "finance", "supply"],
  "Human Resources":                           ["workforce", "business", "perf", "growth", "finance", "supply"],
  "IT & Technology":                           ["perf", "business", "finance", "supply", "workforce", "growth"],
  "Strategy & Corporate Development":          ["business", "growth", "finance", "perf", "supply", "workforce"],
  "Growth & Innovation":                       ["growth", "business", "perf", "supply", "workforce", "finance"],
  // C-Suite
  "CEO / President":                           ["business", "growth", "perf", "finance", "supply", "workforce"],
  "Chief Operating Officer (COO)":             ["perf", "business", "supply", "finance", "workforce", "growth"],
  "Chief Financial Officer (CFO)":             ["finance", "perf", "business", "supply", "growth", "workforce"],
  "Chief Marketing Officer (CMO)":             ["growth", "business", "perf", "workforce", "finance", "supply"],
  "Chief Growth Officer (CGO)":                ["growth", "business", "perf", "finance", "supply", "workforce"],
  "Chief Strategy Officer (CSO)":              ["growth", "business", "perf", "finance", "supply", "workforce"],
  "Chief Sales Officer / Head of Sales":       ["growth", "business", "perf", "workforce", "finance", "supply"],
  "Chief Information Officer (CIO)":           ["perf", "business", "finance", "supply", "workforce", "growth"],
  "Chief Technology Officer (CTO)":            ["perf", "supply", "business", "finance", "workforce", "growth"],
  "Chief Digital Officer (CDO)":               ["business", "perf", "supply", "finance", "growth", "workforce"],
  "Chief Human Resources Officer (CHRO)":      ["workforce", "business", "perf", "growth", "finance", "supply"],
  "Chief Transformation Officer":              ["business", "perf", "workforce", "finance", "supply", "growth"],
  "Chief Sustainability Officer":              ["supply", "business", "perf", "workforce", "finance", "growth"],
  // Key Leaders
  "Finance Director":                          ["finance", "perf", "business", "supply", "growth", "workforce"],
  "VP / Director of Supply Chain":             ["supply", "perf", "business", "finance", "growth", "workforce"],
  "VP / Director of Learning & Development":   ["workforce", "business", "perf", "growth", "finance", "supply"],
  "Head of Operations":                        ["perf", "supply", "business", "finance", "workforce", "growth"],
  "Head of IT":                                ["perf", "business", "finance", "supply", "workforce", "growth"],
  "Head of HR":                                ["workforce", "business", "perf", "growth", "finance", "supply"],
  "Business Unit Leader / Division Head":      ["business", "perf", "growth", "workforce", "finance", "supply"],
  "Head of Product Development / Innovation":  ["growth", "business", "perf", "workforce", "finance", "supply"],
  "Operational Manager":                       ["perf", "supply", "business", "workforce", "finance", "growth"],
  "Board Member / Director":                   ["business", "finance", "growth", "perf", "supply", "workforce"],
};

// ── Buying signals (sourced from each hub's seller sheet) ─────────────────────

const signals: Signal[] = [
  // Growth Strategy
  { id: "gs1", tag: "Stagnant Revenue",           hub: "growth",
    shortLabel: "Revenue has flatlined — no new growth streams",
    quote: "Our revenue has flatlined, and we are struggling to identify new source streams beyond our core business." },
  { id: "gs2", tag: "Market Disruption",          hub: "growth",
    shortLabel: "A competitor is eroding our market share",
    quote: "A new, more agile competitor is eroding our market share, and our traditional strategies aren't working anymore." },
  { id: "gs3", tag: "Marketing-Sales Disconnect", hub: "growth",
    shortLabel: "Marketing and sales teams are completely out of sync",
    quote: "Our marketing and sales teams are completely out of sync, and it's killing our customer acquisition efficiency." },
  { id: "gs4", tag: "Strategy Vacuum",            hub: "growth",
    shortLabel: "Ambitious growth goals but no documented roadmap",
    quote: "We have ambitious growth goals but no formally documented roadmap or data-driven plan to achieve them." },
  { id: "gs5", tag: "Expansion Barriers",         hub: "growth",
    shortLabel: "Want to expand but lack expertise to navigate new markets",
    quote: "We want to enter a new market or launch a new product line, but we don't have the internal expertise to navigate the competitive or regulatory barriers." },

  // Business Transformation
  { id: "bt1", tag: "Declining Performance",      hub: "business",
    shortLabel: "Revenue falling, margins shrinking, losing customers",
    quote: "Our revenue is falling, profit margins are shrinking, or we are losing customers faster than we can acquire them." },
  { id: "bt2", tag: "Business Model Pressure",    hub: "business",
    shortLabel: "Regulations or competitors forcing a business model rethink",
    quote: "New regulations or aggressive moves by competitors are forcing us to rethink our entire business model." },
  { id: "bt3", tag: "Integration Failing",        hub: "business",
    shortLabel: "Post-merger integration is failing to hit growth targets",
    quote: "We've finished the merger, but the integration is failing, and we aren't hitting our projected growth targets." },
  { id: "bt4", tag: "Digital Lag",                hub: "business",
    shortLabel: "Systems are outdated — digital engagement behind the market",
    quote: "Our systems are outdated, and our customer engagement via digital channels is significantly behind the market." },
  { id: "bt5", tag: "Projects Not Moving Needle", hub: "business",
    shortLabel: "Dozens of projects underway but none are moving the needle",
    quote: "We have 50 projects going on, but none of them are actually 'moving the needle' or delivering results." },

  // Finance Transformation
  { id: "ft1", tag: "Manual Chaos",               hub: "finance",
    shortLabel: "Team spending most of their time on manual data entry",
    quote: "Our team spends 80% of their time on manual data entry and reconciliation instead of analysis." },
  { id: "ft2", tag: "Slow Close Cycle",           hub: "finance",
    shortLabel: "Takes 10+ business days to close the books",
    quote: "It takes us more than 10 business days to close the books, so our data is already old by the time leadership sees it." },
  { id: "ft3", tag: "Data Silos",                 hub: "finance",
    shortLabel: "Multiple conflicting data versions across ERP, CRM, HR",
    quote: "We have three different versions of 'the truth' because our ERP, CRM, and HR systems don't talk to each other." },
  { id: "ft4", tag: "Cost Center Perception",     hub: "finance",
    shortLabel: "Finance seen as a cost center, not a strategic partner",
    quote: "Finance is seen as a back-office cost center rather than a strategic partner that helps us grow." },
  { id: "ft5", tag: "Scalability Ceiling",        hub: "finance",
    shortLabel: "Finance too rigid and manual to support growth or acquisition",
    quote: "We want to expand or acquire, but our current finance processes are too rigid and manual to handle the increased volume." },

  // Performance Improvement
  { id: "pi1", tag: "Margin Erosion",             hub: "perf",
    shortLabel: "Revenue growing but profit margins keep shrinking",
    quote: "Our revenue is growing, but our profit margins are shrinking. We need to find and cut the waste." },
  { id: "pi2", tag: "Customer Dissatisfaction",   hub: "perf",
    shortLabel: "Spike in customer complaints about service delays or errors",
    quote: "We are seeing a spike in negative feedback regarding delays and errors in our service delivery." },
  { id: "pi3", tag: "Operational Bottlenecks",    hub: "perf",
    shortLabel: "Processes that took days now take weeks — teams overwhelmed",
    quote: "Everything feels like a struggle. Processes that used to take days now take weeks, and our teams are overwhelmed." },
  { id: "pi4", tag: "Technology Debt",            hub: "perf",
    shortLabel: "Outdated systems are actively blocking team productivity",
    quote: "Our systems are so outdated that they're actually preventing our people from being productive." },
  { id: "pi5", tag: "Poor Asset ROI",             hub: "perf",
    shortLabel: "Tech and headcount investments not delivering expected ROI",
    quote: "We have significant investments in tech and headcount, but we aren't seeing the ROI we expected." },
  { id: "pi6", tag: "High Turnover",              hub: "perf",
    shortLabel: "Top talent leaving due to constant firefighting and inefficiency",
    quote: "Our best people are leaving because they are frustrated by the constant 'firefighting' and inefficient manual work." },

  // Supply Chain
  { id: "sc1", tag: "Disruption Pain",             hub: "supply",
    shortLabel: "Hit by supplier delays, shipping cost spikes, or stockouts",
    quote: "We have been hit hard by recent supplier delays, shipping cost spikes, or unexpected inventory shortages and stockouts." },
  { id: "sc2", tag: "Digital Integration Blocked", hub: "supply",
    shortLabel: "Investing in AI/IoT but legacy systems are too siloed",
    quote: "We are heavily investing in technology like AI, IoT, or advanced automation tools, but our legacy systems are too siloed to integrate them properly." },
  { id: "sc3", tag: "ESG / Decarbonization Gap",   hub: "supply",
    shortLabel: "ESG commitments made but logistics network is falling behind",
    quote: "Our board has made public ESG commitments or decarbonization mandates, but our logistics and supplier network are falling way behind." },
  { id: "sc4", tag: "Efficiency Focus",            hub: "supply",
    shortLabel: "Looking to cut logistics costs and reduce customer lead times",
    quote: "We are actively looking for ways to eliminate process waste, squeeze out logistics costs, or aggressively reduce customer lead times." },
  { id: "sc5", tag: "Competitive Pressure",        hub: "supply",
    shortLabel: "Losing ground to more agile supply chain competitors",
    quote: "We are steadily losing ground to more agile rivals who adapt their supply chain networks to disruption almost instantly." },

  // Workforce Transformation
  { id: "wt1", tag: "Talent Scarcity / Skill Gaps", hub: "workforce",
    shortLabel: "Can't find specialized talent — skills becoming obsolete",
    quote: "We can't find specialized talent, and 56% of our core skills will be obsolete in five years." },
  { id: "wt2", tag: "High Performer Turnover",       hub: "workforce",
    shortLabel: "High performers leaving — no clear growth path or flexibility",
    quote: "Our high performers are leaving because they don't see a clear growth path or flexibility in their roles." },
  { id: "wt3", tag: "Inflexible Structures",          hub: "workforce",
    shortLabel: "Rigid job roles slowing us down — can't pivot to market changes",
    quote: "Our rigid job roles are slowing us down; we can't pivot fast enough to meet market changes." },
  { id: "wt4", tag: "Cultural Inertia",               hub: "workforce",
    shortLabel: "Employee pushback on hybrid work or AI integration",
    quote: "There is significant employee pushback or low engagement regarding our transition to hybrid work or AI integration." },
  { id: "wt5", tag: "Manual Inefficiency",             hub: "workforce",
    shortLabel: "Team bogged down by manual work that should be automated",
    quote: "Our team is bogged down by manual processes that should be automated, but we don't know where to start." },
];

// ── Section 7 service modules (Strategic Sprints) from each seller sheet ─────
// Workforce Transformation has no Section 7 sprints table — button hidden for that hub.

const HUB_MODULES: Partial<Record<HubId, ServiceModule[]>> = {
  growth: [
    {
      name: "Growth Diagnostic & Market Pulse",
      challenge: "Market Volatility / Competitive Pressure",
      objective: "A comprehensive analysis of the current state and market conditions to identify core challenges and 'low-hanging fruit' growth opportunities.",
      duration: "2–4 weeks",
      outcomes: [
        "Current State Assessment: report on core competencies and market position",
        "Market & Competitor Insights: detailed look at industry trends and competitor strategies",
        "Growth Opportunity Document: prioritized list of potential expansion areas and identified challenges",
      ],
    },
    {
      name: "The Growth Strategy Blueprint",
      challenge: "Resource Constraints / Lack of a Plan",
      objective: "Formulating a tailored, data-driven strategy that defines exactly how to expand, whether through market penetration, product development, or diversification.",
      duration: "4–6 weeks",
      outcomes: [
        "Tailored Strategic Plan: actionable roadmap aligned with long-term goals",
        "Resource & Financial Plan: model for capital and human resource allocation",
        "Risk Mitigation Roadmap: identification of bottlenecks and a plan to navigate them",
      ],
    },
    {
      name: "Execution Enablement & Sales Alignment",
      challenge: "Internal Resistance / Siloed Teams",
      objective: "Ensuring the strategy doesn't just sit on a shelf by aligning marketing and sales teams and building internal capabilities.",
      duration: "8–12 weeks",
      outcomes: [
        "Marketing & Sales Optimization: unified processes to drive lead intent and profitability",
        "Operational Efficiency Report: new workflows and technology adoption strategies",
        "Internal Capability Program: knowledge transfer and training to sustain the strategy",
      ],
    },
    {
      name: "Performance & Optimization Audit",
      challenge: "Stagnant Results / Need for ROI",
      objective: "Continuous tracking of growth initiatives to ensure sustained momentum and data-driven adjustments.",
      duration: "Monthly or Quarterly Retainer",
      outcomes: [
        "KPI Dashboard & Reporting: real-time visibility into growth objective progress",
        "Optimization Recommendations: data-driven pivots based on market feedback",
        "Revenue Maximization Report: analysis of increased profitability and ROI",
      ],
    },
  ],
  business: [
    {
      name: "Transformation Vision & Ambition Sprint",
      challenge: "Our business model is outdated and we don't have a plan for AI",
      objective: "A strategic review of the business's current baseline to define a bold future 'ideal state' and a compelling narrative that secures organizational buy-in.",
      duration: "2–4 weeks",
      outcomes: [
        "Current State Diagnostic Map: fact-based overview of internal pain points and market position",
        "Transformation Vision Statement: compelling case for change to inspire the organization",
        "Strategic Value Driver Framework: defined metrics (efficiency, growth) rooting the effort",
      ],
    },
    {
      name: "Initiative Prioritization & Impact Assessment",
      challenge: "We have 50 projects going on, but none of them are moving the needle",
      objective: "Brainstorming, quantifying, and ranking transformation opportunities based on their ability to deliver against strategic pillars and financial goals.",
      duration: "4–6 weeks",
      outcomes: [
        "Prioritized Initiative Heat Map: visual ranking of projects based on ROI and feasibility",
        "Impact Assessment Report: estimated net financial gains (P&L levers) and KPI improvements",
        "Initial Risk Profile: identification of early delivery risks and baseline mitigation plans",
      ],
    },
    {
      name: "Transformation Roadmap & Resourcing Blueprint",
      challenge: "We know what we want to do, but we haven't budgeted the people to do it",
      objective: "Translating prioritized initiatives into a logical, time-phased sequence while formalizing the budget and personnel needed for execution.",
      duration: "4–6 weeks",
      outcomes: [
        "Integrated Transformation Roadmap: phased timeline with clear milestones and dependencies",
        "Resourcing & Budget Plan: detailed breakdown of internal and Toptal talent required",
        "Stakeholder Commitment Charter: formal alignment from senior leadership on the plan",
      ],
    },
    {
      name: "Results Orchestration & PMO Governance",
      challenge: "Our transformations always fail because of internal resistance and lack of tracking",
      objective: "Establishing the rigorous Project Management Office (PMO) and governance required to manage delivery, track impact, and resolve roadblocks in real-time.",
      duration: "Monthly or Quarterly Retainer",
      outcomes: [
        "Governance Framework & PMO Charter: documentation of escalation processes and intervention levels",
        "Real-time Performance Dashboard: visual tracking of initiative progress and value realization",
        "Quarterly Results Review: summary of achieved gains and adapted roadmap milestones",
      ],
    },
  ],
  finance: [
    {
      name: "Finance Diagnostic & Digital Maturity Audit",
      challenge: "Our reporting is manual and full of errors",
      objective: "A deep-dive evaluation of the existing ERP/EPM landscape and core financial cycles (R2R, P2P) to identify bottlenecks and data integrity gaps.",
      duration: "3–4 weeks",
      outcomes: [
        "Finance Diagnostic Heat Map: prioritized list of opportunities and risks",
        "Performance Benchmark Report: functional costs and cycle times vs. industry leaders",
        "Future Vision & Value Drivers: a defined strategic North Star for the finance function",
      ],
    },
    {
      name: "Finance Transformation Blueprint & ROI Roadmap",
      challenge: "We need to modernize, but don't know where to start",
      objective: "Designing the Target Operating Model (TOM) and technology architecture while building a rigorous financial case for change.",
      duration: "4–6 weeks",
      outcomes: [
        "Finance Strategic Plan (Blueprint): recommended policies and service delivery models",
        "Technology Integration Plan: solution architecture for Cloud ERP, BI, or RPA",
        "Quantified Financial Business Case: expected ROI and cost-savings model",
      ],
    },
    {
      name: "Operational Enablement & System Integration",
      challenge: "We bought a new ERP but our team can't use it effectively",
      objective: "Executing the re-engineering of financial workflows and deploying recommended technology stacks (Hyperion, SAP, Power BI, etc.).",
      duration: "12–20 weeks",
      outcomes: [
        "Live Tech Solutions: deployed and integrated ERP/EPM tools in the production environment",
        "Standard Operating Procedures: documented new workflows for R2R, P2P, and O2C",
        "Change Management & Training Records: proof of workforce readiness and internal capability",
      ],
    },
    {
      name: "Performance Excellence & Scalability Retainer",
      challenge: "We've modernized, but want to leverage AI for predictive forecasting",
      objective: "Establishing continuous improvement frameworks and sustainability scorecards to ensure the transformation delivers long-term, scalable value.",
      duration: "Monthly or Quarterly Retainer",
      outcomes: [
        "Sustainability Scorecard: tool to track long-term effectiveness of finance changes",
        "Continuous Improvement Framework: cadences for ongoing optimization using AI/ML",
        "Knowledge Transfer Playbooks: best practice guides for full internal ownership",
      ],
    },
  ],
  perf: [
    {
      name: "High-Performance Baseline & Gap Analysis",
      challenge: "Our teams are busy, but we aren't seeing the results in the bottom line",
      objective: "A holistic audit across all seven building blocks to identify root causes of friction, structural redundancies, and technical debt.",
      duration: "3–4 weeks",
      outcomes: [
        "Current State Process Maps: identification of delays, inefficiencies, and manual workarounds",
        "Technology & Data Audit: assessment of system reliability, integration, and technical debt",
        "Opportunity Mapping Report: prioritized list of high-ROI improvement areas",
      ],
    },
    {
      name: "The Operational Excellence Blueprint",
      challenge: "We have dozens of improvement ideas but don't know where to start",
      objective: "Architecting a future-state model that defines performance targets, optimized cross-functional workflows, and technical requirements.",
      duration: "4–6 weeks",
      outcomes: [
        "Strategic Roadmap: sequenced project plan prioritized by business value and ease of implementation",
        "Target Operating Model (TOM) Design: new blueprints for organizational structure",
        "Technology Selection Matrix: framework for choosing tools to automate tasks and improve visibility",
      ],
    },
    {
      name: "Silo-Breaking & Efficiency Integration",
      challenge: "Our departments don't talk to each other, and everything takes too long",
      objective: "Executing prioritized project plans and tech upgrades while delivering role-specific training to improve interaction among divisions.",
      duration: "8–16 weeks",
      outcomes: [
        "Implemented Performance Frameworks: standardized reporting cycles for project ROI and cash flow",
        "Cross-Functional Collaboration Tools: deployment of standardized meeting and interaction protocols",
        "Capability Building Program: role-specific training and leadership coaching certifications",
      ],
    },
    {
      name: "Continuous Optimization & Value Retainer",
      challenge: "We've made improvements before, but they never seem to stick",
      objective: "Establishing rigorous monitoring systems and 'improvement loops' to ensure operational gains are maintained and scaled.",
      duration: "Monthly or Quarterly Retainer",
      outcomes: [
        "Real-Time Performance Dashboards: visibility into progress vs. goals for immediate course correction",
        "Asset Utilization Audits: ongoing evaluation of products, markets, and projects for high-ROI areas",
        "Long-Term Talent Pipeline Tracking: monitoring of career progression and workforce transformation",
      ],
    },
  ],
  supply: [
    {
      name: "Supply Chain Baseline & Network Gap Analysis",
      challenge: "We hit massive tracking blind spots and supplier delays, but don't know where our network is leaking money",
      objective: "A holistic audit across core pillars utilizing SCOR-based value stream mapping to evaluate legacy visibility gaps, inventory policy health, and supplier footprint risks.",
      duration: "3–4 weeks",
      outcomes: [
        "Current State Network Diagnostic Map: visualization of hidden delays, lead-time slips, and data siloing",
        "Vendor & Supplier Risk Heat Map: dependency assessment tracking macro exposure and vulnerabilities",
        "Prioritization Matrix Report: ranked opportunity backlog pairing issues by impact and feasibility",
      ],
    },
    {
      name: "The Resilient Supply Chain Blueprint",
      challenge: "We want to digitize and optimize our logistics, but our systems are too siloed",
      objective: "Architecting a future-state network model, localized inventory segmentation rules, and optimized cross-functional routing parameters to build agility.",
      duration: "4–6 weeks",
      outcomes: [
        "Phased Optimization Roadmap: sequenced action blueprint with timelines and technical interdependencies",
        "Quantified Financial Business Case: definitive cost models detailing overhead compression and ROI",
        "Technology Stack Recommendations: architectural blueprint outlining pipeline tools to replace manual workarounds",
      ],
    },
    {
      name: "Logistics & Analytics Optimization Integration",
      challenge: "Our warehouses and transport processes run on manual workflows, and customer lead times are slipping",
      objective: "Executing prioritized project plans, data integrations, and automated parameters across warehouse and tracking systems while running pilot implementations.",
      duration: "8–16 weeks",
      outcomes: [
        "Implemented Operational Adjustments: streamlined order processing, warehouse, and logistics configurations",
        "Real-Time Analytics Dashboards: fully deployed visibility portals unifying inventory and tracking metrics",
        "Automated Workforce Playbooks: clear scheduling rules and process maps to improve cross-functional speed",
      ],
    },
    {
      name: "Sustainable Supply Chain & Continuous Optimization Retainer",
      challenge: "We achieve quick savings from individual fixes, but our network quickly decays when new disruptions hit",
      objective: "Establishing robust monitoring frameworks, continuous improvement loops, and sustainability metrics to protect long-term efficiency.",
      duration: "Monthly or Quarterly Retainer",
      outcomes: [
        "Self-Sustaining Operations Blueprint: institutionalized monitoring rules protecting structural resilience",
        "Standardized Sustainability Scorecards: multi-tier ESG compliance trackers integrated with live routing",
        "Continuous Knowledge-Transfer Repositories: upgradable playbooks ensuring independent lifecycle governance",
      ],
    },
  ],
  workforce: [
    {
      name: "The Workforce Capability Baseline & AI Readiness Sprint",
      challenge: "Our workers are swamped, but we don't actually know which tasks can be automated with AI.",
      objective: "A deep-dive audit of the current talent landscape paired with an automation diagnostic to pinpoint where AI can immediately replace or augment workflows.",
      duration: "3–4 weeks",
      outcomes: [
        "Current State Capability Matrix: A fact-based blueprint tracking current internal skills and specific capability gaps.",
        "AI Integration & Automation Heatmap: A visual matrix identifying high-impact areas for AI agent deployment or human task augmentation.",
        "Workforce Vision Statement: A formalized plan aligning executive leadership on target transformation goals and AI ambitions.",
      ],
    },
    {
      name: "The Human-AI Target Operating Model (TOM) & Skill Architecture",
      challenge: "We bought an enterprise AI platform, but our old departmental silos are preventing us from using it.",
      objective: "Redesigning organizational structures away from traditional, siloed job roles and toward an agile operating model built on fluid skill ecosystems.",
      duration: "4–6 weeks",
      outcomes: [
        "AI-Integrated Operating Model Blueprint: A structural plan defining exactly how human workers and autonomous AI agents interact and collaborate.",
        "Upskilling & Recruitment Framework: A precise strategy to bridge technical and cognitive skill gaps through internal training and strategic talent acquisition.",
        "Prioritized Initiative Roadmap: A phased timeline mapping out training, operational change milestones, and clear ownership.",
      ],
    },
    {
      name: "High-Impact Workforce Transformation Pilot",
      challenge: "We want to change our workflow model, but our legacy culture is heavily resisting it.",
      objective: "Launching and running targeted, cross-functional experiments in specific business units to test new human-AI workflows and minimize execution risks before scaling enterprise-wide.",
      duration: "8–12 weeks",
      outcomes: [
        "Pilot Performance Dashboard: Real-time visibility into productivity metrics, employee adaptation rates, and workflow bottlenecks.",
        "Refined Implementation Playbook: An optimized operational manual built from direct pilot feedback and field testing.",
        "Stakeholder Validation Report: Quantified business case results used to justify broader enterprise deployment.",
      ],
    },
    {
      name: "Continuous Learning & Scalable Talent Retainer",
      challenge: "We need to rapidly inject specialized technical or strategic skills into our team, but we can't afford to hire full-time headcount.",
      objective: "Implementing a permanent framework for enterprise-wide upskilling while integrating elastic on-demand talent networks to keep the workforce highly responsive to market updates.",
      duration: "Monthly or Quarterly Retainer",
      outcomes: [
        "Scalable Talent Supply Chain: A structured model blending core internal employees with an on-demand network of elite Toptal subject matter experts.",
        "Continuous Learning Architecture: A permanent infrastructure for ongoing corporate upskilling and leadership alignment cadences.",
        "Transformation Impact Report: Longitudinal evaluation measuring long-term organizational agility, cost optimization, and net innovation capacity.",
      ],
    },
  ],
};

// ── Buyer groups (from seller sheet buyer definitions) ────────────────────────

const buyerGroups: BuyerGroup[] = [
  {
    group: "Buying Center",
    options: [
      "Finance",
      "Operations",
      "Supply Chain & Logistics",
      "Marketing & Sales",
      "Human Resources",
      "IT & Technology",
      "Strategy & Corporate Development",
      "Growth & Innovation",
    ],
  },
  {
    group: "C-Suite",
    options: [
      "CEO / President",
      "Chief Operating Officer (COO)",
      "Chief Financial Officer (CFO)",
      "Chief Marketing Officer (CMO)",
      "Chief Growth Officer (CGO)",
      "Chief Strategy Officer (CSO)",
      "Chief Sales Officer / Head of Sales",
      "Chief Information Officer (CIO)",
      "Chief Technology Officer (CTO)",
      "Chief Digital Officer (CDO)",
      "Chief Human Resources Officer (CHRO)",
      "Chief Transformation Officer",
      "Chief Sustainability Officer",
    ],
  },
  {
    group: "Key Leaders",
    options: [
      "Finance Director",
      "VP / Director of Supply Chain",
      "VP / Director of Learning & Development",
      "Head of Operations",
      "Head of IT",
      "Head of HR",
      "Business Unit Leader / Division Head",
      "Head of Product Development / Innovation",
      "Operational Manager",
      "Board Member / Director",
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HubFinder() {
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [selectedSignalId, setSelectedSignalId] = useState<string>("");
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const [freeFormText, setFreeFormText]         = useState<string>("");
  const [isMatching, setIsMatching]             = useState(false);
  const [matchError, setMatchError]             = useState<string | null>(null);
  const [matchExplanation, setMatchExplanation] = useState<string | null>(null);
  const [isFreeFormOpen, setIsFreeFormOpen]     = useState(false);

  const selectedSignal = signals.find((s) => s.id === selectedSignalId);
  const hub = selectedSignal ? hubs[selectedSignal.hub] : null;

  // Reorder hub groups in the challenge dropdown based on the selected buyer
  const orderedHubIds: HubId[] =
    selectedBuyer && BUYER_HUB_PRIORITY[selectedBuyer]
      ? BUYER_HUB_PRIORITY[selectedBuyer]
      : HUB_ORDER;

  // Changing buyer clears any stale challenge selection and closes the modal
  const handleBuyerChange = (value: string) => {
    setSelectedBuyer(value);
    setSelectedSignalId("");
    setIsModulesOpen(false);
  };

  // Changing signal closes the modal so stale module content doesn't persist
  // Also clears any AI match state so explanations don't linger on manual picks
  const handleSignalChange = (value: string) => {
    setSelectedSignalId(value);
    setIsModulesOpen(false);
    setMatchExplanation(null);
    setMatchError(null);
  };

  // Free-form AI matcher — sends user text + signal corpus to the edge function
  const handleFreeFormMatch = async () => {
    if (!freeFormText.trim() || isMatching) return;
    setIsMatching(true);
    setMatchError(null);
    setMatchExplanation(null);
    try {
      const { data, error } = await supabase.functions.invoke("match-hub-signal", {
        body: {
          userText: freeFormText.trim(),
          buyerRole: selectedBuyer || undefined,
          signals: signals.map(({ id, tag, shortLabel, quote, hub }) => ({ id, tag, shortLabel, quote, hub })),
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error || "Matching failed");
      setSelectedSignalId(data.signalId);
      setMatchExplanation(data.reason);
      setIsModulesOpen(false);
      setIsFreeFormOpen(false);
    } catch (e: unknown) {
      setMatchError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Management Consulting Service Offering Finder
      </p>
      <h2 className="mb-1 text-xl font-bold text-card-foreground tracking-tight">
        Find Your Starting Point
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Select who you're talking to and what challenge you're hearing — the tool will identify the best-fit hub service offering to lead your conversation with the client.
      </p>

      {/* Sentence + dropdowns */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-medium text-foreground">
        <span className="whitespace-nowrap">I am talking with</span>

        <Select value={selectedBuyer} onValueChange={handleBuyerChange}>
          <SelectTrigger className="h-9 w-auto min-w-[220px] text-sm">
            <SelectValue placeholder="select buyer or title..." />
          </SelectTrigger>
          <SelectContent>
            {buyerGroups.map((g) => (
              <SelectGroup key={g.group}>
                <SelectLabel>{g.group}</SelectLabel>
                {g.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <span className="whitespace-nowrap">and am hearing</span>

        <Select value={selectedSignalId} onValueChange={handleSignalChange}>
          <SelectTrigger className="h-9 w-auto min-w-[300px] text-sm">
            <SelectValue placeholder="select a challenge or issue..." />
          </SelectTrigger>
          <SelectContent className="max-w-[500px]">
            {orderedHubIds.map((hubId) => {
              const h = hubs[hubId];
              const hubSignals = signals.filter((s) => s.hub === hubId);
              return (
                <SelectGroup key={hubId}>
                  <SelectLabel>{h.name}</SelectLabel>
                  {hubSignals.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shortLabel}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>

        <span className="whitespace-nowrap font-bold text-sm uppercase tracking-wider text-foreground">
          OR
        </span>
        <button
          onClick={() => { setIsFreeFormOpen(true); setMatchError(null); }}
          className="whitespace-nowrap text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Describe the challenge in your own words
        </button>
      </div>

      {/* Result card — shown as soon as a signal is selected */}
      {selectedSignal && hub ? (
        <div className="mt-5 rounded-lg border border-border bg-card p-5 space-y-3 fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRACTICE_COLORS[hub.practice]}`}
            >
              {hub.practice}
            </span>
            <h3 className="text-base font-bold text-card-foreground">{hub.name}</h3>
            {selectedBuyer && (
              <span className="ml-auto text-xs text-muted-foreground">
                Talking with: {selectedBuyer}
              </span>
            )}
          </div>

          <div className="border-l-4 border-primary/40 pl-4">
            <p className="text-sm italic text-muted-foreground">
              "{selectedSignal.quote}"
            </p>
            <p className="mt-1 text-xs font-semibold text-primary">
              {selectedSignal.tag}
            </p>
          </div>

          {matchExplanation && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground/80 italic">
              <Wand2 className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
              {matchExplanation}
            </p>
          )}

          <p className="text-sm text-muted-foreground">{hub.rationale}</p>

          <div className="flex flex-wrap gap-4 pt-1">
            <a
              href={hub.sellersSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              Seller's Sheet
            </a>
            <a
              href={hub.docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Overview Deck
            </a>
            <a
              href={hub.diagnosticUrl}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Run Diagnostic
            </a>
            {HUB_MODULES[hub.id] && (
              <button
                onClick={() => setIsModulesOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Service Modules
              </button>
            )}
          </div>

          {/* Adjacent services from the services web */}
          {(HUB_ADJACENTS[hub.id].universals.length > 0 || HUB_ADJACENTS[hub.id].secondaries.length > 0) && (
            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Adjacent Services</p>
              {HUB_ADJACENTS[hub.id].universals.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-0.5">Universal Connectors:</span>
                  {HUB_ADJACENTS[hub.id].universals.map((svc) =>
                    svc.docUrl ? (
                      <a
                        key={svc.name}
                        href={svc.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        {svc.name}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span
                        key={svc.name}
                        className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {svc.name}
                      </span>
                    )
                  )}
                </div>
              )}
              {HUB_ADJACENTS[hub.id].secondaries.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-0.5">Secondary Services:</span>
                  {HUB_ADJACENTS[hub.id].secondaries.map((svc) =>
                    svc.docUrl ? (
                      <a
                        key={svc.name}
                        href={svc.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {svc.name}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span
                        key={svc.name}
                        className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {svc.name}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        <p className="mt-4 text-xs italic text-muted-foreground/60">
          Select a challenge above to see the recommended hub service and quick-access materials.
        </p>
      )}

      {hub && HUB_MODULES[hub.id] && (
        <Dialog open={isModulesOpen} onOpenChange={setIsModulesOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{hub.name} — Service Modules</DialogTitle>
              <DialogDescription>
                How to get started: four strategic sprints from initial diagnostic to ongoing optimization
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2 mt-2">
              {HUB_MODULES[hub.id]!.map((mod) => (
                <div key={mod.name} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground leading-snug">{mod.name}</h4>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
                      {mod.duration}
                    </span>
                  </div>
                  <p className="text-xs italic text-muted-foreground">"{mod.challenge}"</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{mod.objective}</p>
                  <ul className="space-y-1">
                    {mod.outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Free-form AI matcher modal */}
      <Dialog open={isFreeFormOpen} onOpenChange={setIsFreeFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              Describe the Challenge
            </DialogTitle>
            <DialogDescription>
              Describe what you're hearing from the client in your own words — the AI will match it to the closest buying signal and identify the best-fit hub offering.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <Textarea
              value={freeFormText}
              onChange={(e) => { setFreeFormText(e.target.value); setMatchError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleFreeFormMatch(); }}
              placeholder="e.g. Our leadership team keeps asking for updated financials but we can't close the books fast enough…"
              className="resize-none text-sm min-h-[100px]"
              autoFocus
            />
            {matchError && (
              <p className="text-xs text-destructive">{matchError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFreeFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleFreeFormMatch}
                disabled={!freeFormText.trim() || isMatching}
                size="sm"
                className="gap-1.5"
              >
                {isMatching
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Matching…</>
                  : <><Wand2  className="h-3.5 w-3.5" />Find My Match</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
