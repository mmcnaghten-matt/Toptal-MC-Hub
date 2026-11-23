import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAX_FRACTIONAL_LEADERS, TALENT_AREA_IDS, TALENT_ROLES, canFlagFractional, fitWithin, fractionalLeaderCount, groupTalent, initialsOf, isToptalProfileUrl, lastNameOf, nameFromProfileUrl, normalizeProfileUrl, otherAreas, placementErrors, planPlacements, profileErrors } from "./talentGuild";
import { AREA_BY_ID } from "@/data/mcStorefront";

// Synthetic people only: the repository is public and holds no candidate data.
type Pl = { id: string; service_area: string; role: string; fractional_leader: boolean };
let n = 0;
const place = (service_area: string, role: string, fractional_leader = false): Pl => ({ id: `pl${++n}`, service_area, role, fractional_leader });
const person = (name: string, ...placements: Pl[]) => ({ name, placements });
// the old one-cell shorthand, used where a person is in a single area
const one = (name: string, service_area: string, role: string) => person(name, place(service_area, role));

describe("Talent Guild structure", () => {
  it("covers four service areas that exist in the storefront, and three roles plus the GM Talent Guild Members column", () => {
    expect(TALENT_AREA_IDS).toEqual(["strategy", "finance", "people", "supply-chain"]);
    expect(AREA_BY_ID.get("supply-chain")?.name).toBe("Supply Chain & Operations");
    for (const id of TALENT_AREA_IDS) expect(AREA_BY_ID.has(id)).toBe(true);
    expect(TALENT_ROLES.map((r) => r.label)).toEqual(["Engagement Leader", "Manager", "Specialist", "GM Talent Guild Members"]);
    expect(TALENT_ROLES.map((r) => r.id)).toEqual(["engagement-leader", "manager", "specialist", "gm-member"]);
    expect(TALENT_ROLES.every((r) => (r.note ?? "").length > 20)).toBe(true);
  });

  it("has a migration that lets the database accept every service area on the page", () => {
    const sql = readFileSync("supabase/migrations/20261123000000_talent_guild_supply_chain.sql", "utf8");
    for (const id of TALENT_AREA_IDS) expect(sql).toContain(`'${id}'`);
  });

  it("finds the last name, ignoring a trailing suffix", () => {
    expect(lastNameOf("Syed Abdullah Mujahid")).toBe("Mujahid");
    expect(lastNameOf("Pat Example Jr.")).toBe("Example");
    expect(lastNameOf("Lee Example III")).toBe("Example");
    expect(lastNameOf("Cher")).toBe("Cher");
    expect(lastNameOf("  ")).toBe("");
  });

  it("groups people by area then role, sorted by last name, with every cell present", () => {
    const g = groupTalent([
      one("Zed Example", "finance", "manager"),
      one("Ann Example", "finance", "manager"),
      one("Bo Example", "people", "specialist"),
      one("Nobody", "legal", "manager"),
      one("Nobody Either", "finance", "director"),
    ]);
    expect(Object.keys(g)).toEqual(["strategy", "finance", "people", "supply-chain"]);
    expect(g.finance.manager.map((e) => e.person.name)).toEqual(["Ann Example", "Zed Example"]);
    const sorted = groupTalent([one("Zoe Adams", "finance", "manager"), one("Adam Zimmer", "finance", "manager"), one("Maria de Souza Baker", "finance", "manager"), one("Al Baker", "finance", "manager")]);
    expect(sorted.finance.manager.map((e) => e.person.name)).toEqual(["Zoe Adams", "Al Baker", "Maria de Souza Baker", "Adam Zimmer"]);
    expect(g.people.specialist).toHaveLength(1);
    expect(g.strategy["engagement-leader"]).toEqual([]);
    expect(g.finance["gm-member"]).toEqual([]);
    expect(Object.keys(g["supply-chain"])).toEqual(["engagement-leader", "manager", "specialist", "gm-member"]);
    expect(groupTalent([one("Sam Example", "supply-chain", "specialist")])["supply-chain"].specialist).toHaveLength(1);
    expect(groupTalent([one("Gem Example", "people", "gm-member")]).people["gm-member"]).toHaveLength(1);
    expect(Object.values(g).flatMap((a) => Object.values(a)).flat()).toHaveLength(3);
  });

  it("lists a person in every service area they are in, under the role they hold in each", () => {
    const pat = person("Pat Example", place("finance", "manager"), place("supply-chain", "specialist"), place("people", "gm-member"));
    const g = groupTalent([pat, one("Quinn Example", "finance", "manager")]);
    expect(g.finance.manager.map((e) => e.person.name)).toEqual(["Pat Example", "Quinn Example"]);
    expect(g["supply-chain"].specialist.map((e) => e.person.name)).toEqual(["Pat Example"]);
    expect(g.people["gm-member"].map((e) => e.person.name)).toEqual(["Pat Example"]);
    expect(g.strategy.manager).toEqual([]);
    expect(Object.values(g).flatMap((a) => Object.values(a)).flat()).toHaveLength(4);
    expect(g.finance.manager[0].placement.role).toBe("manager");
  });

  it("puts Fractional Leaders first in the GM column only, then sorts by last name", () => {
    const g = groupTalent([
      person("Al Adams", place("finance", "gm-member")),
      person("Bo Baker", place("finance", "gm-member", true)),
      person("Cy Carter", place("finance", "gm-member")),
      person("Di Zimmer", place("finance", "gm-member", true)),
      person("Ed Ames", place("finance", "manager")),
    ]);
    expect(g.finance["gm-member"].map((e) => e.person.name)).toEqual(["Bo Baker", "Di Zimmer", "Al Adams", "Cy Carter"]);
    expect(g.finance.manager.map((e) => e.person.name)).toEqual(["Ed Ames"]);
  });

  it("counts and limits Fractional Leaders per service area", () => {
    const people = [
      person("A One", place("finance", "gm-member", true)),
      person("B Two", place("finance", "gm-member", true), place("people", "gm-member", true)),
      person("C Three", place("finance", "gm-member")),
    ];
    expect(MAX_FRACTIONAL_LEADERS).toBe(2);
    expect(fractionalLeaderCount(people, "finance")).toBe(2);
    expect(fractionalLeaderCount(people, "people")).toBe(1);
    expect(fractionalLeaderCount(people, "strategy")).toBe(0);
    expect(canFlagFractional(people, "finance")).toBe(false);
    expect(canFlagFractional(people, "people")).toBe(true);
    // changing someone who is already flagged does not count them against the limit
    expect(canFlagFractional(people, "finance", people[0].placements[0].id)).toBe(true);
  });

  it("lists the other areas a person is in, in the page's order", () => {
    const pl = [place("supply-chain", "manager"), place("finance", "manager"), place("people", "gm-member")];
    expect(otherAreas(pl, "finance")).toEqual(["people", "supply-chain"]);
    expect(otherAreas([place("finance", "manager")], "finance")).toEqual([]);
  });
});

describe("Toptal profile addresses", () => {
  it("accepts Toptal resume pages on any vertical and rejects everything else", () => {
    expect(isToptalProfileUrl("https://www.toptal.com/management-consultants/resume/jane-example")).toBe(true);
    expect(isToptalProfileUrl("https://www.toptal.com/developers/resume/jane-example")).toBe(true);
    expect(isToptalProfileUrl("https://toptal.com/marketing/resume/jane-example")).toBe(true);
    expect(isToptalProfileUrl("http://www.toptal.com/management-consultants/resume/jane-example")).toBe(false);
    expect(isToptalProfileUrl("https://www.toptal.com.evil.test/management-consultants/resume/jane")).toBe(false);
    expect(isToptalProfileUrl("https://evil.test/www.toptal.com/resume/jane")).toBe(false);
    expect(isToptalProfileUrl("https://www.toptal.com/management-consultants")).toBe(false);
    expect(isToptalProfileUrl("not a url")).toBe(false);
    expect(isToptalProfileUrl("")).toBe(false);
  });

  it("stores the address without query, fragment or trailing slash", () => {
    expect(normalizeProfileUrl(" https://WWW.toptal.com/management-consultants/resume/jane-example/?utm=1#top ")).toBe("https://www.toptal.com/management-consultants/resume/jane-example");
    expect(normalizeProfileUrl("https://evil.test/resume/jane")).toBe("");
  });

  it("makes a display name from the address as a last resort", () => {
    expect(nameFromProfileUrl("https://www.toptal.com/management-consultants/resume/jane-example")).toBe("Jane Example");
    expect(nameFromProfileUrl("https://evil.test/x")).toBe("");
  });
});

describe("display helpers", () => {
  it("makes initials", () => {
    expect(initialsOf("Jane Example")).toBe("JE");
    expect(initialsOf("  jane  q  example ")).toBe("JE");
    expect(initialsOf("Cher")).toBe("C");
    expect(initialsOf("")).toBe("?");
  });

  it("scales a photo down to a maximum side, never up", () => {
    expect(fitWithin(480, 480, 160)).toEqual({ width: 160, height: 160 });
    expect(fitWithin(800, 400, 160)).toEqual({ width: 160, height: 80 });
    expect(fitWithin(100, 120, 160)).toEqual({ width: 100, height: 120 });
  });
});

describe("saving a profile", () => {
  const ok = { name: "Jane Example", summary: "Short summary.", profile_url: "https://www.toptal.com/management-consultants/resume/jane-example" };
  it("is fine with a name and a Toptal link", () => {
    expect(profileErrors(ok)).toEqual([]);
  });
  it("lists what is missing", () => {
    expect(profileErrors({ ...ok, name: " " })).toEqual(["Add a name"]);
    expect(profileErrors({ ...ok, profile_url: "https://evil.test/x" })).toHaveLength(1);
    expect(profileErrors({ ...ok, summary: "x".repeat(1201) })).toEqual(["The summary is too long"]);
  });
});

describe("a person's service areas", () => {
  const pl = (service_area: string, role: string, fractional_leader = false) => ({ service_area, role, fractional_leader });
  it("needs at least one, each with a known area and role", () => {
    expect(placementErrors([pl("finance", "manager")])).toEqual([]);
    expect(placementErrors([pl("finance", "manager"), pl("supply-chain", "specialist"), pl("people", "gm-member")])).toEqual([]);
    expect(placementErrors([])).toEqual(["Add at least one service area"]);
    expect(placementErrors([pl("legal", "director")])).toEqual(["Choose a service area"]);
    expect(placementErrors([pl("finance", "director")])).toEqual(["Choose a role"]);
  });
  it("allows an area only once", () => {
    expect(placementErrors([pl("finance", "manager"), pl("finance", "specialist")])).toHaveLength(1);
  });
  it("allows the Fractional Leader flag only on the GM column", () => {
    expect(placementErrors([pl("finance", "gm-member", true)])).toEqual([]);
    expect(placementErrors([pl("finance", "manager", true)])).toEqual(["Only a GM Talent Guild Member can be a Fractional Leader"]);
  });
  it("allows at most two Fractional Leaders in an area", () => {
    const others = [person("A", place("finance", "gm-member", true)), person("B", place("finance", "gm-member", true))];
    expect(placementErrors([pl("finance", "gm-member", true)], others)).toEqual(["There are already 2 Fractional Leaders in this service area"]);
    expect(placementErrors([pl("people", "gm-member", true)], others)).toEqual([]);
    expect(placementErrors([pl("finance", "gm-member", false)], others)).toEqual([]);
  });
});

describe("saving a person's service areas", () => {
  const saved = [
    { id: "a", service_area: "finance", role: "manager", fractional_leader: false },
    { id: "b", service_area: "people", role: "gm-member", fractional_leader: true },
    { id: "c", service_area: "strategy", role: "specialist", fractional_leader: false },
  ];
  it("removes areas that are gone, updates changed ones and adds new ones", () => {
    const plan = planPlacements(saved, [
      { service_area: "finance", role: "manager", fractional_leader: false }, // unchanged
      { service_area: "people", role: "gm-member", fractional_leader: false }, // no longer flagged
      { service_area: "supply-chain", role: "manager", fractional_leader: false }, // new
    ]);
    expect(plan.remove).toEqual(["c"]);
    expect(plan.update).toEqual([{ id: "b", role: "gm-member", fractional_leader: false }]);
    expect(plan.add).toEqual([{ service_area: "supply-chain", role: "manager", fractional_leader: false }]);
  });
  it("changes nothing when nothing changed, and treats a changed role in the same area as an update, not a new area", () => {
    expect(planPlacements(saved, saved)).toEqual({ remove: [], update: [], add: [] });
    const plan = planPlacements(saved, [{ service_area: "finance", role: "specialist", fractional_leader: false }, saved[1], saved[2]]);
    expect(plan.update).toEqual([{ id: "a", role: "specialist", fractional_leader: false }]);
    expect(plan.add).toEqual([]);
  });
});

describe("the placements migration", () => {
  const sql = readFileSync("supabase/migrations/20261124000000_talent_guild_placements.sql", "utf8");
  it("accepts every service area and role on the page", () => {
    for (const id of TALENT_AREA_IDS) expect(sql).toContain(`'${id}'`);
    for (const r of TALENT_ROLES) expect(sql).toContain(`'${r.id}'`);
  });
  it("keeps one role per area, limits the flag to the GM column and caps it at 2", () => {
    expect(sql).toMatch(/unique \(profile_id, service_area\)/);
    expect(sql).toMatch(/check \(not fractional_leader or role = 'gm-member'\)/);
    expect(sql).toMatch(/>= 2 then\s+raise exception 'At most 2 Fractional Leaders per service area'/);
    expect(sql).toMatch(/before insert or update on public\.talent_placements/);
  });
  it("protects the table like the profiles and backfills only profiles without a placement", () => {
    expect((sql.match(/has_talent_bench_access\(\)/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(sql).toMatch(/alter table public\.talent_placements enable row level security/);
    expect(sql).toMatch(/not exists \(select 1 from public\.talent_placements x where x\.profile_id = p\.id\)/);
    expect(sql).toMatch(/alter column service_area drop not null/);
  });
});
