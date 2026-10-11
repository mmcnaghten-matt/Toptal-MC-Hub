// Emailed reports go only to a person's own @toptal.com login address. The page shows the address read-only and
// refuses anything else; the job function and the database enforce the same rule again.
export const REPORT_EMAIL_DOMAIN = "toptal.com";

export function isToptalEmail(email: string | null | undefined): email is string {
  return typeof email === "string" && new RegExp(`^[^@\\s,;<>]+@${REPORT_EMAIL_DOMAIN.replace(".", "\\.")}$`, "i").test(email.trim());
}
