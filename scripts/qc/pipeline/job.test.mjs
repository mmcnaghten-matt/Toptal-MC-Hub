// (No fixed clock here: the slice windows are real time.)
// Emailed reports: the server-side job runner (client-insights-job).
// The database is an in-memory fake of the PostgREST calls, the research function is a fake with canned answers,
// and the Apps Script mailer is a fake that enforces its own secret and toptal.com rule.
import { readFileSync } from "node:fs";
import { buildJobFunction } from "../../build-job-function.mjs";

const env = {
  GEMINI_API_KEY: "k", SUPABASE_URL: "https://sb.test", SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "service",
  JOB_SECRET: "job-secret", APPS_SCRIPT_URL: "https://script.test/exec", APPS_SCRIPT_SECRET: "mail-secret", APP_URL: "https://hub.test",
  JOB_WINDOW_MS: "25", JOB_HARD_MS: "20000",
};
const handlers = [];
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handlers.push(h); } };
await import("../../../supabase/functions/gemini-research/index.ts");
const research = handlers[0];
await import("../../../supabase/functions/client-insights-job/index.ts");
const jobFn = handlers[1];

let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`); if (!ok) failures++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- fake database ----------
const db = { client_insight_jobs: [], client_insight_reports: [], client_insight_steps: [] };
const F = { noConstraint: false, mailSecretWrong: false, mailDown: false, entityFails: false };
let idSeq = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++idSeq).padStart(12, "0")}`;
const EMAIL_RE = /^[^@\s]+@toptal\.com$/i;

const cond = (row, col, expr) => {
  const v = row[col];
  if (expr.startsWith("eq.")) return String(v) === expr.slice(3);
  if (expr.startsWith("lt.")) return v != null && String(v) < expr.slice(3);
  if (expr.startsWith("lte.")) return v != null && String(v) <= expr.slice(4);
  if (expr.startsWith("gte.")) return v != null && String(v) >= expr.slice(4);
  if (expr === "is.null") return v == null;
  if (expr.startsWith("in.(")) return expr.slice(4, -1).split(",").includes(String(v));
  throw new Error("unsupported filter " + expr);
};
const splitTop = (s) => { const out = []; let d = 0, cur = ""; for (const c of s) { if (c === "(") d++; if (c === ")") d--; if (c === "," && d === 0) { out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out; };
const matches = (row, params) => {
  for (const [k, v] of params) {
    if (["select", "limit", "on_conflict", "order"].includes(k)) continue;
    if (k === "or") {
      if (!splitTop(v.slice(1, -1)).some((part) => { const i = part.indexOf("."); return cond(row, part.slice(0, i), part.slice(i + 1)); })) return false;
    } else if (!cond(row, k, v)) return false;
  }
  return true;
};
const dbHandler = async (req, table, params) => {
  const rows = db[table];
  const prefer = req.headers.get("prefer") ?? "";
  const body = req.method === "GET" || req.method === "DELETE" ? null : await req.json();
  const ok = (data, status = 200) => (data === null ? new Response(null, { status }) : new Response(JSON.stringify(data), { status }));
  if (req.method === "GET") return ok(rows.filter((r) => matches(r, params)).slice(0, Number(params.get("limit") ?? 1e9)));
  if (req.method === "DELETE") {
    const gone = rows.filter((r) => matches(r, params));
    db[table] = rows.filter((r) => !gone.includes(r));
    if (table === "client_insight_jobs") for (const g of gone) { db.client_insight_steps = db.client_insight_steps.filter((s) => s.job_id !== g.id); db.client_insight_reports = db.client_insight_reports.filter((s) => s.job_id !== g.id); }
    return ok(null, 204);
  }
  if (req.method === "PATCH") {
    const hit = rows.filter((r) => matches(r, params));
    for (const r of hit) Object.assign(r, body);
    return prefer.includes("return=representation") ? ok(hit.map((r) => ({ ...r }))) : ok(null, 204);
  }
  if (req.method === "POST") {
    if (table === "client_insight_jobs") {
      if (!F.noConstraint && !EMAIL_RE.test(body.email)) return new Response(JSON.stringify({ message: "violates check constraint" }), { status: 400 });
      const row = { id: uuid(), status: "running", progress: null, error: null, attempts: 0, lock_until: null, emailed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), finished_at: null, expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), ...body };
      rows.push(row);
      return ok([{ ...row }], 201);
    }
    const keyCols = table === "client_insight_reports" ? ["job_id"] : ["job_id", "key"];
    const i = rows.findIndex((r) => keyCols.every((c) => r[c] === body[c]));
    if (i >= 0) rows[i] = { ...rows[i], ...body }; else rows.push({ ...body });
    return ok(null, 201);
  }
  throw new Error("unsupported " + req.method);
};

// ---------- fake research function (a step answers after a short delay) ----------
const stepCalls = [];
const ctx = { delay: 6 };
const fakeStep = async (b, headers) => {
  stepCalls.push({ step: b.step, headers });
  await sleep(ctx.delay);
  const S = (n) => ({ topic: n, status: "ok", ms: 1, meta: { groundingSupports: [1] } });
  const entity = { name: b.companyName ?? "Acme", website: "acme.com", segments: [{ name: "Roofing" }] };
  switch (b.step) {
    case "entity": return F.entityFails ? [400, { error: "Could not identify that company with confidence." }] : [200, { entity, warnings: [], slice: S("profile"), segmentSlice: S("segments") }];
    case "scan": return [200, { slice: S(b.topic) }];
    case "ledger": return [200, { state: { entity: b.entity ?? entity, n: (b.slices ?? []).length } }];
    case "verify_evidence": return [200, { state: { ...b.state, verified: true } }];
    case "identify": return [200, { competitors: [{ name: "Rival One", kind: "direct" }, { name: "Rival Two", kind: "direct" }], filter: [], slices: [], validated: [] }];
    case "facts_section": return [200, { ok: true, section: b.section }];
    case "analysis_part": return [200, { ok: true, raw: { part: b.part }, warnings: [] }];
    case "report": return [200, { companyName: b.state?.entity?.name, sources: [], quality: { build: "test" }, partsSeen: b.parts?.length }];
    default: return [400, { error: "unknown step " + b.step }];
  }
};

// ---------- fake mail script ----------
const mails = [];
const mailScript = async (req) => {
  if (F.mailDown) return new Response("down", { status: 503 });
  const b = JSON.parse(await req.text());
  if (b.secret !== (F.mailSecretWrong ? "other" : "mail-secret") || b.secret !== "mail-secret") return new Response(JSON.stringify({ ok: false, error: "bad secret" }), { status: 200 });
  if (!EMAIL_RE.test(b.to)) return new Response(JSON.stringify({ ok: false, error: "recipient" }), { status: 200 });
  mails.push(b);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

const triggers = [];
const USERS = { "Bearer user-a": { id: "user-a-id", email: "a@toptal.com" }, "Bearer user-x": { id: "user-x-id", email: "x@gmail.com" }, "Bearer user-b": { id: "user-b-id", email: "B@Toptal.com" } };
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  const req = new Request(url, init);
  if (url.includes("/auth/v1/user")) { const u = USERS[req.headers.get("authorization")]; return u ? new Response(JSON.stringify(u), { status: 200 }) : new Response("no", { status: 401 }); }
  if (url.includes("/rest/v1/")) { const u = new URL(url); return dbHandler(req, u.pathname.split("/rest/v1/")[1], u.searchParams); }
  if (url.includes("/functions/v1/gemini-research")) {
    const b = JSON.parse(init.body);
    const hdr = { secret: req.headers.get("x-job-secret"), user: req.headers.get("x-job-user") };
    const [status, data] = await fakeStep(b, hdr);
    return new Response(JSON.stringify(data), { status });
  }
  if (url.includes("/functions/v1/client-insights-job")) { triggers.push(JSON.parse(init.body).id); return new Response("{}", { status: 202 }); }
  if (url.startsWith(env.APPS_SCRIPT_URL)) return mailScript(req);
  throw new Error("unexpected fetch " + url);
};

const post = (body, headers = {}) => jobFn(new Request("http://x/", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } }));
const start = (body, token = "Bearer user-a") => post({ action: "start", ...body }, { authorization: token, apikey: "anon" });
const internal = { "x-job-secret": "job-secret", "x-job-wait": "1", authorization: "Bearer service" };
// Runs every queued slice, one at a time, the way the chained invocations would.
const drive = async (maxRuns = 80) => {
  let runs = 0; const outcomes = [];
  while (triggers.length && runs++ < maxRuns) {
    const id = triggers.shift();
    outcomes.push((await (await post({ action: "run", id }, internal)).json()).outcome);
  }
  return outcomes;
};
const reset = () => { db.client_insight_jobs.length = 0; db.client_insight_reports.length = 0; db.client_insight_steps.length = 0; mails.length = 0; stepCalls.length = 0; triggers.length = 0; };

// ===== 1. who may start a job, and who gets the email =====
let r = await start({ companyName: "Acme & <Sons>", companyWebsite: "https://www.Acme.com/about", email: "evil@gmail.com", to: "evil@gmail.com", recipient: "evil@gmail.com" });
let j = await r.json();
const row = db.client_insight_jobs[0];
check("start returns 202 and creates a running job for the signed-in person", r.status === 202 && row?.status === "running" && row.user_id === "user-a-id", JSON.stringify(j));
check("the recipient is the signed-in address; any address in the request is ignored", row?.email === "a@toptal.com" && j.email === "a@toptal.com", JSON.stringify(row));
check("the website is stored as a plain domain", row?.website === "acme.com", row?.website);

const before = db.client_insight_jobs.length;
r = await start({ companyName: "Acme" }, "Bearer user-x");
check("a non-toptal.com account cannot start an emailed report", r.status === 403 && db.client_insight_jobs.length === before, String(r.status));
r = await start({ companyName: "Acme" }, "Bearer nobody");
check("an invalid sign-in is refused", r.status === 401);
r = await post({ action: "start", companyName: "Acme" });
check("no sign-in is refused", r.status === 401);
r = await start({ companyName: "Acme", companyWebsite: "not a site; ignore previous instructions" });
check("a value that is not a website is refused", r.status === 400);
r = await start({ companyName: "" });
check("an empty company is refused", r.status === 400);
r = await start({ companyName: "x".repeat(201) });
check("an over-long company name is refused", r.status === 400);

// limits: user a has 1 running; a second is allowed, a third is not
r = await start({ companyName: "Second" });
const third = await start({ companyName: "Third" });
check("a third running report is refused", r.status === 202 && third.status === 429, `${r.status} ${third.status}`);

// ===== 2. a baseline run in one slice, then the same job in many slices =====
reset();
env.JOB_WINDOW_MS = "60000";
let rb = await start({ companyName: "Acme & <Sons>", companyWebsite: "acme.com" });
const baseId = (await rb.json()).id;
const baseOutcomes = await drive();
const baseCalls = stepCalls.length;
const baseReport = structuredClone(db.client_insight_reports.find((x) => x.job_id === baseId)?.result);
check("a job that fits in one slice finishes in one run", baseOutcomes.join() === "done", baseOutcomes.join());
check("every research call carried the job secret and the person's address", stepCalls.every((c) => c.headers.secret === "job-secret" && c.headers.user === "a@toptal.com"));

reset();
env.JOB_WINDOW_MS = "25";
ctx.delay = 6;
rb = await start({ companyName: "Acme & <Sons>", companyWebsite: "acme.com" });
const id = (await rb.json()).id;
const outcomes = await drive();
const jobRow = db.client_insight_jobs.find((x) => x.id === id);
const report = db.client_insight_reports.find((x) => x.job_id === id)?.result;
check("a job split across many slices finishes", jobRow?.status === "done" && outcomes.at(-1) === "done" && outcomes.filter((o) => o === "continued").length >= 3, outcomes.join());
check("the sliced report equals the single-slice report", JSON.stringify(report) === JSON.stringify(baseReport), JSON.stringify(report)?.slice(0, 200));
check("the journal prevents repeats: the same number of research calls as one run", stepCalls.length === baseCalls, `${stepCalls.length} vs ${baseCalls}`);
check("the journal is deleted when the job finishes", db.client_insight_steps.length === 0);
check("the finished report stays readable by its owner (stored, expires in 30 days)", !!report && Date.parse(jobRow.expires_at) > Date.now() + 29 * 864e5);

// ===== 3. the email =====
check("exactly one email is sent, to the signed-in address", mails.length === 1 && mails[0].to === "a@toptal.com", JSON.stringify(mails.map((m) => m.to)));
check("it links to the report and escapes the company name", mails[0]?.html.includes(`https://hub.test/client-insights?report=${id}`) && mails[0].html.includes("Acme &amp; &lt;Sons&gt;") && !mails[0].html.includes("<Sons>"), mails[0]?.html);
check("it carries the AI caveat and the expiry", /AI-generated research/.test(mails[0]?.html) && /kept until/.test(mails[0]?.html));
check("the job records that the email went out", !!jobRow.emailed_at);

// ===== 4. failures =====
reset();
F.entityFails = true;
rb = await start({ companyName: "Nobody Inc" });
const fid = (await rb.json()).id;
const fo = await drive();
const failed = db.client_insight_jobs.find((x) => x.id === fid);
check("a company that cannot be identified fails the job with the reason", failed?.status === "failed" && /confidence/.test(failed.error) && fo.at(-1) === "failed", JSON.stringify({ fo, e: failed?.error }));
check("a failure sends one short email, not a report link", mails.length === 1 && /could not be completed/.test(mails[0].subject) && !/report=/.test(mails[0].html), JSON.stringify(mails.map((m) => m.subject)));
F.entityFails = false;

// ===== 5. the recipient rule at send time =====
reset();
F.noConstraint = true; // pretend the database check were missing
db.client_insight_jobs.push({ id: uuid(), user_id: "u", email: "outsider@gmail.com", company: "Acme", website: null, deep_research: true, status: "running", attempts: 0, lock_until: null, emailed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 864e5).toISOString() });
triggers.push(db.client_insight_jobs[0].id);
await drive();
check("the job function refuses to email a non-toptal.com address even if one is stored", mails.length === 0 && db.client_insight_jobs[0].status === "done" && !db.client_insight_jobs[0].emailed_at, JSON.stringify({ mails: mails.length, s: db.client_insight_jobs[0].status }));
F.noConstraint = false;
check("the database check constraint rejects a non-toptal.com address", await (async () => { const res = await fetch("https://sb.test/rest/v1/client_insight_jobs", { method: "POST", body: JSON.stringify({ email: "a@evil.com" }), headers: { prefer: "return=representation" } }); return res.status === 400; })());

// ===== 6. email that is not accepted is retried, never lost =====
reset();
F.mailSecretWrong = true;
rb = await start({ companyName: "Acme" });
const mid = (await rb.json()).id;
await drive();
let mrow = db.client_insight_jobs.find((x) => x.id === mid);
check("a rejected email leaves the report saved and the job not marked as emailed", mrow.status === "done" && !mrow.emailed_at && mails.length === 0);
F.mailSecretWrong = false;
env.APPS_SCRIPT_SECRET = "mail-secret";
let res = await post({ action: "resume" }, internal);
check("the resume pass sends the email that did not go out", mails.length === 1 && !!db.client_insight_jobs.find((x) => x.id === mid).emailed_at, JSON.stringify(await res.json()));
await post({ action: "resume" }, internal);
check("and does not send it twice", mails.length === 1);

// ===== 7. stalled jobs, the attempt cap, and clean-up =====
reset();
const now = Date.now();
const mk = (over) => { const row = { id: uuid(), user_id: "u", email: "a@toptal.com", company: "Acme", website: null, deep_research: true, status: "running", attempts: 1, lock_until: null, emailed_at: null, progress: null, error: null, finished_at: null, created_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString(), expires_at: new Date(now + 864e5).toISOString(), ...over }; db.client_insight_jobs.push(row); return row; };
const stalled = mk({ updated_at: new Date(now - 5 * 60e3).toISOString() });
const lockedNow = mk({ updated_at: new Date(now - 5 * 60e3).toISOString(), lock_until: new Date(now + 60e3).toISOString() });
const fresh = mk({});
const expired = mk({ status: "done", emailed_at: new Date().toISOString(), expires_at: new Date(now - 1000).toISOString() });
await post({ action: "resume" }, internal);
check("resume restarts only a stalled, unlocked job", triggers.length === 1 && triggers[0] === stalled.id && !triggers.includes(lockedNow.id) && !triggers.includes(fresh.id), JSON.stringify(triggers));
check("resume purges expired reports", !db.client_insight_jobs.some((x) => x.id === expired.id));
triggers.length = 0;
const capped = mk({ attempts: 30 });
await post({ action: "run", id: capped.id }, internal);
check("a job past the attempt cap stops and is reported as failed", db.client_insight_jobs.find((x) => x.id === capped.id).status === "failed");
const old = mk({ created_at: new Date(now - 40 * 60e3).toISOString() });
await post({ action: "run", id: old.id }, internal);
check("a job older than 30 minutes stops", db.client_insight_jobs.find((x) => x.id === old.id).status === "failed");
const l2 = mk({ lock_until: new Date(Date.now() + 60e3).toISOString() });
const before2 = stepCalls.length;
const o = await (await post({ action: "run", id: l2.id }, internal)).json();
check("a job locked by another slice is left alone", o.outcome === "locked" && stepCalls.length === before2, JSON.stringify(o));

// ===== 8. internal routes need the secret =====
r = await post({ action: "run", id: fresh.id }, { "x-job-secret": "wrong" });
check("run without the job secret is refused", r.status === 401);
r = await post({ action: "resume" }, { authorization: "Bearer user-a" });
check("resume without the job secret is refused", r.status === 401);
r = await post({ action: "run", id: "not-an-id" }, internal);
check("run with a malformed id is refused", r.status === 400);

// ===== 9. the research function accepts internal calls only with the secret and a toptal.com user =====
const callResearch = (headers) => research(new Request("http://x/", { method: "POST", body: JSON.stringify({ step: "entity", companyName: "" }), headers: { "content-type": "application/json", ...headers } }));
r = await callResearch({ "x-job-secret": "job-secret", "x-job-user": "a@toptal.com", authorization: "Bearer service" });
check("research accepts a job call with the secret and a toptal.com user (reaches validation, not auth)", r.status === 400, String(r.status));
r = await callResearch({ "x-job-secret": "nope", "x-job-user": "a@toptal.com", authorization: "Bearer service" });
check("research refuses a wrong job secret", r.status === 401, String(r.status));
r = await callResearch({ "x-job-secret": "job-secret", "x-job-user": "a@gmail.com", authorization: "Bearer service" });
check("research refuses a job call for a non-toptal.com user", r.status === 403, String(r.status));
r = await callResearch({ "x-job-secret": "", authorization: "Bearer service" });
check("research refuses an empty job secret", r.status === 401, String(r.status));
const saved = env.JOB_SECRET; env.JOB_SECRET = "";
r = await callResearch({ "x-job-secret": "", "x-job-user": "a@toptal.com", authorization: "Bearer service" });
check("research refuses job calls when no secret is configured", r.status === 401, String(r.status));
env.JOB_SECRET = saved;

// ===== 9b. email is optional: without a mailer configured the report is simply saved =====
reset();
const savedUrl = env.APPS_SCRIPT_URL; env.APPS_SCRIPT_URL = "";
let scriptHits = 0; const realFetch = globalThis.fetch;
globalThis.fetch = async (u, i) => { if (String(u).startsWith(savedUrl)) scriptHits++; return realFetch(u, i); };
rb = await start({ companyName: "Quiet Co" });
const qid = (await rb.json()).id;
await drive();
await post({ action: "resume" }, internal);
const qrow = db.client_insight_jobs.find((x) => x.id === qid);
check("with no mailer configured the job finishes and the report is saved", qrow?.status === "done" && db.client_insight_reports.some((x) => x.job_id === qid));
check("nothing is sent and nothing is retried", mails.length === 0 && scriptHits === 0 && !qrow.emailed_at, `${mails.length} ${scriptHits}`);
globalThis.fetch = realFetch; env.APPS_SCRIPT_URL = savedUrl;

// ===== 10. the committed function matches the source =====
check("the committed client-insights-job is generated from the current pipeline source", readFileSync(new URL("../../../supabase/functions/client-insights-job/index.ts", import.meta.url), "utf8") === buildJobFunction(), "run: npm run build:job-function");

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
