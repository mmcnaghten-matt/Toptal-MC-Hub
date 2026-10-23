import { describe, expect, it } from "vitest";
import { isValidSlug, readTokenClaims } from "./privatePage";

const token = (payload: object) => `h.${btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.s`;

describe("private page slugs", () => {
  it("accepts lowercase letters, digits and hyphens, not starting with a hyphen", () => {
    expect(isValidSlug("spectrum-wave1-effort-plan")).toBe(true);
    for (const bad of ["", "-x", "Has Caps", "a/b", "a_b", "x".repeat(82)]) expect(isValidSlug(bad)).toBe(false);
  });
});

describe("readTokenClaims", () => {
  it("reads the account details the access rule looks at, not the token", () => {
    const c = readTokenClaims(token({ email: "m@toptal.com", exp: 1_800_000_000, app_metadata: { provider: "email", providers: ["email", "google"] }, user_metadata: { email_verified: true } }));
    expect(c).toEqual({ email: "m@toptal.com", providers: ["email", "google"], emailVerified: true, expiresAt: new Date(1_800_000_000_000).toISOString() });
  });

  it("copes with missing parts and with junk", () => {
    expect(readTokenClaims(token({ email: "a@b.c" }))).toMatchObject({ email: "a@b.c", providers: undefined, emailVerified: false });
    expect(readTokenClaims("not a token")).toBeNull();
    expect(readTokenClaims(undefined)).toBeNull();
  });
});
