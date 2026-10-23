// Private standalone pages (see supabase/migrations/20261024000000_private_pages.sql): a page opens at /p/<slug>.
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
export const isValidSlug = (slug: string): boolean => SLUG_RE.test(slug);

/** What the sign-in token says about the account (never the token itself), for the "not found" details. */
export interface TokenClaims {
  email?: string;
  providers?: string[];
  emailVerified?: boolean;
  expiresAt?: string;
}

export function readTokenClaims(accessToken: string | undefined | null): TokenClaims | null {
  if (!accessToken) return null;
  try {
    const payload = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(decodeURIComponent(atob(payload).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
    return {
      email: typeof json.email === "string" ? json.email : undefined,
      providers: Array.isArray(json.app_metadata?.providers) ? json.app_metadata.providers.map(String) : undefined,
      emailVerified: json.user_metadata?.email_verified === true || json.user_metadata?.email_verified === "true",
      expiresAt: typeof json.exp === "number" ? new Date(json.exp * 1000).toISOString() : undefined,
    };
  } catch {
    return null;
  }
}
