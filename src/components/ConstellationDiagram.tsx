import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Maximize2 } from "lucide-react";

interface DiagramNode {
  id: string;
  cat?: string;
  buyer?: string;
  ll: string[];
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  type: "hub" | "universal" | "secondary";
  info: string;
}

interface DiagramEdge {
  a: string;
  b: string;
  s: string;
}

interface ColorSet {
  f: string;
  s: string;
  t: string;
  e: string;
}

interface Props {
  compact?: boolean;
}

export default function ConstellationDiagram({ compact = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.querySelector("link[data-constellation-font]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/@fontsource/nunito-sans/index.css";
      link.setAttribute("data-constellation-font", "true");
      document.head.appendChild(link);
    }

    const svg = svgRef.current;
    const info = infoRef.current;
    const legend = legendRef.current;
    if (!svg || !info || !legend) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);
    while (legend.firstChild) legend.removeChild(legend.firstChild);

    const D = window.matchMedia("(prefers-color-scheme:dark)").matches;

    const HC: Record<string, ColorSet> = {
      strategy: D ? {f:"#1a2e8c",s:"#4d65e0",t:"#c8d4ff",e:"#4d65e0"} : {f:"#2B44D4",s:"#1a2e8c",t:"#fff",e:"#2B44D4"},
      finance:  D ? {f:"#065a3a",s:"#0CA678",t:"#90e0c0",e:"#0CA678"} : {f:"#0CA678",s:"#087a52",t:"#fff",e:"#0CA678"},
      ops:      D ? {f:"#7c2a12",s:"#e06848",t:"#ffd0c0",e:"#e06848"} : {f:"#E86B4A",s:"#a84530",t:"#fff",e:"#E86B4A"},
      people:   D ? {f:"#312060",s:"#7060c8",t:"#d0c8ff",e:"#7060c8"} : {f:"#5C6BC0",s:"#3949AB",t:"#fff",e:"#5C6BC0"},
    };
    const UC: ColorSet = D ? {f:"#1a2245",s:"#4d65e0",t:"#b0c4ff",e:"#4d65e0"} : {f:"#EEF2FF",s:"#2B44D4",t:"#2B44D4",e:"#2B44D4"};

    function nc(n: DiagramNode): ColorSet {
      if (n.type === "universal") return UC;
      return HC[n.cat!];
    }

    ([
      [HC.strategy.f, "none", "Strategy"],
      [HC.finance.f,  "none", "Finance"],
      [HC.ops.f,      "none", "Operations"],
      [HC.people.f,   "none", "People & Culture"],
      [UC.f, `1.5px solid ${UC.s}`, "Universal connector"],
    ] as [string, string, string][]).forEach(([bg, border, label]) => {
      const w = document.createElement("span");
      w.style.cssText = "display:flex;align-items:center;gap:5px";
      const d = document.createElement("div");
      d.style.cssText = `width:12px;height:8px;border-radius:6px;flex-shrink:0;background:${bg};${border !== "none" ? "border:" + border : ""}`;
      const t = document.createElement("span");
      t.textContent = label;
      w.append(d, t);
      legend.append(w);
    });

    const F = "'Proxima Nova','Nunito Sans',system-ui,sans-serif";

    const nodes: DiagramNode[] = [
      {id:"finance",   cat:"finance",  buyer:"CFO",           ll:["Finance","Transformation","& CFO Advisory"], cx:90,cy:290,rx:80,ry:38,type:"hub",
       info:"<strong>Finance Transformation & CFO Advisory</strong> (CFO gateway) — Modernizes finance from a cost center to a strategic partner. Five pillars: Strategy & Vision, Performance Management, Process Optimization, Org & Governance, Data & Technology. Draws in Digital Strategy, AI Consulting, Risk & Compliance, and Change Management."},
      {id:"mna",       cat:"finance",  buyer:"Corp Dev / PE", ll:["M&A Advisory","Services"],      cx:163,cy:163,rx:78,ry:30,type:"hub",
       info:"<strong>M&A Advisory Services</strong> (Corp Dev / PE gateway) — Pursues inorganic growth through target identification, due diligence, and post-merger integration. Works alongside Strategy & Growth Consulting and Finance Transformation & CFO Advisory."},
      {id:"business",  cat:"strategy", buyer:"CEO / COO",     ll:["Business","Transformation &","Risk Advisory"], cx:517,cy:163,rx:80,ry:38,type:"hub",
       info:"<strong>Business Transformation and Risk Advisory</strong> (CEO/COO gateway) — Enterprise-wide change to improve performance, competitiveness, and adaptability. Connects to all four universal connectors."},
      {id:"growth",    cat:"strategy", buyer:"CSO / CMO",     ll:["Strategy & Growth","Consulting"],  cx:340,cy:110,rx:78,ry:30,type:"hub",
       info:"<strong>Strategy & Growth Consulting</strong> (CSO/CMO gateway) — Identifies and exploits expansion through market penetration, product development, and diversification. Works alongside M&A Advisory Services on inorganic growth."},
      {id:"supply",    cat:"ops",      buyer:"COO",           ll:["Supply Chain &","Procurement","Consulting"], cx:163,cy:417,rx:80,ry:38,type:"hub",
       info:"<strong>Supply Chain and Procurement Consulting</strong> (COO gateway) — Optimizes operations and logistics for resilience, transparency, and efficiency. Pulls in Digital Strategy (IoT/Digital Twins), AI Consulting, and Risk & Compliance."},
      {id:"perf",      cat:"ops",      buyer:"C-Level / Ops", ll:["Operations &","Performance","Improvement"], cx:340,cy:470,rx:80,ry:38,type:"hub",
       info:"<strong>Operations & Performance Improvement</strong> (C-Level/Ops gateway) — Drives EBITDA growth, cost reduction, and operational efficiency. Connects to Digital Strategy, Change Management, and AI Consulting to rewire core processes."},
      {id:"leadership",cat:"people",   buyer:"CEO / CHRO",    ll:["Leadership &","Culture"],        cx:517,cy:417,rx:78,ry:30,type:"hub",
       info:"<strong>Leadership & Culture</strong> (CEO/CHRO gateway) — Builds the leadership behaviors, culture, and operating rhythms that let an organization sustain change rather than relapse after the transformation team leaves."},
      {id:"workforce", cat:"people",   buyer:"CHRO / CPO",    ll:["Adaptive","Organization"],       cx:590,cy:290,rx:78,ry:30,type:"hub",
       info:"<strong>Adaptive Organization</strong> (CHRO/CPO gateway) — Evolves talent strategy, organizational structure, and culture to meet future business needs. Strongly connected to AI Consulting (reskilling for GenAI), Change Management (adoption), and Digital Strategy (HR tech). Includes Workforce Transformation as a core sub-service."},
      {id:"change",    ll:["Change","Management"],            cx:340,cy:192,rx:62,ry:24,type:"universal",
       info:"<strong>Change Management</strong> (Universal Connector — Human Layer) — 75% of transformations fail due to poor execution. Connects to all eight primary hubs, bridging strategy and sustained execution. Especially critical for Adaptive Organization and Leadership & Culture."},
      {id:"digital",   ll:["Digital Strategy"],               cx:435,cy:283,rx:62,ry:24,type:"universal",
       info:"<strong>Digital Strategy</strong> (Universal Connector — Architecture Layer) — The technology roadmap for every transformation: real-time data, automation, IoT, and platform modernization. Connects to all eight primary hubs."},
      {id:"ai",        ll:["AI Consulting"],                  cx:340,cy:388,rx:62,ry:24,type:"universal",
       info:"<strong>AI Consulting</strong> (Universal Connector — Intelligence Layer) — Drives automation and advantage through predictive analytics and generative AI. Especially critical for Adaptive Organization (reskilling for GenAI) and Finance (predictive decisioning)."},
      {id:"risk",      ll:["Risk &","Compliance"],            cx:245,cy:283,rx:62,ry:24,type:"universal",
       info:"<strong>Risk & Compliance</strong> (Universal Connector — Guardrail Layer) — The regulatory and security safety net for any major transformation. Vital for M&A due diligence, Finance regulatory intelligence, and Digital cybersecurity."},
    ];

    const edges: DiagramEdge[] = [
      {a:"change", b:"finance",   s:"u"},{a:"change", b:"business",  s:"u"},
      {a:"change", b:"growth",    s:"u"},{a:"change", b:"supply",    s:"u"},
      {a:"change", b:"perf",      s:"u"},{a:"change", b:"workforce", s:"u"},
      {a:"change", b:"mna",       s:"u"},{a:"change", b:"leadership",s:"u"},
      {a:"digital",b:"finance",   s:"u"},{a:"digital",b:"business",  s:"u"},
      {a:"digital",b:"growth",    s:"u"},{a:"digital",b:"supply",    s:"u"},
      {a:"digital",b:"perf",      s:"u"},{a:"digital",b:"workforce", s:"u"},
      {a:"digital",b:"mna",       s:"u"},{a:"digital",b:"leadership",s:"u"},
      {a:"ai",     b:"finance",   s:"u"},{a:"ai",     b:"business",  s:"u"},
      {a:"ai",     b:"supply",    s:"u"},{a:"ai",     b:"perf",      s:"u"},
      {a:"ai",     b:"workforce", s:"u"},{a:"ai",     b:"leadership",s:"u"},
      {a:"ai",     b:"mna",       s:"u"},
      {a:"risk",   b:"finance",   s:"u"},{a:"risk",   b:"business",  s:"u"},
      {a:"risk",   b:"supply",    s:"u"},{a:"risk",   b:"growth",    s:"u"},
      {a:"risk",   b:"workforce", s:"u"},{a:"risk",   b:"mna",       s:"u"},
      {a:"risk",   b:"leadership",s:"u"},
    ];

    const nM: Record<string, DiagramNode> = {};
    nodes.forEach(n => (nM[n.id] = n));
    const adj: Record<string, Set<string>> = {};
    nodes.forEach(n => (adj[n.id] = new Set()));
    edges.forEach(e => { adj[e.a].add(e.b); adj[e.b].add(e.a); });

    const NS = "http://www.w3.org/2000/svg";
    function mk(tag: string, attrs: Record<string, string | number> = {}): Element {
      const el = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
      return el;
    }
    function ep(n: DiagramNode, tx: number, ty: number) {
      const dx = tx - n.cx, dy = ty - n.cy;
      if (!dx && !dy) return { x: n.cx, y: n.cy };
      const t = 1 / Math.sqrt((dx * dx) / (n.rx * n.rx) + (dy * dy) / (n.ry * n.ry));
      return { x: n.cx + dx * t, y: n.cy + dy * t };
    }

    const eG = mk("g"), nG = mk("g");
    svg.appendChild(eG);
    svg.appendChild(nG);
    const DC = D ? "#2a2e4a" : "#D0D5E8";
    const eL: Record<string, Element> = {};

    edges.forEach(e => {
      const src = nM[e.a], tgt = nM[e.b];
      const p1 = ep(src, tgt.cx, tgt.cy), p2 = ep(tgt, src.cx, src.cy);
      const isU = e.s === "u";
      const l = mk("line", {
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
        stroke: DC, "stroke-width": isU ? ".5" : ".8",
        "stroke-dasharray": isU ? "3 3" : "none",
        opacity: isU ? ".5" : ".65",
      });
      eG.appendChild(l);
      eL[`${e.a}|${e.b}`] = l;
      eL[`${e.b}|${e.a}`] = l;
    });

    const nEl: Record<string, { g: Element; ell: Element; sw: string }> = {};
    nodes.forEach(n => {
      const c = nc(n);
      const g = mk("g");
      (g as SVGGElement).style.cursor = "pointer";
      const sw = n.type === "hub" ? "1.5" : "1";
      const ell = mk("ellipse", { cx: n.cx, cy: n.cy, rx: n.rx, ry: n.ry, fill: c.f, stroke: c.s, "stroke-width": sw });
      g.appendChild(ell);
      const lc = n.ll.length, lh = n.type === "hub" ? 14 : 12;
      const fs = n.type === "hub" ? "13" : n.type === "universal" ? "12" : "11.5";
      const hasB = n.type === "hub" && !!n.buyer;
      const baseOff = hasB ? -6 : 0;
      n.ll.forEach((ln, i) => {
        const oy = (lc === 1 ? 0 : (i - 0.5) * lh) + baseOff;
        const t = mk("text", {
          x: n.cx, y: n.cy + oy,
          "text-anchor": "middle", "dominant-baseline": "central",
          fill: c.t, "font-size": fs, "font-weight": "500",
        });
        (t as SVGTextElement).style.fontFamily = F;
        t.textContent = ln;
        g.appendChild(t);
      });
      if (hasB) {
        const lastOy = (lc === 1 ? 0 : (lc - 1 - 0.5) * lh) + baseOff;
        const bt = mk("text", {
          x: n.cx, y: n.cy + lastOy + 13,
          "text-anchor": "middle", "dominant-baseline": "central",
          fill: c.t, "font-size": "11", "font-weight": "400", opacity: "0.75",
        });
        (bt as SVGTextElement).style.fontFamily = F;
        bt.textContent = n.buyer!;
        g.appendChild(bt);
      }
      g.addEventListener("mouseenter", () => hl(n.id));
      g.addEventListener("mouseleave", rst);
      g.addEventListener("click", () => { info.innerHTML = n.info; });
      nG.appendChild(g);
      nEl[n.id] = { g, ell, sw };
    });

    function hl(id: string) {
      const con = adj[id], ec = nc(nM[id]).e;
      nodes.forEach(n => {
        const { g, ell } = nEl[n.id];
        if (n.id === id) {
          ell.setAttribute("stroke-width", n.type === "hub" ? "3" : "2.5");
          (g as SVGGElement).style.opacity = "1";
        } else if (con.has(n.id)) {
          ell.setAttribute("stroke-width", n.type === "hub" ? "2" : "1.5");
          (g as SVGGElement).style.opacity = "1";
        } else {
          (g as SVGGElement).style.opacity = ".08";
        }
      });
      edges.forEach(e => {
        const l = eL[`${e.a}|${e.b}`];
        if (e.a === id || e.b === id) {
          l.setAttribute("stroke", ec);
          l.setAttribute("stroke-width", "2.5");
          l.setAttribute("opacity", "1");
          l.setAttribute("stroke-dasharray", "none");
        } else {
          l.setAttribute("opacity", ".02");
        }
      });
    }

    function rst() {
      nodes.forEach(n => {
        const { g, ell, sw } = nEl[n.id];
        ell.setAttribute("stroke-width", sw);
        (g as SVGGElement).style.opacity = "1";
      });
      edges.forEach(e => {
        const l = eL[`${e.a}|${e.b}`], isU = e.s === "u";
        l.setAttribute("stroke", DC);
        l.setAttribute("stroke-width", isU ? ".5" : ".8");
        l.setAttribute("stroke-dasharray", isU ? "3 3" : "none");
        l.setAttribute("opacity", isU ? ".5" : ".65");
      });
    }
  }, []);

  return (
    <div className="space-y-2">
      <svg
        ref={svgRef}
        width="100%"
        viewBox="-70 -40 750 640"
        role="img"
        aria-label="Toptal Management Consulting Ecosystem — Eight-Hub Constellation"
      />
      <div
        ref={infoRef}
        style={{ padding: ".75rem 1rem", borderRadius: "6px", fontSize: "13px", lineHeight: "1.6", minHeight: "52px" }}
        className="bg-muted text-muted-foreground"
      >
        <em className="text-muted-foreground/60">Hover to highlight connections · click for service details</em>
      </div>
      <div
        ref={legendRef}
        style={{ display: "flex", gap: "12px", padding: "8px 0 0", flexWrap: "wrap", alignItems: "center", fontSize: "12px" }}
        className="text-muted-foreground"
      />
      {compact && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => navigate("/services/web")}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            <Maximize2 className="h-3 w-3" />
            View full screen
          </button>
        </div>
      )}
    </div>
  );
}
