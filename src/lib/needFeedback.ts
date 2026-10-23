// Turning an admin's corrections into saved feedback rows, and choosing which saved corrections to send with a refresh as examples.
import { placementChanged, placementValues, type PlacedNeed } from "@/lib/needPlacement";

export interface FeedbackNeed extends PlacedNeed {
  name: string;
  signals?: string[];
  narrative?: string;
}

export interface FeedbackRow {
  sub_industry_id: string;
  need_name: string;
  need_text: string;
  proposed_area: string | null;
  proposed_agenda: string | null;
  proposed_primary: string | null;
  proposed_secondary: string | null;
  final_area: string;
  final_agenda: string | null;
  final_primary: string;
  final_secondary: string | null;
  source: "refresh-preview" | "editor" | "spreadsheet-review";
}

export interface StoredFeedback extends FeedbackRow {
  created_at: string;
}

/** What a worked example sent to the refresh function looks like. */
export interface PlacementExample {
  need: string;
  text: string;
  agenda: string | null;
  area: string;
  primary: string;
  secondary: string | null;
}

const nul = (v: string) => (v ? v : null);

export const needText = (n: FeedbackNeed): string => {
  const signals = (n.signals ?? []).filter(Boolean).slice(0, 3).join("; ");
  const narrative = (n.narrative ?? "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim().slice(0, 220);
  return [signals && `Signals: ${signals}`, narrative].filter(Boolean).join(" | ").slice(0, 450);
};

/** One row per need whose placement now differs from what was proposed (matched by name; needs that were added or renamed are skipped). */
export function feedbackRowsFor(subIndustryId: string, proposed: FeedbackNeed[], final: FeedbackNeed[], source: FeedbackRow["source"]): FeedbackRow[] {
  const before = new Map(proposed.map((n) => [n.name, n]));
  const rows: FeedbackRow[] = [];
  for (const n of final) {
    const was = before.get(n.name);
    if (!was || !placementChanged(was, n)) continue;
    const p = placementValues(was), f = placementValues(n);
    if (!f.area || !f.primary) continue;
    rows.push({
      sub_industry_id: subIndustryId, need_name: n.name, need_text: needText(n),
      proposed_area: nul(p.area), proposed_agenda: nul(p.agenda), proposed_primary: nul(p.primary), proposed_secondary: nul(p.secondary),
      final_area: f.area, final_agenda: nul(f.agenda), final_primary: f.primary, final_secondary: nul(f.secondary), source,
    });
  }
  return rows;
}

/** Up to `max` examples, newest first, one per distinct outcome (final agenda + primary offering), and at least one per final agenda before repeats. */
export function chooseExamples(stored: StoredFeedback[], max = 12): PlacementExample[] {
  const newestFirst = [...stored].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const picked: StoredFeedback[] = [];
  const outcomes = new Set<string>();
  const agendas = new Set<string>();
  for (const pass of [0, 1]) {
    for (const r of newestFirst) {
      if (picked.length >= max) break;
      const outcome = `${r.final_agenda ?? `other:${r.final_area}`}|${r.final_primary}`;
      const agendaKey = r.final_agenda ?? `other:${r.final_area}`;
      if (outcomes.has(outcome)) continue;
      if (pass === 0 && agendas.has(agendaKey)) continue; // first pass: one per final agenda
      outcomes.add(outcome);
      agendas.add(agendaKey);
      picked.push(r);
    }
  }
  return picked.map((r) => ({ need: r.need_name, text: r.need_text, agenda: r.final_agenda, area: r.final_area, primary: r.final_primary, secondary: r.final_secondary }));
}
