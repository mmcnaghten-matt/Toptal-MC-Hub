import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/cannes-diagnostic/context/SurveyContext";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Target, Layers } from "lucide-react";
import toptalLogo from "@/assets/toptal-logo-white.svg";

export default function LandingPage() {
  const { isAuthenticated } = useSurvey();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && !isAuthenticated) navigate("/cannes-diagnostic");
  }, [mounted, isAuthenticated, navigate]);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
          <img src={toptalLogo} alt="Toptal" className="h-10 mb-8" />
          <p className="text-sm font-medium uppercase tracking-wider opacity-80 mb-3">Diagnostic Assessment</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            M&E Fan/Audience Platform<br />Diagnostic
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl leading-relaxed">
            Evaluate your organization's maturity in building direct, data-driven relationships with fans and audiences.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Target, title: "8 Key Dimensions", desc: "Comprehensive assessment across data foundations, content personalization, AI-driven engagement, and more." },
            { icon: BarChart3, title: "5 Maturity Levels", desc: "From Foundational (Level 1) to Optimized & Adaptive (Level 5) — understand exactly where you stand." },
            { icon: Layers, title: "Benchmark Comparison", desc: "See how you compare against industry leaders like YouTube, Spotify, Disney+, and more." },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6">
              <item.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface rounded-xl p-8 mb-10 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">About This Assessment</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Welcome to the <strong className="text-foreground">M&E Fan/Audience Platform Diagnostic</strong> — a strategic
              assessment designed to evaluate your organization's maturity in building direct,
              data-driven relationships with fans and audiences.
            </p>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              This diagnostic covers <strong className="text-foreground">8 key dimensions</strong> of fan/audience platform
              capability, from data foundations and content personalization to AI-driven engagement
              and ecosystem integration.
            </p>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Upon completion, you'll receive a <strong className="text-foreground">maturity score and level</strong>, along
              with tailored recommendations and a benchmark comparison against leading platforms.
            </p>
          </div>
        </div>

        <div className="bg-accent rounded-xl p-8 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-2">Ready to Begin?</h2>
          <p className="text-muted-foreground mb-6 text-[15px]">
            The assessment takes approximately <strong className="text-foreground">5 minutes</strong> to complete. You will be asked to provide some basic information before starting.
          </p>
          <button
            onClick={() => navigate("/cannes-diagnostic/user-info")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
