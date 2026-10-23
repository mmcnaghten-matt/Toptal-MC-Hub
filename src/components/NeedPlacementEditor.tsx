import { AGENDAS, SERVICE_AREAS } from "@/data/mcStorefront";
import { offeringsOfArea } from "@/data/mcOfferings";
import { areaIdOf, placementChanged, placementErrors, primaryOf, secondaryOf, withAgenda, withArea, withPrimary, withSecondary, type PlacedNeed } from "@/lib/needPlacement";

interface Props<T extends PlacedNeed> {
  need: T;
  onChange: (next: T) => void;
  /** What the refresh (or the saved content) proposed; a "changed" mark shows when the current choice differs. */
  proposed?: T;
  /** Unique per need on the page, so labels point at the right select. */
  idPrefix: string;
}

const selectClass = "mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm disabled:opacity-50";
const l3Of = (key: string) => key.split(" > ")[1] ?? key;

// Remap one need: Service area and Agenda first, then the Primary offering (only that area's offerings), then an optional
// Secondary offering (any area). Used in the refresh preview and in the saved-content editor.
export function NeedPlacementEditor<T extends PlacedNeed>({ need, onChange, proposed, idPrefix }: Props<T>) {
  const areaId = areaIdOf(need) ?? "";
  const errors = placementErrors(need);
  const changed = proposed ? placementChanged(proposed, need) : false;
  const areaOffers = areaId ? offeringsOfArea(areaId) : [];

  return (
    <div className="space-y-2" data-testid={`placement-${idPrefix}`}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground" htmlFor={`${idPrefix}-area`}>Service area</label>
          <select id={`${idPrefix}-area`} value={areaId} onChange={(e) => onChange(withArea(need, e.target.value))} className={selectClass}>
            <option value="">Choose a service area</option>
            {SERVICE_AREAS.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground" htmlFor={`${idPrefix}-agenda`}>Agenda</label>
          <select id={`${idPrefix}-agenda`} value={need.agenda ?? ""} disabled={!areaId} onChange={(e) => onChange(withAgenda(need, e.target.value))} className={selectClass}>
            <option value="">Other</option>
            {AGENDAS.filter((g) => g.area === areaId).map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground" htmlFor={`${idPrefix}-primary`}>Primary offering (from the service area)</label>
          <select id={`${idPrefix}-primary`} value={primaryOf(need)} disabled={!areaId} onChange={(e) => onChange(withPrimary(need, e.target.value))} className={selectClass}>
            <option value="">Choose a primary offering</option>
            {areaOffers.map((o) => (
              <option key={o} value={o}>{l3Of(o)}</option>
            ))}
            {primaryOf(need) && !areaOffers.includes(primaryOf(need)) && <option value={primaryOf(need)}>{primaryOf(need)} (not in this area)</option>}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground" htmlFor={`${idPrefix}-secondary`}>Secondary offering (optional, any area)</label>
          <select id={`${idPrefix}-secondary`} value={secondaryOf(need)} onChange={(e) => onChange(withSecondary(need, e.target.value))} className={selectClass}>
            <option value="">None</option>
            {SERVICE_AREAS.map((a) => (
              <optgroup key={a.id} label={a.name}>
                {offeringsOfArea(a.id).map((o) => (
                  <option key={o} value={o}>{l3Of(o)}</option>
                ))}
              </optgroup>
            ))}
            {secondaryOf(need) && !SERVICE_AREAS.some((a) => offeringsOfArea(a.id).includes(secondaryOf(need))) && <option value={secondaryOf(need)}>{secondaryOf(need)}</option>}
          </select>
        </div>
      </div>
      {changed && <p className="text-xs font-medium text-amber-700">Changed from the proposal; this correction is remembered for future refreshes.</p>}
      {errors.length > 0 && (
        <ul role="alert" className="text-xs font-medium text-destructive">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}
