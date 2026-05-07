import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSurvey } from "@/context/SurveyContext";
import { Lock } from "lucide-react";
import toptalLogo from "@/assets/toptal-logo-white.svg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "M&E Fan/Audience Diagnostic — Cannes" },
      { name: "description", content: "Assess your organization's fan and audience platform maturity." },
    ],
  }),
  component: LoginPage,
});

const VALID_PASSWORD = "Cannes2026";
const ADMIN_PASSWORD = "ADMIN2026";

function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setAuthenticated, setAdmin } = useSurvey();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === VALID_PASSWORD) {
      setAuthenticated(true);
      navigate({ to: "/landing" });
    } else if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAdmin(true);
      navigate({ to: "/admin" });
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md mx-4">
        <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
          <div className="flex flex-col items-center mb-8">
            <div className="w-full bg-primary rounded-lg py-4 flex items-center justify-center mb-6">
              <img src={toptalLogo} alt="Toptal" className="h-10" />
            </div>
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">M&E Fan/Audience Platform Diagnostic</h1>
            <p className="text-muted-foreground text-sm mt-1">Cannes Edition</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Access Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              {error && <p className="text-destructive text-sm mt-1.5">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
