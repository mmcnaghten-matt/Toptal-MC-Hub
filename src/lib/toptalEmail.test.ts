import { describe, expect, it } from "vitest";
import { isToptalEmail } from "./toptalEmail";

describe("isToptalEmail", () => {
  it("accepts a toptal.com address in any case", () => {
    expect(isToptalEmail("m.mcnaghten@toptal.com")).toBe(true);
    expect(isToptalEmail("A.B@Toptal.COM")).toBe(true);
  });

  it("rejects other domains, look-alikes and lists", () => {
    for (const bad of ["a@gmail.com", "a@toptal.com.evil.io", "a@evil-toptal.com", "a@sub.toptal.com", "a@toptal.co", "a@toptal.com, b@gmail.com", "a b@toptal.com", "<a@toptal.com>", "toptal.com", "", null, undefined]) {
      expect(isToptalEmail(bad as string | null | undefined)).toBe(false);
    }
  });
});
