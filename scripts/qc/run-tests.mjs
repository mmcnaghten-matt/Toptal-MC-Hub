#!/usr/bin/env node
// Runs the whole QC suite: the pipeline tests (mocked Gemini, no network) and the report-checker tests.
//   npm run qc
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const files = [
  ...readdirSync(path.join(here, "pipeline")).filter((f) => f.endsWith(".test.mjs")).sort().map((f) => path.join(here, "pipeline", f)),
  path.join(here, "check-report.test.mjs"),
];
let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [f], { encoding: "utf8", cwd: path.dirname(path.dirname(here)) });
  const out = `${r.stdout}\n${r.stderr}`;
  const fails = out.split("\n").filter((l) => /^FAIL\b/.test(l));
  const ok = r.status === 0;
  console.log(`${ok ? "PASS" : "FAIL"}  ${path.relative(path.dirname(here), f)}${ok ? "" : `  (exit ${r.status})`}`);
  fails.forEach((l) => console.log("      " + l.slice(0, 300)));
  if (!ok) failed++;
}
console.log(failed ? `\n${failed} of ${files.length} test files FAILED` : `\nAll ${files.length} test files passed`);
process.exit(failed ? 1 : 0);
