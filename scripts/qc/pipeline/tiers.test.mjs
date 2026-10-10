import "./fixed-date.mjs";
// Source tiers, excluded domains, citation cap and financial-statement rules, straight against the function.
let handler; const env={GEMINI_API_KEY:"k",SUPABASE_URL:"https://sb.test",SOURCE_DENYLIST:"blocked-example.com"};
globalThis.Deno={env:{get:k=>env[k]},serve:(h)=>{handler=h}};
await import("../../../supabase/functions/gemini-research/index.ts");
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json"}});
let verifyPrompts=[];
globalThis.fetch=async(url,init)=>{
  url=String(url);
  if(url.includes("/auth/v1/user")) return json({email:"matt@toptal.com"});
  if(url.includes("generativelanguage")){ const p=JSON.parse(init.body).contents[0].parts[0].text;
    if(p.includes("For each numbered CLAIM")){ verifyPrompts.push(p); const n=[...p.matchAll(/^CLAIM (\d+): (.*)$/gm)]; return json({candidates:[{content:{parts:[{text:JSON.stringify(n.map(m=>({index:Number(m[1]),verdict:/Kingspan synergy/.test(m[2])?"unsupported":"supported"})))}]}}]}); }
    if(p.includes("building one section of the fact base")){ return json({candidates:[{content:{parts:[{text:JSON.stringify({businessPerformance:{financialHighlights:[
      {text:"Owens Corning reported 2025 net sales from continuing operations of $10.1 billion, up 3%.",status:"sourced",evidenceIds:[1]},
      {text:"Revenue fell 9.49% to $9.85B in the 12 months ending June 2026.",status:"sourced",evidenceIds:[2]}],recentMetrics:[
      {text:"Owens Corning has about 25,304 employees.",status:"sourced",evidenceIds:[5]}]}})}]}}]}); }
    throw new Error("unmocked gemini "+p.slice(0,60)); }
  // page-title fetches
  if(url.startsWith("https://www.sec.gov/")) return new Response("<html><head><title>Owens Corning 8-K &amp; results</title></head>",{status:200,headers:{"content-type":"text/html"}});
  if(url.startsWith("https://www.reuters.com/")) return new Response("blocked",{status:403,headers:{"content-type":"text/html"}});
  if(url.startsWith("https://www.randomblog.example/")) return new Response("<title>Just a moment...</title>",{status:200,headers:{"content-type":"text/html"}});
  return new Response("<title>Fallback Page Title</title>",{status:200,headers:{"content-type":"text/html"}});
};
const post=(b)=>handler(new Request("http://x/",{method:"POST",body:JSON.stringify(b),headers:{"content-type":"application/json",authorization:"Bearer u",apikey:"pk"}}));
const chunk=(uri,title)=>({web:{uri,title}});
const meta=(chunks,supports)=>({groundingChunks:chunks,groundingSupports:supports.map(([t,idx])=>({segment:{text:t},groundingChunkIndices:idx}))});
const entity={name:"Owens Corning",website:"[www.owenscorning.com](https://www.owenscorning.com)",headquarters:"Toledo",description:"x",ownership:"public",confidence:"high",otherEntities:"none"};
const slices=[{topic:"performance",status:"ok",ms:1,meta:meta([
  chunk("https://www.sec.gov/ix?doc=1","sec.gov"),                 //0 T1
  chunk("https://investors.owenscorning.com/news/1","owenscorning.com"), //1 T1 (company)
  chunk("https://www.reuters.com/a","reuters.com"),                 //2 T2
  chunk("https://www.randomblog.example/x","randomblog.example"),  //3 T3
  chunk("https://www.facebook.com/p/1","facebook.com"),             //4 excluded
  chunk("https://stocktwits.com/x","stocktwits.com"),               //5 excluded
  chunk("https://www.asbestos-law-firm.com/x","asbestos-law-firm.com"), //6 excluded (law firm)
  chunk("https://blocked-example.com/y","blocked-example.com"),     //7 excluded (secret denylist)
  chunk("https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc","koalagains.com"), //8 excluded via title
  chunk("https://vertexaisearch.cloud.google.com/grounding-api-redirect/def","www.macrotrends.net"), //9 T3
  chunk("https://www.stock-aggregator.example/z","stock-aggregator.example"), //10 T3
  chunk("https://www.example.org/d","example.org"),                 //11 T3
 ],[
  ["Owens Corning reported 2025 net sales from continuing operations of $10.1 billion, up 3%.",[0,1,2,3]],  // E1 sources 0,1,2,3 -> T1
  ["Revenue fell 9.49% to $9.85B in the 12 months ending June 2026, according to an aggregator.",[10]],      // E2 T3 only
  ["Owens Corning employs 25,000 people according to a social post.",[4,5]],                                // dropped by tier
  ["More than half of Owens Corning revenue comes from energy-efficient products, according to the company.",[1,0,2,11,3]], // E3 many sources
  ["The firm announced the Kingspan synergy plan in 2026 according to a blog.",[11]],                        // E4
  ["Owens Corning has about 25,304 employees according to a data site.",[9]],                                // E5 T3 (via title host)
  ["Asbestos litigation continues according to a law firm site.",[6,7,8]],                                    // dropped by tier
 ])}];
let r=await post({step:"ledger",slices,entity,companyName:"Owens Corning"});
// v2Ledger needs state-less call with entity: names? gemini-research ledger takes entity
let L=await r.json(); console.log("ledger",r.status,L.error||"");
const st=L.state;
console.log("evidence",st.evidence.map(e=>`E${e.id} T${e.tier} src[${e.sourceIds}] tiers[${e.srcTiers}]`).join(" | "));
console.log("sources",st.sources.map(s=>`${s.id}:${s.tier}:${s.title}`).join(", "),"| droppedByTier",st.droppedByTier);
// facts_section performance with claims citing T3-only evidence
globalThis.__none=1;
const claim=(text,ids)=>({text,status:"sourced",evidenceIds:ids});
// call report directly with crafted analysis
const item=(text,ids)=>({text,basedOn:ids});
const raw={core:{executiveSummary:{tldr:item("Owens Corning is growing with net sales of $10.1 billion, up 3%.",[1]),keyTrends:[],competitivePositioning:{label:"Leader",rationale:item("A leading building-products company.",[1])},bigOpportunity:item("Over half of revenue comes from energy-efficient products.",[3])},performanceSummary:[item("Net sales of $10.1 billion were reported on a continuing-operations basis.",[1]),item("Revenue is down 9.49% suggesting headwinds.",[2])],competitorGaps:[]},
  frameworks:{swot:{strengths:[item("Kingspan synergy will transform margins.",[4]),item("Over half of revenue comes from a business segment.",[4])],weaknesses:[],opportunities:[],threats:[]},portersFiveForces:{buyerPower:null,supplierPower:null,competitiveRivalry:null,threatOfSubstitution:null,threatOfNewEntry:null},pestle:{political:null,economic:null,social:null,technological:null,legal:null,environmental:null}},
  recs:{recommendations:{product:[],marketing:[],resourceAllocation:null,roadmap:null},mcOpportunities:[]}};
r=await post({step:"report",state:st,parts:[],raw,deepResearch:false,clientWarnings:[],scanLog:[]}); const rep=await r.json(); console.log("report",r.status,rep.error||"");
console.log("tldr:",rep.executiveSummary.tldr);
console.log("bigOpportunity:",rep.executiveSummary.bigOpportunity);
console.log("positioning:",rep.executiveSummary.competitivePositioning,"|",rep.executiveSummary.positioningRationale);
console.log("perf paragraphs:",rep.businessPerformance.financialHighlights);
console.log("swot strengths:",JSON.stringify(rep.strategicFrameworks.swot.strengths));
console.log("sources:",JSON.stringify(rep.sources.map(s=>({id:s.id,t:s.tier,title:s.title}))));
console.log("dropped:",JSON.stringify(rep.quality.dropped.map(d=>d.path+" :: "+d.reason)));
console.log("quality:",JSON.stringify({sourcesDroppedByType:rep.quality.sourcesDroppedByType,sourceTiers:rep.quality.sourceTiers,sourceCount:rep.quality.sourceCount,verifier:rep.quality.verifier.slice(-60)}),"| evidence key present:", "evidence" in rep);

r=await post({step:"facts_section",section:"performance",state:st}); const fs=await r.json();
console.log("facts perf:",fs.facts.businessPerformance.financialHighlights.map(c=>c.text.slice(0,50)),"| metrics:",fs.facts.businessPerformance.recentMetrics.length,"| dropped:",JSON.stringify(fs.dropped.map(d=>d.path+" :: "+d.reason)));

let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`); if (!ok) failures++; };
check("primary, major press and other sources get tiers 1, 2 and 3", st.sources.find((x) => /sec\.gov/.test(x.title))?.tier === 1 && st.sources.find((x) => /owenscorning/.test(x.title))?.tier === 1 && st.sources.find((x) => /reuters/.test(x.title))?.tier === 2 && st.sources.find((x) => /randomblog/.test(x.title))?.tier === 3);
check("social, stock-forum, law-firm, denylisted and stock-data sources never enter the ledger", st.sources.every((x) => !/facebook|stocktwits|asbestos|blocked-example|koalagains|macrotrends/.test(x.url + x.title)) && st.droppedByTier >= 3, JSON.stringify(st.sources.map((x) => x.title)) + st.droppedByTier);
check("at most three citations per statement", [rep.executiveSummary.tldr, rep.executiveSummary.bigOpportunity].every((t) => (t.match(/\[\d+\]/g) ?? []).length <= 3));
check("a financial statement resting on a non-primary source is dropped for a public company", rep.quality.dropped.some((d) => /financial statement needs a primary source/.test(d.reason)));
check("a quantity word the evidence does not support is dropped", rep.quality.dropped.some((d) => /quantity wording/.test(d.reason)));
check("the facts section keeps only the primary-sourced financial claim", fs.facts.businessPerformance.financialHighlights.length === 1 && fs.facts.businessPerformance.recentMetrics.length === 0);
check("source titles are plain text with the page title and host", rep.sources.some((x) => /8-K & results - sec\.gov/.test(x.title)));
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
