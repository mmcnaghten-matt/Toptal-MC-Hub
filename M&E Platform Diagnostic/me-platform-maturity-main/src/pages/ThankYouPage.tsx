import { useNavigate } from "react-router-dom";
import { useSurvey } from "@/context/SurveyContext";
import { CheckCircle, RotateCcw } from "lucide-react";
import toptalLogo from "@/assets/toptal-logo-white.svg";

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { resetSurvey, record } = useSurvey();

  const handleRestart = () => {
    resetSurvey();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="bg-primary py-4 px-6">
        <div className="max-w-lg mx-auto">
          <img src={toptalLogo} alt="Toptal" className="h-10" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-lg mx-4 text-center">
        <div className="bg-card rounded-xl shadow-lg p-10 border border-border">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-9 h-9 text-success" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">Thank You!</h1>

          {record && (
            <p className="text-muted-foreground mb-2">
              <span className="font-medium text-foreground">{record.name}</span> from{" "}
              <span className="font-medium text-foreground">{record.enterprise}</span>
            </p>
          )}

          <p className="text-muted-foreground leading-relaxed mb-8">
            Your responses have been recorded. Thank you for completing the M&E Platform Maturity Diagnostic Assessment. Your insights will help inform strategic decisions for your platform journey.
          </p>

          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" />
            Start New Assessment
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
