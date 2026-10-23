// Groups industry needs by MC service area, then by client agenda (see src/data/mcStorefront.ts).
//
// Where a need belongs, in order: its stored agenda (the area is taken from the agenda, never from a separately stored value),
// its stored area, the area of its first catalog-style offering ("Finance > Finance AI"), otherwise the "Other needs" group.
import { AGENDA_BY_ID, AREA_BY_ID, SERVICE_AREAS, areaOfOffer, type Agenda, type ServiceArea } from "@/data/mcStorefront";

interface Placeable {
  agenda?: string;
  area?: string;
  mcOffers?: string[];
}

export interface AgendaGroup<T> {
  /** undefined: needs placed in the area but under none of its three agendas. */
  agenda?: Agenda;
  needs: T[];
}

export interface AreaGroup<T> {
  area: ServiceArea;
  agendas: AgendaGroup<T>[];
  count: number;
}

export interface GroupedNeeds<T> {
  areas: AreaGroup<T>[];
  /** Needs that could not be placed in any service area. */
  other: T[];
}

export function placementOf(need: Placeable): { area?: ServiceArea; agenda?: Agenda } {
  const agenda = need.agenda ? AGENDA_BY_ID.get(need.agenda) : undefined;
  if (agenda) return { area: AREA_BY_ID.get(agenda.area), agenda };
  const area = (need.area ? AREA_BY_ID.get(need.area) : undefined) ?? areaOfOffer(need.mcOffers?.[0]);
  return { area };
}

export function groupNeeds<T extends Placeable>(needs: T[]): GroupedNeeds<T> {
  const byAgenda = new Map<string, T[]>(); // key: area id + "/" + agenda id ("" for none)
  const other: T[] = [];
  for (const need of needs) {
    const { area, agenda } = placementOf(need);
    if (!area) {
      other.push(need);
      continue;
    }
    const key = `${area.id}/${agenda?.id ?? ""}`;
    byAgenda.set(key, [...(byAgenda.get(key) ?? []), need]);
  }
  const areas: AreaGroup<T>[] = [];
  for (const area of SERVICE_AREAS) {
    const agendas: AgendaGroup<T>[] = [];
    for (const agenda of [...agendaList(area.id), undefined]) {
      const list = byAgenda.get(`${area.id}/${agenda?.id ?? ""}`);
      if (list?.length) agendas.push({ agenda, needs: list });
    }
    const count = agendas.reduce((n, g) => n + g.needs.length, 0);
    if (count) areas.push({ area, agendas, count });
  }
  return { areas, other };
}

const agendaList = (areaId: string): Agenda[] => [...AGENDA_BY_ID.values()].filter((a) => a.area === areaId);
