import { useState } from "react";
import { ExternalLink, FileText, BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const selectedSignal = signals.find((s) => s.id === selectedSignalId);
  const hub = selectedSignal ? hubs[selectedSignal.hub] : null;

  // Reorder hub groups in the challenge dropdown based on the selected buyer
  const orderedHubIds: HubId[] =
    selectedBuyer && BUYER_HUB_PRIORITY[selectedBuyer]
      ? BUYER_HUB_PRIORITY[selectedBuyer]
      : HUB_ORDER;

  // Changing buyer clears any stale challenge selection
  const handleBuyerChange = (value: string) => {
    setSelectedBuyer(value);
    setSelectedSignalId("");
  };

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Hub Service Finder
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

        <Select value={selectedSignalId} onValueChange={setSelectedSignalId}>
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
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs italic text-muted-foreground/60">
          Select a challenge above to see the recommended hub service and quick-access materials.
        </p>
      )}
    </div>
  );
}
