import { useNavigate } from "react-router-dom";
import { EXECUTIVE_SUMMARY } from "@/data/surveyData";
import { ArrowRight, BarChart3, Target, Layers } from "lucide-react";
import toptalLogo from "@/assets/toptal-logo-white.svg";

const LandingPage = () => {
  const navigate = useNavigate();
  const paragraphs = EXECUTIVE_SUMMARY.split("\n\n");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
          <img src={toptalLogo} alt="Toptal" className="h-10 mb-8" />
          <p className="text-sm font-medium uppercase tracking-wider opacity-80 mb-3">Diagnostic Assessment</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            M&E Audience/Fan Platform<br />Maturity Model
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl leading-relaxed">
            Assess your organization's readiness to evolve from a single-sided platform to a multi-sided platform (MSP) architecture.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Target, title: "6 Core Pillars", desc: "Comprehensive assessment across ecosystem strategy, data, content, monetization, architecture, and governance." },
            { icon: BarChart3, title: "5 Maturity Levels", desc: "From Foundational (Level 1) to Optimized & Adaptive (Level 5) — understand exactly where you stand." },
            { icon: Layers, title: "Visual Results", desc: "Receive a spider chart showing your maturity profile with actionable insights for advancement." },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <item.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-xl p-8 mb-10 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Executive Summary</h2>
          <div className="space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed text-[15px]">{p}</p>
            ))}
          </div>
        </div>

        <div className="bg-accent rounded-xl p-8 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-2">Ready to Begin?</h2>
          <p className="text-muted-foreground mb-6 text-[15px]">
            You will be asked a series of questions across six pillars to assess your enterprise's current capabilities and readiness to become a multi-sided platform. The assessment takes approximately 10–15 minutes.
          </p>
          <button
            onClick={() => navigate("/user-info")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Start Diagnostic
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
