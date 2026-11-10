import { describe, expect, it } from "vitest";
import { AGENDAS, AREA_BY_ID, SERVICE_AREAS, areaOfOffer } from "./mcStorefront";

describe("MC storefront", () => {
  it("has six areas with three agendas each, in slide order", () => {
    expect(SERVICE_AREAS.map((a) => a.name)).toEqual([
      "Strategy & AI Transformation",
      "Finance",
      "People & Organization",
      "Supply Chain & Operations",
      "Customer",
      "Risk, Compliance & AI Governance",
    ]);
    expect(AGENDAS).toHaveLength(18);
    for (const area of SERVICE_AREAS) expect(AGENDAS.filter((a) => a.area === area.id)).toHaveLength(3);
  });

  it("marks the first agenda of each area as AI-led, and no other", () => {
    for (const area of SERVICE_AREAS) {
      const list = AGENDAS.filter((a) => a.area === area.id);
      expect(list.filter((a) => a.aiLed)).toHaveLength(1);
      expect(list[0].aiLed).toBe(true);
    }
    expect(AGENDAS.filter((a) => a.aiLed).map((a) => a.label)).toEqual([
      "Turn AI into P&L value",
      "Modernize finance with AI and automation",
      "Reshape work and skills for AI",
      "Modernize operations and planning with AI and automation",
      "Modernize customer service with AI",
      "Govern AI and data responsibly",
    ]);
  });

  it("uses the current Customer agendas and keeps retired ids out", () => {
    expect(AGENDAS.filter((a) => a.area === "customer-growth").map((a) => a.id)).toEqual(["modernize-customer-service", "redesign-customer-experience", "grow-customer-value"]);
    const ids = AGENDAS.map((a) => a.id);
    expect(ids).not.toContain("pricing-commercial-excellence");
    expect(ids).not.toContain("marketing-sales-effectiveness");
  });

  it("has unique ids and every agenda points at a real area", () => {
    expect(new Set(AGENDAS.map((a) => a.id)).size).toBe(18);
    expect(new Set(SERVICE_AREAS.map((a) => a.id)).size).toBe(6);
    for (const a of AGENDAS) expect(AREA_BY_ID.has(a.area)).toBe(true);
  });

  it("maps catalog offerings to their area, under the area names used on the storefront", () => {
    expect(areaOfOffer("Finance > Finance AI")?.id).toBe("finance");
    expect(areaOfOffer("Strategy & AI Transformation > Enterprise AI")?.name).toBe("Strategy & AI Transformation");
    expect(areaOfOffer("Risk, Compliance & AI Governance > Risk AI")?.name).toBe("Risk, Compliance & AI Governance");
    expect(areaOfOffer("Customer > Pricing & Monetization Strategy")?.id).toBe("customer-growth");
    expect(areaOfOffer("Strategy & AI Transformation > Growth Strategy")?.id).toBe("strategy");
  });

  it("does not map legacy offering names or empty values", () => {
    expect(areaOfOffer("AI Consulting")).toBeUndefined();
    expect(areaOfOffer(undefined)).toBeUndefined();
    expect(areaOfOffer("Unknown Area > Something")).toBeUndefined();
    expect(areaOfOffer("Customer & Growth > Growth Strategy")).toBeUndefined(); // retired area name
  });
});
