// Talent Guild (called the Talent Bench until November 2026; its database objects keep the old names): pre-identified talent by service area and role. Pure helpers (no network); the page and hooks build on these.
// Candidate data is never kept in the code repository (it is public); see supabase/migrations/20261110000000_talent_bench.sql.

export interface TalentRole {
  id: string;
  label: string;
  /** Shown under the column heading. */
  note?: string;
}

export const TALENT_ROLES: TalentRole[] = [
  { id: "engagement-leader", label: "Engagement Leader", note: "Senior expert who owns the client relationship and delivery; leads the team and SteerCo." },
  { id: "manager", label: "Manager", note: "Mid-level consultant who runs the day-to-day work; frees the lead to focus on the client." },
  { id: "specialist", label: "Specialist", note: "Deep subject-matter expert brought in for specific expertise; usually part-time, not leading the engagement." },
  // People the Service Line leaders know in the area who have not yet signed up for one of the three roles above.
  { id: "gm-member", label: "GM Talent Guild Members", note: "Known to the Service Line leaders; not yet signed up as an Engagement Leader, Manager or Specialist" },
];

/** The service areas the program covers, by id (names and colours come from src/data/mcStorefront.ts). */
export const TALENT_AREA_IDS = ["strategy", "finance", "people", "supply-chain"] as const;

/** One service area a person is in, with their role there. In the GM column a placement can be flagged as a Fractional Leader. */
export interface Placement {
  id: string;
  service_area: string;
  role: string;
  fractional_leader: boolean;
}

/** The GM Talent Guild Members column: the only column where a placement can be flagged as a Fractional Leader. */
export const GM_ROLE_ID = "gm-member";
/** At most this many Fractional Leaders per service area (the database enforces it too). */
export const MAX_FRACTIONAL_LEADERS = 2;

export interface TalentProfile {
  id: string;
  created_at: string;
  updated_at: string;
  added_by: string | null;
  name: string;
  location: string;
  headline: string;
  summary: string;
  highlights: string[];
  profile_url: string;
  photo: string | null;
  /** Every service area the person is in (at least one). */
  placements: Placement[];
}

/** What the talent-profile function reads from a Toptal profile. */
export interface ReadProfile {
  name: string;
  location: string;
  headline: string;
  summary: string;
  highlights: string[];
  photo?: string;
}

/** Toptal profile addresses only: https on toptal.com (the function refuses anything else). */
export function isToptalProfileUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" && (u.hostname === "toptal.com" || u.hostname === "www.toptal.com") && /\/resume\/[^/]+/.test(u.pathname);
  } catch {
    return false;
  }
}

/** The form a profile address is stored in: lower-case host, no query, fragment or trailing slash. Returns "" if it is not a Toptal profile. */
export function normalizeProfileUrl(value: string): string {
  if (!isToptalProfileUrl(value)) return "";
  const u = new URL(value.trim());
  return `https://${u.hostname}${u.pathname.replace(/\/+$/, "")}`;
}

/** "joe-coombs" in a profile address, as a display name: "Joe Coombs". Used only when a profile could not be read. */
export function nameFromProfileUrl(value: string): string {
  const slug = normalizeProfileUrl(value).split("/").pop() ?? "";
  return slug.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const SUFFIX = /^(jr|sr|ii|iii|iv|phd|mba|cpa|cfa)\.?$/i;

/** The surname used to sort people: the last word of the name, ignoring a trailing suffix such as "Jr." or "III". */
export function lastNameOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  while (words.length > 1 && SUFFIX.test(words[words.length - 1])) words.pop();
  return words[words.length - 1] ?? "";
}

/** Alphabetical by last name, then by the full name. */
export const byLastName = (a: { name: string }, b: { name: string }) =>
  lastNameOf(a.name).localeCompare(lastNameOf(b.name), undefined, { sensitivity: "base" }) || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/** A person as listed in one cell: the person and the placement that puts them there. */
export interface CellEntry<T, P extends { fractional_leader: boolean } = Placement> {
  person: T;
  placement: P;
}

/**
 * Talent by service area, then role. A person in two areas is listed in both, under the role they hold in each. People in a cell are sorted
 * by last name; in the GM column, Fractional Leaders come first. Unknown areas or roles are left out.
 */
export function groupTalent<T extends { name: string; placements: P[] }, P extends { service_area: string; role: string; fractional_leader: boolean } = Placement>(
  people: T[],
): Record<string, Record<string, CellEntry<T, P>[]>> {
  const out: Record<string, Record<string, CellEntry<T, P>[]>> = {};
  for (const area of TALENT_AREA_IDS) {
    out[area] = {};
    for (const role of TALENT_ROLES) out[area][role.id] = [];
  }
  for (const person of people) for (const placement of person.placements) out[placement.service_area]?.[placement.role]?.push({ person, placement });
  for (const area of Object.values(out)) {
    for (const [roleId, list] of Object.entries(area)) {
      list.sort((a, b) => (roleId === GM_ROLE_ID ? Number(b.placement.fractional_leader) - Number(a.placement.fractional_leader) : 0) || byLastName(a.person, b.person));
    }
  }
  return out;
}

/** How many people are flagged as Fractional Leader in a service area, not counting one placement (the one being changed). */
export function fractionalLeaderCount(people: { placements: { id?: string; service_area: string; fractional_leader: boolean }[] }[], area: string, exceptPlacementId?: string): number {
  let n = 0;
  for (const p of people) for (const pl of p.placements) if (pl.service_area === area && pl.fractional_leader && (exceptPlacementId === undefined || pl.id !== exceptPlacementId)) n++;
  return n;
}

/** Whether one more person can be flagged as Fractional Leader in the area (the placement being flagged is not counted). */
export const canFlagFractional = (people: Parameters<typeof fractionalLeaderCount>[0], area: string, exceptPlacementId?: string) =>
  fractionalLeaderCount(people, area, exceptPlacementId) < MAX_FRACTIONAL_LEADERS;

/** The service areas a person is in other than this one, as area ids, in the page's order. */
export const otherAreas = (placements: { service_area: string }[], area: string) =>
  TALENT_AREA_IDS.filter((id) => id !== area && placements.some((p) => p.service_area === id));

/** Size to scale an image to so its longer side is at most `max` pixels (never enlarges). */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longer = Math.max(width, height);
  if (!(longer > max)) return { width, height };
  const scale = max / longer;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * What saving a person's service areas changes: areas they are no longer in are removed, areas whose role or flag changed are updated, and new
 * areas are added. Areas are matched by service area (a person has one placement per area).
 */
export function planPlacements<E extends { id: string; service_area: string; role: string; fractional_leader: boolean }, N extends { service_area: string; role: string; fractional_leader: boolean }>(
  existing: E[],
  next: N[],
): { remove: string[]; update: { id: string; role: string; fractional_leader: boolean }[]; add: N[] } {
  const wanted = new Map(next.map((pl) => [pl.service_area, pl]));
  const saved = new Map(existing.map((pl) => [pl.service_area, pl]));
  return {
    remove: existing.filter((old) => !wanted.has(old.service_area)).map((old) => old.id),
    update: next.flatMap((pl) => {
      const old = saved.get(pl.service_area);
      return old && (old.role !== pl.role || old.fractional_leader !== pl.fractional_leader) ? [{ id: old.id, role: pl.role, fractional_leader: pl.fractional_leader }] : [];
    }),
    add: next.filter((pl) => !saved.has(pl.service_area)),
  };
}

/** What a profile read must hold before it can be saved. Returns the problems, empty when it is fine. */
export function profileErrors(p: { name: string; summary: string; profile_url: string }): string[] {
  const errors: string[] = [];
  if (!p.name.trim()) errors.push("Add a name");
  if (!isToptalProfileUrl(p.profile_url)) errors.push("The link must be a Toptal profile (https://www.toptal.com/.../resume/...)");
  if (p.summary.length > 1200) errors.push("The summary is too long");
  return errors;
}

/**
 * What a person's service areas must hold before saving: at least one, each a known area and role, an area only once, and a Fractional
 * Leader flag only on the GM column and only while the area has room (`others` are the other people already on the Guild; `ownPlacementIds`
 * are this person's saved placements, which are not counted against the limit).
 */
export function placementErrors(
  placements: { id?: string; service_area: string; role: string; fractional_leader: boolean }[],
  others: Parameters<typeof fractionalLeaderCount>[0] = [],
): string[] {
  const errors: string[] = [];
  if (placements.length === 0) errors.push("Add at least one service area");
  const seen = new Set<string>();
  for (const pl of placements) {
    if (!(TALENT_AREA_IDS as readonly string[]).includes(pl.service_area)) { errors.push("Choose a service area"); continue; }
    if (seen.has(pl.service_area)) errors.push(`${pl.service_area} is listed twice: a person has one role per service area`);
    seen.add(pl.service_area);
    if (!TALENT_ROLES.some((r) => r.id === pl.role)) errors.push("Choose a role");
    if (pl.fractional_leader && pl.role !== GM_ROLE_ID) errors.push("Only a GM Talent Guild Member can be a Fractional Leader");
    if (pl.fractional_leader && pl.role === GM_ROLE_ID && fractionalLeaderCount(others, pl.service_area) >= MAX_FRACTIONAL_LEADERS) {
      errors.push(`There are already ${MAX_FRACTIONAL_LEADERS} Fractional Leaders in this service area`);
    }
  }
  return [...new Set(errors)];
}
