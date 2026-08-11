import { useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import HubFinder from "@/components/HubFinder";

type TabId = "conversation" | "tech" | "talent";

const TECH_ENGAGEMENTS = [
  {
    engagement: "ERP / platform / Salesforce implementation",
    pairs: [
      { trigger: "How are you thinking about adoption — do your people have what they need to actually change how they work?", hub: "Change Management" },
      { trigger: "Now that the system is live, are your processes and team model keeping up?", hub: "Business Transformation and Risk Advisory" },
    ],
  },
  {
    engagement: "AI / ML implementation",
    pairs: [
      { trigger: "When your CFO asks if this is working — do you have a way to measure ROI yet?", hub: "Finance Transformation & CFO Advisory", subtitle: "AI ROI - Value Realization", overrideLinks: [{ label: "Overview Deck", url: "https://docs.google.com/presentation/d/1OcYkwpnaHsmAcJSunA6-pbLot9Bh_0N5RLpMX6aErQQ/edit?usp=drive_link", icon: "external" as const }, { label: "Discussion Deck", url: "/ai-roi-value-realization.html", icon: "file" as const }] },
      { trigger: "The tools are live — are people actually using them? What's the resistance looking like?", hub: "Change Management" },
    ],
  },
  {
    engagement: "Agile / product model transformation",
    pairs: [
      { trigger: "Now that the model is in place — are you confident you're building the right things?", hub: "Strategy & Growth Consulting" },
      { trigger: "Are the team behaviors and structure actually keeping up with the new model?", hub: "Change Management" },
    ],
  },
  {
    engagement: "Cloud migration / app modernization",
    pairs: [
      { trigger: "Now that infrastructure changed — how are your processes and team model keeping up?", hub: "Business Transformation and Risk Advisory" },
    ],
  },
  {
    engagement: "Large-scale tech talent deployment (10+ resources)",
    pairs: [
      { trigger: "How are you thinking about your long-term talent model as AI changes what your engineers do?", hub: "Adaptive Organization" },
    ],
  },
  {
    engagement: "Supply chain / ERP / ops systems",
    pairs: [
      { trigger: "Do you have visibility into where AI could automate in your value chain today?", hub: "Operations & Performance Improvement" },
      { trigger: "How resilient is your supply chain if your primary supplier or region gets disrupted?", hub: "Supply Chain and Procurement Consulting" },
    ],
  },
];

const TALENT_SIGNALS = [
  { signal: "Long-term staffing engagement (18+ months, stable team)", trigger: "You've had a consistent team in place for over a year — has the business problem evolved? What are you trying to solve next?", path: "Business Transformation and Risk Advisory / Strategy & Growth Consulting" },
  { signal: "Multiple roles placed across two or more functions", trigger: "You're scaling across multiple areas at once — is that driven by a strategic shift or a capacity gap?", path: "Strategy & Growth Consulting / Business Transformation and Risk Advisory" },
  { signal: "Finance or FP&A talent placed", trigger: "Now that you have the right people — do you have the processes and tools to fully leverage them?", path: "Finance Transformation & CFO Advisory" },
  { signal: "PM or change management talent in a transformation", trigger: "You have the people in place — how's the change actually landing with the broader team?", path: "Change Management" },
  { signal: "Ops or supply chain talent expanding", trigger: "Your ops team is growing — are processes keeping up, or are efficiency gaps building?", path: "Operations & Performance Improvement / Supply Chain and Procurement Consulting" },
  { signal: "Senior IC placed (director / VP level)", trigger: "At that seniority, they're likely driving a broader agenda — are there areas where a consulting sprint would accelerate what they're already building?", path: "Business Transformation and Risk Advisory / Adaptive Organization" },
];

const HUB_META: Record<string, { practice: string; color: string; sellersSheet?: string; overviewDeck?: string }> = {
  "Strategy & Growth Consulting":          { practice: "Strategy",   color: "#2563eb", sellersSheet: "https://docs.google.com/document/d/15j8g5YQ7bdnigvMeR1eAgU2K5W9_EZMLG8Xs3OQVySc/edit?usp=sharing",  overviewDeck: "https://docs.google.com/presentation/d/1lN6S_ESoqT3ZLkBr7w5MP6rsnp8_974nxLIJhenJutk/edit?usp=sharing" },
  "Business Transformation and Risk Advisory":  { practice: "Strategy",   color: "#2563eb", sellersSheet: "https://docs.google.com/document/d/1kKYqaVQqdZNEbw1q5HxsS-dX3Ce0a-4xdai6QpxnAS8/edit?usp=sharing",  overviewDeck: "https://docs.google.com/presentation/d/1Dk3zvl6pwuoew2Y2yi8X3k8gR8owBN5SeK-vNh3Vmf4/edit?usp=drive_link" },
  "Finance Transformation & CFO Advisory":   { practice: "Finance",    color: "#16a34a", sellersSheet: "https://docs.google.com/document/d/1fa7xf7L0V7417A8xEOfXLxhEF3sSchhRQMKhDtGpdsk/edit?usp=sharing",  overviewDeck: "https://docs.google.com/presentation/d/1_incQcSAXJG5faq7hOjorbbjG4IoANs7VQTMg6tZdVk/edit?usp=drive_link" },
  "Change Management":        { practice: "People",     color: "#7c3aed", overviewDeck: "https://docs.google.com/presentation/d/11uGqDTdhR8q7SJqBMUxxmNPescZB5WHQz2ys75kQ2Zs/edit?usp=drive_link" },
  "Adaptive Organization": { practice: "People",     color: "#7c3aed", sellersSheet: "https://docs.google.com/document/d/1GjjF_7PxsKckocTSL9rRuVXQaHhpONNyzQAeaxHgspk/edit?usp=sharing",  overviewDeck: "https://docs.google.com/presentation/d/11xmJIF7nBPrY596wA3wXRqbmvHXv60q5qwRG4hLUuDo/edit?usp=sharing" },
  "Operations & Performance Improvement":  { practice: "Operations", color: "#f97316", sellersSheet: "https://docs.google.com/document/d/1lah0V9ttO_KdMhXPDT2k-6-FaGrPRT9TrYATtVteLI0/edit?usp=sharing", overviewDeck: "https://docs.google.com/presentation/d/1bKjSw5MgD5mzLbK-lMtIGoKXOwj09QH7fXRfOB9MLvY/edit?usp=drive_link" },
  "Supply Chain and Procurement Consulting":             { practice: "Operations", color: "#f97316", sellersSheet: "https://docs.google.com/document/d/1JLsclhpbRlMiyiEEXGDxHK86azS9ittyOi6GCk-zwPQ/edit?usp=sharing", overviewDeck: "https://docs.google.com/presentation/d/1dn-i3M0XlWLs9t0F3PxIJeaNPIHBV5bluSgaasbaBFY/edit?usp=sharing" },
};

const PRACTICE_BADGE: Record<string, string> = {
  Strategy:   "bg-primary/10 text-primary",
  Finance:    "bg-accent text-accent-foreground",
  Operations: "bg-destructive/10 text-destructive",
  People:     "bg-muted text-muted-foreground",
};

function selectCls(isEmpty: boolean): string {
  return [
    "h-9 rounded-md border border-input bg-background px-3 text-sm",
    "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    "cursor-pointer appearance-none pr-8",
    isEmpty ? "text-muted-foreground" : "text-foreground",
  ].join(" ");
}

interface OverrideLink { label: string; url: string; icon?: "external" | "file" }

interface ResultCardProps {
  hub: string;
  trigger: string;
  path?: string;
  subtitle?: string;
  overrideLinks?: OverrideLink[];
}

function ResultCard({ hub, trigger, path, subtitle, overrideLinks }: ResultCardProps) {
  const meta = HUB_META[hub];
  if (!meta) return null;
  return (
    <div className="mt-5 rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRACTICE_BADGE[meta.practice] ?? ""}`}>
          {meta.practice}
        </span>
        <div>
          <h3 className="text-base font-bold leading-tight" style={{ color: meta.color }}>{hub}</h3>
          {subtitle && <p className="text-sm font-semibold" style={{ color: meta.color }}>{subtitle}</p>}
        </div>
        {path && path.includes(" / ") && (
          <span className="ml-auto text-xs text-muted-foreground italic">Also consider: {path.split(" / ").filter(h => h !== hub).join(", ")}</span>
        )}
      </div>
      <div className="border-l-4 border-primary/40 pl-4">
        <p className="text-sm italic text-muted-foreground">"{trigger}"</p>
      </div>
      <div className="flex flex-wrap gap-4 pt-1">
        {overrideLinks ? overrideLinks.map(lnk => (
          <a key={lnk.label} href={lnk.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            {lnk.icon === "file" ? <FileText className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
            {lnk.label}
          </a>
        )) : (
          <>
            {meta.sellersSheet && (
              <a href={meta.sellersSheet} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <FileText className="h-3.5 w-3.5" />
                Seller's Sheet
              </a>
            )}
            {meta.overviewDeck && (
              <a href={meta.overviewDeck} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />
                Overview Deck
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ServiceFinder() {
  const [tab, setTab] = useState<TabId>("conversation");

  // Tab 2 state
  const [techEngagement, setTechEngagement] = useState("");
  const [techTriggerIdx, setTechTriggerIdx] = useState<number | null>(null);

  // Tab 3 state
  const [talentSignalIdx, setTalentSignalIdx] = useState<number | null>(null);

  const techEntry = TECH_ENGAGEMENTS.find(e => e.engagement === techEngagement) ?? null;
  const multiTrigger = techEntry !== null && techEntry.pairs.length > 1;
  const techResult = techEntry
    ? multiTrigger && techTriggerIdx !== null
      ? techEntry.pairs[techTriggerIdx]
      : !multiTrigger
        ? techEntry.pairs[0]
        : null
    : null;

  const talentEntry = talentSignalIdx !== null ? TALENT_SIGNALS[talentSignalIdx] : null;
  const talentHub = talentEntry ? talentEntry.path.split(" / ")[0] : null;

  const tabs: { id: TabId; label: string }[] = [
    { id: "conversation", label: "By conversation signal" },
    { id: "tech",         label: "Expand from tech engagement" },
    { id: "talent",       label: "Expand from talent account" },
  ];

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Management Consulting Service Offering Finder
      </p>
      <h2 className="mb-1 text-xl font-bold text-card-foreground tracking-tight">
        Find Your Starting Point
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Three entry points — by client conversation signal, by tech engagement, or by talent account.
      </p>

      {/* Tab pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1 — existing conversation-based finder */}
      {tab === "conversation" && <HubFinder />}

      {/* Tab 2 — tech engagement expander */}
      {tab === "tech" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Select the active tech engagement, then choose the trigger question that fits what you're hearing. The tool will identify the best-fit MC hub to introduce.
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-medium text-foreground">
            <span className="whitespace-nowrap">The current tech engagement is</span>
            <div className="relative">
              <select
                value={techEngagement}
                onChange={e => { setTechEngagement(e.target.value); setTechTriggerIdx(null); }}
                className={selectCls(!techEngagement)}
                style={{ minWidth: 320 }}
              >
                <option value="" disabled>select a tech engagement...</option>
                {TECH_ENGAGEMENTS.map(e => (
                  <option key={e.engagement} value={e.engagement}>{e.engagement}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
            </div>

            {techEntry && multiTrigger && (
              <>
                <span className="whitespace-nowrap">and the opening question I'm using is</span>
                <div className="relative">
                  <select
                    value={techTriggerIdx !== null ? String(techTriggerIdx) : ""}
                    onChange={e => setTechTriggerIdx(Number(e.target.value))}
                    className={selectCls(techTriggerIdx === null)}
                    style={{ minWidth: 380 }}
                  >
                    <option value="" disabled>select a trigger question...</option>
                    {techEntry.pairs.map((p, i) => (
                      <option key={i} value={i}>{p.trigger}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
                </div>
              </>
            )}
          </div>

          {techResult ? (
            <ResultCard hub={techResult.hub} trigger={techResult.trigger} subtitle={techResult.subtitle} overrideLinks={techResult.overrideLinks} />
          ) : techEntry && !multiTrigger ? null : techEntry ? (
            <p className="mt-4 text-xs italic text-muted-foreground/60">
              Select a trigger question above to see the recommended hub.
            </p>
          ) : (
            <p className="mt-4 text-xs italic text-muted-foreground/60">
              Select a tech engagement above to get started.
            </p>
          )}
        </div>
      )}

      {/* Tab 3 — talent account expander */}
      {tab === "talent" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Select the talent engagement signal you're seeing in the account. The tool will surface the trigger question and the best MC hub to introduce.
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-medium text-foreground">
            <span className="whitespace-nowrap">The signal I'm seeing is</span>
            <div className="relative">
              <select
                value={talentSignalIdx !== null ? String(talentSignalIdx) : ""}
                onChange={e => setTalentSignalIdx(Number(e.target.value))}
                className={selectCls(talentSignalIdx === null)}
                style={{ minWidth: 380 }}
              >
                <option value="" disabled>select a talent signal...</option>
                {TALENT_SIGNALS.map((s, i) => (
                  <option key={i} value={i}>{s.signal}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
            </div>
          </div>

          {talentEntry && talentHub ? (
            <ResultCard hub={talentHub} trigger={talentEntry.trigger} path={talentEntry.path} />
          ) : (
            <p className="mt-4 text-xs italic text-muted-foreground/60">
              Select a talent signal above to see the recommended hub and trigger question.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
