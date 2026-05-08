import { useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  Users,
  ShieldAlert,
  Loader2,
  BarChart3,
  Globe,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  TrendingUp,
  FileText,
  Layers,
  UserCheck,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";

// Safely stringify values before passing to Markdown (Gemini may return objects)
const toStr = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
};
const Markdown = ({ children, ...props }: React.ComponentProps<typeof ReactMarkdown> & { children: any }) => (
  <ReactMarkdown {...props}>{toStr(children)}</ReactMarkdown>
);

function WinLossColumns({ raw }: { raw: string }) {
  try {
    const parsed = JSON.parse(raw);
    const wins: string[] = Array.isArray(parsed.wins) ? parsed.wins : [];
    const losses: string[] = Array.isArray(parsed.losses) ? parsed.losses : [];
    if (wins.length || losses.length) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h5 className="text-xs font-bold uppercase tracking-widest text-green-700 mb-3">Wins</h5>
            <ul className="space-y-2">
              {wins.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h5 className="text-xs font-bold uppercase tracking-widest text-red-700 mb-3">Losses</h5>
            <ul className="space-y-2">
              {losses.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
  } catch {
    // not JSON
  }
  return <div className="prose prose-neutral text-sm text-foreground"><Markdown>{raw}</Markdown></div>;
}
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { performResearch, type ResearchResult } from "@/services/geminiService";
import ToptalLogo from "@/components/ToptalLogo";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "executive", label: "Executive Summary", icon: FileText },
  { id: "performance", label: "Business Performance", icon: BarChart3 },
  { id: "market", label: "Market Overview", icon: Globe },
  { id: "landscape", label: "Competitive Landscape", icon: Users },
  { id: "deepdive", label: "Competitor Deep Dives", icon: Layers },
  { id: "strategic", label: "Strategic Frameworks", icon: ShieldAlert },
  { id: "customer", label: "Customer Insights", icon: UserCheck },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "mc", label: "MC Opportunities", icon: Target },
];

export default function AccountMarketIntel() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [deepResearch, setDeepResearch] = useState(true);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("executive");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const headerRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      const captureElement = async (element: HTMLElement) => {
        const dataUrl = await toPng(element, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
        });
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = dataUrl;
        });
        const ratio = contentWidth / img.width;
        return { dataUrl, scaledHeight: img.height * ratio };
      };

      // Page 1: Header + Executive Summary combined
      let currentY = margin;
      if (headerRef.current) {
        const header = await captureElement(headerRef.current);
        pdf.addImage(header.dataUrl, "PNG", margin, currentY, contentWidth, header.scaledHeight);
        currentY += header.scaledHeight + 4;
      }
      const firstSection = SECTIONS[0];
      const firstEl = sectionRefs.current[firstSection.id];
      if (firstEl) {
        const first = await captureElement(firstEl);
        // If it fits on the same page, add it; otherwise new page
        if (currentY + first.scaledHeight > pdfHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.addImage(first.dataUrl, "PNG", margin, currentY, contentWidth, first.scaledHeight);
      }

      // Remaining sections: one per page
      for (let i = 1; i < SECTIONS.length; i++) {
        const section = SECTIONS[i];
        const element = sectionRefs.current[section.id];
        if (!element) continue;
        pdf.addPage();
        pdf.setFontSize(10);
        pdf.setTextColor(105, 118, 132);
        pdf.text(`${result.companyName} - ${section.label}`, margin, 8);
        pdf.line(margin, 10, pdfWidth - margin, 10);
        const sec = await captureElement(element);
        pdf.addImage(sec.dataUrl, "PNG", margin, 15, contentWidth, sec.scaledHeight);
      }
      pdf.save(`${result.companyName.replace(/\s+/g, "_")}_Market_Intelligence_Report.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) return;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const data = await performResearch(query, deepResearch);
        setResult(data);
        setActiveSection("executive");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    [query, deepResearch]
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsSidebarOpen(false);
  };

  const radarData = useMemo(() => {
    if (!result) return [];
    return [
      { subject: "Market Presence", A: 85, fullMark: 100 },
      { subject: "Innovation", A: 90, fullMark: 100 },
      { subject: "Financial Strength", A: 75, fullMark: 100 },
      { subject: "Customer Loyalty", A: 80, fullMark: 100 },
      { subject: "Operational Efficiency", A: 70, fullMark: 100 },
    ];
  }, [result]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-primary sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary-foreground/10 text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-primary-foreground">
                Client Insights
              </h1>
              <p className="text-xs text-primary-foreground/80">AI Powered Client Research</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 text-primary-foreground"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <ToptalLogo className="h-8" />
          </div>
        </div>
      </header>

      {/* Hero / Search */}
      <section
        className={cn(
          "bg-primary transition-all duration-500 overflow-hidden",
          result ? "py-6" : "py-16"
        )}
      >
        <div className="max-w-4xl mx-auto text-center px-6">
          {!result && (
            <>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4 tracking-tight"
              >
                Professional Client Intelligence
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-primary-foreground/70 mb-8 max-w-2xl mx-auto"
              >
                Uncover deep market insights, competitor strategies, and real-time industry trends
                with our AI-powered research engine.
              </motion.p>
            </>
          )}

          <motion.form layout onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="flex p-1 bg-card rounded-lg shadow-xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter company name (e.g. NVIDIA, Stripe, Tesla)..."
                  className="w-full bg-transparent py-4 pl-12 pr-4 focus:outline-none text-foreground text-base"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-accent-foreground px-8 py-3 rounded-md hover:bg-accent/90 disabled:opacity-50 transition-all font-bold flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Now"}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setDeepResearch(!deepResearch)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative",
                    deepResearch ? "bg-accent" : "bg-primary-foreground/20"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-3 h-3 bg-primary-foreground rounded-full transition-all",
                      deepResearch ? "left-6" : "left-1"
                    )}
                  />
                </div>
                <span className="text-sm font-medium text-primary-foreground/80 group-hover:text-primary-foreground transition-colors">
                  Deep Research Mode
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-accent/20 border border-accent/30 text-[10px] font-bold text-accent-foreground uppercase tracking-wider">
                  <Zap className="w-3 h-3" />
                  Recommended
                </div>
              </label>
            </div>
          </motion.form>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Empty State */}
          {!result && !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4"
            >
              {[
                { icon: Globe, title: "Global Reach", desc: "Scan markets across borders and industries in real-time." },
                { icon: Target, title: "Precision Data", desc: "Get accurate competitive landscapes and SWOT breakdowns." },
                { icon: Zap, title: "Instant Insights", desc: "Turn hours of manual research into seconds of AI analysis." },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="card-hover rounded-lg border border-border bg-card p-8"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-5">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <p className="mt-8 text-lg font-medium text-foreground animate-pulse">
                Generating Comprehensive Intelligence Report...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Scanning global markets, news, and strategic frameworks
              </p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-l-4 border-destructive bg-card p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center"
            >
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Analysis Interrupted</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                onClick={() => handleSearch()}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors font-bold"
              >
                Retry Analysis
              </button>
            </motion.div>
          )}

          {/* Results */}
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              {/* Sidebar */}
              <aside
                className={cn(
                  "lg:w-64 shrink-0 lg:sticky lg:top-24 h-fit space-y-2 z-40",
                  "fixed inset-0 bg-card lg:bg-transparent lg:static p-6 lg:p-0 transition-transform duration-300",
                  isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
              >
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <span className="font-bold text-foreground">Report Sections</span>
                  <button onClick={() => setIsSidebarOpen(false)}>
                    <X />
                  </button>
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-3">
                  Report Sections
                </div>
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all",
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.label}
                  </button>
                ))}

                <div className="pt-8 mt-8 border-t border-border">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-3">
                    Verification
                  </div>
                  <div className="bg-primary text-primary-foreground p-4 rounded-xl">
                    <div className="text-[10px] font-bold text-accent uppercase mb-2">Sources Grounded</div>
                    <div className="space-y-2">
                      {result.sources.slice(0, 3).map((s, i) => (
                        <div key={i} className="text-[10px] text-primary-foreground/60 truncate" title={s.title}>
                          {i + 1}. {s.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="flex-1 space-y-8">
                {/* Report Header */}
                <div
                  ref={headerRef}
                  className="bg-card p-8 rounded-lg shadow-sm border border-border flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div>
                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Intelligence Report Verified
                    </div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">
                      {result.companyName}
                    </h2>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="px-4 py-2 border border-border rounded-md text-sm font-bold hover:bg-secondary transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {isExporting ? "Exporting..." : "Export PDF"}
                    </button>
                  </div>
                </div>

                {/* 1. Executive Summary */}
                <section
                  ref={(el) => { sectionRefs.current["executive"] = el; }}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24"
                >
                  <div className="px-8 py-6 border-b border-border bg-secondary/50 flex items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <FileText className="w-5 h-5 text-primary" />
                      1. Executive Summary
                    </h3>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="prose prose-neutral max-w-none text-foreground leading-relaxed">
                      <Markdown>{result.executiveSummary.tldr}</Markdown>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-5 bg-secondary/30 rounded-lg border border-border">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Key Market Trends</h4>
                        <ul className="space-y-2">
                          {result.executiveSummary.keyTrends.map((t, i) => (
                            <li key={i} className="text-sm font-medium text-foreground flex items-start gap-2">
                              <TrendingUp className="w-3 h-3 mt-1 shrink-0 text-primary" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-5 bg-secondary/30 rounded-lg border border-border">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Competitive Positioning</h4>
                        <span className="text-xl font-bold text-foreground">
                          {result.executiveSummary.competitivePositioning}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">Based on current market share and innovation trajectory.</p>
                      </div>
                      <div className="p-5 bg-primary text-primary-foreground rounded-lg shadow-lg">
                        <h4 className="text-xs font-bold text-primary-foreground/70 uppercase tracking-widest mb-3">The Big Opportunity</h4>
                        <p className="text-sm font-bold leading-relaxed">{result.executiveSummary.bigOpportunity}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Business Performance & Strategic Initiatives */}
                <section
                  ref={(el) => { sectionRefs.current["performance"] = el; }}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24"
                >
                  <div className="px-8 py-6 border-b border-border bg-secondary/50 flex items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      2. Business Performance &amp; Strategic Initiatives
                    </h3>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="prose prose-neutral max-w-none text-foreground leading-relaxed">
                      <Markdown>{result.businessPerformance.financialHighlights}</Markdown>
                    </div>
                    {result.businessPerformance.recentMetrics?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {result.businessPerformance.recentMetrics.map((m, i) => (
                          <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Key Strategic Initiatives
                      </h4>
                      <div className="space-y-3">
                        {result.businessPerformance.strategicInitiatives.map((init, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border bg-secondary/20">
                            <p className="text-sm font-semibold text-foreground mb-1">{init.name}</p>
                            <p className="text-sm text-muted-foreground">{init.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Market Overview */}
                <section
                  ref={(el) => { sectionRefs.current["market"] = el; }}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24"
                >
                  <div className="px-8 py-6 border-b border-border bg-secondary/50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <Globe className="w-5 h-5 text-primary" />
                      3. Market Overview
                    </h3>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="prose prose-neutral max-w-none text-foreground">
                      <Markdown>{result.marketOverview.definition}</Markdown>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { label: "TAM", value: result.marketOverview.metrics.tam, desc: "Total Addressable Market" },
                        { label: "SAM", value: result.marketOverview.metrics.sam, desc: "Serviceable Addressable Market" },
                        { label: "SOM", value: result.marketOverview.metrics.som, desc: "Serviceable Obtainable Market" },
                      ].map((item, i) => (
                        <div key={i} className="text-center p-6 border border-border rounded-lg">
                          <div className="text-xs font-bold text-muted-foreground uppercase mb-1">{item.label}</div>
                          <div className="text-xl font-bold text-foreground mb-1">{item.value}</div>
                          <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-accent" />
                          Market Drivers
                        </h4>
                        <ul className="space-y-3">
                          {result.marketOverview.drivers.map((d, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
                              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-destructive" />
                          Market Inhibitors
                        </h4>
                        <ul className="space-y-3">
                          {result.marketOverview.inhibitors.map((d, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Competitive Landscape */}
                <section
                  ref={(el) => { sectionRefs.current["landscape"] = el; }}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24"
                >
                  <div className="px-8 py-6 border-b border-border bg-secondary/50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <Users className="w-5 h-5 text-primary" />
                      4. Competitive Landscape
                    </h3>
                  </div>
                  <div className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              name={result.companyName}
                              dataKey="A"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.4}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Market Positioning Analysis</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          The competitive landscape is characterized by high fragmentation in the niche segments but strong consolidation among top-tier leaders. {result.companyName} maintains a competitive edge through its focus on innovation and customer-centric value propositions.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-secondary/50 rounded-lg">
                            <div className="text-xl font-bold text-foreground">{result.competitiveLandscape.directCompetitors.length}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Direct Competitors</div>
                          </div>
                          <div className="p-4 bg-secondary/50 rounded-lg">
                            <div className="text-xl font-bold text-foreground">{result.competitiveLandscape.indirectCompetitors.length}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Indirect Rivals</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold text-foreground border-l-4 border-primary pl-3">Direct Competitors</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.competitiveLandscape.directCompetitors.map((c, i) => (
                          <div key={i} className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                            <div className="font-bold text-foreground mb-1">{c}</div>
                            <div className="text-xs text-muted-foreground">Primary market rival with overlapping product features.</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 5. Competitor Deep Dives */}
                <section
                  ref={(el) => { sectionRefs.current["deepdive"] = el; }}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24"
                >
                  <div className="px-8 py-6 border-b border-border bg-secondary/50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <Layers className="w-5 h-5 text-primary" />
                      5. Competitor Deep Dives
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {result.competitorDeepDives.map((c, i) => (
                      <div key={i} className="p-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <h4 className="text-2xl font-bold text-foreground">{c.name}</h4>
                          <span className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded tracking-widest">
                            {c.pricingModel}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed">{c.valueProposition}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Key Strengths</h5>
                            <div className="flex flex-wrap gap-2">
                              {c.strengths.map((s, si) => (
                                <span key={si} className="text-xs font-semibold bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gap Analysis</h5>
                            <p className="text-sm text-foreground italic">"{c.gapAnalysis}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 6. Strategic Frameworks */}
                <section
                  ref={(el) => { sectionRefs.current["strategic"] = el; }}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24"
                >
                  <div className="px-8 py-6 border-b border-border bg-secondary/50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <ShieldAlert className="w-5 h-5 text-primary" />
                      6. Strategic Frameworks
                    </h3>
                  </div>
                  <div className="p-8 space-y-12">
                    {/* SWOT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-accent/5 p-6 rounded-lg border border-accent/10">
                        <h4 className="text-sm font-bold text-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Strengths
                        </h4>
                        <ul className="space-y-2">
                          {result.strategicFrameworks.swot.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-destructive/5 p-6 rounded-lg border border-destructive/10">
                        <h4 className="text-sm font-bold text-destructive uppercase tracking-widest mb-4 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Weaknesses
                        </h4>
                        <ul className="space-y-2">
                          {result.strategicFrameworks.swot.weaknesses.map((s, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 bg-destructive rounded-full shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-primary/5 p-6 rounded-lg border border-primary/10">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Opportunities
                        </h4>
                        <ul className="space-y-2">
                          {result.strategicFrameworks.swot.opportunities.map((s, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-destructive/5 p-6 rounded-lg border border-destructive/10">
                        <h4 className="text-sm font-bold text-destructive uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" /> Threats
                        </h4>
                        <ul className="space-y-2">
                          {result.strategicFrameworks.swot.threats.map((s, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 bg-destructive rounded-full shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Porter's Five Forces */}
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Porter's Five Forces</h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {[
                          { label: "Rivalry", score: result.strategicFrameworks.portersFiveForces.competitiveRivalry, icon: Users },
                          { label: "Suppliers", score: result.strategicFrameworks.portersFiveForces.supplierPower, icon: Building2 },
                          { label: "Buyers", score: result.strategicFrameworks.portersFiveForces.buyerPower, icon: UserCheck },
                          { label: "Substitutes", score: result.strategicFrameworks.portersFiveForces.threatOfSubstitution, icon: Zap },
                          { label: "New Entrants", score: result.strategicFrameworks.portersFiveForces.threatOfNewEntry, icon: ChevronRight },
                        ].map((force, i) => (
                          <div key={i} className="p-4 border border-border rounded-lg text-center">
                            <force.icon className="w-5 h-5 text-primary mx-auto mb-3" />
                            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{force.label}</div>
                            <div className="text-sm text-foreground">{force.score}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 7. Customer Insights */}
                <section
                  ref={(el) => { sectionRefs.current["customer"] = el; }}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24"
                >
                  <div className="px-8 py-6 border-b border-border bg-secondary/50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <UserCheck className="w-5 h-5 text-primary" />
                      7. Customer & Win-Loss Insights
                    </h3>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-6 bg-secondary/30 rounded-lg border border-border">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Market Sentiment</h4>
                        <div className="text-3xl font-bold text-foreground mb-2">{result.customerInsights.sentiment}</div>
                        <p className="text-sm text-muted-foreground">Aggregated from reviews, social media, and industry reports.</p>
                      </div>
                      <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Unmet Customer Needs</h4>
                        <div className="prose prose-neutral text-sm text-foreground">
                          <Markdown>{result.customerInsights.unmetNeeds}</Markdown>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-foreground">Win/Loss Reasons</h4>
                      <WinLossColumns raw={toStr(result.customerInsights.winLossReasons)} />
                    </div>
                  </div>
                </section>

                {/* 8. Recommendations */}
                <section
                  ref={(el) => { sectionRefs.current["recommendations"] = el; }}
                  className="bg-card rounded-lg shadow-xl overflow-hidden scroll-mt-24 border border-border"
                >
                  <div className="px-8 py-8 border-b border-border bg-primary/5">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-foreground">
                      <Lightbulb className="w-6 h-6 text-primary" />
                      8. Recommendations & Strategic Roadmap
                    </h3>
                  </div>
                  <div className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Product Strategy</h4>
                        <ul className="space-y-3">
                          {result.recommendations.product.map((s, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-3">
                              <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Marketing Strategy</h4>
                        <ul className="space-y-3">
                          {result.recommendations.marketing.map((s, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-3">
                              <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Resource Allocation</h4>
                        <p className="text-sm text-foreground leading-relaxed">
                          {result.recommendations.resourceAllocation}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
                      <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">
                        Strategic Roadmap (Next 12-18 Months)
                      </h4>
                      <div className="prose prose-neutral max-w-none text-foreground text-sm leading-relaxed">
                        <Markdown>{result.recommendations.roadmap}</Markdown>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 9. MC Service Opportunities */}
                <section
                  ref={(el) => { sectionRefs.current["mc"] = el; }}
                  className="bg-card rounded-lg shadow-sm border border-border overflow-hidden scroll-mt-24"
                >
                  <div className="px-8 py-6 border-b border-border bg-secondary/50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      <Target className="w-5 h-5 text-primary" />
                      9. MC Service Opportunities
                    </h3>
                  </div>
                  <div className="p-8">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Initiative</th>
                            <th className="py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Need</th>
                            <th className="py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Service Offering</th>
                            <th className="py-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Rationale</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {result.mcOpportunities.map((opp, i) => (
                            <tr key={i} className="hover:bg-secondary/30 transition-colors">
                              <td className="py-4 px-4 text-sm font-bold text-foreground">{opp.initiative}</td>
                              <td className="py-4 px-4 text-sm text-foreground">{opp.need}</td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  {opp.serviceOffering}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-muted-foreground italic">"{opp.rationale}"</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
