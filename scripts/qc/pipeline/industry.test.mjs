import "./fixed-date.mjs";
// Industry Insights: the checks ported from Client Insights (blocked sources, dated events checked against the cited page,
// unreadable pages kept, evidence ids stripped, non-substantive initiatives dropped), plus the existing behaviour that the
// directional parts (overview, challenges, needs) stay free to interpret.
let handler;
const env = { GEMINI_API_KEY: "k", SUPABASE_URL: "https://sb.test" };
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };
await import("../../../supabase/functions/refresh-industry-insights/index.ts");
const { runIndustryResearch } = await import("../../../src/services/industryResearchPipeline.ts");

const gem = (text, meta) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, groundingMetadata: meta }] }), { status: 200 });
const metaOf = (items) => {
  const hosts = [...new Set(items.map(([, h]) => h))];
  return {
    groundingChunks: hosts.map((h) => ({ web: { uri: h.includes("/") ? `https://${h}` : `https://${h}/page`, title: h.split("/")[0] } })),
    groundingSupports: items.map(([t, h]) => ({ segment: { text: t }, groundingChunkIndices: [hosts.indexOf(h)] })),
  };
};
const F = {};

const SEG = {
  market: [
    ["U.S. retail banking net interest margin was 3.1% in 2025, according to the FDIC.", "www.fdic.gov/reports/nim"],
    ["Retail deposit costs rose to 2.67% in 2025, according to the FDIC.", "www.fdic.gov/reports/deposits"],
    ["Retail banks reported net income of $98B in Q2 2026, according to Banking Trade.", "www.bankingtrade.example/old-article"],
    ["Bank stocks gained 8% in 2026, according to StockAnalysis.", "stockanalysis.com/banks"],
  ],
  regulation: [
    ["The CFPB finalized an open banking rule in October 2025, according to the CFPB.", "www.consumerfinance.gov/rules/open-banking"],
    ["Regulators issued a third-party risk rule on July 17, 2026, according to Banking Trade.", "www.bankingtrade.example/old-article"],
    ["A pending liquidity rule was announced in March 2026, according to a trade blog.", "www.tradeblog.example/liquidity"],
    ["Basel III endgame rules were re-proposed in March 2026, according to Reuters.", "www.reuters.com/markets/basel"],
    ["Capital planning rules were updated in 2025, according to a trade site.", "www.undated.example/capital"],
  ],
  technology_ai: [
    ["Legacy core systems limit real-time payments, according to McKinsey.", "www.mckinsey.com/insights/core"],
    ["Retail banks increased generative AI spending in 2025, according to Gartner.", "www.gartner.com/ai"],
  ],
  workforce: [
    ["Compliance headcount grew in banking, according to Thomson Reuters.", "www.reuters.com/workforce"],
    ["Attrition among tellers stayed high, according to the ABA.", "www.aba.com/workforce"],
  ],
  competition_ma: [
    ["Capital One completed its Discover acquisition in 2025, according to Business Wire.", "www.businesswire.com/capone"],
    ["Fintech lenders took share in personal loans, according to TransUnion.", "www.transunion.com/fintech"],
  ],
  buyers: [
    ["Bank executives ranked AI and fraud as top priorities in the 2026 Deloitte outlook.", "www.deloitte.com/outlook"],
    ["Executives cite legacy modernization as the top barrier in a 2025 Accenture survey.", "www.accenture.com/survey"],
  ],
  moves: [
    ["JPMorgan announced a core modernization program in January 2026, according to Business Wire.", "www.businesswire.com/jpm"],
    ["Wells Fargo launched an AI assistant for employees in 2025, according to a trade site.", "www.trade.example/wells"],
    ["A bank won the Best Digital Bank award in 2026, according to Reuters.", "www.reuters.com/awards"],
    ["Banks adopted shared-service consolidation, according to a 2022 article.", "www.old.example/shared-services"],
  ],
};
const ASK = {
  market: "Market size and growth", regulation: "Regulatory, policy", technology_ai: "Technology and AI adoption", workforce: "Workforce and talent",
  competition_ma: "Competitive dynamics", buyers: "What executives and customers", moves: "Concrete programs and investments",
};

const page = (title, { pub, body = "" } = {}) =>
  new Response(`<html><head><title>${title}</title>${pub ? `<meta property="article:published_time" content="${pub}">` : ""}</head><body><main>${body} ${"Lorem ipsum dolor sit amet. ".repeat(30)}</main></body></html>`, { status: 200, headers: { "content-type": "text/html" } });

globalThis.fetch = async (url, init) => {
  url = String(url);
  if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ email: "m@toptal.com" }), { status: 200 });
  if (!url.includes("generativelanguage")) {
    if (url.includes("bankingtrade.example")) return page("Regulators to adopt rule", { pub: "2007-07-17T10:00:00Z", body: "On July 17, 2007, regulators announced a rule." });
    if (url.includes("trade.example/wells")) return page("Wells Fargo AI", { pub: "2025-05-01T10:00:00Z", body: "In 2025 Wells Fargo launched an AI assistant." });
    if (url.includes("undated.example")) return page("Capital planning", { body: "Capital planning guidance for banks." });
    if (url.includes("old.example")) return page("Shared services", { pub: "2022-03-01T10:00:00Z", body: "Banks adopted shared-service consolidation." });
    if (url.includes("tradeblog.example") || url.includes("reuters.com") || url.includes("businesswire.com")) return new Response("blocked", { status: 403, headers: { "content-type": "text/html" } });
    return new Response("<title>Some Page</title>", { status: 200, headers: { "content-type": "text/html" } });
  }
  const prompt = JSON.parse(init.body).contents[0].parts[0].text;
  const ev = [...prompt.matchAll(/^E(\d+) \[([^\]]+)\] (.*)$/gm)].map((m) => ({ id: Number(m[1]), topic: m[2], text: m[3] }));
  const id = (sub) => ev.find((e) => e.text.includes(sub))?.id;
  if (prompt.includes("You are researching the")) {
    const key = Object.keys(ASK).find((k) => prompt.includes(ASK[k]));
    return gem("x", metaOf(SEG[key]));
  }
  if (prompt.includes("5. overview:")) {
    return gem(JSON.stringify({
      overview: { text: "Retail banking faces margin pressure as deposit costs stay high and regulators reset capital rules (E1, E2).", basedOn: [id("2.67%"), id("Basel")] },
      challenges: [
        { text: "Deposit cost pressure: Retail deposit costs rose to 2.67% in 2025.", basedOn: [id("2.67%")] },
        { text: "Legacy core limits: Core platforms hold back real-time payments and slow product launches (E7).", basedOn: [id("Legacy core")] },
        { text: "Capital rule uncertainty: Re-proposed capital rules keep planning cycles open.", basedOn: [id("Basel")] },
        { text: "Talent churn: Teller attrition keeps training costs high.", basedOn: [id("Attrition")] },
      ],
    }));
  }
  if (prompt.includes("5. initiatives:")) {
    return gem(JSON.stringify({
      initiatives: [
        { text: "Core modernization: JPMorgan announced a core modernization program in January 2026.", basedOn: [id("JPMorgan")] },
        { text: "AI assistants: Wells Fargo launched an AI assistant for employees in 2025.", basedOn: [id("Wells Fargo")] },
        { text: "Awards: A bank won the Best Digital Bank award in 2026.", basedOn: [id("Best Digital Bank")] },
        { text: "Open banking: The CFPB finalized an open banking rule in October 2025.", basedOn: [id("open banking")] },
        { text: "Third-party risk: Regulators issued a third-party risk rule on July 17, 2026.", basedOn: [id("third-party risk rule")] },
        { text: "Liquidity: A pending liquidity rule was announced in March 2026.", basedOn: [id("liquidity rule")] },
      ],
    }));
  }
  if (prompt.includes("5. needs:")) {
    const N = (name, sig, narr, sub) => ({ name, signals: sig, narrative: narr, basedOn: [id(sub)] });
    return gem(JSON.stringify({ needs: [
      N("Reduce deposit cost pressure", ["Rising cost of funds", "Deposit attrition", "Margin compression"], "Deposit costs rose to 2.67% in 2025, squeezing margins.", "2.67%"),
      N("Modernize the legacy core", ["Mandatory downtime", "Slow product launches", "Batch processing"], "Legacy cores limit real-time payments.", "Legacy core"),
      N("Meet capital rule changes", ["Capital planning delays", "New reporting requests", "Model rework"], "Regulators re-proposed capital rules in March 2026.", "Basel"),
      N("Scale AI responsibly", ["AI pilots stall", "Governance questions", "No owner for AI value"], "Generative AI spending rose in 2025.", "generative AI"),
      N("Stabilise the frontline workforce", ["High teller attrition", "Rising training spend", "Thin coverage"], "Teller attrition stayed high.", "Attrition"),
    ] }));
  }
  if (prompt.includes("For each numbered client need")) {
    const idx = [...prompt.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
    return gem(JSON.stringify({ rows: idx.map((i) => ({ index: i, mcOffers: ["Finance > Finance Strategy"], offerNarrative: "" })) }));
  }
  if (prompt.includes("For each numbered CLAIM")) {
    const n = [...prompt.matchAll(/^CLAIM (\d+):/gm)].length;
    return gem(JSON.stringify(Array.from({ length: n }, (_, i) => ({ index: i, verdict: "supported" }))));
  }
  if (prompt.includes("Each numbered STATEMENT")) return gem("[]");
  throw new Error("unmocked " + prompt.slice(0, 80));
};

let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`); if (!ok) failures++; };

const call = async (body) => {
  if (F.verifyFails && body.step === "verify_evidence") throw Object.assign(new Error("boom"), { status: 500 });
  const r = await handler(new Request("http://x/", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", authorization: "Bearer u", apikey: "pk" } }));
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j.error || "http " + r.status), { status: r.status });
  return j;
};
const run = async (flags = {}) => {
  for (const k of Object.keys(F)) delete F[k];
  Object.assign(F, flags);
  let last = [];
  const rep = await runIndustryResearch({ call, subIndustryName: "Retail Banking", industryName: "BFSI", onProgress: (c) => { last = c; }, retryDelayMs: 3 });
  return { rep, last };
};

const { rep, last } = await run();
const q = rep.quality;
const dc = q.dateChecks;
const all = JSON.stringify({ o: rep.overview, c: rep.challenges, i: rep.initiatives, n: rep.needs });
const dropReasons = (re) => dc.dropped.filter((d) => re.test(d.reason)).map((d) => d.text);
console.log("   initiatives:", JSON.stringify(rep.initiatives.map((x) => x.slice(0, 40))));
console.log("   dateChecks:", dc.confirmed, "confirmed,", dc.unverified, "unverified,", dc.dropped.length, "dropped");

check("a dated regulation item whose page is from 2007 is dropped as contradicted", dropReasons(/contradicts the cited page/).some((t) => /third-party risk rule on July 17, 2026/.test(t)), JSON.stringify(dc.dropped));
check("the contradicted rule never reaches the initiatives", !/third-party risk rule on July 17/.test(all), all.slice(0, 300));
check("a regulation item whose page is readable but shows no date is dropped", dropReasons(/does not show this date/).some((t) => /Capital planning rules/.test(t)), JSON.stringify(dc.dropped));
check("a dated event whose page cannot be read (bot block) is kept as unverified", dc.unverified >= 2 && !dc.dropped.some((d) => /liquidity rule|Basel/.test(d.text)) && /liquidity rule/.test(rep.initiatives.join(" ")), JSON.stringify(dc));
check("a dated event whose page shows the date is confirmed and kept", dc.confirmed >= 1 && /Wells Fargo launched an AI assistant/.test(rep.initiatives.join(" ")), JSON.stringify(dc));
check("an undated event from a page published before the window is dropped", dropReasons(/older than 24 months/).some((t) => /shared-service/.test(t)), JSON.stringify(dc.dropped));
check("market statistics are not date-checked (a market row on an old page is kept)", !dc.dropped.some((d) => /net income of \$98B/.test(d.text)) && q.evidenceByTopic.market >= 3, JSON.stringify(q.evidenceByTopic));
check("stock-data sites are blocked", !rep.sources.some((s) => /stockanalysis/.test(s.url)) && q.sourcesDroppedByType >= 1, String(q.sourcesDroppedByType));
check("evidence ids are stripped from the text", !/\(E\d+/.test(all) && /Retail banking faces margin pressure/.test(all), all.slice(0, 200));
check("an award is not an initiative", /not an initiative/.test(JSON.stringify(q.dropped)) && !/Best Digital Bank/.test(all), JSON.stringify(q.dropped.map((d) => d.reason)));
check("directional parts stay free to interpret (challenges without statistics survive)", rep.challenges.length >= 3 && rep.needs.length >= 5, `${rep.challenges.length} challenges, ${rep.needs.length} needs`);
check("the Checking dates chip finished", last.find((c) => c.label === "Checking dates")?.status === "done", last.map((c) => c.label + ":" + c.status).join());

const failed = await run({ verifyFails: true });
check("if the date check cannot run, the refresh still completes with a warning", failed.rep.quality.warnings.some((w) => /Date check could not run/.test(w)) && failed.rep.initiatives.length >= 1 && failed.last.find((c) => c.label === "Checking dates")?.status === "failed", failed.rep.quality.warnings.join(" | "));

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
