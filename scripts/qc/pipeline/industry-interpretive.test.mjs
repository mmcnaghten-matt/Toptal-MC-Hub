import "./fixed-date.mjs";
// Industry Insights: interpretive challenges and needs are rewritten (not dropped) when a figure is unsupported, thin lists get one top-up, events must be inside the window, the verifier removes unsupported statements.
let handler; const env={GEMINI_API_KEY:"k",SUPABASE_URL:"https://sb.test"};
globalThis.Deno={env:{get:k=>env[k]},serve:(h)=>{handler=h}};
await import("../../../supabase/functions/refresh-industry-insights/index.ts");
const { runIndustryResearch } = await import("../../../src/services/industryResearchPipeline.ts");
const gem=(text,meta)=>new Response(JSON.stringify({candidates:[{content:{parts:[{text}]},groundingMetadata:meta}]}),{status:200});
const metaOf=(segs,uri)=>({groundingChunks:[{web:{uri,title:uri}}],groundingSupports:segs.map(t=>({segment:{text:t},groundingChunkIndices:[0]}))});
const SEG={
 market:["U.S. retail banking net interest margin was 3.1% in 2025, according to the FDIC.","Retail deposit costs rose to 2.67% in 2025 according to the FDIC.","Branch visits fell in 2025, according to the ABA.","Retail banks reported higher net income in 2026, according to the FDIC."],
 regulation:["Basel III endgame rules were re-proposed in March 2026 by U.S. regulators.","The CFPB finalized an open banking rule in October 2025.","Regulators issued new third-party risk guidance in June 2026.","Overdraft fee rules were withdrawn in 2025, according to Reuters."],
 technology_ai:["Retail banks increased generative AI spending in 2025, according to Gartner.","Legacy core systems limit real-time payments, according to McKinsey in 2025.","Cloud migration of core platforms accelerated in 2026, according to Deloitte.","Fraud losses from instant payments rose in 2025, according to the FBI."],
 workforce:["Banks cut branch staff in 2025 according to BLS.","Demand for data engineers in banking rose in 2026 according to LinkedIn data reported by Reuters.","Compliance headcount grew in 2025 according to Thomson Reuters.","Attrition among tellers stayed high in 2025 according to ABA."],
 competition_ma:["Capital One completed its Discover acquisition in 2025, according to Reuters.","Fintech lenders took share in personal loans in 2025, according to TransUnion.","Regional bank mergers rose in 2026, according to S&P Global.","Neobanks pursued charters in 2025, according to the OCC."],
 buyers:["Bank executives ranked AI and fraud as top priorities in the 2026 Deloitte outlook.","CFOs prioritised cost discipline in the 2026 KPMG survey.","Customers want digital-first onboarding according to J.D. Power 2025.","Executives cite legacy modernization as the top barrier in a 2025 Accenture survey."],
 moves:["JPMorgan announced a core modernization program in January 2026.","Wells Fargo launched an AI assistant for employees in 2025.","Regional banks announced shared-service consolidations in 2026.","Banks partnered with fintechs on embedded finance in 2025."],
};
const URI={market:"https://www.fdic.gov/m",regulation:"https://www.reuters.com/r",technology_ai:"https://www.gartner.com/t",workforce:"https://www.bls.gov/w",competition_ma:"https://www.reuters.com/c",buyers:"https://www.deloitte.com/b",moves:"https://www.reuters.com/mv"};
const ASK={market:"Market size and growth",regulation:"Regulatory, policy",technology_ai:"Technology and AI adoption",workforce:"Workforce and talent",competition_ma:"Competitive dynamics",buyers:"What executives and customers",moves:"Concrete programs"};
const calls={}; let F={};
globalThis.fetch=async(url,init)=>{
  url=String(url);
  if(url.includes("/auth/v1/user")) return new Response(JSON.stringify({email:"matt@toptal.com"}),{status:200});
  if(!url.includes("generativelanguage")) throw new Error("no net");
  const body=JSON.parse(init.body); const p=body.contents[0].parts[0].text;
  const ev=[...p.matchAll(/^E(\d+) \[([^\]]+)\] (.*)$/gm)].map(m=>({id:Number(m[1]),text:m[3]})); const id=(sub)=>ev.find(e=>e.text.includes(sub))?.id;
  const bump=(k)=>calls[k]=(calls[k]||0)+1;
  if(p.includes("You are researching the")){ bump("scan"); const k=Object.keys(ASK).find(k=>p.includes(ASK[k])); return gem("x",metaOf(SEG[k],URI[k])); }
  if(p.includes("was rejected because of the problem")){ bump("repair"); const rows=[...p.matchAll(/^STATEMENT (\d+): (.*)$/gm)]; return gem(JSON.stringify(rows.map(m=>({index:Number(m[1]),text:/over half/.test(m[2])?"":m[2].replace(/ by \d+(\.\d+)?%/,"").replace(/ \d+(\.\d+)?%/,"")})))); }
  if(p.includes("For each numbered CLAIM")){ bump("verify"); const n=[...p.matchAll(/^CLAIM (\d+): (.*)$/gm)]; return gem(JSON.stringify(n.map(m=>({index:Number(m[1]),verdict:/Wells Fargo launched/.test(m[2])?"unsupported":"supported"})))); }
  if(p.includes("ALREADY ACCEPTED")&&p.includes("ADDITIONAL challenges")){ bump("topupChallenges"); return gem(JSON.stringify({overview:null,challenges:[{text:"Fraud exposure: Fraud losses from instant payments rose in 2025.",basedOn:[id("Fraud losses")]},{text:"Talent churn: Attrition among tellers stayed high in 2025.",basedOn:[id("Attrition")]}]})); }
  if(p.includes("5. overview:")){ bump("overview"); return gem(JSON.stringify({overview:{text:"Retail banking faces margin pressure as deposit costs rise.",basedOn:[id("2.67%")]},challenges:[
    {text:"Deposit cost pressure: Retail deposit costs rose to 2.67% in 2025.",basedOn:[id("2.67%")]},
    {text:"Margin squeeze: Deposit costs rose 4.5% since last year, squeezing margins.",basedOn:[id("2.67%")]},            // repairable figure
    {text:"Legacy reliance: Banks still depend on core platforms built in 2012.",basedOn:[id("Legacy core")]},                // old year, fine for challenges
    {text:"Branch decline: Over half of branches are closing.",basedOn:[id("Branch visits")]},                              // repairable -> repair returns "" -> dropped
    {text:"Uncited claim: Banks face headwinds.",basedOn:[]},
    {text:"AI assistants: Wells Fargo launched an AI assistant for employees.",basedOn:[id("Wells Fargo")]},                  // verifier unsupported
    {text:"Capital rules: Basel III endgame was re-proposed.",basedOn:[id("Basel")]}]})); }
  if(p.includes("ALREADY ACCEPTED")&&p.includes("ADDITIONAL things organizations")){ bump("topupInitiatives"); return gem(JSON.stringify({initiatives:[{text:"Shared services: Regional banks announced shared-service consolidations in 2026.",basedOn:[id("shared-service")]},{text:"Embedded finance: Banks partnered with fintechs in 2025.",basedOn:[id("embedded finance")]}]})); }
  if(p.includes("5. initiatives:")){ bump("initiatives"); return gem(JSON.stringify({initiatives:[
    {text:"Core modernization: JPMorgan announced a core modernization program in January 2026.",basedOn:[id("JPMorgan")]},
    {text:"Old program: A program announced in 2019 is still running.",basedOn:[id("JPMorgan")]}, // event kind: old year -> dropped
    {text:"Regulatory readiness: Regulators issued third-party risk guidance in June 2026 and banks responded.",basedOn:[id("third-party risk")]}]})); }
  if(p.includes("ALREADY ACCEPTED")&&p.includes("ADDITIONAL needs")){ bump("topupNeeds"); const N=(name,sub)=>({name,signals:["Signal one","Signal two","Signal three"],narrative:"This matters now for the sub-sector.",basedOn:[id(sub)]}); return gem(JSON.stringify({needs:[N("Strengthen fraud defences","Fraud losses"),N("Retain frontline talent","Attrition"),N("Modernize shared services","shared-service")]})); }
  if(p.includes("5. needs:")){ bump("needs"); const N=(name,narr,sub)=>({name,signals:["Signal one","Signal two","Signal three"],narrative:narr,basedOn:[id(sub)]}); return gem(JSON.stringify({needs:[N("Reduce deposit cost pressure","Deposit costs rose 4.5% and squeeze margins.","2.67%"),N("Modernize the legacy core","Legacy cores limit real-time payments.","Legacy core"),N("Meet capital rule changes","Capital rules are being reset.","Basel")]})); }
  if(p.includes("For each numbered client need")){ bump("offers"); const idx=[...p.matchAll(/^(\d+)\. /gm)].map(m=>Number(m[1])); return gem(JSON.stringify({rows:idx.map(i=>({index:i,mcOffers:["Finance > Finance Strategy"],offerNarrative:"Finance Strategy helps address this need."}))})); }
  throw new Error("unmocked "+p.slice(0,70));
};
const call=async(b)=>{ const r=await handler(new Request("http://x/",{method:"POST",body:JSON.stringify(b),headers:{"content-type":"application/json",authorization:"Bearer u",apikey:"pk"}})); const j=await r.json(); if(!r.ok) throw Object.assign(new Error(j.error||"http "+r.status),{status:r.status}); return j; };
const rep=await runIndustryResearch({call,subIndustryName:"Retail Banking",industryName:"BFSI",retryDelayMs:3});
console.log("calls",JSON.stringify(calls));
console.log("challenges",rep.challenges.length,JSON.stringify(rep.challenges.map(c=>c.slice(0,70))));
console.log("initiatives",rep.initiatives.length,JSON.stringify(rep.initiatives.map(c=>c.slice(0,60))));
console.log("needs",rep.needs.length,rep.needs.map(n=>n.name).join(" | "));
console.log("overview:",rep.overview);
console.log("repaired:",JSON.stringify(rep.quality.repaired.map(r=>r.path+": "+r.before.slice(0,40)+" => "+r.after.slice(0,50))));
console.log("topUps:",JSON.stringify(rep.quality.topUps),"| verifier:",rep.quality.verifier);
console.log("dropped:",JSON.stringify(rep.quality.dropped.map(d=>d.path+" :: "+d.reason)));
console.log("warnings:",JSON.stringify(rep.quality.warnings));

let failures = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`); if (!ok) failures++; };
check("an interpretive challenge with an unsupported figure is rewritten, not dropped", rep.quality.repaired.some((r) => /^challenges/.test(r.path) && /4\.5%/.test(r.before) && !/4\.5%/.test(r.after)), JSON.stringify(rep.quality.repaired));
check("a need narrative with an unsupported figure is rewritten", rep.quality.repaired.some((r) => /needs\[0\]\.narrative/.test(r.path)));
check("thin initiative and need lists get one top-up each", rep.quality.topUps.some((t) => /initiatives \+/.test(t)) && rep.quality.topUps.some((t) => /needs \+/.test(t)), JSON.stringify(rep.quality.topUps));
check("the result has at least 3 challenges, 3 initiatives and 5 needs", rep.challenges.length >= 3 && rep.initiatives.length >= 3 && rep.needs.length >= 5, `${rep.challenges.length}/${rep.initiatives.length}/${rep.needs.length}`);
check("an initiative older than 24 months is dropped", rep.quality.dropped.some((d) => /^initiatives/.test(d.path) && /older than 24 months/.test(d.reason)));
check("a challenge the verifier cannot support is removed", rep.quality.dropped.some((d) => /verifier/.test(d.reason)));
check("a quantity word the evidence does not state is not kept", rep.quality.dropped.some((d) => /quantity wording/.test(d.reason)));
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
