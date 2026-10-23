import { describe, expect, it } from "vitest";
import { chooseExamples, feedbackRowsFor, needText, type StoredFeedback } from "./needFeedback";

const need = (name: string, extra: { area?: string; agenda?: string; mcOffers?: string[]; signals?: string[]; narrative?: string } = {}) => ({ name, mcOffers: [] as string[], ...extra });

describe("feedbackRowsFor", () => {
  it("records only needs whose placement changed, with what was proposed and what was chosen", () => {
    const proposed = [
      need("A", { agenda: "modernize-finance", mcOffers: ["Finance > Finance AI"] }),
      need("B", { agenda: "plan-forecast-ai", mcOffers: ["Finance > Financial Planning & Analysis"] }),
    ];
    const final = [
      need("A", { agenda: "modernize-finance", mcOffers: ["Finance > Finance AI"] }),
      need("B", { agenda: "govern-ai-regulation", mcOffers: ["Risk & Compliance > Risk AI", "Finance > Financial Planning & Analysis"], signals: ["Fines rising"], narrative: "Regulators [1] are watching." }),
    ];
    const rows = feedbackRowsFor("insurance", proposed, final, "refresh-preview");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      sub_industry_id: "insurance", need_name: "B", source: "refresh-preview",
      proposed_area: "finance", proposed_agenda: "plan-forecast-ai", proposed_primary: "Finance > Financial Planning & Analysis", proposed_secondary: null,
      final_area: "risk", final_agenda: "govern-ai-regulation", final_primary: "Risk & Compliance > Risk AI", final_secondary: "Finance > Financial Planning & Analysis",
    });
    expect(rows[0].need_text).toBe("Signals: Fines rising | Regulators are watching.");
  });

  it("skips needs that were added or renamed, and needs without a primary offering", () => {
    const proposed = [need("A", { area: "finance", mcOffers: ["Finance > Finance AI"] })];
    expect(feedbackRowsFor("x", proposed, [need("New", { area: "risk", mcOffers: ["Risk & Compliance > Risk AI"] })], "editor")).toEqual([]);
    expect(feedbackRowsFor("x", proposed, [need("A", { area: "finance", mcOffers: [] })], "editor")).toEqual([]);
  });

  it("keeps the example text short", () => {
    expect(needText(need("A", { signals: ["a", "b", "c", "d"], narrative: "x".repeat(900) })).length).toBeLessThanOrEqual(450);
  });
});

const stored = (i: number, agenda: string | null, area: string, primary: string): StoredFeedback => ({
  created_at: `2026-10-${String(10 + i).padStart(2, "0")}T00:00:00Z`, sub_industry_id: "s", need_name: `need ${i}`, need_text: "t",
  proposed_area: null, proposed_agenda: null, proposed_primary: null, proposed_secondary: null,
  final_area: area, final_agenda: agenda, final_primary: primary, final_secondary: null, source: "editor",
});

describe("chooseExamples", () => {
  it("takes the newest first, one per distinct outcome", () => {
    const rows = [stored(1, "govern-ai-regulation", "risk", "Risk & Compliance > Risk AI"), stored(2, "govern-ai-regulation", "risk", "Risk & Compliance > Risk AI"), stored(3, "plan-forecast-ai", "finance", "Finance > Financial Planning & Analysis")];
    const ex = chooseExamples(rows);
    expect(ex.map((e) => e.need)).toEqual(["need 3", "need 2"]);
  });

  it("covers every final agenda before repeating one, and caps the count", () => {
    const rows = [
      stored(9, "govern-ai-regulation", "risk", "Risk & Compliance > Risk AI"),
      stored(8, "govern-ai-regulation", "risk", "Risk & Compliance > Compliance & Regulatory"),
      stored(1, "plan-forecast-ai", "finance", "Finance > Financial Planning & Analysis"),
    ];
    expect(chooseExamples(rows, 2).map((e) => e.need)).toEqual(["need 9", "need 1"]);
    const many = Array.from({ length: 30 }, (_, i) => stored(i, null, "strategy", `Strategy & Transformation > Offer ${i}`));
    expect(chooseExamples(many)).toHaveLength(12);
  });
});
