import { describe, expect, it } from "vitest";
import { AREA_BY_ID, SERVICE_AREAS } from "./mcStorefront";
import { OFFERINGS, OFFER_KEYS, isGenericOffering, offerKeyOf, offeringsOfArea } from "./mcOfferings";

describe("MC offerings", () => {
  it("has 51 offerings with the expected number per service area", () => {
    expect(OFFERINGS).toHaveLength(51);
    expect(Object.fromEntries(SERVICE_AREAS.map((a) => [a.id, offeringsOfArea(a.id).length]))).toEqual({
      strategy: 10, finance: 8, people: 8, "supply-chain": 9, "customer-growth": 6, risk: 10,
    });
  });

  it("stores offerings as '<catalog area name> > <offering>', unique, and each belongs to a real area", () => {
    expect(new Set(OFFER_KEYS).size).toBe(51);
    for (const o of OFFERINGS) {
      expect(AREA_BY_ID.has(o.area)).toBe(true);
      expect(offerKeyOf(o)).toBe(`${AREA_BY_ID.get(o.area)!.catalogL2} > ${o.l3}`);
    }
    expect(OFFER_KEYS).toContain("Strategy & AI Transformation > Enterprise AI");
    expect(OFFER_KEYS).toContain("Risk, Compliance & AI Governance > Risk AI");
    expect(OFFER_KEYS).toContain("Strategy & AI Transformation > Growth Strategy");
    expect(OFFER_KEYS).toContain("Customer > Pricing & Monetization Strategy");
    expect(OFFER_KEYS).not.toContain("People & Organization > Learning & Capability Development");
  });

  it("recognises the two generic offerings that exist under every area", () => {
    const generic = OFFER_KEYS.filter(isGenericOffering);
    expect(generic).toHaveLength(12);
    expect(isGenericOffering("Finance > Change Management")).toBe(true);
    expect(isGenericOffering("Finance > Finance AI")).toBe(false);
  });
});
