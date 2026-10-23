// The MC service offering catalog: 52 offerings across the six service areas (see mcStorefront.ts).
// An offering is stored on a need as "<catalog area name> > <offering>" (for example "Finance > Finance AI"), because Change Management and
// Program & Portfolio Management exist under every area. supabase/functions/refresh-industry-insights/index.ts holds the same list with
// descriptions; scripts/qc/pipeline/industry.test.mjs fails if the two differ.
import { AREA_BY_ID } from "./mcStorefront";

export interface Offering {
  /** Service area id (see mcStorefront.ts). */
  area: string;
  l3: string;
}

export const OFFERINGS: Offering[] = [
  { area: "strategy", l3: "Corporate Strategy" },
  { area: "strategy", l3: "Enterprise Digital & Technology" },
  { area: "strategy", l3: "Enterprise AI" },
  { area: "strategy", l3: "Operating Model" },
  { area: "strategy", l3: "M&A & Divestitures" },
  { area: "strategy", l3: "Performance Improvement" },
  { area: "strategy", l3: "Transformation Management" },
  { area: "strategy", l3: "Change Management" },
  { area: "strategy", l3: "Program & Portfolio Management" },
  { area: "finance", l3: "Finance Strategy" },
  { area: "finance", l3: "Finance Operating Model" },
  { area: "finance", l3: "Finance Processes & Operations" },
  { area: "finance", l3: "Financial Planning & Analysis" },
  { area: "finance", l3: "Finance Technology" },
  { area: "finance", l3: "Finance AI" },
  { area: "finance", l3: "Change Management" },
  { area: "finance", l3: "Program & Portfolio Management" },
  { area: "supply-chain", l3: "Supply Chain Strategy" },
  { area: "supply-chain", l3: "Supply Chain Planning" },
  { area: "supply-chain", l3: "Procurement" },
  { area: "supply-chain", l3: "Manufacturing & Operations" },
  { area: "supply-chain", l3: "Logistics & Fulfillment" },
  { area: "supply-chain", l3: "Supply Chain & Operations Technology" },
  { area: "supply-chain", l3: "Supply Chain & Operations AI" },
  { area: "supply-chain", l3: "Change Management" },
  { area: "supply-chain", l3: "Program & Portfolio Management" },
  { area: "customer-growth", l3: "Growth Strategy" },
  { area: "customer-growth", l3: "Customer Experience" },
  { area: "customer-growth", l3: "Customer Service & Success" },
  { area: "customer-growth", l3: "Customer & Growth Technology" },
  { area: "customer-growth", l3: "Customer & Growth AI" },
  { area: "customer-growth", l3: "Change Management" },
  { area: "customer-growth", l3: "Program & Portfolio Management" },
  { area: "people", l3: "Organization Strategy" },
  { area: "people", l3: "Organization Design" },
  { area: "people", l3: "Talent & Leadership" },
  { area: "people", l3: "Learning & Capability Development" },
  { area: "people", l3: "HR Operations & Services" },
  { area: "people", l3: "HR Technology" },
  { area: "people", l3: "HR AI" },
  { area: "people", l3: "Change Management" },
  { area: "people", l3: "Program & Portfolio Management" },
  { area: "risk", l3: "Enterprise Risk Management" },
  { area: "risk", l3: "Third-Party Risk Management" },
  { area: "risk", l3: "Operational Risk & Resilience" },
  { area: "risk", l3: "Governance & Controls" },
  { area: "risk", l3: "Compliance & Regulatory" },
  { area: "risk", l3: "Internal Audit" },
  { area: "risk", l3: "Risk Technology" },
  { area: "risk", l3: "Risk AI" },
  { area: "risk", l3: "Change Management" },
  { area: "risk", l3: "Program & Portfolio Management" },
];

/** The stored form: "Finance > Finance AI". */
export const offerKeyOf = (o: Offering): string => `${AREA_BY_ID.get(o.area)!.catalogL2} > ${o.l3}`;

export const OFFER_KEYS: string[] = OFFERINGS.map(offerKeyOf);
export const OFFER_KEY_SET = new Set(OFFER_KEYS);

/** The offerings of one service area, in catalog order. */
export const offeringsOfArea = (areaId: string): string[] => OFFERINGS.filter((o) => o.area === areaId).map(offerKeyOf);

/** Change Management and Program & Portfolio Management appear under every area; they are add-ons, not a first choice. */
export const isGenericOffering = (key: string): boolean => /> (Change Management|Program & Portfolio Management)$/.test(key);

