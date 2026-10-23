// Private pages: the SQL that stores a document, and the slug rule.
const { buildPrivatePageSql } = await import("../../build-private-page-sql.mjs");
const { isValidSlug } = await import("../../../src/lib/privatePage.ts");

let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`); if (!ok) failures++; };
const throws = (fn) => { try { fn(); return false; } catch { return true; } };

check("a slug is lowercase letters, digits and hyphens, starting with a letter or digit", isValidSlug("spectrum-wave1-effort-plan") && isValidSlug("a") && !isValidSlug("") && !isValidSlug("-x") && !isValidSlug("Has Caps") && !isValidSlug("a/b") && !isValidSlug("a_b") && !isValidSlug("x".repeat(82)));

const html = `<!doctype html><title>t</title><script>const a = \`\${1+1}\`; const price = "$$ 5 $private_page$ done"; const q = 'it\\'s';</script>`;
const sql = buildPrivatePageSql({ html, slug: "my-page", title: "Kim's plan (v2)" });
const m = sql.match(/values \('my-page', 'Kim''s plan \(v2\)', \$(\w+)\$([\s\S]*)\$\1\$, 'sql editor'\)/);
check("the document is stored whole, quoted with a delimiter that is not in it", !!m && m[2] === html && m[1] !== "private_page", sql.slice(0, 300));
check("a single quote in the title is escaped", /'Kim''s plan \(v2\)'/.test(sql));
check("running it again replaces the page and returns a check row", /on conflict \(slug\) do update/.test(sql) && /select slug, title, char_length\(html\)/.test(sql));
check("a bad slug, an empty title, empty HTML and an oversized document are refused", throws(() => buildPrivatePageSql({ html, slug: "Bad Slug", title: "t" })) && throws(() => buildPrivatePageSql({ html, slug: "ok", title: "" })) && throws(() => buildPrivatePageSql({ html: "  ", slug: "ok", title: "t" })) && throws(() => buildPrivatePageSql({ html: "x".repeat(2_000_001), slug: "ok", title: "t" })));

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
