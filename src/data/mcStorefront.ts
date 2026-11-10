// The MC storefront: six service areas, each with three client agendas ("we lead with their agendas, not our catalogue").
// Industry needs are grouped area -> agenda -> need. Names and wording come from the storefront slides.
// The first agenda of each area is AI-led ("we lead with it first; the others follow"). An agenda's id is stored with saved needs, so a
// reworded agenda keeps its id (cost-margin-cash, modernize-planning, cut-procurement-ops-cost, govern-ai-regulation); a replaced one
// gets a new id and the old id is retired (pricing-commercial-excellence, marketing-sales-effectiveness: see scripts/agenda-update.mjs).
//
// `catalogL2` is the area's name in the offering catalog (supabase/functions/refresh-industry-insights/index.ts, CATALOG) and on the
// MC Services page. It is what offering strings ("L2 > L3") carry. It now equals the area's `name` for every area; the two fields
// are kept apart because the L2 is stored inside offering strings, so renaming an area is a data migration.

export interface ServiceArea {
  id: string;
  /** Name on the storefront slide. */
  name: string;
  /** Name of the same area in the offering catalog (the L2 of an "L2 > L3" offering). */
  catalogL2: string;
  description: string;
  buyers: string[];
  color: { text: string; bg: string };
}

export interface Agenda {
  id: string;
  area: string;
  label: string;
  /** The AI-led agenda: the one we lead with in its area first (the first agenda of each area on the storefront slide). */
  aiLed?: boolean;
}

export const SERVICE_AREAS: ServiceArea[] = [
  {
    id: "strategy",
    name: "Strategy & AI Transformation",
    catalogL2: "Strategy & AI Transformation",
    description: "Set direction, reshape the operating model and make big change stick",
    buyers: ["Chief Executive Officer", "Chief Strategy Officer", "Chief Operating Officer"],
    color: { text: "#2B44D4", bg: "#EEF2FF" },
  },
  {
    id: "finance",
    name: "Finance",
    catalogL2: "Finance",
    description: "Modernize finance with AI: planning, close, data and cost",
    buyers: ["Chief Financial Officer", "Chief Accounting Officer", "Controller"],
    color: { text: "#0CA678", bg: "#ECFDF5" },
  },
  {
    id: "people",
    name: "People & Organization",
    catalogL2: "People & Organization",
    description: "Redesign work, structure and leadership for the AI era",
    buyers: ["Chief Human Resources Officer"],
    color: { text: "#5C6BC0", bg: "#EDE9FE" },
  },
  {
    id: "supply-chain",
    name: "Supply Chain & Operations",
    catalogL2: "Supply Chain & Operations",
    description: "Build resilient, lower-cost supply chains and operations",
    buyers: ["Chief Operating Officer", "Chief Supply Chain Officer"],
    color: { text: "#E86B4A", bg: "#FFF7ED" },
  },
  {
    id: "customer-growth",
    name: "Customer",
    catalogL2: "Customer",
    description: "Grow revenue: pricing, sales, marketing and customer experience",
    buyers: ["Chief Revenue Officer", "Chief Marketing Officer"],
    color: { text: "#D6336C", bg: "#FDF2F8" },
  },
  {
    id: "risk",
    name: "Risk, Compliance & AI Governance",
    catalogL2: "Risk, Compliance & AI Governance",
    description: "Govern AI, manage risk and stay ahead of regulation",
    buyers: ["General Counsel", "Chief Risk Officer", "Chief Audit Executive"],
    color: { text: "#9C2B2B", bg: "#FEF2F2" },
  },
];

export const AGENDAS: Agenda[] = [
  { id: "ai-into-pl-value", area: "strategy", label: "Turn AI into P&L value", aiLed: true },
  { id: "ai-first-operating-model", area: "strategy", label: "Build an AI-first operating model" },
  { id: "portfolio-through-ma", area: "strategy", label: "Reshape the portfolio through M&A" },
  { id: "modernize-finance", area: "finance", label: "Modernize finance with AI and automation", aiLed: true },
  { id: "plan-forecast-ai", area: "finance", label: "Plan and forecast with AI" },
  { id: "cost-margin-cash", area: "finance", label: "Improve cost, margin, cash and capital allocation" },
  { id: "reshape-work-skills", area: "people", label: "Reshape work and skills for AI", aiLed: true },
  { id: "ai-era-organization", area: "people", label: "Design the AI-era organization" },
  { id: "leaders-and-change", area: "people", label: "Build leaders and lead change" },
  { id: "modernize-planning", area: "supply-chain", label: "Modernize operations and planning with AI and automation", aiLed: true },
  { id: "resilient-sourcing-footprint", area: "supply-chain", label: "Build resilient sourcing and footprint" },
  { id: "cut-procurement-ops-cost", area: "supply-chain", label: "Cut cost and lift productivity in procurement and operations" },
  { id: "modernize-customer-service", area: "customer-growth", label: "Modernize customer service with AI", aiLed: true },
  { id: "redesign-customer-experience", area: "customer-growth", label: "Redesign the customer experience end to end" },
  { id: "grow-customer-value", area: "customer-growth", label: "Grow customer value: pricing, loyalty and retention" },
  { id: "govern-ai-regulation", area: "risk", label: "Govern AI and data responsibly", aiLed: true },
  { id: "modernize-risk-compliance", area: "risk", label: "Modernize risk and compliance with AI and automation" },
  { id: "third-party-operational-resilience", area: "risk", label: "Strengthen third-party and operational resilience" },
];

export const AREA_BY_ID = new Map(SERVICE_AREAS.map((a) => [a.id, a]));
export const AREA_BY_CATALOG_L2 = new Map(SERVICE_AREAS.map((a) => [a.catalogL2, a]));
export const AGENDA_BY_ID = new Map(AGENDAS.map((a) => [a.id, a]));

/** Colours keyed by the catalog's L2 name, for offering pills ("L2 > L3"). */
export const L2_COLORS: Record<string, { text: string; bg: string }> = Object.fromEntries(
  SERVICE_AREAS.map((a) => [a.catalogL2, a.color]),
);

/** The service area an offering string belongs to: "Finance > Finance AI" -> Finance. Legacy names ("AI Consulting") return undefined. */
export function areaOfOffer(offer: string | undefined): ServiceArea | undefined {
  if (!offer) return undefined;
  const [l2, l3] = offer.split(" > ");
  return l3 ? AREA_BY_CATALOG_L2.get(l2.trim()) : undefined;
}
