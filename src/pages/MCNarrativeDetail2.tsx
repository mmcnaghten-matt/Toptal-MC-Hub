import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

const points = [
  {
    num: "01",
    title: "Record Growth — The Business Is Compounding",
    body: "Q1 2026 was the best quarter on record: $7.5M gross, +9% YoY, three consecutive quarters of growth. ENT conversion has doubled from 12% to 27% over five quarters — that's not noise, it's a structural improvement in how we identify and close Enterprise work. PS has grown from 4% to 14% of gross revenue in twelve months, and the PS weighted pipeline is up 68% over three quarters. This isn't a recovery story or a turnaround story. It's a compounding story. The question for H2 2026 isn't whether the business works — it's how fast we can scale it.",
  },
  {
    num: "02",
    title: "Talent Is the Flywheel — Protect and Extend It",
    body: "86% of revenue is Talent, and that's a strength, not a liability. Margins are strong — 34–37% and stable for five consecutive quarters — and the Talent motion works. The shift isn't about replacing Talent with something better. It's about recognizing that every active Talent relationship is a potential MC entry point, and we don't yet have a systematic motion to activate that. The relationships are there. The trust is there. The infrastructure to convert them isn't — yet. Protecting the Talent flywheel while building the expansion motion is the dual mandate for H2.",
  },
  {
    num: "03",
    title: "Enterprise Is the Engine — and the Ceiling Is Structural",
    body: "ENT grew 25% YoY in Q1 2026 and now represents 70% of gross revenue. $13.2M weighted pipeline entering Q2 2026. New opportunity creation hit a record 122 in Q1 2026. The constraint to scale isn't demand. It's the model upstream: sellers need clear entry points (not 40+ services), squad leads need to be in front of the conversation (not behind it), and Talent accounts need to be formally mapped for expansion. Each of these is a solvable structural problem, not a market problem.",
  },
  {
    num: "04",
    title: "SMB Is a Portfolio Decision, Not a Failure",
    body: "Five consecutive quarters of YoY decline, ranging from −16% to −34%. No single SMB account has produced $200K net in the last 12 months. Three open pipeline opportunities with essentially zero tracked dollar value. ENT growth is masking this, but it needs a decision — not monitoring. The question isn't whether the SMB Talent motion works (it does). The question is whether MC belongs in it systematically: where to allocate PS pursuit effort, whether to defend SMB share or focus capacity on ENT, and what role SMB plays in the 2026 plan. Making the call is the task — either way.",
  },
  {
    num: "05",
    title: "Professional Services Is the Right Bet — At the Right Scale",
    body: "PS grew 4x in one year, from 4% to 14% of gross revenue. The PS weighted pipeline has grown from $1.25M to $2.10M over three quarters — a 68% increase — while still climbing as Talent pipeline pulled back slightly from its Q1 peak. The PS win rate is accelerating: 14% → 27% → 44% over three quarters (with the caveat that sample sizes of 7, 11, and 9 deals are too small to confirm a trend). What's missing isn't the market signal or the talent to deliver it. It's consistent signal recognition upstream from ESEs and CPs, and domain expertise embedded in the pursuit from discovery through orals.",
  },
  {
    num: "06",
    title: "H2 Is a Top-Line Story — Margin Follows Volume",
    body: "Blended margins have held at 34–37% for five consecutive quarters through a significant mix shift toward PS. That's a remarkable achievement and a sign of operational discipline. There is no further structural margin lever to pull from mix shift or PS growth — PS margins run 31–36%, in line with Talent. The H2 2026 story has to be about revenue volume: converting the 83 Solutioning opportunities currently in pipeline, deepening relationships in the top 30 Talent accounts, winning more ENT mandates, and deciding what to do about SMB. Margin is a deal-by-deal pricing call; growth requires a motion.",
  },
];

export default function MCNarrativeDetail2() {
  return (
    <div className="min-h-screen font-sans antialiased bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1b40] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/mc-plan-2"
              className="text-blue-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to MC Plan
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <ToptalLogo className="h-9" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-300/80">
            MC Plan · Confidential
          </p>
        </div>
      </header>

      {/* Page heading */}
      <div className="bg-[#0d1b40] border-b border-white/10 pb-10 pt-10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400 mb-3">
            MC Business at a Glance
          </p>
          <h1 className="text-3xl font-extrabold text-white">Deeper Analysis</h1>
          <p className="text-blue-300/70 text-sm mt-2">Six signals that define where we are and what comes next</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {points.map((point, i) => (
            <div key={point.num} className="flex gap-6">
              <span className="text-3xl font-extrabold text-[#e2e8f0] leading-none shrink-0 w-10 pt-0.5 select-none">
                {point.num}
              </span>
              <div className={i < points.length - 1 ? "pb-8 border-b border-[#f1f5f9] flex-1" : "flex-1"}>
                <h2 className="text-lg font-bold text-[#0f172a] mb-2">{point.title}</h2>
                <p className="text-base text-[#374151] leading-relaxed">{point.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
