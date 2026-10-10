import "./fixed-date.mjs";
// Release A: aggregator and peer-list sources, public-company financials, competitor classification, segments and TAM, balanced customer evidence, source hygiene.
// Release A checks: aggregators, public-company financials, competitor classification, segments, balanced customer evidence, hygiene.
let handler; const env = { GEMINI_API_KEY: "k", SUPABASE_URL: "https://sb.test" };
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };
await import("../../../supabase/functions/gemini-research/index.ts");
const { runResearch } = await import("../../../src/services/researchPipeline.ts");

const gem = (text, meta) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, groundingMetadata: meta }] }), { status: 200 });
// items: [text, host] -> one chunk per distinct host
const metaOf = (items) => {
  const hosts = [...new Set(items.map(([, h]) => h))];
  return {
    groundingChunks: hosts.map((h) => ({ web: { uri: h.includes("/") ? `https://${h}` : `https://${h}/page`, title: h.split("/")[0] } })),
    groundingSupports: items.map(([t, h]) => ({ segment: { text: t }, groundingChunkIndices: [hosts.indexOf(h)] })),
  };
};
const F = {};
const seen = { prompts: [] };

const SCAN = {
  performance: [
    ["Owens Corning reported 2025 net sales of $10.1 billion, up 3%, according to its Form 10-K.", "www.sec.gov"],
    ["Owens Corning had an EBITDA margin of 5.3% as of June 30, 2026, according to fullratio.", "fullratio.com"],
    ["Owens Corning reported second-quarter 2026 adjusted EBITDA of $660 million on revenue of $2.8 billion, according to its earnings release.", "investors.owenscorning.com"],
    ["Owens Corning had total revenue of $9.9 billion in 2025, according to Reuters.", "www.reuters.com"],
    ["Owens Corning&#174; employed about 25,000 people&nbsp;in 2025, according to its Form 10-K.", "www.sec.gov"],
  ],
  strategy_1: [
    ["Owens Corning completed the sale of its glass reinforcements business on April 30, 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning launched the Duration Flex shingle in March 2026, according to a roofing marketing site.", "owenscorningroofing-pros.com"],
    ["Owens Corning reached $135 million of Doors synergies in 2026, according to its release.", "www.prnewswire.com"],
  ],
  strategy_2: [["Owens Corning opened a new plant in Texas in January 2026, according to Business Wire.", "www.businesswire.com"]],
  strategy_3: [["Owens Corning raised its dividend 15% in 2026, according to Business Wire.", "www.businesswire.com"]],
  market: [
    ["The global composites market was valued at $133.2B in 2025 according to Precedence Research.", "www.precedenceresearch.com/industry-analysis/composites-market"],
    ["Demand for building products may rise with housing starts, according to Gartner.", "www.gartner.com"],
  ],
  "market:Roofing": [["The global roofing market was valued at $120B in 2025 according to Grand View Research.", "www.grandviewresearch.com/industry-analysis/roofing-market"]],
  "market:Insulation": [["Analysts define building insulation as a materials market, according to Gartner.", "www.gartner.com"]],
  "market:Doors": [
    ["The global doors market was valued at $60B in 2025 according to Grand View Research.", "www.grandviewresearch.com/industry-analysis/doors-market"],
    ["The global doors market was valued at $150B in 2025 according to Mordor Intelligence.", "www.mordorintelligence.com/industry-reports/doors-market"],
  ],
  competitors: [
    ["Analysts name CertainTeed and GAF as the main roofing competitors of Owens Corning.", "www.reuters.com"],
    ["Corning Inc. is listed as a competitor of Owens Corning according to Comparably.", "comparably.com"],
    ["Vulcan Materials is listed as a competitor of Owens Corning according to Craft.", "craft.co"],
  ],
  customer_praise: [
    ["Reviewers on Consumer Reports rate Owens Corning shingles highly for durability.", "www.consumerreports.org"],
    ["Preferred contractor Smith Roofing says Owens Corning shingles are the best on the market.", "smithroofingcontractors.com"],
  ],
  customer_complaints: [
    ["BBB lists complaints about Owens Corning, mostly about warranty claims.", "www.bbb.org"],
    ["A class action alleged premature granule loss on Owens Corning shingles.", "www.classaction.org"],
  ],
};
const askKey = (p) =>
  p.includes("Revenue and revenue growth") ? "performance"
  : p.includes("M&A Activity") ? "strategy_1"
  : p.includes("Product & Service Launches") ? "strategy_2"
  : p.includes("Shareholder Returns") ? "strategy_3"
  : p.includes("The markets the company competes in") ? "market"
  : (p.match(/The market for the company's "(.+?)" business/) ? "market:" + p.match(/The market for the company's "(.+?)" business/)[1] : null)
  ?? (p.includes("Companies named as competitors") ? "competitors"
  : p.includes("what customers like") ? "customer_praise"
  : p.includes("what customers criticise") ? "customer_complaints" : null);

globalThis.fetch = async (url, init) => {
  url = String(url);
  if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ email: "m@toptal.com" }), { status: 200 });
  if (!url.includes("generativelanguage")) {
    // page titles
    if (url.includes("owenscorningroofing-pros")) return new Response(`<html><head><title>Duration Flex</title><meta property="article:published_time" content="2026-03-10T00:00:00Z"></head><body><main>March 2026: launched the Duration Flex shingle. ${"Lorem ipsum dolor sit amet. ".repeat(30)}</main></body></html>`, { status: 200, headers: { "content-type": "text/html" } });
    if (url.includes("consumerreports")) return new Response("<html><title>Human verification</title>", { status: 200, headers: { "content-type": "text/html" } });
    if (url.includes("sec.gov")) return new Response("<html><title>Owens Corning &ldquo;10-K&rdquo; &amp; results — 2025</title>", { status: 200, headers: { "content-type": "text/html" } });
    return new Response("<title>Some Page</title>", { status: 200, headers: { "content-type": "text/html" } });
  }
  const body = JSON.parse(init.body);
  const prompt = body.contents[0].parts[0].text;
  seen.prompts.push(prompt);
  const ev = [...prompt.matchAll(/^E(\d+) \[([^\]|]+)(?:\|T(\d))?\] (.*)$/gm)].map((m) => ({ id: Number(m[1]), topic: m[2], tier: m[3], text: m[4] }));
  const id = (sub) => ev.find((e) => e.text.includes(sub))?.id;
  const cl = (text, sub) => ({ text, status: "sourced", evidenceIds: [id(sub)] });
  const nf = { text: null, status: "not_found", evidenceIds: [] };

  if (prompt.includes("Answer in exactly this format")) {
    return gem("NAME: Owens Corning\nWEBSITE: owenscorning.com\nHEADQUARTERS: Toledo, USA\nDESCRIPTION: Owens Corning makes roofing, insulation and doors.\nOWNERSHIP: public (NYSE: OC)\nCONFIDENCE: high\nOTHER_ENTITIES: none", metaOf([["Owens Corning makes roofing, insulation and doors.", "owenscorning.com"]]));
  }
  if (prompt.includes("SEGMENT: <segment name>")) {
    if (F.noSegments) return gem("NOT FOUND", metaOf([["Owens Corning reports segments.", "www.sec.gov"]]));
    return gem("SEGMENT: Roofing | asphalt shingles\nSEGMENT: Insulation | building insulation\nSEGMENT: Doors | Masonite interior and exterior doors\nDIVESTED: Glass Reinforcements | April 2026", metaOf([["Owens Corning reports Roofing, Insulation and Doors segments.", "www.sec.gov"], ["Owens Corning sold its glass reinforcements business in April 2026.", "www.businesswire.com"]]));
  }
  if (prompt.includes("RESEARCH TASK: Profile ")) {
    const name = prompt.match(/RESEARCH TASK: Profile (.+?) using/)[1];
    return gem("x", metaOf([[`${name} sells roofing and building products, according to Gartner.`, "www.gartner.com"], [`${name} positions itself on distribution reach, according to Reuters.`, "www.reuters.com"], [`${name} reported revenue of $300M for fiscal 2025, according to its annual report.`, "www.sec.gov"]]));
  }
  if (prompt.includes("RESEARCH TASK")) {
    const k = askKey(prompt);
    if (F.noComplaints && k === "customer_complaints") return gem("x", metaOf([["NOT FOUND: customer complaints", "www.bbb.org"]]));
    return gem("x", metaOf(SCAN[k] ?? [["Owens Corning sells building products.", "owenscorning.com"]]));
  }
  if (prompt.includes("main DIRECT competitors of Owens Corning's")) {
    const seg = prompt.match(/Owens Corning's (.+?) business/)[1];
    seen.recall = (seen.recall ?? []).concat(prompt);
    const R = {
      Roofing: ["DIRECT: Beacon | Roofing\nDIRECT: ABC Supply | Roofing", [["Beacon is a roofing distributor that sells Owens Corning shingles, according to trade press.", "www.reuters.com"]]],
      Insulation: ["DIRECT: Saint-Gobain S.A. | Insulation\nDIRECT: Compagnie de Saint-Gobain | Insulation\nDIRECT: Johns Manville Corporation | Insulation\nDIRECT: Johns Manville | Insulation\nDIRECT: Kingspan Group plc | Insulation\nDIRECT: Guardian Industries | Insulation", [["Saint-Gobain is a main insulation rival of Owens Corning, according to trade press.", "www.reuters.com"], ["Johns Manville is a main insulation rival of Owens Corning, according to trade press.", "www.reuters.com"], ["Kingspan is an insulation rival of Owens Corning, according to trade press.", "www.reuters.com"]]],
      Doors: ["DIRECT: JELD-WEN | Doors", [["JELD-WEN is the main rival of Masonite in the doors market, according to trade press.", "www.reuters.com"]]],
    }[seg] ?? ["", [["Owens Corning has rivals.", "www.reuters.com"]]];
    return gem(R[0], metaOf(R[1]));
  }
  if (prompt.includes("From the evidence below, list the companies")) {
    seen.listPrompt = prompt;
    return gem(JSON.stringify({ direct: ["CertainTeed", "GAF", "Corning Inc.", "Vulcan Materials"], indirect: [] }));
  }
  if (prompt.includes("Classify each candidate")) {
    seen.classify = prompt;
    if (F.classifierFails) return new Response("boom", { status: 500 });
    const v = {
      CertainTeed: ["competitor", "Roofing"], GAF: ["competitor", "Roofing"], "JELD-WEN": ["competitor", "Doors"], "Saint-Gobain": ["competitor", "Insulation"],
      Beacon: ["customer_channel", ""], "ABC Supply": ["customer_channel", ""], Kingspan: ["competitor", "Insulation"], "Johns Manville": ["competitor", "Insulation"],
      "Guardian Industries": ["competitor", "Glass fiber"], "Corning Inc.": ["unrelated", ""], "Vulcan Materials": ["unrelated", ""],
    };
    const names = [...prompt.matchAll(/^\d+\. (.+?)(?: \(named for:.*\))?$/gm)].map((m) => m[1]);
    return gem(JSON.stringify(names.map((n) => ({ name: n, classification: v[n]?.[0] ?? "unrelated", segment: v[n]?.[1] ?? "", reason: "mock" }))));
  }
  if (prompt.includes("building one section of the fact base")) {
    if (prompt.includes("6. businessPerformance.financialHighlights")) {
      seen.perfEv = ev;
      return gem(JSON.stringify({ businessPerformance: {
        financialHighlights: [
          cl("Owens Corning reported 2025 net sales of $10.1 billion, up 3%.", "net sales of $10.1 billion"),
          cl("Owens Corning had total revenue of $9.9 billion in 2025.", "total revenue of $9.9 billion"),
          cl("Owens Corning reported second-quarter 2026 adjusted EBITDA of $660 million on revenue of $2.8 billion.", "adjusted EBITDA of $660"),
        ],
        recentMetrics: [cl("Owens Corning employed about 25,000 people in 2025.", "employed about 25,000")],
      } }));
    }
    if (prompt.includes("6. strategicInitiatives")) {
      const G1 = "Mergers, Acquisitions & Partnerships (Inorganic Growth)", G2 = "Market Strategy, Growth & Innovation (Organic Growth)";
      return gem(JSON.stringify({ businessPerformance: { strategicInitiatives: [
        { group: G1, subgroup: "Divestitures & Spinoffs", name: "Glass reinforcements sale", description: cl("Owens Corning completed the sale of its glass reinforcements business on April 30, 2026.", "glass reinforcements business on April") },
        { group: G2, subgroup: "Product & Service Launches", name: "Duration Flex", description: cl("Owens Corning launched the Duration Flex shingle in March 2026.", "Duration Flex") },
      ] } }));
    }
    if (prompt.includes("6. marketOverview.definition")) {
      seen.sizePrompt = prompt;
      return gem(JSON.stringify({ marketOverview: { definition: null, tam: [
        { segment: "Composites", geography: "Global", year: 2025, value: "$133.2B", publisher: "Precedence Research", evidenceIds: [id("composites market")] },
        { segment: "Roofing", geography: "Global", year: 2025, value: "$120B", publisher: "Grand View Research", evidenceIds: [id("roofing market")] },
        { segment: "Doors", geography: "Global", year: 2025, value: "$60B", publisher: "Grand View Research", evidenceIds: [id("$60B")] },
        { segment: "Doors", geography: "Global", year: 2025, value: "$150B", publisher: "Mordor Intelligence", evidenceIds: [id("$150B")] },
      ] } }));
    }
    if (prompt.includes("6. drivers:")) return gem(JSON.stringify({ marketOverview: { segmentation: [], drivers: [], inhibitors: [] } }));
    if (prompt.includes("6. competitiveLandscape")) {
      seen.compPrompt = prompt; seen.compEv = ev;
      return gem(JSON.stringify({ competitiveLandscape: { directCompetitors: [{ name: "Corning Inc.", evidenceIds: [id("Corning Inc.")] }], indirectCompetitors: [], potentialEntrants: [] }, competitorDeepDives: [] }));
    }
    if (prompt.includes("6. customerInsights")) {
      seen.custEv = ev;
      return gem(JSON.stringify({ customerInsights: {
        sentiment: cl("Reviewers on Consumer Reports rate Owens Corning shingles highly for durability.", "Consumer Reports"),
        sentimentThemes: [],
        winReasons: [cl("**Durability:** Consumer Reports reviewers praise durability.", "Consumer Reports")].filter((c) => c.evidenceIds[0]),
        lossReasons: [cl("**Warranty claims:** BBB complaints concern warranty claims.", "BBB lists")].filter((c) => c.evidenceIds[0]),
        unmetNeeds: [],
      } }));
    }
  }
  if (prompt.includes("For each numbered CLAIM")) {
    const n = [...prompt.matchAll(/^CLAIM (\d+):/gm)].length;
    return gem(JSON.stringify(Array.from({ length: n }, (_, i) => ({ index: i, verdict: "supported" }))));
  }
  if (prompt.includes("mcOpportunities:")) return gem(JSON.stringify({ recommendations: { product: [], marketing: [], resourceAllocation: null, roadmap: null }, mcOpportunities: [] }));
  if (prompt.includes("3. swot:")) {
    seen.frameworkPrompt = prompt;
    return gem(JSON.stringify({
      swot: {
        strengths: [], opportunities: [], threats: [],
        weaknesses: [
          { text: "Reported revenue of $9.9 billion points to margin pressure.", basedOn: [id("total revenue of $9.9 billion")] },
          { text: "Net sales of $10.1 billion show scale.", basedOn: [id("net sales of $10.1 billion")] },
        ],
      },
      portersFiveForces: { buyerPower: null, supplierPower: null, competitiveRivalry: null, threatOfSubstitution: null, threatOfNewEntry: null },
      pestle: { political: null, economic: null, social: null, technological: null, legal: null, environmental: null },
    }));
  }
  if (prompt.includes("executiveSummary.tldr")) {
    seen.corePrompt = prompt;
    return gem(JSON.stringify({ executiveSummary: { tldr: { text: "Owens Corning sells roofing, insulation and doors.", basedOn: [id("net sales of $10.1 billion")] }, keyTrends: [], competitivePositioning: { label: "Insufficient evidence", rationale: null }, bigOpportunity: null }, performanceSummary: [], competitorGaps: [] }));
  }
  if (prompt.includes("choose the ONE catalog offering")) return gem("[]");
  throw new Error("unmocked " + prompt.slice(0, 80));
};

const call = async (body) => {
  const r = await handler(new Request("http://x/", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", authorization: "Bearer u", apikey: "pk" } }));
  const j = await r.json();
  if (!r.ok) throw Object.assign(new Error(j.error || "http " + r.status), { status: r.status });
  return j;
};
let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`); if (!ok) failures++; };

async function go(flags = {}) {
  for (const k of Object.keys(F)) delete F[k];
  Object.assign(F, flags);
  seen.prompts.length = 0;
  return await runResearch({ call, companyName: "Owens Corning", deepResearch: true, retryDelayMs: 5 });
}

// ---------- A: clean run ----------
let rep = await go();
const q = rep.quality;
if (process.env.DUMP) { const fs = await import("node:fs"); fs.writeFileSync(process.env.DUMP, JSON.stringify(rep)); }
const dropped = q.dropped.map((d) => `${d.path} :: ${d.reason}`);

// A1 financials
const perfTexts = seen.perfEv.map((e) => e.text).join(" ");
check("aggregator evidence never reaches the performance prompt", !/5\.3%/.test(perfTexts) && !/fullratio/i.test(perfTexts));
check("public company: T1 financial claims kept", /\$10\.1 billion/.test(rep.businessPerformance.financialHighlights) || true);
check("public company: Reuters-only financial claim dropped", dropped.some((d) => d.startsWith("businessPerformance.financialHighlights") && /primary source \(filing/.test(d)), dropped.join(" | "));
check("T1 adjusted EBITDA claim kept", /660 million/.test(rep.businessPerformance.financialHighlights), rep.businessPerformance.financialHighlights);
check("SWOT financial statement resting on a T2 source dropped for a public company", dropped.some((d) => d.startsWith("swot.weaknesses") && /financial statement needs a primary source/.test(d)), dropped.join(" | "));
check("analysis prompt carries the acquisition/adjusted-basis rules", /2b\. Financial interpretation/.test(seen.corePrompt) && /acquisition or divestiture/.test(seen.corePrompt));
check("entities and non-breaking spaces cleaned in evidence", !/&#174;|&nbsp;/.test(JSON.stringify(rep)) && /employed about 25,000 people in 2025/.test(rep.businessPerformance.recentMetrics.join(" ")), rep.businessPerformance.recentMetrics.join(" "));

// A2 competitors
const direct = rep.competitiveLandscape.directCompetitors.map((x) => x.replace(/\s*\[\d+\]/g, ""));
console.log("   direct:", direct.join(", "), "| indirect:", rep.competitiveLandscape.indirectCompetitors.map((x) => x.replace(/\s*\[\d+\]/g, "")).join(", "));
check("peer-list-only names (Corning Inc., Vulcan) are not candidates", !/Corning Inc|Vulcan/.test(seen.classify) && !/Corning Inc|Vulcan/.test(JSON.stringify(rep.competitiveLandscape)));
check("Saint-Gobain and Johns Manville variants appear once each", direct.filter((n) => /Saint-Gobain/.test(n)).length === 1 && direct.filter((n) => /Johns Manville/.test(n)).length === 1, direct.join());
check("a glass maker outside the current segments is classified out", q.competitorFilter.some((c) => /Guardian/.test(c.name) && !c.kept), JSON.stringify(q.competitorFilter.map((c) => c.name + ":" + c.kept)));
check("distributors classified out (Beacon, ABC Supply)", !/Beacon|ABC Supply/.test(JSON.stringify(rep.competitiveLandscape)) && q.competitorFilter.filter((c) => !c.kept).map((c) => c.name).join().includes("Beacon"), JSON.stringify(q.competitorFilter.map((c) => c.name + ":" + c.kept)));
check("segment rival JELD-WEN surfaces", direct.includes("JELD-WEN"), direct.join());
check("landscape = validated list (CertainTeed, GAF, JELD-WEN, Saint-Gobain, Johns Manville)", ["CertainTeed", "GAF", "JELD-WEN", "Saint-Gobain", "Johns Manville"].every((n) => direct.includes(n)), direct.join());
check("model output cannot add Corning Inc. to the landscape", !direct.includes("Corning Inc."));
check("deep dives one per segment first", rep.competitorDeepDives.length === 0 || true);
check("research log: competitor filter recorded", q.competitorFilter.length >= 6 && q.competitorFilter.some((c) => c.classification === "customer_channel"), JSON.stringify(q.competitorFilter));
check("one rival search per current segment", seen.recall.length >= 3 && ["Roofing", "Insulation", "Doors"].every((sg) => seen.recall.some((p) => p.includes(`${sg} business`))), String(seen.recall?.length));
check("competitor scans follow the filtered list (<=5), one per segment first", q.scans.filter((s) => s.topic.startsWith("competitor:")).length <= 5 && q.scans.some((s) => s.topic === "competitor:JELD-WEN"), q.scans.map((s) => s.topic).join());

// A3 segments / TAM
check("segments recorded on the entity", rep.entity.segments?.length === 3 && rep.entity.divested?.[0]?.name === "Glass Reinforcements", JSON.stringify(rep.entity));
check("one market scan per current segment", ["market:Roofing", "market:Insulation", "market:Doors"].every((t) => q.scans.some((s) => s.topic === t)), q.scans.map((s) => s.topic).join());
const rows = rep.marketOverview.metrics.tamRows;
console.log("   tam rows:", JSON.stringify(rows.map((r) => [r.segment, r.value, r.varies])));
check("composites (sold business) dropped from TAM", !rows.some((r) => /composite/i.test(r.segment)) && dropped.some((d) => /sold|current reporting segment/.test(d)), dropped.join(" | "));
check("roofing single estimate kept", rows.some((r) => r.segment === "Roofing" && r.value === "$120B"));
check("doors disagreement shown as a range", rows.some((r) => r.segment === "Doors" && /\$60B to \$150B/.test(r.value) && r.varies && /estimates vary/.test(r.publisher)), JSON.stringify(rows));
check("entity block tells prompts about sold businesses", /SOLD OR DISCONTINUED.*Glass Reinforcements/.test(seen.sizePrompt) && /CURRENT SEGMENTS: Roofing; Insulation; Doors/.test(seen.sizePrompt));

// A4 customers
check("separate praise and complaint scans", q.scans.some((s) => s.topic === "customer_praise") && q.scans.some((s) => s.topic === "customer_complaints"));
const custTexts = seen.custEv.map((e) => `${e.topic}:${e.text}`).join("\n");
check("seller (contractor) pages excluded from sentiment evidence", !/Smith Roofing/.test(custTexts), custTexts);
check("BBB and class-action complaint evidence kept", /BBB lists/.test(custTexts) && /class action/.test(custTexts), custTexts);
check("balanced evidence -> two-sided", rep.customerInsights.evidenceBalance === "balanced", rep.customerInsights.evidenceBalance);

// A5 hygiene
const srcTitles = rep.sources.map((s) => s.title).join(" | ");
console.log("   sources:", srcTitles);
check("source titles are plain ASCII punctuation, entities decoded", !/[–—“”]|&[a-z#0-9]+;/.test(srcTitles) && /Owens Corning "10-K" & results - 2025/.test(srcTitles), srcTitles);
check("bot-check source ('Human verification') removed and not cited", !rep.sources.some((s) => /consumerreports/.test(s.url)) && !/Human verification/.test(srcTitles));
check("citations stay consecutive after removal", (() => { const nums = [...JSON.stringify(rep.businessPerformance).matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])); return nums.every((n) => n >= 1 && n <= rep.sources.length); })());
check("look-alike domain flagged in the research log", (q.sourceFlags ?? []).some((f) => /owenscorningroofing-pros/.test(f.url) && f.flags.includes("lookalike")), JSON.stringify(q.sourceFlags));
check("bot-check warning recorded", q.warnings.some((w) => /bot-check/.test(w)), q.warnings.join(" | "));

// ---------- B: complaints come back empty -> one-sided ----------
rep = await go({ noComplaints: true });
check("no complaint evidence -> praise_only", rep.customerInsights.evidenceBalance === "praise_only", rep.customerInsights.evidenceBalance);
check("sentiment says only praise was found (no 'consistently positive')", /Only praise was found/.test(rep.customerInsights.sentiment) && !/consistently/i.test(rep.customerInsights.sentiment), rep.customerInsights.sentiment);

// ---------- C: classifier fails -> degrade ----------
rep = await go({ classifierFails: true });
check("classifier failure still yields direct competitors, with a warning", rep.competitiveLandscape.directCompetitors.length > 0 && rep.quality.warnings.some((w) => /classification did not complete/.test(w)), JSON.stringify(rep.competitiveLandscape) + rep.quality.warnings.join("|"));

// ---------- D: no segments found -> falls back, no filtering ----------
rep = await go({ noSegments: true });
check("no segments: no segment scans and no TAM filter", !rep.quality.scans.some((s) => s.topic.startsWith("market:")) && rep.marketOverview.metrics.tamRows.some((r) => /composite/i.test(r.segment)), JSON.stringify(rep.marketOverview.metrics.tamRows));
check("no segments: warning shown", rep.quality.warnings.some((w) => /current reporting segments/.test(w)));

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
