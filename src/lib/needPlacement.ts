// Editing a need's placement: Service area / Agenda first, then the Primary offering (from that area), then an optional Secondary
// offering (from any area). A need holds at most these two offerings: mcOffers = [primary, secondary?].
import { AGENDA_BY_ID, AREA_BY_ID } from "@/data/mcStorefront";
import { OFFER_KEY_SET, offeringsOfArea } from "@/data/mcOfferings";
import { placementOf } from "@/lib/needGrouping";

export interface PlacedNeed {
  area?: string;
  agenda?: string;
  mcOffers: string[];
}

export const primaryOf = (n: PlacedNeed): string => n.mcOffers[0] ?? "";
export const secondaryOf = (n: PlacedNeed): string => n.mcOffers[1] ?? "";

const inArea = (areaId: string | undefined, offer: string): boolean => !!areaId && offeringsOfArea(areaId).includes(offer);

function build<T extends PlacedNeed>(need: T, parts: { area?: string; agenda?: string; primary: string; secondary: string }): T {
  const { area: _area, agenda: _agenda, ...rest } = need;
  const mcOffers = parts.primary || parts.secondary ? [parts.primary, ...(parts.secondary ? [parts.secondary] : [])] : [];
  return { ...rest, ...(parts.area ? { area: parts.area } : {}), ...(parts.agenda ? { agenda: parts.agenda } : {}), mcOffers } as T;
}

/** The service area the need currently sits in: from its agenda, its stored area, or (older content) its first offering. */
export const areaIdOf = (n: PlacedNeed): string | undefined => placementOf(n).area?.id;

/** Choose the service area. The agenda is cleared unless it belongs to the new area; the primary is kept only if it is in the new area. */
export function withArea<T extends PlacedNeed>(need: T, areaId: string): T {
  const agenda = need.agenda && AGENDA_BY_ID.get(need.agenda)?.area === areaId ? need.agenda : undefined;
  const primary = inArea(areaId, primaryOf(need)) ? primaryOf(need) : "";
  return build(need, { area: areaId || undefined, agenda, primary, secondary: secondaryOf(need) });
}

/** Choose the agenda (its service area follows), or "" for Other within the current area. */
export function withAgenda<T extends PlacedNeed>(need: T, agendaId: string): T {
  const agenda = agendaId ? AGENDA_BY_ID.get(agendaId) : undefined;
  const base = agenda && agenda.area !== areaIdOf(need) ? withArea(need, agenda.area) : need;
  return build(base, { area: agenda ? agenda.area : areaIdOf(base), agenda: agenda?.id, primary: primaryOf(base), secondary: secondaryOf(base) });
}

export function withPrimary<T extends PlacedNeed>(need: T, offer: string): T {
  return build(need, { area: areaIdOf(need), agenda: need.agenda, primary: offer, secondary: secondaryOf(need) === offer ? "" : secondaryOf(need) });
}

export function withSecondary<T extends PlacedNeed>(need: T, offer: string): T {
  return build(need, { area: areaIdOf(need), agenda: need.agenda, primary: primaryOf(need), secondary: offer === primaryOf(need) ? "" : offer });
}

/** Why a need cannot be saved yet (empty when it is fine). */
export function placementErrors(n: PlacedNeed): string[] {
  const errors: string[] = [];
  const areaId = areaIdOf(n);
  const primary = primaryOf(n);
  const secondary = secondaryOf(n);
  if (!areaId) errors.push("Choose a service area");
  if (!primary) errors.push("Choose a primary offering");
  else if (!OFFER_KEY_SET.has(primary)) errors.push("The primary offering is not in the catalog");
  else if (areaId && !inArea(areaId, primary)) errors.push(`The primary offering must be in ${AREA_BY_ID.get(areaId)!.name}`);
  if (secondary && !OFFER_KEY_SET.has(secondary)) errors.push("The secondary offering is not in the catalog");
  if (secondary && secondary === primary) errors.push("The secondary offering must differ from the primary");
  if (n.mcOffers.length > 2) errors.push("A need holds a primary and at most one secondary offering");
  return errors;
}

/** The four values that make up a placement, for comparing what was proposed with what was chosen. */
export interface PlacementValues {
  area: string;
  agenda: string;
  primary: string;
  secondary: string;
}
export const placementValues = (n: PlacedNeed): PlacementValues => ({ area: areaIdOf(n) ?? "", agenda: placementOf(n).agenda?.id ?? "", primary: primaryOf(n), secondary: secondaryOf(n) });
export const placementChanged = (a: PlacedNeed, b: PlacedNeed): boolean => {
  const x = placementValues(a), y = placementValues(b);
  return x.area !== y.area || x.agenda !== y.agenda || x.primary !== y.primary || x.secondary !== y.secondary;
};
