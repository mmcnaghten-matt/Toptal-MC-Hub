import { describe, expect, it } from "vitest";
import { placementChanged, placementErrors, placementValues, primaryOf, secondaryOf, withAgenda, withArea, withPrimary, withSecondary } from "./needPlacement";

const need = (extra: { area?: string; agenda?: string; mcOffers?: string[] } = {}) => ({ name: "n", mcOffers: [] as string[], ...extra });

describe("remapping a need", () => {
  it("keeps the primary when the new area contains it, and clears it when not", () => {
    const n = need({ agenda: "modernize-finance", mcOffers: ["Finance > Finance AI", "Customer & Growth > Growth Strategy"] });
    expect(primaryOf(withArea(n, "finance"))).toBe("Finance > Finance AI");
    const moved = withArea(n, "risk");
    expect(primaryOf(moved)).toBe("");
    expect(secondaryOf(moved)).toBe("Customer & Growth > Growth Strategy"); // the secondary is not tied to the area
  });

  it("drops an agenda that does not belong to the new area, keeps one that does", () => {
    const n = need({ agenda: "modernize-finance", mcOffers: ["Finance > Finance AI"] });
    expect(withArea(n, "risk").agenda).toBeUndefined();
    expect(withArea(n, "finance").agenda).toBe("modernize-finance");
  });

  it("choosing an agenda moves the need to that agenda's area", () => {
    const n = withAgenda(need({ area: "finance", mcOffers: ["Finance > Finance AI"] }), "govern-ai-regulation");
    expect(n.area).toBe("risk");
    expect(n.agenda).toBe("govern-ai-regulation");
    expect(primaryOf(n)).toBe("");
  });

  it("'Other' keeps the area and removes the agenda", () => {
    const n = withAgenda(need({ agenda: "plan-forecast-ai", mcOffers: ["Finance > Financial Planning & Analysis"] }), "");
    expect(n.agenda).toBeUndefined();
    expect(n.area).toBe("finance");
    expect(primaryOf(n)).toBe("Finance > Financial Planning & Analysis");
  });

  it("the secondary can never equal the primary", () => {
    const n = withSecondary(need({ area: "finance", mcOffers: ["Finance > Finance AI"] }), "Finance > Finance AI");
    expect(secondaryOf(n)).toBe("");
    const m = withPrimary(need({ area: "finance", mcOffers: ["Finance > Finance AI", "Finance > Finance Strategy"] }), "Finance > Finance Strategy");
    expect(m.mcOffers).toEqual(["Finance > Finance Strategy"]);
  });
});

describe("placementErrors", () => {
  it("accepts a primary in the area with an optional secondary from any area", () => {
    expect(placementErrors(need({ agenda: "plan-forecast-ai", mcOffers: ["Finance > Financial Planning & Analysis"] }))).toEqual([]);
    expect(placementErrors(need({ area: "finance", mcOffers: ["Finance > Finance AI", "Risk & Compliance > Risk AI"] }))).toEqual([]);
  });

  it("flags a missing area, a missing primary, a primary outside the area and bad secondaries", () => {
    expect(placementErrors(need({ mcOffers: ["Finance > Finance AI"] }))).toEqual([]); // the area follows the first catalog offering (older content)
    expect(placementErrors(need({ mcOffers: ["Not an offering"] }))).toEqual(expect.arrayContaining(["Choose a service area"]));
    expect(placementErrors(need({ area: "finance", mcOffers: [] }))).toEqual(["Choose a primary offering"]);
    expect(placementErrors(need({ area: "finance", mcOffers: ["Risk & Compliance > Risk AI"] }))).toEqual(["The primary offering must be in Finance"]);
    expect(placementErrors(need({ area: "finance", mcOffers: ["Finance > Finance AI", "Nope"] }))).toEqual(["The secondary offering is not in the catalog"]);
    expect(placementErrors(need({ area: "finance", mcOffers: ["Finance > Finance AI", "Finance > Finance AI"] }))).toEqual(["The secondary offering must differ from the primary"]);
    expect(placementErrors(need({ area: "finance", mcOffers: ["Finance > Finance AI", "Finance > Finance Strategy", "Finance > Change Management"] }))).toContain("A need holds a primary and at most one secondary offering");
  });
});

describe("comparing placements", () => {
  it("reports a change in any of area, agenda, primary or secondary", () => {
    const a = need({ agenda: "modernize-finance", mcOffers: ["Finance > Finance AI", "Finance > Finance Strategy"] });
    expect(placementChanged(a, { ...a })).toBe(false);
    expect(placementChanged(a, withSecondary(a, ""))).toBe(true);
    expect(placementChanged(a, withAgenda(a, "cost-margin-cash"))).toBe(true);
    expect(placementChanged(a, withArea(a, "risk"))).toBe(true);
    expect(placementValues(a)).toEqual({ area: "finance", agenda: "modernize-finance", primary: "Finance > Finance AI", secondary: "Finance > Finance Strategy" });
  });
});
