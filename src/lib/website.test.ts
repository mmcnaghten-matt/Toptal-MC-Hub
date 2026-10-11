import { describe, expect, it } from "vitest";
import { normalizeWebsite } from "./website";

describe("normalizeWebsite", () => {
  it("accepts a bare domain, a URL and mixed case", () => {
    expect(normalizeWebsite("owenscorning.com")).toBe("owenscorning.com");
    expect(normalizeWebsite("https://www.OwensCorning.com/about?x=1#top")).toBe("owenscorning.com");
    expect(normalizeWebsite("  http://investors.owenscorning.com:8080/  ")).toBe("investors.owenscorning.com");
    expect(normalizeWebsite("www.example.co.uk")).toBe("example.co.uk");
  });
  it("treats empty input as no website", () => {
    expect(normalizeWebsite("")).toBeUndefined();
    expect(normalizeWebsite("   ")).toBeUndefined();
    expect(normalizeWebsite(undefined)).toBeUndefined();
  });
  it("rejects things that cannot be a company website", () => {
    for (const bad of ["localhost", "192.168.1.10", "not a site", "example", "ftp://", "a b.com", "-bad.com", "foo..com", "http://127.0.0.1:3000", "printer.local"]) {
      expect(normalizeWebsite(bad), bad).toBeNull();
    }
  });
});
