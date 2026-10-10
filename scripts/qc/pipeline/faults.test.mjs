import "./fixed-date.mjs";
// Pipeline behaviour under faults: failed scans, failed sections, gateway errors, unknown company.
let handler; const env={GEMINI_API_KEY:"k",SUPABASE_URL:"https://sb.test"};
globalThis.Deno={env:{get:k=>env[k]},serve:(h)=>{handler=h}};
await import("../../../supabase/functions/gemini-research/index.ts");
const { runResearch } = await import("../../../src/services/researchPipeline.ts");
const gem=(text,meta)=>new Response(JSON.stringify({candidates:[{content:{parts:[{text}]},groundingMetadata:meta}]}),{status:200});
const metaOf=(segs,uri)=>({groundingChunks:[{web:{uri:uri||"https://www.sec.gov/a",title:"T"}}],groundingSupports:segs.map(t=>({segment:{text:t},groundingChunkIndices:[0]}))});
const SEG={
 perf:["Acme reported revenue of $120M for fiscal 2025, up 18% year over year, according to its annual report.","Acme reported net income of $9M for fiscal 2025, according to its annual report.","Acme has a market capitalization of $1.4B as of October 2026, according to Yahoo Finance."],
 s1:["Acme acquired Roadrunner Labs in March 2026, according to Reuters.","Acme sold its legacy hardware unit in June 2022, according to Reuters.","Acme formed a joint venture with ToolCo in February 2026, according to Reuters.","Acme announced a supply agreement with ToolCo in March 2026 that is expected to exceed $30 billion, according to Reuters."],
 s2:["Acme launched the Anvil Cloud product in January 2026, according to TechCrunch.","Acme opened a Sao Paulo office in November 2025, according to TechCrunch.","Acme expanded to Chile in December 2025, according to TechCrunch."],
 s3:["Acme authorized a $50M share buyback in May 2026, according to Bloomberg.","Acme refinanced debt in April 2026, according to Bloomberg.","Acme cut dividends in July 2025, according to Bloomberg."],
 mkt:["The global anvil market was valued at $4.8B in 2025 according to Grand View Research.","Acme's cloud segment market was valued at $1.2B in 2025 according to IDC.","Analysts define the market as industrial tooling, according to Gartner.","Demand could grow as logistics hubs automate, according to Gartner.","Market saturation may slow growth in mature regions, according to IDC.","Steel price swings could squeeze margins industry-wide, according to Reuters.", ...Array.from({length:10},(_,i)=>`Industry note ${i}: tooling shipments changed in quarter ${i}, according to Statista.`)],
 comp:["Wile Tools is named by analysts as the main competitor of Acme.","Coyote Forge is a frequent alternative to Acme according to reviews.","ToolHub is an indirect alternative to Acme according to Gartner."],
 cust:["Reviewers on G2 rate Acme 4.5 out of 5 and praise ease of use.","Reviewers on G2 criticise Acme's pricing.","Customers say onboarding takes too long, according to G2 reviews."],
};
const F={}; const promptsSeen=[]; let dynCalls=0; // fault flags
let inflight=0,maxInflight=0; const counts={};
function segsFor(p){return p.includes("M&A Activity")?SEG.s1:p.includes("Product & Service Launches")?SEG.s2:p.includes("Shareholder Returns")?SEG.s3:p.includes("Revenue and revenue growth")?SEG.perf:p.includes("The markets the company competes in")?SEG.mkt:(p.includes("what customers like")||p.includes("what customers criticise"))?SEG.cust:p.includes("Companies named as competitors")?SEG.comp:["Acme sells anvils to roadrunners worldwide."];}
globalThis.fetch=async(url,init)=>{
  url=String(url);
  if(url.includes("/auth/v1/user")) return new Response(JSON.stringify({email:"matt@toptal.com"}),{status:200});
  const body=JSON.parse(init.body); const prompt=body.contents[0].parts[0].text; const model=url.split("/models/")[1].split(":")[0];
  const ev=[...prompt.matchAll(/^E(\d+) \[([^\]]+)\] (.*)$/gm)].map(m=>({id:Number(m[1]),topic:m[2],text:m[3]}));
  const id=(sub)=>ev.find(e=>e.text.includes(sub))?.id; const nf={text:null,status:"not_found",evidenceIds:[]}; const cl=(text,sub)=>({text,status:"sourced",evidenceIds:[id(sub)]});
  const G1="Mergers, Acquisitions & Partnerships (Inorganic Growth)",G2="Market Strategy, Growth & Innovation (Organic Growth)";
  if(prompt.includes("Answer in exactly this format")){ if(F.entity422) return gem("NAME: UNKNOWN",{groundingChunks:[],groundingSupports:[]}); return gem("NAME: Acme\nWEBSITE: acme.com\nHEADQUARTERS: Austin, USA\nDESCRIPTION: Acme sells anvils.\nOWNERSHIP: private\nCONFIDENCE: high\nOTHER_ENTITIES: none",metaOf(["Acme sells anvils to roadrunners worldwide."]));}
  if(prompt.includes("SEGMENT: <segment name>")) return gem("NOT FOUND",metaOf(["Acme sells anvils to roadrunners worldwide."]));
  if(prompt.includes("Classify each candidate")){const names=[...prompt.matchAll(/^\d+\. (.+?)(?: \(named for:.*\))?$/gm)].map(m=>m[1]);return gem(JSON.stringify(names.map(n=>({name:n,classification:"competitor",segment:"",reason:"mock"}))));}
  if(prompt.includes("RESEARCH TASK: Profile ")){const name=prompt.match(/RESEARCH TASK: Profile (.+?) using/)[1];return gem("x",metaOf([`${name} positions itself as the broadest catalog vendor, according to Gartner.`,`${name} is praised by analysts for its distribution reach.`,`${name} reported revenue of $300M for fiscal 2025, according to its annual report.`]));}
  if(prompt.includes("RESEARCH TASK")){const segs=segsFor(prompt); const topicKey=segs===SEG.mkt?"market":""; if(F.failMarketScan&&topicKey==="market") return new Response("boom",{status:500}); return gem("x",metaOf(segs));}
  if(prompt.includes("From the evidence below, list the companies")) return gem(JSON.stringify({direct:["Wile Tools","Coyote Forge","ToolHub"],indirect:[]}));
  if(prompt.includes("building one section of the fact base")){
    counts.factsSection=(counts.factsSection||0)+1;
    if(prompt.includes("6. businessPerformance.financialHighlights")) return gem(JSON.stringify({businessPerformance:{financialHighlights:[cl("Acme reported revenue of $120M for fiscal 2025.","revenue of $120M")],recentMetrics:[]}}));
    if(prompt.includes("6. strategicInitiatives")) return gem(JSON.stringify({businessPerformance:{strategicInitiatives:[{group:G1,subgroup:"M&A Activity",name:"Acquired Roadrunner Labs",description:cl("Acme acquired Roadrunner Labs in March 2026.","Roadrunner Labs")},{group:G1,subgroup:"Divestitures & Spinoffs",name:"Sold unit",description:cl("Acme sold its legacy hardware unit in June 2022.","legacy hardware")},{group:G1,subgroup:"Joint Ventures & Strategic Alliances",name:"ToolCo supply agreement",description:cl("Acme announced a supply agreement with ToolCo in March 2026 that is expected to exceed $30 billion.","supply agreement")},{group:G2,subgroup:"Product & Service Launches",name:"Anvil Cloud",description:cl("Acme launched the Anvil Cloud product in January 2026.","Anvil Cloud")}]}}));
    if(prompt.includes("6. marketOverview.definition")){ promptsSeen.push(["market_size",prompt]); return gem(JSON.stringify({marketOverview:{definition:{text:"Analysts define the market as industrial tooling.",basedOn:[id("define the market")]},tam:[{segment:"Anvils",geography:"Global",year:2025,value:"$4.8B",publisher:"Grand View Research",evidenceIds:[id("anvil market")]},{segment:"Cloud",geography:"Global",year:2025,value:"$1.2B",publisher:"IDC",evidenceIds:[id("cloud segment")]}]}}));}
    if(prompt.includes("6. drivers:")){ promptsSeen.push(["market_dynamics",prompt]); dynCalls++; if(F.dynEmptyOnce&&dynCalls===1) return gem(JSON.stringify({marketOverview:{segmentation:[],drivers:[],inhibitors:[]}}));
      return gem(JSON.stringify({marketOverview:{segmentation:[],drivers:[{text:"Demand could grow as logistics hubs automate.",basedOn:[id("logistics hubs")]},{text:"Market worth $900B by automation.",basedOn:[id("logistics hubs")]}],inhibitors:[{text:"Market saturation may slow growth in mature regions.",basedOn:[id("saturation")]},{text:"Steel price swings could squeeze margins.",basedOn:[id("Steel price")]}]}}));}
    if(prompt.includes("6. competitiveLandscape")){ return gem(JSON.stringify({competitiveLandscape:{directCompetitors:[{name:"Wile Tools",evidenceIds:[id("Wile Tools is named")]}],indirectCompetitors:[],potentialEntrants:[]},competitorDeepDives:[
      {name:"Wile Tools",revenue:cl("Wile Tools reported revenue of $300M for fiscal 2025.","Wile Tools reported revenue"),headcount:nf,activity:nf,pricingModel:nf,description:{text:"A leading catalog vendor.",basedOn:[id("Wile Tools positions")]},strengths:[{text:"Broad catalog",basedOn:[id("Wile Tools positions")]}]},
      {name:"Coyote Forge",revenue:nf,headcount:nf,activity:nf,pricingModel:nf,description:{text:"Sells at low prices.",basedOn:[id("Coyote Forge positions")]},strengths:[]}]}));}
    if(prompt.includes("6. customerInsights")){ if(F.failCustomerFacts) return new Response("boom",{status:500}); return gem(JSON.stringify({customerInsights:{sentiment:cl("Reviewers rate Acme 4.5 out of 5 on G2.","4.5 out of 5"),sentimentThemes:[cl("**Ease of use:** reviewers praise it.","ease of use")],winReasons:[cl("**Ease of use:** reviewers praise it.","ease of use")],lossReasons:[cl("**Pricing:** reviewers criticise the cost.","pricing")],unmetNeeds:[cl("**Onboarding:** customers say it takes too long.","onboarding")]}}));}
  }
  if(prompt.includes("For each numbered CLAIM")){const n=[...prompt.matchAll(/^CLAIM (\d+):/gm)].length;return gem(JSON.stringify(Array.from({length:n},(_,i)=>({index:i,verdict:"supported"}))));}
  if(prompt.includes("mcOpportunities:")) return gem(JSON.stringify({recommendations:{product:[{text:"Bundle Anvil Cloud with hardware.",basedOn:[id("Anvil Cloud")||1]}],marketing:[],resourceAllocation:null,roadmap:null},mcOpportunities:[{initiative:"Anvil Cloud launch",need:"Subscription finance model",serviceOffering:"Finance Transformation",rationale:"Shift to recurring revenue.",basedOn:[id("Anvil Cloud")||1]}]}));
  if(prompt.includes("3. swot:")){ if(F.failFrameworks) return new Response("boom",{status:500}); return gem(JSON.stringify({swot:{strengths:[{text:"Strong growth.",basedOn:[id("revenue of $120M")]}],weaknesses:[],opportunities:[],threats:[]},portersFiveForces:{buyerPower:null,supplierPower:null,competitiveRivalry:null,threatOfSubstitution:null,threatOfNewEntry:null},pestle:{political:null,economic:null,social:null,technological:null,legal:null,environmental:null}}));}
  if(prompt.includes("executiveSummary.tldr")) return gem(JSON.stringify({executiveSummary:{tldr:{text:"Acme sells anvils and is growing.",basedOn:[id("revenue of $120M")]},keyTrends:[],competitivePositioning:{label:"Insufficient evidence",rationale:null},bigOpportunity:null},performanceSummary:[{text:"Acme reported revenue of $120M for fiscal 2025, up 18% year over year.",basedOn:[id("revenue of $120M")]},{text:"Acme's market capitalization is approximately $1.45 billion.",basedOn:[id("market capitalization")]},{text:"Acme expects $2 billion in sales.",basedOn:[id("market capitalization")]}],somEstimate:null,competitorGaps:[]}));
  if(prompt.includes("choose the ONE catalog offering")){return gem(JSON.stringify([{index:0,serviceOffering:"Finance > Finance Strategy"}]));}
  throw new Error("unmocked "+prompt.slice(0,70));
};
const mkCall=()=> async (body)=>{ counts[body.step]=(counts[body.step]||0)+1; if(F.http503Ledger&&body.step==="ledger"&&!F._done){F._done=1;throw Object.assign(new Error("gateway"),{status:503});}
  inflight++; maxInflight=Math.max(maxInflight,inflight);
  try{ await new Promise(r=>setTimeout(r,5)); const r=await handler(new Request("http://x/",{method:"POST",body:JSON.stringify(body),headers:{"content-type":"application/json",authorization:"Bearer u",apikey:"pk"}})); const j=await r.json(); if(!r.ok) throw Object.assign(new Error(j.error||"http "+r.status),{status:r.status}); return j;} finally{inflight--;}};
const run=async(label,flags={})=>{ for(const k of Object.keys(F)) delete F[k]; Object.assign(F,flags); for(const k of Object.keys(counts)) delete counts[k]; maxInflight=0; dynCalls=0; promptsSeen.length=0; let last=[]; 
  try{ const rep=await runResearch({call:mkCall(),companyName:"Acme",deepResearch:true,onProgress:c=>{last=c},retryDelayMs:5}); console.log(`\n=== ${label}: ok`); return {rep,last}; }catch(e){ console.log(`\n=== ${label}: THROWN status=${e.status} msg=${e.message}`); return {err:e,last}; } };
// A: clean
let {rep,last}=await run("clean");
console.log("calls",JSON.stringify(counts),"maxInflight",maxInflight);
console.log("chips",last.map(c=>c.label+":"+c.status).join(" | "));
console.log("scans",rep.quality.scans.map(s=>s.topic+":"+s.status).join(", "));
console.log("initiative groups",JSON.stringify(rep.businessPerformance.strategicInitiativeGroups.map(g=>g.group.slice(0,12)+":"+g.subgroups.map(s=>s.name+s.items.length))));
console.log("tamRows",rep.marketOverview.metrics.tamRows.map(r=>r.segment+" "+r.value).join(", "),"| metrics keys",Object.keys(rep.marketOverview.metrics).join(","),"| def",rep.marketOverview.definition);
console.log("drivers",JSON.stringify(rep.marketOverview.drivers),"| inhibitors",JSON.stringify(rep.marketOverview.inhibitors));
console.log("market prompts saw profile evidence?",promptsSeen.map(([n,p])=>n+":"+/\[profile\]/.test(p)).join(", "),"| retried-empty warnings:",rep.quality.warnings.filter(w=>/came back empty/.test(w)).length,"| somEstimate in analysis?",JSON.stringify("somEstimate" in rep.claims.analysis));
console.log("deep dives",rep.competitorDeepDives.map(d=>d.name+" vp="+d.valueProposition).join(" ; "));
console.log("customer winloss",rep.customerInsights.winLossReasons);
console.log("initiatives",JSON.stringify(rep.businessPerformance.strategicInitiativeGroups.flatMap(g=>g.subgroups.map(sg=>sg.name+": "+sg.items.map(i=>i.name).join(",")))));
console.log("dropped (all):",JSON.stringify(rep.quality.dropped.map(d=>d.path+" :: "+d.reason)));
console.log("perf",rep.businessPerformance.financialHighlights,"| mc",JSON.stringify(rep.mcOpportunities.map(m=>m.serviceOffering)),"| sections",JSON.stringify(rep.quality.sectionsOk));
({rep,last}=await run("market dynamics empty once",{dynEmptyOnce:1}));
console.log("dyn calls",dynCalls,"| drivers",JSON.stringify(rep.marketOverview.drivers),"| warnings:",rep.quality.warnings.filter(w=>/came back empty/.test(w)));
console.log("dropped market:",JSON.stringify(rep.quality.dropped.filter(d=>d.path.startsWith("marketOverview")).map(d=>d.path+" :: "+d.reason)));
// B: faults
({rep,last}=await run("faults",{failMarketScan:1,failCustomerFacts:1,failFrameworks:1,http503Ledger:1}));
console.log("calls",JSON.stringify(counts));
console.log("chips",last.map(c=>c.label+":"+c.status).join(" | "));
console.log("market scan",JSON.stringify(rep.quality.scans.find(s=>s.topic==="market")),"| tam:",rep.marketOverview.metrics.tam);
console.log("customer:",rep.customerInsights.sentiment,"| frameworks:",rep.strategicFrameworks.portersFiveForces.buyerPower,"| swot:",JSON.stringify(rep.strategicFrameworks.swot.strengths));
console.log("sectionsOk",JSON.stringify(rep.quality.sectionsOk),"| warnings:",rep.quality.warnings.length); rep.quality.warnings.forEach(w=>console.log("  -",w.slice(0,140)));
// C: unknown company
await run("unknown company",{entity422:1});

let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`); if (!ok) failures++; };
{
  const clean = await run("assert: clean");
  check("clean run: every section extracted", Object.values(clean.rep.quality.sectionsOk).every(Boolean), JSON.stringify(clean.rep.quality.sectionsOk));
  check("clean run: every progress chip finished", clean.last.every((c) => c.status === "done" || c.status === "retried"), clean.last.map((c) => c.label + ":" + c.status).join());
  check("clean run: at most 5 requests in flight", maxInflight <= 5, String(maxInflight));
  const once = await run("assert: empty once", { dynEmptyOnce: 1 });
  check("an empty section with plenty of evidence is retried once", once.rep.quality.warnings.some((w) => /came back empty/.test(w)) && once.rep.marketOverview.drivers.length > 0);
  const faults = await run("assert: faults", { failMarketScan: 1, failCustomerFacts: 1, failFrameworks: 1, http503Ledger: 1 });
  check("a failed scan, section and analysis part degrade without failing the report", !!faults.rep && faults.last.find((c) => c.label === "Market").status === "failed" && faults.last.find((c) => c.label === "Customers").status === "failed" && faults.last.find((c) => c.label === "Analysis").status === "failed", faults.last.map((c) => c.label + ":" + c.status).join());
  check("failed parts say 'Not generated', not 'Not found'", /Not generated/.test(faults.rep.customerInsights.sentiment) && /Not generated/.test(faults.rep.strategicFrameworks.portersFiveForces.buyerPower));
  check("a gateway error on a step is retried", faults.rep.quality.sectionsOk.performance === true);
  const unknown = await run("assert: unknown company", { entity422: 1 });
  check("an unknown company stops with a clear 422", unknown.err?.status === 422 && /Could not find/.test(unknown.err.message), unknown.err?.message);
}
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
