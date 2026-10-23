// Private standalone pages (see supabase/migrations/20261024000000_private_pages.sql): a page opens at /p/<slug>.
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
export const isValidSlug = (slug: string): boolean => SLUG_RE.test(slug);
