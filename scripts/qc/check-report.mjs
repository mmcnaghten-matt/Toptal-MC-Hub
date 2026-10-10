#!/usr/bin/env node
// Checks a finished Client Insights report (the JSON from "Copy report JSON" in the Research log) against the assertions
// that came out of the QC rounds. Run it after every function change:
//
//   node scripts/qc/check-report.mjs report.json [--today=2026-10-10] [--forbid="Siding Solutions,Taloja"]
//   pbpaste | node scripts/qc/check-report.mjs
//
// Exit code 1 when any assertion fails. README.md lists each assertion and the QC finding it comes from.
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const BLOCKED_DOMAINS = [
  // stock-data aggregators
  "stockanalysis.com", "wallstreetzen.com", "fullratio.com", "macrotrends.net", "companiesmarketcap.com", "gurufocus.com", "simplywall.st",
  "stockscan.io", "marketbeat.com", "finance.yahoo.com", "seekingalpha.com", "investing.com", "tipranks.com", "zacks.com", "ycharts.com",
  // peer lists and company-profile databases
  "owler.com", "comparably.com", "craft.co", "growjo.com", "leadiq.com", "zoominfo.com", "similarweb.com", "cbinsights.com", "tracxn.com",
  "globaldata.com", "rocketreach.co", "dnb.com", "buzzfile.com", "datanyze.com", "apollo.io", "pitchbook.com",
  // job sites, social media
  "indeed.com", "glassdoor.com", "ziprecruiter.com", "facebook.com", "reddit.com", "x.com", "twitter.com", "linkedin.com", "youtube.com",
];
const BOT_CHECK = /^(just a moment|access denied|attention required|human verification|verify(ing)? you are human|are you a (human|robot)|security check|checking your browser|please wait|enable javascript|one more step|pardon our interruption|request blocked|403|404|forbidden)/i;
const SALE_RE = /\b(sold|sale|sell|selling|divest\w*|spin[- ]?off|spun off|agreed to sell|completed the sale|buyer|acquired by|transferred to|exited?)\b/i;
const MATERIALITY_RE = /\b(colou?rs?|shades?|SKUs?|awards?|award-winning|ranked|rankings?|recogni[sz]ed|best places to work|women'?s choice)\b|\b(published|releas\w+|issued|unveiled)\s+(?:its |the |a |an )?[^.]{0,40}\b(sustainability|esg|annual|impact|citizenship) report\b/i;
const NAME_SUFFIX = new Set(["corporation", "corp", "incorporated", "inc", "company", "co", "group", "holdings", "holding", "international", "intl", "industries", "plc", "ltd", "limited", "llc", "lp", "gmbh", "ag", "sa", "nv", "ab", "as", "oyj", "spa", "bv", "pty", "the"]);
const FILLER = new Set(["market", "markets", "global", "worldwide", "industry", "industries", "size", "the", "of"]);

const competitorKey = (name) => {
  const words = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " ").replace(/a\/s/g, " ")
    .replace(/[.,'’]/g, "").replace(/[-–&]/g, " ").replace(/^compagnie de /, "").split(/\s+/).filter(Boolean);
  while (words.length > 1 && NAME_SUFFIX.has(words[words.length - 1])) words.pop();
  return words.join(" ");
};
const segWords = (name) =>
  name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter((w) => w && !FILLER.has(w)).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w)).filter((w) => w.length > 3);
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };
const strings = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
};
// Sentence split that keeps a trailing citation ("... impairment. [1][2]") with its sentence.
const sentences = (texts) => texts.flatMap((t) => t.split(/(?<=[.!?])\s+(?!\[\d)|\n+/)).map((t) => t.trim()).filter(Boolean);
const magnitude = (v) => {
  const m = String(v).match(/(\d[\d,]*(?:\.\d+)?)\s*(trillion|billion|million|thousand|tn|bn|mn|[tbmk])?/i);
  if (!m) return NaN;
  const mult = { t: 1e12, tn: 1e12, trillion: 1e12, b: 1e9, bn: 1e9, billion: 1e9, m: 1e6, mn: 1e6, million: 1e6, k: 1e3, thousand: 1e3 };
  return Number(m[1].replace(/,/g, "")) * (mult[(m[2] ?? "").toLowerCase()] ?? 1);
};

/** Returns [{ name, ok, detail }] for one report. */
export function checkReport(report, opts = {}) {
  const today = opts.today ? new Date(opts.today) : new Date();
  const forbid = (opts.forbid ?? []).filter(Boolean);
  const out = [];
  const check = (name, ok, detail = "") => out.push({ name, ok: !!ok, detail: ok ? "" : String(detail).slice(0, 400) });

  const RENDERED = ["executiveSummary", "businessPerformance", "marketOverview", "competitiveLandscape", "competitorDeepDives", "strategicFrameworks", "customerInsights", "recommendations", "mcOpportunities"];
  const texts = RENDERED.flatMap((k) => strings(report[k]));
  const sources = Array.isArray(report.sources) ? report.sources : [];
  const q = report.quality ?? {};
  const entity = report.entity ?? {};

  // 1. Output hygiene
  const refs = texts.flatMap((t) => t.match(/[(\[]\s*E\d+(?:\s*[,;&]\s*E\d+)*\s*[)\]]/g) ?? []);
  check("no evidence ids in client text", refs.length === 0, refs.slice(0, 5).join(" "));
  const garbled = texts.filter((t) => /&[a-z#0-9]+;|â€|‚Ä/.test(t));
  check("no HTML entities or garbled characters in client text", garbled.length === 0, garbled[0]);
  check("no source titled like a bot-check page", !sources.some((s) => BOT_CHECK.test((s.title ?? "").trim())), sources.filter((s) => BOT_CHECK.test((s.title ?? "").trim())).map((s) => s.title).join(" | "));

  // 2. Sold businesses
  const terms = [...new Set([
    ...(entity.divested ?? []).flatMap((d) => [d.name, ...(d.terms ?? [])]),
    ...(entity.footprint ?? []),
    ...forbid,
  ].map((t) => String(t).trim()).filter((t) => t.length >= 4))];
  const bad = terms.length
    ? sentences(texts).filter((s) => terms.some((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i").test(s)) && !SALE_RE.test(s))
    : [];
  check("no sold business (its name, products, plants or brands) is described as current", bad.length === 0, bad.slice(0, 3).join(" || "));

  // 3. Sources
  const blocked = sources.filter((s) => BLOCKED_DOMAINS.some((d) => { const h = hostOf(s.url); return h === d || h.endsWith("." + d); }));
  check("no blocked domain (stock-data, peer-list, job, social) among the sources", blocked.length === 0, blocked.map((s) => s.url).join(" "));
  const lookalike = (q.sourceFlags ?? []).filter((f) => (f.flags ?? []).includes("lookalike") || (f.flags ?? []).includes("unauditable"));
  check("no look-alike or unauditable source is cited", lookalike.length === 0, lookalike.map((f) => f.url).join(" "));

  // 4. Competitors
  const names = [
    ...Object.values(report.competitiveLandscape ?? {}).flat().filter((x) => typeof x === "string").map((x) => x.replace(/\s*\[\d+\]/g, "").trim()),
    ...(report.competitorDeepDives ?? []).map((d) => d.name),
  ].filter((n) => n && !/^not found/i.test(n));
  const keys = [...new Set(names.map(competitorKey))];
  const dupes = keys.filter((k, i) => keys.some((o, j) => i !== j && (o.startsWith(k + " ") || k.startsWith(o + " "))));
  const landscapeKeys = (report.competitiveLandscape?.directCompetitors ?? []).map((x) => competitorKey(String(x).replace(/\s*\[\d+\]/g, "")));
  const landscapeDupes = landscapeKeys.filter((k, i) => landscapeKeys.indexOf(k) !== i);
  check("each competitor is listed once (corporate suffixes and subsidiaries merged)", dupes.length === 0 && landscapeDupes.length === 0, [...dupes, ...landscapeDupes].join(", "));

  // 5. Market table
  const rows = report.marketOverview?.metrics?.tamRows ?? [];
  const segKeys = rows.map((r) => segWords(r.segment).join(" "));
  check("each market segment appears once", new Set(segKeys).size === segKeys.length, segKeys.join(" | "));
  const segs = entity.segments ?? [];
  const tooSmall = rows.filter((r) => {
    const sg = segs.find((x) => segWords(r.segment).some((w) => segWords(x.name).includes(w)));
    return sg?.revenue && /global|worldwide|world|not stated/i.test(r.geography ?? "") && magnitude(r.value) < sg.revenue;
  });
  check("a market is never smaller than the company's own sales in that segment", tooSmall.length === 0, tooSmall.map((r) => `${r.segment} ${r.value}`).join(", "));
  const offTopic = rows.filter((r) => {
    const nums = [...String(r.cite ?? "").matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    const cited = nums.map((n) => sources[n - 1]).filter(Boolean);
    if (!cited.length) return false;
    const words = segWords(r.segment);
    return !cited.some((s) => {
      let slug = "";
      try { slug = decodeURIComponent(new URL(s.url).pathname).replace(/[-_/.]+/g, " "); } catch { return true; }
      const hay = segWords(`${slug} ${s.title ?? ""}`);
      return words.some((w) => hay.includes(w));
    });
  });
  check("a market row never cites a page about another market", offTopic.length === 0, offTopic.map((r) => `${r.segment}: ${r.cite}`).join(", "));

  // 6. Materiality and dates
  const initiatives = (report.businessPerformance?.strategicInitiatives ?? []).map((i) => `${i.name}. ${i.description}`);
  const advice = [...strings(report.recommendations), ...strings(report.mcOpportunities)];
  const immaterial = [...initiatives, ...advice].filter((t) => MATERIALITY_RE.test(t));
  check("no colour, SKU, award or report-publication item among initiatives, recommendations or MC rows", immaterial.length === 0, immaterial.slice(0, 3).join(" || "));
  const oldInitiatives = initiatives.filter((t) => { const ys = (t.match(/\b20\d\d\b/g) ?? []).map(Number); return ys.length && Math.max(...ys) < today.getFullYear() - 2; });
  check("no strategic initiative older than 24 months", oldInitiatives.length === 0, oldInitiatives.join(" || "));
  const expired = sentences(texts).filter((s) => /\b(expects?|expected to|projected|anticipat\w+)\b/i.test(s) && !/\b(by|to|through)\s+20[3-9]\d\b/.test(s) && (() => {
    const m = s.match(/\bQ([1-4])\s*(20\d\d)\b/i);
    return m ? new Date(Date.UTC(Number(m[2]), Number(m[1]) * 3, 0)).getTime() < today.getTime() : false;
  })());
  check("no forecast whose quarter has already ended", expired.length === 0, expired.slice(0, 3).join(" || "));

  // 7. Litigation wording: a lawsuit or investigation is stated as fact only with a filing or major-press source behind it,
  // otherwise it must be worded as a law firm's announcement or allegation.
  const backed = (sentence) =>
    [...sentence.matchAll(/\[(\d+)\]/g)].map((m) => sources[Number(m[1]) - 1]).filter(Boolean)
      .some((x) => (x.tier ?? 3) <= 2 && !(x.kinds ?? []).includes("legal_marketing"));
  const unattributed = sentences(texts).filter((s) =>
    /\b(lawsuits?|class[- ]actions?|securities (?:fraud|litigation)|investigations?)\b/i.test(s) && !/\b(law firms?|plaintiff|attorneys?|alleg\w+)\b/i.test(s) && !backed(s));
  check("litigation statements cite a filing or major press, or are worded as a law firm's claim", unattributed.length === 0, unattributed.slice(0, 3).join(" || "));

  // 8. Positioning
  const label = report.executiveSummary?.competitivePositioning ?? "";
  const needsSegment = (entity.segments ?? []).length > 0;
  check("positioning is 'Leader/Challenger/Niche in <segment>' with a cited rank, or 'Insufficient evidence'",
    (label === "Insufficient evidence" || (needsSegment ? /^(Leader|Challenger|Niche) in .+/ : /^(Leader|Challenger|Niche)( in .+)?$/).test(label)) &&
      (label === "Insufficient evidence" || /\[\d+\]/.test(report.executiveSummary?.positioningRationale ?? "")), label);

  // 9. What the page needs to show the method and the log
  check("report carries the method numbers and the cited-domain list", typeof q.methodStats?.evidenceFound === "number" && Array.isArray(q.sourceDomains) && q.sourceDomains.length > 0, JSON.stringify(Object.keys(q)));
  check("report carries the date-check log", !!q.dateChecks && Array.isArray(q.dateChecks.dropped), "");

  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const raw = file ? fs.readFileSync(file, "utf8") : fs.readFileSync(0, "utf8");
  let report;
  try {
    report = JSON.parse(raw);
  } catch {
    console.error("Could not read the report: paste the JSON from 'Copy report JSON' into a file, or pipe it in.");
    process.exit(2);
  }
  const results = checkReport(report, { today: opt("today"), forbid: (opt("forbid") ?? "").split(",").map((x) => x.trim()) });
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : "\n      " + r.detail}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed ? `\n${failed} of ${results.length} checks FAILED for ${report.companyName ?? "report"}` : `\nAll ${results.length} checks passed for ${report.companyName ?? "report"}`);
  process.exit(failed ? 1 : 0);
}
