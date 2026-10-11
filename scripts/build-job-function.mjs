// Builds supabase/functions/client-insights-job/index.ts: the job runner template with the research pipeline and the
// website rule copied in from the app source, so the browser and the server run the same pipeline code.
//
//   node scripts/build-job-function.mjs           write the file
//   node scripts/build-job-function.mjs --check   exit 1 if the committed file is out of date (used by `npm run qc`)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = resolve(root, "scripts/job/template.ts");
const outPath = resolve(root, "supabase/functions/client-insights-job/index.ts");

export function buildJobFunction() {
  const template = readFileSync(templatePath, "utf8");
  return template.replace(/^\/\/__INLINE:(.+?)__\s*$/gm, (_m, rel) => {
    const src = readFileSync(resolve(root, rel), "utf8");
    if (/^import\s/m.test(src)) throw new Error(`${rel} has an import; inlined files must be self-contained`);
    const body = src
      .replace(/^export type \{[^}]*\};?\s*$/gm, "")
      .replace(/^export (?=(async\s|function|const|let|type|interface|class))/gm, "");
    if (/^export\s/m.test(body)) throw new Error(`${rel} has an export form the generator does not handle`);
    return `// ===== inlined from ${rel} =====\n${body.trimEnd()}\n// ===== end ${rel} =====`;
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const built = buildJobFunction();
  if (process.argv.includes("--check")) {
    const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
    if (current !== built) {
      console.error("supabase/functions/client-insights-job/index.ts is out of date. Run: npm run build:job-function");
      process.exit(1);
    }
    console.log("client-insights-job is up to date");
  } else {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, built);
    console.log(`Wrote ${outPath.replace(root + "/", "")}`);
  }
}
