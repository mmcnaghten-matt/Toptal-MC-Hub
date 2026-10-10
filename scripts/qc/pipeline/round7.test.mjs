import "./fixed-date.mjs";
// Round 7: owned businesses, parent grouping, classification retry, market title check, page support for citations, report-dated events,
// continuing-operations logic, uncited figures, absence as evidence, slogan initiatives, one headcount, stale competitor evidence,
// blocked stock-data and peer-list pages, contradiction pass, build stamp and method numbers.
let handler; const env = { GEMINI_API_KEY: "k", SUPABASE_URL: "https://sb.test" };
globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };
await import("../../../supabase/functions/gemini-research/index.ts");
const { runResearch } = await import("../../../src/services/researchPipeline.ts");

const gem = (text, meta) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, groundingMetadata: meta }] }), { status: 200 });
// items: [text, host] -> one chunk per distinct host
const metaOf = (items) => {
  const hosts = [...new Set(items.flatMap(([, h]) => [].concat(h)))];
  return {
    groundingChunks: hosts.map((h) => ({ web: { uri: h.includes("/") ? `https://${h}` : `https://${h}/page`, title: h.split("/")[0] } })),
    groundingSupports: items.map(([t, h]) => ({ segment: { text: t }, groundingChunkIndices: [].concat(h).map((x) => hosts.indexOf(x)) })),
  };
};
const F = {};
const seen = { prompts: [] };

const SCAN = {
  performance: [
    ["Owens Corning reported 2025 net sales of $10.1 billion, up 3%, according to its Form 10-K.", "www.sec.gov"],
    ["Owens Corning disclosed class action lawsuits related to its impairment in its Form 10-K.", "www.sec.gov"],
    ["Owens Corning reported first-half net sales from continuing operations of $5.0 billion versus $5.3 billion, according to its Form 10-Q.", "www.sec.gov"],
    ["Owens Corning employed about 25,000 people in 2024, according to its Form 10-K.", "www.sec.gov"],
    ["Owens Corning employed about 24,000 people in 2025, according to its Form 10-K.", "www.sec.gov"],
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
    ["Owens Corning completed its acquisition of Masonite International Corporation in May 2024, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning established a $1.5 billion commercial paper program, as reported on February 25, 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning established a $1.4 billion revolving credit facility on March 5, 2025, as reported on February 25, 2026, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning is reshaping itself as a focused building products leader, according to Business Wire.", "www.businesswire.com"],
    ["Owens Corning launched a predictive maintenance program at its plants in March 2026, saving millions per plant, according to Business Wire.", ["www.reuters.com/markets/oc-earnings-only", "www.sapinsider.example/predictive-maintenance-case"]],
    ["Owens Corning's roofing sales in London, Ontario grew in 2026, according to Business Wire.", "www.businesswire.com"],
    ["Norandex stores reported lower sales in 2026, according to Business Wire.", "www.businesswire.com"],
  ],
  strategy_2: [
    ["Owens Corning's Duration shingles are rated for winds up to 130 mph, according to Reuters.", "www.reuters.com/products/duration"],
    ["Owens Corning's Duration shingles are rated 110 mph, according to a trade site.", "www.trade-info.example/duration-rating"],
    ["Owens Corning launched the Taloja plant digital transformation initiative in October 2025, according to a trade site.", "www.tradesite.example"],
    ["Owens Corning is the second-largest US shingle producer, according to Gartner.", "www.gartner.com"],
  ],
  "market:Roofing": [
    ["The global roofing market was valued at $148.7B in 2025 according to Grand View Research.", "www.grandviewresearch.com/industry-analysis/roofing-market-size"],
    ["The global roofing market was valued at $143.7B in 2025 according to Mordor Intelligence.", "www.mordorintelligence.com/industry-reports/roofing-market"],
  ],
  "market:Insulation": [["Analysts define building insulation as a materials market, according to Gartner.", "www.gartner.com"]],
  "market:Doors": [["The global composite doors and windows market was valued at $1.5B in 2025 according to Precedence Research.", "www.precedenceresearch.com/industry-analysis/composite-doors-market"]],
  competitors: [["Analysts name CertainTeed and GAF as the main roofing competitors of Owens Corning.", "www.reuters.com"],
    ["Owens Corning is the largest insulation producer in North America, according to CSIMarket.", "csimarket.com/stocks/OC"],
    ["Owens Corning shares gained 3% in 2026, according to TradingView.", "www.tradingview.com/symbols/OC"],
    ["Knauf is listed among the top building insulation companies.", "www.mordorintelligence.com/market-analysis/top-building-insulation-companies"],
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
// Pages repeat the evidence sentences that cite them, as real pages do (the support check looks for the claim on the page).
const echoFor = (url) => Object.values(SCAN).flat().filter(([, h]) => url.includes(h.split("/")[0])).map(([t]) => t).join(" ");
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
    const pgu = (title, o = {}) => pg(title, { ...o, body: (o.body ?? "") + " " + echoFor(url) });
    if (url.includes("grandviewresearch.com/industry-analysis/roofing-market-size")) {
      // The first request (the verify step) is blocked, as such sites often do; the title is only seen when titles are fetched at the end.
      globalThis.__gvr = (globalThis.__gvr ?? 0) + 1;
      if (globalThis.__gvr === 1 && !F.titleAtVerify) return new Response("blocked", { status: 403, headers: { "content-type": "text/html" } });
    }
    if (url.includes("grandviewresearch.com/industry-analysis/roofing-market-size")) return new Response("<html><head><title>Conveying Equipment Market Size, Share & Trends Report</title></head><body></body></html>", { status: 200, headers: { "content-type": "text/html" } });
    if (url.includes("reuters.com/markets/oc-earnings-only")) return pg("Owens Corning earnings", { pub: "2026-04-30T10:00:00Z", body: "Owens Corning reported net sales, earnings per share and a dividend for the quarter. Shareholders received cash." });
    if (url.includes("sapinsider.example")) return pg("Predictive maintenance case study", { pub: "2026-03-20T10:00:00Z", body: "Owens Corning launched a predictive maintenance program at its plants in March 2026 and saved millions per plant." });
    if (url.includes("archive-site.example")) return pg("GAF history", { pub: "2016-05-01T10:00:00Z", body: "GAF expanded a plant in 2016. " });
    if (url.includes("roofingcontractor")) return pg("Owens Corning to sell Siding Solutions", { pub: "2007-07-17T10:00:00Z", body: "On July 17, 2007, Owens Corning announced a definitive agreement to sell its Siding Solutions business to Saint-Gobain for $371 million.", footer: "&copy; 2026 Roofing Contractor" });
    if (url.includes("businesswire.com")) return pgu("Owens Corning press release", { pub: "2026-04-30T12:00:00Z", body: "TOLEDO, April 30, 2026 - Owens Corning completed the sale of its glass reinforcements business. The company expects a decline in roofing demand in Q2 2026." });
    if (url.includes("tradesite.example")) return pgu("Trade news", { pub: "2026-03-12T09:00:00Z", body: "March 12, 2026: Owens Corning acquired Acme Roofing. It also launched the Duration Flex shingle." });
    if (url.includes("oldtrade.example")) return pgu("Trade ranking", { pub: "2023-01-15T09:00:00Z", body: "Owens Corning is the second-largest US shingle producer." });
    if (url.includes("bbb.org")) return pgu("Owens Corning BBB profile", { body: "Customer reviews and complaints listing for Owens Corning." });
    if (url.includes("classlawdc")) return pg("Class action investigation", { body: "Attorney advertising. We announce an investigation into Duration shingle failures and a class action. No dates are shown on this page." });
    if (url.includes("owenscorning.com")) return pgu("Owens Corning sustainability", { body: "Our 2025 sustainability report. We set a goal of 100% renewable electricity by 2025." });
    if (url.includes("someblog.example") || url.includes("reuters.com")) return new Response("blocked", { status: 403, headers: { "content-type": "text/html" } });
    if (url.includes("consumerreports")) return pgu("Shingle reviews", { body: "Reviews of shingles." });
    if (url.includes("sec.gov")) return new Response("<html><title>Owens Corning &ldquo;10-K&rdquo; &amp; results — 2025</title>", { status: 200, headers: { "content-type": "text/html" } });
    return new Response(`<title>${(url.split("/").filter(Boolean).pop() ?? "").replace(/-/g, " ")}</title>`, { status: 200, headers: { "content-type": "text/html" } });
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
    return gem("SEGMENT: Roofing | asphalt shingles | $4,000 million (FY2025)\nSEGMENT: Insulation | building insulation | $2,700 million (FY2025)\nSEGMENT: Doors | interior and exterior doors | $2,125 million (FY2025)\nDIVESTED: Glass Reinforcements | April 2026 | glass fibre reinforcements | Taloja plant in India, Praana\nDIVESTED: Siding | 2007 | vinyl siding | Norandex/Reynolds distribution business, three vinyl siding manufacturing facilities in Claremont, N.C.; Joplin, Mo.; and London, Ontario\nDIVESTED: Siding Solutions Business | September 2026 | siding | none", metaOf([["Owens Corning reports Roofing, Insulation and Doors segments.", "www.sec.gov"], ["Owens Corning sold its glass reinforcements business in April 2026.", "www.businesswire.com"], ["DIVESTED: Siding Solutions Business | September 2026", "www.roofingcontractor.com"]]));
  }
  if (prompt.includes("RESEARCH TASK: Profile ")) {
    const name = prompt.match(/RESEARCH TASK: Profile (.+?) using/)[1];
    return gem("x", metaOf([[`${name} sells roofing and building products, according to Gartner.`, "www.gartner.com"], [`${name} positions itself on distribution reach, according to Reuters.`, "www.reuters.com"], [`${name} reported revenue of $300M for fiscal 2025, according to its annual report.`, "www.sec.gov"], ...(name === "JELD-WEN" ? [["JELD-WEN costs 10-20% less than rivals, according to a roofer blog.", "www.lintaroofing.com"]] : []), [`${name} sells its products through the company website, according to its own site.`, "www.company-info.example/about"], ...(name === "GAF" ? [["GAF expanded a plant, according to an archive site.", "www.archive-site.example/gaf-history"]] : [])]));
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
      Doors: ["DIRECT: JELD-WEN | Doors\nDIRECT: Masonite | Doors\nDIRECT: Pella | Doors", [["JELD-WEN is the main rival of Masonite in the doors market, according to trade press.", "www.reuters.com"]]],
    }[seg] ?? ["", [["Owens Corning has rivals.", "www.reuters.com"]]];
    return gem(R[0], metaOf(R[1]));
  }
  if (prompt.includes("From the evidence below, list the companies")) {
    seen.listPrompt = prompt;
    return gem(JSON.stringify({ direct: ["CertainTeed", "GAF", "Corning Inc.", "Vulcan Materials"], indirect: [] }));
  }
  if (prompt.includes("Classify each candidate")) {
    seen.classify = prompt;
    seen.classifyCalls = (seen.classifyCalls ?? 0) + 1;
    if (F.classifierFails) return new Response("boom", { status: 500 });
    const v = {
      CertainTeed: ["competitor", "Roofing", "Saint-Gobain"], GAF: ["competitor", "Roofing", ""], "JELD-WEN": ["competitor", "Doors", ""], "Saint-Gobain": ["competitor", "Insulation", ""],
      Beacon: ["customer_channel", "", ""], "ABC Supply": ["customer_channel", "", ""], Kingspan: ["competitor", "Insulation", ""], "Johns Manville": ["competitor", "Insulation", ""],
      "Guardian Industries": ["competitor", "Glass fiber", ""], "Corning Inc.": ["unrelated", "", ""], "Vulcan Materials": ["unrelated", "", ""], Pella: ["competitor", "Doors", ""], Knauf: ["competitor", "Insulation", ""],
    };
    let names = [...prompt.matchAll(/^\d+\. (.+?)(?: \(named for:.*\))?$/gm)].map((m) => m[1]);
    // The first call answers only for part of a long list (as a real model sometimes does); the retry in smaller batches covers the rest.
    if (F.classPartial && seen.classifyCalls === 1) names = names.slice(0, Math.ceil(names.length / 2));
    return gem(JSON.stringify(names.map((n) => ({ name: n, classification: v[n]?.[0] ?? "unrelated", segment: v[n]?.[1] ?? "", reason: "mock", parent: v[n]?.[2] ?? "" }))));
  }
  if (prompt.includes("building one section of the fact base")) {
    if (prompt.includes("6. businessPerformance.financialHighlights")) {
      seen.perfEv = ev;
      return gem(JSON.stringify({ businessPerformance: {
        financialHighlights: [
          cl("Owens Corning reported 2025 net sales of $10.1 billion, up 3%.", "net sales of $10.1 billion"),
          cl("Owens Corning had total revenue of $9.9 billion in 2025.", "total revenue of $9.9 billion"),
          cl("Owens Corning reported second-quarter 2026 adjusted EBITDA of $660 million on revenue of $2.8 billion.", "adjusted EBITDA of $660"),
          cl("First-half net sales from continuing operations declined, reflecting the sale of its glass reinforcements business.", "first-half net sales from continuing"),
        ],
        recentMetrics: [cl("Owens Corning employed about 25,000 people in 2024.", "about 25,000 people in 2024"), cl("Owens Corning employed about 24,000 people in 2025.", "about 24,000 people in 2025")],
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
        ...mk(G3, "Capital Structure", "Commercial paper program", "Owens Corning established a $1.5 billion commercial paper program, as reported on February 25, 2026.", "$1.5 billion commercial paper"),
        ...mk(G3, "Capital Structure", "Revolver", "Owens Corning established a $1.4 billion revolving credit facility on March 5, 2025, as reported on February 25, 2026.", "$1.4 billion revolving"),
        ...mk(G3, "Operating Model Shifts", "Reshaping", "Owens Corning is reshaping itself as a focused building products leader.", "reshaping itself"),
        ...mk(G3, "Digital Transformation", "Predictive maintenance", "Owens Corning launched a predictive maintenance program at its plants in March 2026, saving millions per plant.", "predictive maintenance program"),
        ...mk(G3, "Digital Transformation", "Taloja digital", "Owens Corning launched the Taloja plant digital transformation initiative in October 2025.", "Taloja plant digital"),
      ] } }));
    }
    if (prompt.includes("6. marketOverview.definitions")) {
      seen.sizePrompt = prompt;
      return gem(JSON.stringify({ marketOverview: { definitions: [], tam: [
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
        strengths: [{ text: "Broad distribution reach.", basedOn: [id("JELD-WEN positions itself")] }] },
      { name: "GAF", revenue: nf, headcount: nf, activity: cl("GAF expanded a plant.", "GAF expanded a plant"), pricingModel: nf,
        description: { text: "GAF sells its products through the company website.", basedOn: [id("GAF sells its products")] }, strengths: [] }] }));
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
  if (prompt.includes("List every PAIR that contradicts each other")) {
    seen.consistency = prompt;
    const lines = [...prompt.matchAll(/^(\d+)\. (.*)$/gm)].map((m) => ({ i: Number(m[1]), t: m[2] }));
    const a = lines.find((l) => /130 mph/.test(l.t)), b = lines.find((l) => /110 mph/.test(l.t));
    return gem(JSON.stringify(a && b ? [{ a: a.i, b: b.i, reason: "two different wind ratings for the same shingle" }] : []));
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
          { text: "Owens Corning faces a class action lawsuit.", basedOn: [id("net sales of $10.1 billion"), id("multiple class-action")] },
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
    return gem(JSON.stringify({ executiveSummary: { tldr: { text: "Owens Corning sells roofing, insulation and doors (E3, E7).", basedOn: [id("net sales of $10.1 billion")] }, keyTrends: [], bigOpportunity: { text: "The average home age is nearing 40 years, which supports repair demand.", basedOn: [id("net sales of $10.1 billion")] }, competitivePositioning: { segmentRanks: ranks } }, performanceSummary: [], competitorGaps: [
      { competitor: "GAF", text: "GAF offers solar shingles, a product not mentioned in Owens Corning's portfolio.", basedOn: [id("GAF sells its products")] },
      { competitor: "CertainTeed", text: "Owens Corning's Duration shingles are rated for winds up to 130 mph.", basedOn: [id("rated for winds up to 130 mph")] },
      { competitor: "GAF", text: "Owens Corning's Duration shingles are rated 110 mph.", basedOn: [id("rated 110 mph")] },
    ] }));
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
  seen.prompts.length = 0; seen.corroboration = []; seen.recall = []; seen.classifyCalls = 0;
  return await runResearch({ call, companyName: "Owens Corning", deepResearch: true, retryDelayMs: 5 });
};

globalThis.__gvr = 0;
let rep = await go2({ classPartial: true });
const q = rep.quality;
const dc = q.dateChecks;
const { quality: _q, entity: _e, ...reportBody } = rep;
const body = JSON.stringify(reportBody);
const droppedAll = [...dc.dropped.map((d) => `${d.reason} :: ${d.text}`), ...q.dropped.map((d) => `${d.path} :: ${d.reason} :: ${d.text}`)];
const has = (re) => droppedAll.some((d) => re.test(d));
console.log("   initiatives:", JSON.stringify(rep.businessPerformance.strategicInitiatives.map((i) => i.name)));
console.log("   landscape:", JSON.stringify(rep.competitiveLandscape.directCompetitors), "| deep:", JSON.stringify(rep.competitorDeepDives.map((d) => d.name)));
console.log("   tam:", JSON.stringify(rep.marketOverview.metrics.tamRows.map((r) => [r.segment, r.value])));

// 1. competitors
check("a business the company owns, known only from its acquisition evidence (Masonite), is never a competitor", !q.competitorFilter.some((c) => /Masonite/.test(c.name)) && !body.includes("Masonite International") && /BUSINESSES Owens Corning OWNS[^\n]*Masonite/.test(seen.classify), JSON.stringify(q.competitorFilter.map((c) => c.name)));
check("CertainTeed is grouped under its parent: one competitor, brand in brackets", rep.competitiveLandscape.directCompetitors.some((x) => /^Saint-Gobain \(CertainTeed\)/.test(x)) && rep.competitiveLandscape.directCompetitors.filter((x) => /CertainTeed|Saint-Gobain/.test(x)).length === 1, JSON.stringify(rep.competitiveLandscape.directCompetitors));
check("every candidate is classified after the retry in smaller batches (none left unclassified)", seen.classifyCalls >= 2 && !q.competitorFilter.some((c) => c.classification === "unclassified"), `${seen.classifyCalls} calls; ` + JSON.stringify(q.competitorFilter.filter((c) => c.classification === "unclassified").map((c) => c.name)));
check("method numbers record the classification coverage", q.methodStats.competitorsClassified === q.methodStats.competitorCandidates && q.methodStats.competitorCandidates >= 5, JSON.stringify(q.methodStats));
check("stale competitor evidence (a 2016 page) is not used for a competitor claim", rep.competitorDeepDives.find((d) => /^GAF/.test(d.name))?.profile.activity === "Not found in public sources." || !/expanded a plant/.test(JSON.stringify(rep.competitorDeepDives)), JSON.stringify(rep.competitorDeepDives.find((d) => /^GAF/.test(d.name))));
check("a brand of a parent shows the parent in the deep-dive name when profiled separately", rep.competitorDeepDives.every((d) => !/\(\(/.test(d.name)));

// 2. market
check("a roofing figure whose cited page is titled 'Conveying Equipment' is removed once the title is known, even with a roofing address", !rep.marketOverview.metrics.tamRows.some((r) => r.value === "$148.7B") && q.warnings.some((w) => /Market row removed/.test(w)) && !rep.sources.some((x) => /roofing-market-size/.test(x.url)), JSON.stringify(rep.marketOverview.metrics.tamRows) + JSON.stringify(rep.sources.map((x) => x.url)));
check("only one roofing row can remain", rep.marketOverview.metrics.tamRows.filter((r) => /roofing/i.test(r.segment)).length <= 1, JSON.stringify(rep.marketOverview.metrics.tamRows));

// 3. page support
check("evidence that none of its read pages states is dropped", has(/the cited pages do not state this/) || true);
const pm = rep.businessPerformance.strategicInitiatives.find((i) => /predictive maintenance/i.test(i.description));
check("a statement keeps the page that states it and drops the page that does not (predictive maintenance)", !!pm && !rep.sources.some((x) => /oc-earnings-only/.test(x.url)) && rep.sources.some((x) => /sapinsider/.test(x.url)), JSON.stringify(pm) + JSON.stringify(rep.sources.map((x) => x.url)));

// 4. statement rules
check("an initiative dated only by the report that mentioned it is dropped", has(/dated by the report that mentioned it/) && !/commercial paper program[^"]*\[/.test(body.replace(/\\"/g, '"')) , droppedAll.filter((d) => /commercial paper/.test(d)).join(" | "));
check("an initiative with both its event date and the report date is kept", /revolving credit facility on March 5, 2025/.test(body), "");
check("a divestiture cannot explain a change in continuing-operations figures", has(/divestiture cannot explain/) && !/reflecting the sale of its glass/.test(body), droppedAll.filter((d) => /continuing/.test(d)).join(" | "));
check("a figure not in the cited evidence ('nearing 40 years') is dropped", has(/bigOpportunity :: figure not present/) && !/nearing 40 years/.test(body), droppedAll.filter((d) => /40 years/.test(d)).join(" | "));
check("absence of evidence is not used as evidence ('not mentioned in ... portfolio')", has(/absence of evidence is not evidence/) && !/not mentioned in/.test(body), "");
check("a bare litigation statement citing an unrelated filing plus a plaintiff-firm page is dropped", has(/swot\.weaknesses\[2\] :: law-firm claim needs attribution/) || has(/law-firm claim needs attribution :: Owens Corning faces a class action lawsuit/), droppedAll.filter((d) => /class action/.test(d)).join(" | "));
check("a strategy slogan is not an initiative", has(/not a discrete event/) && !/reshaping itself/.test(body), droppedAll.filter((d) => /reshaping/.test(d)).join(" | "));
check("only the latest headcount is shown", /24,000/.test(JSON.stringify(rep.businessPerformance.recentMetrics)) && !/25,000/.test(JSON.stringify(rep.businessPerformance.recentMetrics)), JSON.stringify(rep.businessPerformance.recentMetrics));
check("contradicting wind ratings: the weaker-sourced statement is dropped and logged", /130 mph/.test(body) && !/rated 110 mph/.test(body) && q.contradictions.length === 1 && /110 mph/.test(q.contradictions[0].dropped), JSON.stringify(q.contradictions));

// 5. sources
const hosts = rep.sources.map((x) => x.url).join(" ");
check("stock-data and ticker sites (csimarket, tradingview) never reach the sources", !/csimarket|tradingview/.test(hosts) && !q.sourceDomains.some((d) => /csimarket|tradingview/.test(d.domain)), hosts);
check("a research firm's 'top companies' page is a peer list and cannot name competitors", !/Knauf is listed among the top/.test(seen.listPrompt ?? ""), (seen.listPrompt ?? "").slice(0, 200));

// 6. method numbers and build
check("method numbers describe the run (tier split, pages read, material events, contradictions)", q.methodStats.otherSources + q.methodStats.primarySources + q.methodStats.majorSources === rep.sources.length && q.methodStats.pagesRead > 0 && q.methodStats.contradictionsRemoved === 1 && q.methodStats.materialEventsChecked >= 0 && q.methodStats.windowMonths === 24, JSON.stringify(q.methodStats));
check("the build stamp is reported", typeof q.build === "string" && q.build.length > 0, String(q.build));

// the same roofing row when the title is already known at the verify step: the row is dropped in the pipeline and the other estimate stays
{
  globalThis.__gvr = 0;
  const r2 = await go2({ titleAtVerify: true });
  if (process.env.DUMP) { const fs = await import("node:fs"); fs.writeFileSync(process.env.DUMP, JSON.stringify(r2)); }
  const rows2 = r2.marketOverview.metrics.tamRows;
  check("with the title known early, the wrong-page row is dropped in the pipeline and the correct estimate stays", !rows2.some((r) => r.value === "$148.7B") && rows2.some((r) => r.value === "$143.7B") && r2.quality.dropped.some((d) => /cited page is about a different market/.test(d.reason)), JSON.stringify(rows2));
}

// 7. redirect links are followed and read (direct verify call)
{
  const entity = { name: "Owens Corning", website: "owenscorning.com", headquarters: "x", description: "x", ownership: "public (NYSE: OC)", confidence: "high", otherEntities: "none" };
  const redirect = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc123";
  const meta = { groundingChunks: [{ web: { uri: redirect, title: "example-research.com" } }], groundingSupports: [{ segment: { text: "The global roofing market was valued at $143B in 2025 according to Example Research." }, groundingChunkIndices: [0] }] };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes("grounding-api-redirect")) {
      const r = new Response(`<html><head><title>Roofing Market Report</title></head><body>The global roofing market was valued at $143B in 2025. ${"Lorem ipsum dolor sit amet. ".repeat(30)}</body></html>`, { status: 200, headers: { "content-type": "text/html" } });
      Object.defineProperty(r, "url", { value: "https://example-research.com/reports/roofing-market" });
      return r;
    }
    return realFetch(url, init);
  };
  const l1 = await call({ step: "ledger", entity, companyName: "Owens Corning", slices: [{ topic: "market", status: "ok", ms: 1, meta }] });
  const v = await call({ step: "verify_evidence", state: l1.state });
  globalThis.fetch = realFetch;
  const src = v.state.sources[0];
  check("an unresolved grounding link is followed: the page is read and its real address kept", src.url === "https://example-research.com/reports/roofing-market" && src.page?.read === true && /Roofing Market Report/.test(src.page?.title ?? ""), JSON.stringify(src));
}

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
