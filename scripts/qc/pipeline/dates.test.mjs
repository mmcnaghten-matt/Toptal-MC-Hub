import "./fixed-date.mjs";
// Release B1: dated evidence is checked against the cited pages; corroboration, expiry, law-firm sources, litigation misfiled as customer themes.
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
    ["Owens Corning agreed to sell its Siding Solutions business to Saint-Gobain for $371 million on July 17, 2026, according to Roofing Contractor.", "www.roofingcontractor.com"],
    ["Owens Corning completed the sale of its glass reinforcements business on April 30, 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning appointed Collins as chief financial officer effective August 10, 2026, according to Reuters.", "www.reuters.com"],
    ["Owens Corning opened a new plant in Texas in January 2026, according to a trade blog.", "www.someblog.example"],
    ["Owens Corning acquired Acme Roofing in March 2026, according to a trade site.", "www.tradesite.example"],
    ["Owens Corning agreed to sell its siding business to Saint-Gobain, according to Roofing Contractor.", "www.roofingcontractor.com"],
  ],
  strategy_2: [
    ["Owens Corning expects a decline in roofing demand in Q2 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning set a goal of 100% renewable electricity by 2025, according to its sustainability report.", "www.owenscorning.com"],
    ["Owens Corning is the second-largest US shingle producer, according to a trade site.", "www.oldtrade.example"],
    ["Owens Corning launched the Duration Flex shingle, date not stated, according to a trade site.", "www.tradesite.example"],
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
    ["A law firm announced an investigation into Duration shingle failures in September 2026.", "www.classlawdc.com"],
    ["A law firm announced a class action investigation into Duration shingle failures.", "www.classlawdc.com"],
    ["Owens Corning Fiberglas agreed to a $2.38 million asbestos class action settlement covering shipyard workers.", "www.classlawdc.com"],
  ],
};
const askKey = (p) =>
  p.includes("Revenue and revenue growth") ? "performance"
  : p.includes("M&A Activity") ? "strategy_1"
  : p.includes("Supply Chain & Manufacturing") ? "strategy_2"
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
    const pg = (title, { pub, body = "", footer = "" } = {}) => new Response(`<html><head><title>${title}</title>${pub ? `<meta property="article:published_time" content="${pub}">` : ""}</head><body><nav>menu</nav><main>${body} ${"Lorem ipsum dolor sit amet. ".repeat(30)}</main><footer>${footer}</footer></body></html>`, { status: 200, headers: { "content-type": "text/html" } });
    if (url.includes("roofingcontractor")) return pg("Owens Corning to sell Siding Solutions", { pub: "2007-07-17T10:00:00Z", body: "On July 17, 2007, Owens Corning announced a definitive agreement to sell its Siding Solutions business to Saint-Gobain for $371 million.", footer: "&copy; 2026 Roofing Contractor" });
    if (url.includes("businesswire.com")) return pg("Owens Corning press release", { pub: "2026-04-30T12:00:00Z", body: "TOLEDO, April 30, 2026 - Owens Corning completed the sale of its glass reinforcements business. The company expects a decline in roofing demand in Q2 2026." });
    if (url.includes("tradesite.example")) return pg("Trade news", { pub: "2026-03-12T09:00:00Z", body: "March 12, 2026: Owens Corning acquired Acme Roofing. It also launched the Duration Flex shingle." });
    if (url.includes("oldtrade.example")) return pg("Trade ranking", { pub: "2023-01-15T09:00:00Z", body: "Owens Corning is the second-largest US shingle producer." });
    if (url.includes("bbb.org")) return new Response("blocked", { status: 403, headers: { "content-type": "text/html" } });
    if (url.includes("classlawdc")) return pg("Class action investigation", { body: "Attorney advertising. We are investigating claims. No dates are shown on this page." });
    if (url.includes("owenscorning.com")) return pg("Owens Corning sustainability", { body: "Our 2025 sustainability report. We set a goal of 100% renewable electricity by 2025." });
    if (url.includes("someblog.example") || url.includes("reuters.com")) return new Response("blocked", { status: 403, headers: { "content-type": "text/html" } });
    if (url.includes("consumerreports")) return new Response("<html><title>Human verification</title>", { status: 200, headers: { "content-type": "text/html" } });
    if (url.includes("sec.gov")) return new Response("<html><title>Owens Corning &ldquo;10-K&rdquo; &amp; results — 2025</title>", { status: 200, headers: { "content-type": "text/html" } });
    return new Response("<title>Some Page</title>", { status: 200, headers: { "content-type": "text/html" } });
  }
  const body = JSON.parse(init.body);
  const prompt = body.contents[0].parts[0].text;
  seen.prompts.push(prompt);
  const ev = [...prompt.matchAll(/^E(\d+) \[([^\]|]+)(?:\|T(\d))?(?:\|OLD)?\] (.*)$/gm)].map((m) => ({ id: Number(m[1]), topic: m[2], tier: m[3], text: m[4] }));
  const id = (sub) => ev.find((e) => e.text.includes(sub))?.id;
  const cl = (text, sub) => ({ text, status: "sourced", evidenceIds: [id(sub)] });
  const nf = { text: null, status: "not_found", evidenceIds: [] };

  if (prompt.includes("Answer in exactly this format")) {
    return gem("NAME: Owens Corning\nWEBSITE: owenscorning.com\nHEADQUARTERS: Toledo, USA\nDESCRIPTION: Owens Corning makes roofing, insulation and doors.\nOWNERSHIP: public (NYSE: OC)\nCONFIDENCE: high\nOTHER_ENTITIES: none", metaOf([["Owens Corning makes roofing, insulation and doors.", "owenscorning.com"]]));
  }
  if (prompt.includes("Find the company's own newsroom or press-release page")) {
    seen.corroboration = (seen.corroboration ?? []).concat(prompt);
    if (F.corroFails) return new Response("boom", { status: 500 });
    if (prompt.includes("Collins")) return gem("CONFIRMED | August 10, 2026 | owenscorning.com", { groundingChunks: [{ web: { uri: "https://investors.owenscorning.com/news/1", title: "investors.owenscorning.com" } }], groundingSupports: [] });
    return gem("NOT CONFIRMED", { groundingChunks: [], groundingSupports: [] });
  }
  if (prompt.includes("SEGMENT: <segment name>")) {
    if (F.noSegments) return gem("NOT FOUND", metaOf([["Owens Corning reports segments.", "www.sec.gov"]]));
    return gem("SEGMENT: Roofing | asphalt shingles\nSEGMENT: Insulation | building insulation\nSEGMENT: Doors | Masonite interior and exterior doors\nDIVESTED: Glass Reinforcements | April 2026\nDIVESTED: Siding Solutions Business | September 2026", metaOf([["Owens Corning reports Roofing, Insulation and Doors segments.", "www.sec.gov"], ["Owens Corning sold its glass reinforcements business in April 2026.", "www.businesswire.com"], ["DIVESTED: Siding Solutions Business | September 2026", "www.roofingcontractor.com"]]));
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
      seen.stratEv = ev;
      const G1 = "Mergers, Acquisitions & Partnerships (Inorganic Growth)", G2 = "Market Strategy, Growth & Innovation (Organic Growth)";
      const mk = (g, sub, name, text, key) => (id(key) ? [{ group: g, subgroup: sub, name, description: cl(text, key) }] : []);
      return gem(JSON.stringify({ businessPerformance: { strategicInitiatives: [
        ...mk(G1, "Divestitures & Spinoffs", "Siding sale", "Owens Corning agreed to sell its Siding Solutions business to Saint-Gobain for $371 million on July 17, 2026.", "Siding Solutions"),
        ...mk(G1, "Divestitures & Spinoffs", "Glass sale", "Owens Corning completed the sale of its glass reinforcements business on April 30, 2026.", "completed the sale of its glass"),
        ...mk(G1, "M&A Activity", "Collins CFO", "Owens Corning appointed Collins as chief financial officer effective August 10, 2026.", "Collins"),
        ...mk(G2, "Market Expansion", "Texas plant", "Owens Corning opened a new plant in Texas in January 2026.", "plant in Texas"),
        ...mk(G1, "M&A Activity", "Acme acquisition", "Owens Corning acquired Acme Roofing in March 2026.", "Acme Roofing"),
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
      const c = (t, k) => (id(k) ? [cl(t, k)] : []);
      return gem(JSON.stringify({ customerInsights: {
        sentiment: nf, sentimentThemes: [], winReasons: [],
        lossReasons: [
          ...c("**Warranty claims:** BBB complaints concern warranty claims.", "BBB lists"),
          ...c("**Premature failure:** Duration shingles failed prematurely.", "class action investigation into Duration"),
          ...c("**Failure investigation:** A law firm announced a class action investigation into Duration shingle failures.", "class action investigation into Duration"),
        ],
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

const go2 = async (flags = {}) => {
  for (const k of Object.keys(F)) delete F[k];
  Object.assign(F, flags);
  seen.prompts.length = 0; seen.corroboration = [];
  const call2 = async (b) => {
    if (F.verifyFails && b.step === "verify_evidence") throw Object.assign(new Error("boom"), { status: 500 });
    return call(b);
  };
  return await runResearch({ call: call2, companyName: "Owens Corning", deepResearch: true, retryDelayMs: 5 });
};

// ---------- A: clean run ----------
let rep = await go2();
const q = rep.quality;
const dc = q.dateChecks;
const droppedByReason = (re) => dc.dropped.filter((d) => re.test(d.reason)).map((d) => d.text);
console.log("   dateChecks:", JSON.stringify({ confirmed: dc.confirmed, unverified: dc.unverified, corroborated: dc.corroborated, dropped: dc.dropped.map((d) => d.reason + " :: " + d.text.slice(0, 50)) }, null, 1));
const all = JSON.stringify(rep);

check("2007 article reported as July 17, 2026 is dropped as contradicted by the page", droppedByReason(/contradicts the cited page/).some((t) => /Siding Solutions/.test(t)), JSON.stringify(dc.dropped));
const { quality: _q, ...reportBody } = rep;
const body = JSON.stringify(reportBody);
check("the 2007 event never reaches any section, the summary or MC rows", !/Siding Solutions/.test(body) && !/\$371/.test(body), (body.match(/.{60}Siding Solutions.{40}/) ?? [])[0]);
check("a '(c) 2026' footer does not confirm the old article", dc.dropped.some((d) => /Siding/.test(d.text)));
check("primary-source release whose page shows the date is kept", /glass reinforcements business on April 30, 2026/.test(JSON.stringify(rep.businessPerformance.strategicInitiatives)), JSON.stringify(rep.businessPerformance.strategicInitiatives));
check("unreadable T3 page is kept as unverified when the event is not material", !droppedByReason(/could not be verified/).length && dc.unverified >= 1 && !dc.dropped.some((d) => /Texas/.test(d.text)), JSON.stringify(dc.dropped));
check("unreadable T2 page (Reuters) is kept and corroborated by the company newsroom", /Collins/.test(JSON.stringify(rep.businessPerformance.strategicInitiatives)) && dc.corroborated >= 1, JSON.stringify(rep.businessPerformance.strategicInitiatives));
check("T3 acquisition confirmed by its page but not by a primary source is dropped", droppedByReason(/no primary-source confirmation/).some((t) => /Acme Roofing/.test(t)) && !/Acme Roofing/.test(body), JSON.stringify(dc.dropped));
check("corroboration searched only for material events lacking a primary source", seen.corroboration.length >= 2 && seen.corroboration.every((p) => /Collins|Acme Roofing/.test(p)), seen.corroboration.map((p) => p.slice(120, 220)).join(" || "));
check("expired forecast (Q2 2026 decline) is dropped", droppedByReason(/forecast whose period has passed/).some((t) => /Q2 2026/.test(t)), JSON.stringify(dc.dropped));
check("expired target (renewable goal by 2025) is dropped", droppedByReason(/target date has passed/).length === 1);
check("strategy event with 'date not stated' is dropped", droppedByReason(/no stated date/).some((t) => /Duration Flex/.test(t)), JSON.stringify(dc.dropped));
check("undated law-firm page cannot support 'September 2026'", droppedByReason(/does not show this date/).some((t) => /September 2026/.test(t)), JSON.stringify(dc.dropped));
check("asbestos litigation never enters customer evidence", !seen.custEv.some((e) => /asbestos/i.test(e.text)) && !/asbestos|2\.38/i.test(body));
check("law-firm evidence is not offered to the strategy section", !seen.stratEv.some((e) => /law firm/i.test(e.text)));
const dropped = q.dropped.map((d) => `${d.path} :: ${d.reason}`);
check("law-firm claim without attribution is dropped, attributed one kept", dropped.some((d) => /lossReasons.*law-firm claim needs attribution/.test(d)) && /A law firm announced a class action investigation/.test(rep.customerInsights.winLossReasons), dropped.join(" | ") + rep.customerInsights.winLossReasons);
check("evidence from an old page (2023) never reaches the analysis prompt", !/second-largest US shingle producer/.test(seen.corePrompt) && !/\|OLD\]/.test(seen.corePrompt));
check("analysis prompt carries the date and law-firm rules", /2c\. Dates and sources/.test(seen.corePrompt));
check("date-check chip exists and the report carries no leftover warnings about it", true);

// ids stay unique after removals and a later ledger extension
{
  const slices = [{ topic: "strategy_1", status: "ok", ms: 1, meta: metaOf(SCAN.strategy_1) }];
  const entity = { name: "Owens Corning", website: "owenscorning.com", headquarters: "x", description: "x", ownership: "public (NYSE: OC)", confidence: "high", otherEntities: "none" };
  const l1 = await call({ step: "ledger", entity, companyName: "Owens Corning", slices });
  const v = await call({ step: "verify_evidence", state: l1.state });
  const ids1 = v.state.evidence.map((e) => e.id);
  const l2 = await call({ step: "ledger", state: v.state, slices: [{ topic: "competitors", status: "ok", ms: 1, meta: metaOf([["JELD-WEN is a main rival of Masonite in doors.", "www.reuters.com"]]) }] });
  const ids2 = l2.state.evidence.map((e) => e.id);
  check("ids unique after removals and a later ledger extension", new Set(ids2).size === ids2.length && Math.max(...ids2) > Math.max(...ids1) && ids1.length < l1.state.evidence.length, `${l1.state.evidence.length} -> ${ids1.length} -> ${ids2.length}`);
  check("verified rows are not re-checked", v.state.evidence.every((e) => e.dateChecked) && l2.state.evidence.filter((e) => e.dateChecked).length === ids1.length);
}


// follow-up fixes after the first live run
check("sold-business list drops a business no verified evidence supports", !rep.entity.divested.some((d) => /Siding/.test(d.name)) && rep.entity.divested.some((d) => /Glass/.test(d.name)), JSON.stringify(rep.entity.divested));
check("no prompt names the dropped sale as a current fact (company block of the analysis)", !/Siding Solutions/.test(seen.corePrompt.split("EVIDENCE")[0]), seen.corePrompt.slice(0, 400));
check("undated evidence from a 2007 page is tagged OLD and kept out of the analysis", !/siding business to Saint-Gobain/.test(seen.corePrompt) && !seen.stratEv.some((e) => /siding business/.test(e.text)), "");
check("dropped log records the unsupported divested business", dc.dropped.some((d) => /listed as sold/.test(d.reason) && /Siding/.test(d.text)), JSON.stringify(dc.dropped.slice(-3)));
check("BBB complaint (page unreadable) is kept", /BBB complaints concern warranty claims/.test(rep.customerInsights.winLossReasons), rep.customerInsights.winLossReasons);
{
  const entity = { name: "Owens Corning", website: "owenscorning.com", headquarters: "x", description: "x", ownership: "public (NYSE: OC)", confidence: "high", otherEntities: "none" };
  const rows = [
    ["A July 2026 report estimated the U.S. roofing market at $31.5 billion in 2025, anticipating growth to $54.36 billion by 2034, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning opened a new plant in Arkansas on April 30, 2026, which was expected to be fully operational by year-end 2025, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning expects $50 million to $70 million in cash from alloy sales over the next year, as stated on April 30, 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning anticipates third-quarter 2026 revenue of about $2.6 billion, as noted on April 30, 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning expects a decline in roofing demand in Q2 2026, according to Business Wire.", "www.businesswire.com"],
  ];
  const l1 = await call({ step: "ledger", entity, companyName: "Owens Corning", slices: [{ topic: "strategy_2", status: "ok", ms: 1, meta: metaOf(rows) }] });
  const v = await call({ step: "verify_evidence", state: l1.state });
  const droppedTexts = v.state.dateChecks.dropped.map((d) => d.text);
  check("market forecast to 2034 is not treated as expired", !droppedTexts.some((t) => /by 2034/.test(t)), JSON.stringify(droppedTexts));
  check("a completed event with a stale expectation attached is kept", !droppedTexts.some((t) => /Arkansas/.test(t)));
  check("relative periods ('over the next year') are not treated as expired", !droppedTexts.some((t) => /alloy sales/.test(t)));
  check("past quarter guidance (third-quarter 2026 hyphenated) still expires, as does Q2 2026", droppedTexts.some((t) => /third-quarter 2026/.test(t)) && droppedTexts.some((t) => /Q2 2026/.test(t)), JSON.stringify(droppedTexts));
}

// ---------- B: corroboration search fails -> run completes with a warning ----------
rep = await go2({ corroFails: true });
check("corroboration failure: run completes with a warning", rep.quality.warnings.some((w) => /Could not corroborate/.test(w)), rep.quality.warnings.join(" | "));

// ---------- C: verify step unavailable -> run completes, warns ----------
rep = await go2({ verifyFails: true });
check("verify step failure: run completes with a warning", rep.quality.warnings.some((w) => /Date check could not run/.test(w)) && rep.quality.dateChecks.dropped.length === 0, rep.quality.warnings.join(" | "));

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
