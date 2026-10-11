// A company website entered by a person: "example.com", "https://www.Example.com/about?x=1" -> "example.com".
// Returns undefined for an empty value and null for something that cannot be a company website.
// The same rule is applied again inside the research function, which never trusts the page.
export function normalizeWebsite(input: string | null | undefined): string | undefined | null {
  const raw = (input ?? "").trim();
  if (!raw) return undefined;
  if (/\s/.test(raw)) return null;
  let host = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  host = host.split(/[/?#]/)[0].replace(/:\d+$/, "").toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  if (!host || host.length > 253) return null;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) return null; // needs a dot, letters/digits/hyphens only
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // IP address
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  return host;
}
