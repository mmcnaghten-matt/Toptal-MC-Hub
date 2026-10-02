import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type PracticeId = "strategy" | "finance" | "supplychain" | "customer" | "people" | "risk";

interface L3Offering {
  id: string;
  name: string;
  challenge: string;
  description: string;
}

interface Practice {
  id: PracticeId;
  name: string;
  color: string;
  bg: string;
  buyers: string[];
  l3s: L3Offering[];
}

// ── Practice definitions — buyers match the Service Offerings cards; L3s and
// their descriptions match the taxonomy catalog; challenge is a one-line signal
// a seller might hear that points to that L3. ────────────────────────────────

const PRACTICES: Practice[] = [
  {
    id: "strategy",
    name: "Strategy & Transformation",
    color: "#2B44D4",
    bg: "#EEF2FF",
    buyers: ["CEO", "Chief Strategy Officer", "Chief Transformation Officer", "business unit presidents"],
    l3s: [
      { id: "st-corp", name: "Corporate Strategy", challenge: "We don't have a documented strategy for where or how we compete — growth and portfolio decisions are made ad hoc.", description: "Enterprise-level strategy that defines where and how the company competes, including strategic planning, business portfolio choices, market entry, and enterprise growth strategy." },
      { id: "st-digital", name: "Enterprise Digital & Technology", challenge: "We're increasing tech spend but have no enterprise strategy tying those investments to corporate strategy.", description: "Enterprise-level advisory on how digital and technology investments enable corporate strategy, including enterprise technology strategy, digital roadmaps, and investment prioritization; technical delivery coordinated with Technology Services." },
      { id: "st-ai", name: "Enterprise AI", challenge: "Multiple functions are experimenting with AI independently — there's no enterprise-level AI ambition or roadmap.", description: "Enterprise-level AI business strategy spanning multiple functions, including AI ambition, enterprise use case prioritization, and AI adoption roadmaps; technical build coordinated with AI Services." },
      { id: "st-opmodel", name: "Operating Model", challenge: "Our business units operate with unclear decision rights, duplicated shared services, and no coherent target operating model.", description: "Design of the enterprise target operating model across business units and functions, including decision rights, shared services strategy, and global business services design." },
      { id: "st-ma", name: "M&A & Divestitures", challenge: "We're pursuing or just closed a deal and need support across diligence, integration, or carve-out.", description: "Transaction support across the deal lifecycle, including commercial and operational due diligence, integration strategy, post-merger integration, Day One readiness, and carve-outs and separations." },
      { id: "st-perf", name: "Performance Improvement", challenge: "Costs keep creeping up and margins are compressing, with no structured cost or productivity program underway.", description: "Enterprise-wide cost and productivity improvement, including cost transformation, productivity assessments, operating margin improvement, and value creation roadmaps." },
      { id: "st-transform", name: "Transformation Management", challenge: "We've launched a major transformation with no transformation office, governance, or benefits framework to run it.", description: "Design of the enterprise transformation architecture, including transformation assessments, roadmaps, transformation office and governance design, and benefits frameworks." },
      { id: "st-change", name: "Change Management", challenge: "Leadership approved a cross-functional transformation, but there's no change strategy to bring the organization along.", description: "Change management for enterprise, cross-functional transformations, including change strategy, change readiness assessments, stakeholder alignment, and communications and adoption." },
      { id: "st-pmo", name: "Program & Portfolio Management", challenge: "We're running several enterprise programs with no PMO, portfolio prioritization, or benefits tracking.", description: "Delivery and governance of enterprise programs, including enterprise PMO, program leadership, portfolio prioritization, Integration Management Offices, and benefits tracking." },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    color: "#0CA678",
    bg: "#ECFDF5",
    buyers: ["CFO", "Chief Accounting Officer", "Controller"],
    l3s: [
      { id: "fi-strategy", name: "Finance Strategy", challenge: "The CFO has no documented vision or roadmap for where the finance function needs to go.", description: "Defines the direction of the finance function, including CFO strategy assessments, finance vision and priorities, finance transformation roadmaps, and value cases." },
      { id: "fi-opmodel", name: "Finance Operating Model", challenge: "Our finance org structure, shared services, and GBS setup haven't been rethought in years.", description: "Design of how the finance function is organized and delivered, including the finance target operating model, organization design, shared services, and global business services." },
      { id: "fi-processes", name: "Finance Processes & Operations", challenge: "Our record-to-report, procure-to-pay, or order-to-cash processes are manual and the close takes too long.", description: "Improvement and ongoing execution of core finance processes, including record-to-report, procure-to-pay, order-to-cash, and close management and optimization." },
      { id: "fi-fpa", name: "Financial Planning & Analysis", challenge: "Budgeting, forecasting, and reporting take weeks and still don't give the business what it needs.", description: "Design, improvement, and ongoing operation of financial planning and analysis, including budgeting and forecasting, management reporting, and financial analysis and business partnering." },
      { id: "fi-tech", name: "Finance Technology", challenge: "We're evaluating (or stuck on) an ERP/EPM and need strategy and selection help, not just an implementer.", description: "Advisory on finance platforms, including ERP strategy, selection, and modernization roadmaps, EPM advisory, finance platform selection, and finance automation design." },
      { id: "fi-ai", name: "Finance AI", challenge: "Finance wants to use AI but has no prioritized use cases or plan for an AI-enabled close or FP&A process.", description: "AI-specific strategy and solution design for finance, including use case prioritization, intelligent close, AI-enabled FP&A and finance operations, and agentic finance operating models." },
      { id: "fi-change", name: "Change Management", challenge: "We're rolling out a finance transformation with no plan for change impact or adoption on the finance team.", description: "Change management for finance programs, including finance change strategy, change impact assessment, stakeholder communications, and finance learning and adoption." },
      { id: "fi-pmo", name: "Program & Portfolio Management", challenge: "Multiple finance initiatives are running with no dedicated PMO or portfolio view.", description: "Project, program, and portfolio management for finance initiatives, including finance project managers, finance PMO, program leadership, portfolio management, and benefits tracking." },
    ],
  },
  {
    id: "supplychain",
    name: "Supply Chain & Operations",
    color: "#E86B4A",
    bg: "#FFF7ED",
    buyers: ["COO", "Chief Supply Chain Officer", "Chief Procurement Officer"],
    l3s: [
      { id: "sc-strategy", name: "Supply Chain Strategy", challenge: "We haven't reassessed our network design or resilience strategy in years, and it shows under pressure.", description: "Defines supply chain direction and structure, including supply chain strategy, network design and optimization, supply chain operating model, and resilience strategy." },
      { id: "sc-planning", name: "Supply Chain Planning", challenge: "Demand, supply, and inventory planning are disconnected and our S&OP process isn't delivering reliable numbers.", description: "Design and ongoing operation of supply chain planning, including demand, supply, and inventory planning, integrated business planning, and planning performance monitoring." },
      { id: "sc-procurement", name: "Procurement", challenge: "Procurement is transactional, not strategic — we have no real sourcing or category management approach.", description: "Strategy and execution of sourcing and supplier management, including procurement strategy, strategic sourcing, category management, supplier relationship management, and procurement operating model." },
      { id: "sc-mfg", name: "Manufacturing & Operations", challenge: "Plant or service operations performance has plateaued with no structured excellence program.", description: "Improvement of plant and service operations performance, including manufacturing excellence, lean and operational excellence, service operations design, and quality and productivity improvement." },
      { id: "sc-logistics", name: "Logistics & Fulfillment", challenge: "Warehouse, transportation, and last-mile costs are rising and delivery performance is falling behind.", description: "Design and optimization of how goods reach customers, including warehouse operations, transportation strategy, distribution design, fulfillment optimization, and last-mile operations." },
      { id: "sc-tech", name: "Supply Chain & Operations Technology", challenge: "We're evaluating planning or warehouse systems and need a platform strategy, not just a vendor bake-off.", description: "Advisory on supply chain and operations platforms, including planning platform strategy, warehouse and transportation platform selection, operations systems roadmaps, and process automation design." },
      { id: "sc-ai", name: "Supply Chain & Operations AI", challenge: "We want to use AI for demand planning, inventory, or procurement but don't know where to start.", description: "AI-specific strategy and solution design for supply chain and operations, including AI use cases, AI-enabled demand planning and procurement, inventory optimization, and predictive operations." },
      { id: "sc-change", name: "Change Management", challenge: "We're changing how a site or supplier network operates with no plan for frontline or partner adoption.", description: "Change management for supply chain and operations programs, including site readiness and impact assessment, frontline adoption, and supplier and partner change enablement." },
      { id: "sc-pmo", name: "Program & Portfolio Management", challenge: "Several supply chain initiatives are in flight with no PMO or network-level program leadership.", description: "Project, program, and portfolio management for supply chain and operations initiatives, including supply chain PMO, network program leadership, operations portfolio management, and benefits tracking." },
    ],
  },
  {
    id: "customer",
    name: "Customer & Growth",
    color: "#D6336C",
    bg: "#FDF2F8",
    buyers: ["Chief Revenue Officer", "CMO", "Chief Customer Officer"],
    l3s: [
      { id: "cg-growth", name: "Growth Strategy", challenge: "We have ambitious revenue targets but no documented go-to-market, pricing, or expansion strategy to hit them.", description: "Defines commercial direction and go-to-market choices, including commercial strategy, go-to-market and channel strategy, pricing and revenue growth, and commercial market expansion." },
      { id: "cg-cx", name: "Customer Experience", challenge: "Satisfaction or loyalty scores are slipping and we have no clear view of the end-to-end journey.", description: "Design and improvement of the end-to-end customer experience, including CX strategy, customer journey design, voice of customer, experience measurement, and loyalty experience design." },
      { id: "cg-service", name: "Customer Service & Success", challenge: "Our contact center or customer success operation is strained and retention numbers are starting to show it.", description: "Design and ongoing delivery of customer service and success, including service strategy, contact center operating model, service and success operations, and retention and renewal management." },
      { id: "cg-tech", name: "Customer & Growth Technology", challenge: "We're reevaluating our CRM or marketing platform and need a systems roadmap, not just a new tool.", description: "Advisory on commercial platforms, including CRM strategy and selection, marketing platform strategy, customer service platform advisory, and commercial systems roadmaps." },
      { id: "cg-ai", name: "Customer & Growth AI", challenge: "Sales and marketing want to use AI for personalization or lead scoring but have no prioritized use cases.", description: "AI-specific strategy and solution design for commercial functions, including commercial AI strategy, sales and marketing AI use cases, personalization strategy, and AI-enabled customer service." },
      { id: "cg-change", name: "Change Management", challenge: "We're rolling out a new commercial model and sales/marketing readiness hasn't been planned for.", description: "Change management for commercial programs, including commercial change strategy, sales and marketing readiness, stakeholder communications, and commercial adoption and enablement." },
      { id: "cg-pmo", name: "Program & Portfolio Management", challenge: "Multiple commercial transformation initiatives are running with no PMO or portfolio view.", description: "Project, program, and portfolio management for commercial initiatives, including customer transformation PMO, commercial program leadership, growth portfolio management, and benefits tracking." },
    ],
  },
  {
    id: "people",
    name: "People & Organization",
    color: "#5C6BC0",
    bg: "#EDE9FE",
    buyers: ["CHRO", "Chief People Officer"],
    l3s: [
      { id: "po-strategy", name: "Organization Strategy", challenge: "Our people strategy isn't clearly tied to the business plan, and we have no future-of-work point of view.", description: "Aligns people and the HR function to business priorities, including people strategy, strategic people planning, future of work strategy, HR function strategy, and organization effectiveness assessment." },
      { id: "po-design", name: "Organization Design", challenge: "Roles and reporting lines grew organically and no longer reflect how the business actually runs.", description: "HR-led design of organization structures, including roles and decision rights, job architecture, HR operating model, and organization effectiveness design." },
      { id: "po-talent", name: "Talent & Leadership", challenge: "We have no leadership pipeline or succession plan, and attrition in key roles would really hurt us.", description: "Strategies and programs to attract, develop, and retain talent, including talent strategy, leadership and executive development, succession planning, and culture and leadership alignment." },
      { id: "po-learning", name: "Learning & Capability Development", challenge: "Our learning programs aren't preparing people for the skills — especially AI — the business will need next.", description: "Design, improvement, and ongoing delivery of learning programs, including learning strategy, capability assessment, reskilling strategy, AI readiness and literacy, and learning operating model." },
      { id: "po-hrops", name: "HR Operations & Services", challenge: "HR service delivery is inconsistent and the team spends too much time on transactional work.", description: "Design, improvement, and ongoing delivery of HR services, including HR service delivery design, employee lifecycle administration, HR shared services, and HR process improvement." },
      { id: "po-tech", name: "HR Technology", challenge: "We're assessing a new HRIS or talent platform and need a systems roadmap, not just a vendor comparison.", description: "Advisory on HR platforms, including HRIS strategy and selection, talent platform advisory, HR systems roadmaps, and people analytics design." },
      { id: "po-ai", name: "HR AI", challenge: "HR wants to apply AI to talent or learning processes but has no strategy or prioritized use cases.", description: "AI-specific strategy and solution design for HR, including HR AI strategy, use case prioritization, AI-enabled talent and learning processes, and HR AI adoption roadmaps." },
      { id: "po-change", name: "Change Management", challenge: "We're rolling out an org change with no plan for culture, behavior, or stakeholder communication.", description: "Change management for people and organization programs, including change strategy, organization change readiness, culture and behavior adoption, and stakeholder communications." },
      { id: "po-pmo", name: "Program & Portfolio Management", challenge: "Multiple people/HR initiatives are in flight with no dedicated PMO or portfolio view.", description: "Project, program, and portfolio management for HR and people initiatives, including people transformation PMO, organization program leadership, HR portfolio management, and benefits tracking." },
    ],
  },
  {
    id: "risk",
    name: "Risk & Compliance",
    color: "#9C2B2B",
    bg: "#FEF2F2",
    buyers: ["Chief Risk Officer", "Chief Compliance Officer", "Chief Audit Executive"],
    l3s: [
      { id: "rc-erm", name: "Enterprise Risk Management", challenge: "We have no documented risk appetite or enterprise risk framework — reporting is inconsistent at best.", description: "Design and operation of enterprise risk management, including risk strategy and framework, risk appetite, risk operating model, enterprise risk assessments, risk registers, and monitoring and reporting." },
      { id: "rc-tprm", name: "Third-Party Risk Management", challenge: "Our vendor risk program stops at onboarding — there's no ongoing monitoring or reassessment.", description: "Management of supplier and third-party risk from design through ongoing operation, including frameworks, due diligence, onboarding and risk tiering, ongoing monitoring, remediation, and reporting." },
      { id: "rc-resilience", name: "Operational Risk & Resilience", challenge: "We've never stress-tested our business continuity plans and aren't confident we'd handle a real disruption.", description: "Assessment and strengthening of operational resilience, including operational risk assessments, business continuity, scenario exercises, incident readiness, and resilience monitoring." },
      { id: "rc-governance", name: "Governance & Controls", challenge: "Our internal controls are outdated or manual, and SOX/controls testing is becoming a real burden.", description: "Design, testing, and modernization of governance and internal controls, including governance frameworks, SOX controls advisory, controls testing and monitoring, and remediation tracking." },
      { id: "rc-compliance", name: "Compliance & Regulatory", challenge: "Regulatory change is outpacing our compliance program, and monitoring/testing hasn't kept up.", description: "Design and operation of compliance programs, including compliance operating model, regulatory change management, policy frameworks, compliance monitoring and testing, financial crime compliance, and remediation." },
      { id: "rc-audit", name: "Internal Audit", challenge: "Our internal audit function is still fully point-in-time — there's no continuous auditing capability.", description: "Strategy, transformation, and execution of internal audit, including audit operating model, planning and methodology, audit execution, continuous auditing, and issue follow-up." },
      { id: "rc-tech", name: "Risk Technology", challenge: "We're evaluating a GRC platform and need strategy and selection help, not just an implementation partner.", description: "Advisory on risk and compliance platforms, including GRC platform strategy and selection, controls technology roadmaps, third-party risk platform advisory, and risk analytics design." },
      { id: "rc-ai", name: "Risk AI", challenge: "We're deploying AI and agentic systems with no clear AI risk and controls framework in place.", description: "AI governance and AI-specific solution design for risk, including AI risk and controls frameworks, AI use cases for risk, intelligent controls design, and AI-enabled compliance and audit." },
      { id: "rc-change", name: "Change Management", challenge: "We're rolling out new risk or compliance policies with no plan for culture or adoption.", description: "Change management for risk and compliance programs, including change strategy, risk culture and adoption, policy change enablement, and controls training and adoption." },
      { id: "rc-pmo", name: "Program & Portfolio Management", challenge: "Several risk/compliance remediation programs are running with no PMO or portfolio governance.", description: "Project, program, and portfolio management for risk and compliance initiatives, including regulatory program PMO, risk program leadership, risk portfolio management, and remediation governance." },
    ],
  },
];

const PRACTICE_ORDER: PracticeId[] = PRACTICES.map((p) => p.id);
const PRACTICE_BY_ID: Record<PracticeId, Practice> = Object.fromEntries(PRACTICES.map((p) => [p.id, p])) as Record<PracticeId, Practice>;

// Which practice a given buyer title belongs to (for reordering the challenge list)
const BUYER_TO_PRACTICE: Record<string, PracticeId> = Object.fromEntries(
  PRACTICES.flatMap((p) => p.buyers.map((b) => [b, p.id]))
);

const BUYER_GROUPS = PRACTICES.map((p) => ({ group: p.name, options: p.buyers }));

// Flat signal corpus for the AI free-text matcher — generic shape the edge
// function expects (id | tag | shortLabel | quote | hub).
const signals = PRACTICES.flatMap((p) =>
  p.l3s.map((l3) => ({
    id: l3.id,
    tag: l3.name,
    shortLabel: l3.challenge,
    quote: l3.challenge,
    hub: p.id,
  }))
);

function selectCls(isEmpty: boolean): string {
  return [
    "h-9 rounded-md border border-input bg-background px-3 text-sm",
    "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    "cursor-pointer appearance-none pr-8",
    isEmpty ? "text-muted-foreground" : "text-foreground",
  ].join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HubFinder() {
  const [selectedBuyer, setSelectedBuyer] = useState<string>("");
  const [selectedL3Id, setSelectedL3Id] = useState<string>("");
  const [freeFormText, setFreeFormText] = useState<string>("");
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchExplanation, setMatchExplanation] = useState<string | null>(null);
  const [isFreeFormOpen, setIsFreeFormOpen] = useState(false);

  const selectedPractice = PRACTICES.find((p) => p.l3s.some((l3) => l3.id === selectedL3Id)) ?? null;
  const selectedL3 = selectedPractice?.l3s.find((l3) => l3.id === selectedL3Id) ?? null;

  // Reorder practice groups in the challenge dropdown based on the selected buyer
  const orderedPracticeIds: PracticeId[] =
    selectedBuyer && BUYER_TO_PRACTICE[selectedBuyer]
      ? [BUYER_TO_PRACTICE[selectedBuyer], ...PRACTICE_ORDER.filter((id) => id !== BUYER_TO_PRACTICE[selectedBuyer])]
      : PRACTICE_ORDER;

  const handleBuyerChange = (value: string) => {
    setSelectedBuyer(value);
  };

  const handleSignalChange = (value: string) => {
    setSelectedL3Id(value);
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
          signals,
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error || "Matching failed");
      setSelectedL3Id(data.signalId);
      setMatchExplanation(data.reason);
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
        Select who you're talking to and what challenge you're hearing — the tool will identify the best-fit service offering to lead your conversation with the client.
      </p>

      {/* Sentence + dropdowns */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-medium text-foreground">
        <span className="whitespace-nowrap">I am talking with</span>

        <Select value={selectedBuyer} onValueChange={handleBuyerChange}>
          <SelectTrigger className="h-9 w-auto min-w-[220px] text-sm">
            <SelectValue placeholder="select buyer or title..." />
          </SelectTrigger>
          <SelectContent>
            {BUYER_GROUPS.map((g) => (
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

        <Select value={selectedL3Id} onValueChange={handleSignalChange}>
          <SelectTrigger className="h-9 w-auto min-w-[300px] max-w-[420px] text-sm">
            <SelectValue placeholder="select a challenge or issue..." />
          </SelectTrigger>
          <SelectContent className="max-w-[500px]">
            {orderedPracticeIds.map((practiceId) => {
              const p = PRACTICE_BY_ID[practiceId];
              return (
                <SelectGroup key={practiceId}>
                  <SelectLabel>{p.name}</SelectLabel>
                  {p.l3s.map((l3) => (
                    <SelectItem key={l3.id} value={l3.id}>
                      {l3.challenge}
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

      {/* Result card — shown as soon as a challenge is selected */}
      {selectedL3 && selectedPractice ? (
        <div className="mt-5 rounded-lg border border-border bg-card p-5 space-y-3 fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: selectedPractice.bg, color: selectedPractice.color }}
            >
              {selectedPractice.name}
            </span>
            <h3 className="text-base font-bold" style={{ color: selectedPractice.color }}>{selectedL3.name}</h3>
            {selectedBuyer && (
              <span className="ml-auto text-xs text-muted-foreground">
                Talking with: {selectedBuyer}
              </span>
            )}
          </div>

          <div className="border-l-4 border-primary/40 pl-4">
            <p className="text-sm italic text-muted-foreground">
              "{selectedL3.challenge}"
            </p>
          </div>

          {matchExplanation && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground/80 italic">
              <Wand2 className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
              {matchExplanation}
            </p>
          )}

          <p className="text-sm text-muted-foreground">{selectedL3.description}</p>
        </div>
      ) : (
        <p className="mt-4 text-xs italic text-muted-foreground/60">
          Select a challenge above to see the recommended service offering.
        </p>
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
              Describe what you're hearing from the client in your own words — the AI will match it to the closest offering.
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
