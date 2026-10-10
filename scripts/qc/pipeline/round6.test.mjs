import "./fixed-date.mjs";
// Round 6: sold-business footprint, market sanity checks, competitor merging, rank-based positioning, litigation and materiality rules.
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
    ["Owens Corning disclosed class action lawsuits related to its impairment in its Form 10-K.", "www.sec.gov"],
    ["Owens Corning had total revenue of $9.9 billion in 2025, according to Reuters.", "www.reuters.com"],
  ],
  strategy_1: [
    ["Owens Corning agreed to sell its Siding Solutions business to Saint-Gobain for $371 million on July 17, 2026, according to Roofing Contractor.", "www.roofingcontractor.com"],
    ["Owens Corning completed the sale of its glass reinforcements business, including the Taloja plant in India, on April 30, 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning appointed Collins as chief financial officer effective August 10, 2026, according to Reuters.", "www.reuters.com"],
    ["Owens Corning closed its Walkerton, Indiana doors plant in September 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning is laying off employees at its Walkerton, Indiana doors plant in September 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning's board elected Brian DeVito as chair in March 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning launched the Evergreen Mist shingle color in March 2026, according to Business Wire.", "www.businesswire.com"],
  ],
  strategy_2: [
    ["Owens Corning launched the Taloja plant digital transformation initiative in October 2025, according to a trade site.", "www.tradesite.example"],
    ["Owens Corning is the second-largest US shingle producer, according to Gartner.", "www.gartner.com"],
  ],
  "market:Roofing": [
    ["The global roofing market was valued at $148.7B in 2025 according to Grand View Research.", "www.grandviewresearch.com/industry-analysis/conveying-equipment-market"],
    ["The global roofing market was valued at $143.7B in 2025 according to Mordor Intelligence.", "www.mordorintelligence.com/industry-reports/roofing-market"],
  ],
  "market:Insulation": [["Analysts define building insulation as a materials market, according to Gartner.", "www.gartner.com"]],
  "market:Doors": [["The global composite doors and windows market was valued at $1.5B in 2025 according to Precedence Research.", "www.precedenceresearch.com/industry-analysis/composite-doors-market"]],
  competitors: [["Analysts name CertainTeed and GAF as the main roofing competitors of Owens Corning.", "www.reuters.com"],
    ["Corning Inc. is listed as a competitor of Owens Corning according to Comparably.", "comparably.com"],
    ["Owens Corning is ranked against rivals on Owler.", "www.owler.com"]],
  customer_praise: [
    ["Reviewers on Consumer Reports rate Owens Corning shingles and vinyl siding highly for durability.", "www.consumerreports.org"],
    ["Reviewers on Trustpilot praise Owens Corning installers for fast service.", "www.trustpilot.com"],
  ],
  customer_complaints: [
    ["Owens Corning has received 48 complaints on the Better Business Bureau as of July 2026.", "www.bbb.org"],
    ["Owens Corning is subject to multiple class-action lawsuits over its impairment disclosures.", "www.zlk.com"],
    ["A law firm announced a class action investigation into Duration shingle failures.", "www.classlawdc.com"],
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
    if (url.includes("bbb.org")) return pg("Owens Corning BBB profile", { body: "Customer reviews and complaints listing for Owens Corning." });
    if (url.includes("classlawdc")) return pg("Class action investigation", { body: "Attorney advertising. We are investigating claims. No dates are shown on this page." });
    if (url.includes("owenscorning.com")) return pg("Owens Corning sustainability", { body: "Our 2025 sustainability report. We set a goal of 100% renewable electricity by 2025." });
    if (url.includes("someblog.example") || url.includes("reuters.com")) return new Response("blocked", { status: 403, headers: { "content-type": "text/html" } });
    if (url.includes("consumerreports")) return pg("Shingle reviews", { body: "Reviews of shingles." });
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
    return gem("SEGMENT: Roofing | asphalt shingles | $4,000 million (FY2025)\nSEGMENT: Insulation | building insulation | $2,700 million (FY2025)\nSEGMENT: Doors | Masonite interior and exterior doors | $2,125 million (FY2025)\nDIVESTED: Glass Reinforcements | April 2026 | glass fibre reinforcements | Taloja plant in India, Praana\nDIVESTED: Siding | 2007 | vinyl siding | Norandex, Reynolds\nDIVESTED: Siding Solutions Business | September 2026 | siding | none", metaOf([["Owens Corning reports Roofing, Insulation and Doors segments.", "www.sec.gov"], ["Owens Corning sold its glass reinforcements business in April 2026.", "www.businesswire.com"], ["DIVESTED: Siding Solutions Business | September 2026", "www.roofingcontractor.com"]]));
  }
  if (prompt.includes("RESEARCH TASK: Profile ")) {
    const name = prompt.match(/RESEARCH TASK: Profile (.+?) using/)[1];
    return gem("x", metaOf([[`${name} sells roofing and building products, according to Gartner.`, "www.gartner.com"], [`${name} positions itself on distribution reach, according to Reuters.`, "www.reuters.com"], [`${name} reported revenue of $300M for fiscal 2025, according to its annual report.`, "www.sec.gov"], ...(name === "JELD-WEN" ? [["JELD-WEN costs 10-20% less than rivals, according to a roofer blog.", "www.lintaroofing.com"]] : [])]));
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
      const G3 = "Operational Transformation & Technology", G4 = "Organizational & Leadership Dynamics";
      return gem(JSON.stringify({ businessPerformance: { strategicInitiatives: [
        ...mk(G1, "Divestitures & Spinoffs", "Siding sale", "Owens Corning agreed to sell its Siding Solutions business to Saint-Gobain for $371 million on July 17, 2026.", "Siding Solutions"),
        ...mk(G1, "Divestitures & Spinoffs", "Glass sale", "Owens Corning completed the sale of its glass reinforcements business, including the Taloja plant in India, on April 30, 2026.", "completed the sale of its glass"),
        ...mk(G4, "C-Suite & Board Transitions", "Collins was appointed", "Owens Corning appointed Collins as chief financial officer effective August 10, 2026.", "Collins"),
        ...mk(G4, "C-Suite & Board Transitions", "Election of DeVito", "Owens Corning's board elected Brian DeVito as chair in March 2026.", "Brian DeVito"),
        ...mk(G3, "Cost Optimization", "Walkerton closure", "Owens Corning closed its Walkerton, Indiana doors plant in September 2026.", "closed its Walkerton"),
        ...mk(G4, "Workforce Restructuring", "Walkerton layoffs", "Owens Corning is laying off employees at its Walkerton, Indiana doors plant in September 2026.", "laying off employees"),
        ...mk(G2, "Product & Service Launches", "Evergreen Mist", "Owens Corning launched the Evergreen Mist shingle color in March 2026.", "Evergreen Mist"),
        ...mk(G3, "Digital Transformation", "Taloja digital", "Owens Corning launched the Taloja plant digital transformation initiative in October 2025.", "Taloja plant digital"),
      ] } }));
    }
    if (prompt.includes("6. marketOverview.definition")) {
      seen.sizePrompt = prompt;
      return gem(JSON.stringify({ marketOverview: { definition: null, tam: [
        { segment: "roofing", geography: "Global", year: 2025, value: "$148.7B", publisher: "Grand View Research", evidenceIds: [id("$148.7B")] },
        { segment: "roofing", geography: "Global", year: 2025, value: "$143.7B", publisher: "Mordor Intelligence", evidenceIds: [id("$143.7B")] },
        { segment: "Composite doors and windows", geography: "Global", year: 2025, value: "$1.5B", publisher: "Precedence Research", evidenceIds: [id("$1.5B")] },
      ] } }));
    }
    if (prompt.includes("6. drivers:")) return gem(JSON.stringify({ marketOverview: { segmentation: [], drivers: [], inhibitors: [] } }));
    if (prompt.includes("6. competitiveLandscape")) {
      seen.compPrompt = prompt; seen.compEv = ev;
      return gem(JSON.stringify({ competitiveLandscape: { directCompetitors: [{ name: "Corning Inc.", evidenceIds: [id("Corning Inc.")] }], indirectCompetitors: [], potentialEntrants: [] }, competitorDeepDives: [{ name: "JELD-WEN", revenue: nf, headcount: nf, activity: nf,
        pricingModel: cl("JELD-WEN costs 10-20% less than rivals.", "costs 10-20% less"),
        description: { text: "JELD-WEN is the main rival of Masonite in doors.", basedOn: [id("main rival of Masonite")] },
        strengths: [{ text: "Broad distribution reach.", basedOn: [id("JELD-WEN positions itself")] }] }] }));
    }
    if (prompt.includes("6. customerInsights")) {
      seen.custEv = ev;
      const c = (t, k) => (id(k) ? [cl(t, k)] : []);
      return gem(JSON.stringify({ customerInsights: {
        sentiment: nf, sentimentThemes: [],
        winReasons: [...c("**Durability:** Consumer Reports reviewers praise shingles and vinyl siding for durability.", "vinyl siding"), ...c("**Service:** Trustpilot reviewers praise installers.", "Trustpilot")],
        lossReasons: [
          ...c("**Complaints volume:** Owens Corning has received 48 complaints on the Better Business Bureau as of July 2026.", "48 complaints"),
          ...c("**Litigation:** Owens Corning is subject to multiple class-action lawsuits over its impairment disclosures.", "multiple class-action"),
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
  if (prompt.includes("mcOpportunities:")) return gem(JSON.stringify({ recommendations: { product: [{ text: "Amplify the Shingle Color of the Year campaign.", basedOn: [id("Evergreen Mist") || 1] }, { text: "Expand installer training to protect warranty outcomes.", basedOn: [id("Trustpilot") || 1] }], marketing: [], resourceAllocation: null, roadmap: null }, mcOpportunities: [] }));
  if (prompt.includes("3. swot:")) {
    seen.frameworkPrompt = prompt;
    return gem(JSON.stringify({
      swot: {
        strengths: [], opportunities: [], threats: [],
        weaknesses: [
          { text: "Owens Corning is subject to multiple class-action lawsuits.", basedOn: [id("multiple class-action")] },
          { text: "Owens Corning is subject to class action lawsuits related to its impairment.", basedOn: [id("class action lawsuits related to its impairment"), id("multiple class-action")] },
        ],
      },
      portersFiveForces: { buyerPower: null, supplierPower: null, competitiveRivalry: null, threatOfSubstitution: null, threatOfNewEntry: null },
      pestle: { political: null, economic: null, social: null, technological: null, legal: null, environmental: null },
    }));
  }
  if (prompt.includes("executiveSummary.tldr")) {
    seen.corePrompt = prompt;
    const ranks = F.badRank
      ? [{ segment: "Roofing", rank: 1, basis: "Owens Corning is the second-largest US shingle producer.", basedOn: [id("second-largest")] }]
      : [{ segment: "roofing", rank: 2, basis: "Owens Corning is the second-largest US shingle producer.", basedOn: [id("second-largest")] }];
    return gem(JSON.stringify({ executiveSummary: { tldr: { text: "Owens Corning sells roofing, insulation and doors (E3, E7).", basedOn: [id("net sales of $10.1 billion")] }, keyTrends: [], competitivePositioning: { segmentRanks: ranks }, bigOpportunity: null }, performanceSummary: [], competitorGaps: [] }));
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
  seen.prompts.length = 0; seen.corroboration = []; seen.recall = [];
  return await runResearch({ call, companyName: "Owens Corning", deepResearch: true, retryDelayMs: 5 });
};
let rep = await go2();
const q = rep.quality;
if (process.env.DUMP) { const fs = await import("node:fs"); fs.writeFileSync(process.env.DUMP, JSON.stringify(rep)); }
const dc = q.dateChecks;
const { quality: _q, entity: _e, ...reportBody } = rep;
const body = JSON.stringify(reportBody);
const droppedAll = [...dc.dropped.map((d) => `${d.reason} :: ${d.text}`), ...q.dropped.map((d) => `${d.path} :: ${d.reason} :: ${d.text}`)];
const has = (re) => droppedAll.some((d) => re.test(d));
console.log("   initiatives:", JSON.stringify(rep.businessPerformance.strategicInitiatives.map((i) => i.name)));
console.log("   tam:", JSON.stringify(rep.marketOverview.metrics.tamRows.map((r) => [r.segment, r.value])));
console.log("   position:", rep.executiveSummary.competitivePositioning, "|", rep.executiveSummary.positioningRationale);

// 1.2 sold-business footprint
check("plant of a sold business (Taloja) is not offered as a current initiative", has(/refers to a business the company has sold :: .*Taloja plant digital/) && !/Taloja plant digital/.test(body), droppedAll.filter((d) => /Taloja/.test(d)).join(" | "));
check("the sale itself (naming the Taloja plant) is kept", /glass reinforcements business, including the Taloja plant/.test(JSON.stringify(rep.businessPerformance.strategicInitiatives)));
check("an older sold product (vinyl siding) never reaches praise", !seen.custEv.some((e) => /vinyl siding/.test(e.text)) && !/vinyl siding/.test(body), "");
// 1.3 hygiene
check("evidence ids are stripped from client text", !/\(E\d+/.test(body) && /Owens Corning sells roofing, insulation and doors\./.test(body), (body.match(/.{30}\(E\d.{20}/) ?? [])[0]);
check("leadership headings carry the full name", rep.businessPerformance.strategicInitiatives.every((i) => !/^(Election of DeVito|Collins was appointed)$/.test(i.name)) && rep.businessPerformance.strategicInitiatives.some((i) => /Brian DeVito/.test(i.name)), JSON.stringify(rep.businessPerformance.strategicInitiatives.map((i) => i.name)));
// 1.4 market
const rows = rep.marketOverview.metrics.tamRows;
check("market smaller than the company's own sales in it is dropped (Doors $1.5B vs $2,125M)", has(/market smaller than the company's own sales/) && !rows.some((r) => /door/i.test(r.segment)), JSON.stringify(rows));
check("a market page about a different market (conveying equipment) is dropped", has(/cited page is about a different market/), droppedAll.join(" | "));
check("roofing appears once, with the company's capitalisation", rows.filter((r) => /roofing/i.test(r.segment)).length === 1 && rows[0].segment === "Roofing" && rows[0].value === "$143.7B", JSON.stringify(rows));
// 1.5 competitors
const hosts = rep.sources.map((s) => s.url).join(" ");
check("blocked domains never reach the sources (owler, comparably, indeed)", !/owler|comparably|indeed/.test(hosts) && !q.sourceDomains.some((d) => /owler|comparably|indeed/.test(d.domain)), hosts);
const jw = rep.competitorDeepDives.find((d) => d.name === "JELD-WEN");
check("competitor pricing resting on a roofer blog is dropped, a T2-backed strength is kept", !!jw && !/10-20%/.test(JSON.stringify(jw)) && jw.strengths.some((x) => /distribution reach/.test(x)), JSON.stringify(jw));
// 1.6 positioning
check("positioning derived from explicit rank evidence, with its segment", rep.executiveSummary.competitivePositioning === "Challenger in Roofing" && /second-largest/.test(rep.executiveSummary.positioningRationale), rep.executiveSummary.competitivePositioning);
const label1 = rep.executiveSummary.competitivePositioning;
// 1.7 litigation
check("litigation statement resting on a plaintiff-firm page alone is dropped", has(/law-firm claim needs attribution :: .*multiple class-action lawsuits over its impairment/) && !/multiple class-action lawsuits over its impairment/.test(body), droppedAll.filter((d) => /class-action/.test(d)).join(" | "));
check("the same litigation with a 10-K alongside is kept; the bare SWOT claim is dropped", /related to its impairment/.test(JSON.stringify(rep.strategicFrameworks.swot)) && !/multiple class-action lawsuits\./.test(JSON.stringify(rep.strategicFrameworks.swot)), JSON.stringify(rep.strategicFrameworks.swot.weaknesses));
check("a law firm's announcement is kept when worded as one", /A law firm announced a class action investigation/.test(rep.customerInsights.winLossReasons));
// 1.8 materiality, dedupe
check("colour launch is not an initiative; 'Color of the Year' recommendation is dropped", has(/colour, SKU, award or report publication/) && !/Evergreen Mist|Color of the Year/.test(body), droppedAll.filter((d) => /colo/i.test(d)).join(" | "));
check("a useful recommendation survives", /Expand installer training/.test(JSON.stringify(rep.recommendations)), JSON.stringify(rep.recommendations.product));
const wk = rep.businessPerformance.strategicInitiatives.filter((i) => /Walkerton/.test(i.name + i.description));
check("the same Walkerton event under two themes is one initiative", wk.length === 1 && has(/same event reported under another theme/), JSON.stringify(wk));
// 1.1 date check
check("BBB listing (readable, no date) is kept", /48 complaints on the Better Business Bureau/.test(rep.customerInsights.winLossReasons), rep.customerInsights.winLossReasons);
check("per-topic drop counts are logged", dc.byTopic && Object.keys(dc.byTopic).length > 0, JSON.stringify(dc.byTopic));
// quality additions
check("method stats and cited-domain list are in the report quality", typeof q.methodStats?.evidenceFound === "number" && q.methodStats.evidenceUsed > 0 && Array.isArray(q.sourceDomains) && q.sourceDomains.length > 0, JSON.stringify(q.methodStats));
// stable label
rep = await go2();
check("the same evidence gives the same label on a second run", rep.executiveSummary.competitivePositioning === label1, rep.executiveSummary.competitivePositioning);
// rank not stated
rep = await go2({ badRank: true });
check("a rank the cited evidence does not state is dropped (label stays 'Insufficient evidence')", rep.executiveSummary.competitivePositioning === "Insufficient evidence" && rep.quality.dropped.some((d) => /rank not stated/.test(d.reason)), rep.executiveSummary.competitivePositioning);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
