// Talent Bench: pre-identified talent by service area and role. Pure helpers (no network); the page and hooks build on these.
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
  { id: "gm-member", label: "GM Talent Bench Members", note: "Known to the Service Line leaders; not yet signed up as an Engagement Leader, Manager or Specialist" },
];

/** The service areas the program covers, by id (names and colours come from src/data/mcStorefront.ts). */
export const TALENT_AREA_IDS = ["strategy", "finance", "people"] as const;

export interface TalentProfile {
  id: string;
  created_at: string;
  updated_at: string;
  added_by: string | null;
  service_area: string;
  role: string;
  name: string;
  location: string;
  headline: string;
  summary: string;
  highlights: string[];
  profile_url: string;
  photo: string | null;
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

/** Talent by service area, then role; people in a cell are sorted by last name. Unknown areas or roles are left out. */
export function groupTalent<T extends { service_area: string; role: string; name: string }>(people: T[]): Record<string, Record<string, T[]>> {
  const out: Record<string, Record<string, T[]>> = {};
  for (const area of TALENT_AREA_IDS) {
    out[area] = {};
    for (const role of TALENT_ROLES) out[area][role.id] = [];
  }
  for (const p of people) out[p.service_area]?.[p.role]?.push(p);
  for (const area of Object.values(out)) for (const list of Object.values(area)) list.sort(byLastName);
  return out;
}

/** Size to scale an image to so its longer side is at most `max` pixels (never enlarges). */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longer = Math.max(width, height);
  if (!(longer > max)) return { width, height };
  const scale = max / longer;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** What a profile read must hold before it can be saved. Returns the problems, empty when it is fine. */
export function profileErrors(p: { name: string; summary: string; profile_url: string; service_area: string; role: string }): string[] {
  const errors: string[] = [];
  if (!p.name.trim()) errors.push("Add a name");
  if (!isToptalProfileUrl(p.profile_url)) errors.push("The link must be a Toptal profile (https://www.toptal.com/.../resume/...)");
  if (!(TALENT_AREA_IDS as readonly string[]).includes(p.service_area)) errors.push("Choose a service area");
  if (!TALENT_ROLES.some((r) => r.id === p.role)) errors.push("Choose a role");
  if (p.summary.length > 1200) errors.push("The summary is too long");
  return errors;
}
