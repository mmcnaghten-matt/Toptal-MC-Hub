import { describe, expect, it } from "vitest";
import { AGENDAS, AREA_BY_ID, SERVICE_AREAS, areaOfOffer } from "./mcStorefront";

describe("MC storefront", () => {
  it("has six areas with three agendas each, in slide order", () => {
    expect(SERVICE_AREAS.map((a) => a.name)).toEqual([
      "Strategy & AI Transformation",
      "Finance",
      "People & Organization",
      "Supply Chain & Operations",
      "Customer & Growth",
      "Risk, Compliance & AI Governance",
    ]);
    expect(AGENDAS).toHaveLength(18);
    for (const area of SERVICE_AREAS) expect(AGENDAS.filter((a) => a.area === area.id)).toHaveLength(3);
  });

  it("has unique ids and every agenda points at a real area", () => {
    expect(new Set(AGENDAS.map((a) => a.id)).size).toBe(18);
    expect(new Set(SERVICE_AREAS.map((a) => a.id)).size).toBe(6);
    for (const a of AGENDAS) expect(AREA_BY_ID.has(a.area)).toBe(true);
  });

  it("maps catalog offerings to their area, including the two areas named differently on the slides", () => {
    expect(areaOfOffer("Finance > Finance AI")?.id).toBe("finance");
    expect(areaOfOffer("Strategy & Transformation > Enterprise AI")?.name).toBe("Strategy & AI Transformation");
    expect(areaOfOffer("Risk & Compliance > Risk AI")?.name).toBe("Risk, Compliance & AI Governance");
  });

  it("does not map legacy offering names or empty values", () => {
    expect(areaOfOffer("AI Consulting")).toBeUndefined();
    expect(areaOfOffer(undefined)).toBeUndefined();
    expect(areaOfOffer("Unknown Area > Something")).toBeUndefined();
  });
});
