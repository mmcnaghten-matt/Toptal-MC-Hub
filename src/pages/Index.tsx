import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { industries, Industry, SubIndustry, Need } from "@/data/industryData";
import { useSubIndustryContent } from "@/hooks/useIndustryContent";
import { IndustrySelector } from "@/components/IndustrySelector";
import { SubIndustryNav } from "@/components/SubIndustryNav";
import { SubIndustryOverview } from "@/components/SubIndustryOverview";
import { NeedDetail } from "@/components/NeedDetail";
import { ChevronLeft } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";

const Index = () => {
  const navigate = useNavigate();
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [selectedSubIndustry, setSelectedSubIndustry] = useState<SubIndustry | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);

  const { data: dbContent } = useSubIndustryContent(selectedSubIndustry?.id ?? null);
  const displaySub = dbContent || selectedSubIndustry;

  const handleSelectIndustry = (industry: Industry) => {
    setSelectedIndustry(industry);
    setSelectedSubIndustry(industry.subIndustries[0]);
    setSelectedNeed(null);
  };

  const handleBack = () => {
    if (selectedNeed) {
      setSelectedNeed(null);
    } else if (selectedSubIndustry) {
      setSelectedIndustry(null);
      setSelectedSubIndustry(null);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 bg-primary">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary-foreground/10 text-primary-foreground">
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-primary-foreground">Management Consulting: Industry Insights</h1>
              <p className="text-xs text-primary-foreground">Q1 2026 · Confidential</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedIndustry &&
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                <span className="text-sm font-medium text-secondary-foreground">
                  {selectedIndustry.shortName}
                </span>
              </div>
            }
            <ToptalLogo className="h-8" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {!selectedIndustry ?
        <IndustrySelector
          industries={industries}
          onSelect={handleSelectIndustry} /> :


        <div className="fade-in">
            <SubIndustryNav
            subIndustries={selectedIndustry.subIndustries}
            selected={selectedSubIndustry}
            onSelect={(sub) => {
              setSelectedSubIndustry(sub);
              setSelectedNeed(null);
            }}
            colorVar={selectedIndustry.colorVar} />
          

            {displaySub && !selectedNeed &&
          <SubIndustryOverview
            subIndustry={displaySub}
            onSelectNeed={setSelectedNeed}
            colorVar={selectedIndustry.colorVar} />
          }

            {selectedNeed &&
          <NeedDetail
            need={selectedNeed}
            onBack={() => setSelectedNeed(null)}
            colorVar={selectedIndustry.colorVar} />
          }
          </div>
        }
      </main>
    </div>);

};

export default Index;