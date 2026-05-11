import { useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ToptalLogo from "@/components/ToptalLogo";

interface Props {
  slug: string;
  role: 'respondent' | 'admin';
  title: string;
  children: React.ReactNode;
}

function storageKey(slug: string, role: string) {
  return `diagnostic-auth-${slug}-${role}`;
}

export default function DiagnosticPasswordGate({ slug, role, title, children }: Props) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(storageKey(slug, role)) === "true"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-diagnostic-password', {
        body: { slug, password, role },
      });

      if (fnError) throw fnError;

      if (data?.valid) {
        sessionStorage.setItem(storageKey(slug, role), "true");
        setAuthenticated(true);
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

  if (authenticated) return <>{children}</>;

  const label = role === 'admin' ? 'Admin Access' : 'Diagnostic Access';
  const hint = role === 'admin'
    ? 'Enter the admin password to view results'
    : 'Enter the access code to begin the survey';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-primary rounded-xl px-5 py-4 flex items-center gap-4">
            <ToptalLogo className="h-6" />
            <div className="w-px h-6 bg-primary-foreground/30" />
            <Lock className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
          <h1 className="text-xl font-semibold text-foreground">{label}</h1>
          <p className="text-sm text-muted-foreground mt-1">{hint}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
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
