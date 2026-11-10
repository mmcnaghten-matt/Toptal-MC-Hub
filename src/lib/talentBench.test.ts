import { describe, expect, it } from "vitest";
import { TALENT_AREA_IDS, TALENT_ROLES, fitWithin, groupTalent, initialsOf, isToptalProfileUrl, lastNameOf, nameFromProfileUrl, normalizeProfileUrl, profileErrors } from "./talentBench";
import { AREA_BY_ID } from "@/data/mcStorefront";

// Synthetic people only: the repository is public and holds no candidate data.
const person = (name: string, service_area: string, role: string) => ({ name, service_area, role });

describe("Talent Bench structure", () => {
  it("covers three service areas that exist in the storefront, and three roles", () => {
    expect(TALENT_AREA_IDS).toEqual(["strategy", "finance", "people"]);
    for (const id of TALENT_AREA_IDS) expect(AREA_BY_ID.has(id)).toBe(true);
    expect(TALENT_ROLES.map((r) => r.label)).toEqual(["Engagement Leader", "Manager", "Specialist"]);
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
      person("Zed Example", "finance", "manager"),
      person("Ann Example", "finance", "manager"),
      person("Bo Example", "people", "specialist"),
      person("Nobody", "legal", "manager"),
      person("Nobody Either", "finance", "director"),
    ]);
    expect(Object.keys(g)).toEqual(["strategy", "finance", "people"]);
    expect(g.finance.manager.map((p) => p.name)).toEqual(["Ann Example", "Zed Example"]);
    const sorted = groupTalent([person("Zoe Adams", "finance", "manager"), person("Adam Zimmer", "finance", "manager"), person("Maria de Souza Baker", "finance", "manager"), person("Al Baker", "finance", "manager")]);
    expect(sorted.finance.manager.map((p) => p.name)).toEqual(["Zoe Adams", "Al Baker", "Maria de Souza Baker", "Adam Zimmer"]);
    expect(g.people.specialist).toHaveLength(1);
    expect(g.strategy["engagement-leader"]).toEqual([]);
    expect(Object.values(g).flatMap((a) => Object.values(a)).flat()).toHaveLength(3);
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
  const ok = { name: "Jane Example", summary: "Short summary.", profile_url: "https://www.toptal.com/management-consultants/resume/jane-example", service_area: "finance", role: "manager" };
  it("is fine with a name, a Toptal link, an area and a role", () => {
    expect(profileErrors(ok)).toEqual([]);
  });
  it("lists what is missing", () => {
    expect(profileErrors({ ...ok, name: " " })).toEqual(["Add a name"]);
    expect(profileErrors({ ...ok, profile_url: "https://evil.test/x" })).toHaveLength(1);
    expect(profileErrors({ ...ok, service_area: "legal", role: "director" })).toEqual(["Choose a service area", "Choose a role"]);
    expect(profileErrors({ ...ok, summary: "x".repeat(1201) })).toEqual(["The summary is too long"]);
  });
});
