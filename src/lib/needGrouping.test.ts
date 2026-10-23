import { describe, expect, it } from "vitest";
import { groupNeeds, placementOf } from "./needGrouping";

const need = (name: string, extra: { agenda?: string; area?: string; mcOffers?: string[] } = {}) => ({ name, mcOffers: [] as string[], ...extra });

describe("groupNeeds", () => {
  it("groups by area then agenda, in storefront order, keeping each group's need order", () => {
    const g = groupNeeds([
      need("c", { agenda: "cost-margin-cash" }),
      need("a", { agenda: "ai-into-pl-value" }),
      need("b", { agenda: "ai-into-pl-value" }),
      need("d", { agenda: "plan-forecast-ai" }),
    ]);
    expect(g.areas.map((x) => x.area.id)).toEqual(["strategy", "finance"]);
    expect(g.areas[0].agendas.map((x) => x.agenda?.id)).toEqual(["ai-into-pl-value"]);
    expect(g.areas[0].agendas[0].needs.map((n) => n.name)).toEqual(["a", "b"]);
    // agendas follow the slide order (plan before cost), not the order the needs arrived in
    expect(g.areas[1].agendas.map((x) => x.agenda?.id)).toEqual(["plan-forecast-ai", "cost-margin-cash"]);
    expect(g.areas.map((x) => x.count)).toEqual([2, 2]);
    expect(g.other).toEqual([]);
  });

  it("takes the area from the agenda, never from a separately stored area", () => {
    const p = placementOf(need("x", { agenda: "plan-forecast-ai", area: "risk" }));
    expect(p.area?.id).toBe("finance");
    expect(p.agenda?.id).toBe("plan-forecast-ai");
  });

  it("uses a stored area when there is no agenda, as a group of its own after the three agendas", () => {
    const g = groupNeeds([need("area only", { area: "finance" }), need("agenda", { agenda: "cost-margin-cash" })]);
    expect(g.areas).toHaveLength(1);
    expect(g.areas[0].agendas.map((x) => x.agenda?.id)).toEqual(["cost-margin-cash", undefined]);
  });

  it("falls back to the area of the first catalog-style offering", () => {
    const g = groupNeeds([need("n", { mcOffers: ["Customer & Growth > Customer Experience", "Finance > Finance AI"] })]);
    expect(g.areas.map((x) => x.area.id)).toEqual(["customer-growth"]);
    expect(g.areas[0].agendas[0].agenda).toBeUndefined();
  });

  it("puts needs it cannot place (legacy offering names, unknown ids, nothing) in 'other'", () => {
    const g = groupNeeds([need("legacy", { mcOffers: ["AI Consulting"] }), need("bad", { agenda: "nope", area: "nope" }), need("empty")]);
    expect(g.areas).toEqual([]);
    expect(g.other.map((n) => n.name)).toEqual(["legacy", "bad", "empty"]);
  });

  it("omits empty areas and agendas", () => {
    const g = groupNeeds([need("only", { agenda: "govern-ai-regulation" })]);
    expect(g.areas).toHaveLength(1);
    expect(g.areas[0].agendas).toHaveLength(1);
  });
});
