// Builds the SQL that stores an HTML document as a private page (opens at /p/<slug> for signed-in Toptal accounts).
//   node scripts/build-private-page-sql.mjs <file.html> <slug> "<title>" <out.sql>
// The output must NOT be written inside this repository (it is public): the script refuses.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { isValidSlug } = await import(path.join(root, "src/lib/privatePage.ts"));

export const MAX_HTML = 2_000_000;

export function buildPrivatePageSql({ html, slug, title }) {
  if (!isValidSlug(slug)) throw new Error(`"${slug}" is not a valid slug (lowercase letters, digits and hyphens, starting with a letter or digit)`);
  if (!title || title.length > 200) throw new Error("the title must be 1-200 characters");
  if (!html.trim()) throw new Error("the HTML is empty");
  if (html.length > MAX_HTML) throw new Error(`the HTML is ${html.length} characters; the limit is ${MAX_HTML}`);
  // Dollar-quote the document with a delimiter that does not occur in it, so nothing in the HTML can end the string early.
  let tag = "private_page";
  for (let i = 0; html.includes(`$${tag}$`); i++) tag = `private_page_${i}`;
  const sq = (v) => `'${String(v).replace(/'/g, "''")}'`;
  return `-- Stores a private page: it opens at /p/${slug} for signed-in @toptal.com accounts only. Run once; running it again replaces the page.
insert into public.private_pages (slug, title, html, updated_by)
values (${sq(slug)}, ${sq(title)}, $${tag}$${html}$${tag}$, 'sql editor')
on conflict (slug) do update
  set title = excluded.title, html = excluded.html, updated_at = now(), updated_by = excluded.updated_by;

select slug, title, char_length(html) as characters from public.private_pages where slug = ${sq(slug)};
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [file, slug, title, out] = process.argv.slice(2);
  if (!file || !slug || !title || !out) { console.error('usage: build-private-page-sql.mjs <file.html> <slug> "<title>" <out.sql>'); process.exit(2); }
  const target = path.resolve(out);
  if (target === root || target.startsWith(root + path.sep)) { console.error("Refusing to write the page inside the repository (it is public). Choose a folder outside it."); process.exit(1); }
  try {
    const sql = buildPrivatePageSql({ html: readFileSync(file, "utf8"), slug, title });
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, sql);
    console.log(`Wrote ${target} (${sql.length} characters). The page will open at /p/${slug}`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
