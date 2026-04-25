import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  slug: string;
}

function storageKey(slug: string, role: string) {
  return `diagnostic-auth-${slug}-${role}`;
}

export default function DiagnosticEntryGate({ slug }: Props) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check both roles in parallel
      const [respondentRes, adminRes] = await Promise.all([
        supabase.functions.invoke('verify-diagnostic-password', {
          body: { slug, password, role: 'respondent' },
        }),
        supabase.functions.invoke('verify-diagnostic-password', {
          body: { slug, password, role: 'admin' },
        }),
      ]);

      if (respondentRes.data?.valid) {
        sessionStorage.setItem(storageKey(slug, 'respondent'), "true");
        navigate(`/diagnostics/${slug}/survey`, { replace: true });
      } else if (adminRes.data?.valid) {
        sessionStorage.setItem(storageKey(slug, 'admin'), "true");
        navigate(`/diagnostics/${slug}/admin`, { replace: true });
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-primary rounded-xl p-4">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Diagnostic Access</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your access code to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Password"
              autoFocus
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Verifying…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
