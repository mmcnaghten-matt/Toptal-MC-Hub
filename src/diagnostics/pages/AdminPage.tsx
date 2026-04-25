import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/AdminDashboard";
import { useAdminData } from "../hooks/useAdminData";
import type { DiagnosticConfig } from "../types";

interface Props {
  config: DiagnosticConfig;
}

export default function AdminPage({ config }: Props) {
  const navigate = useNavigate();
  const { data: rows = [], isLoading, error } = useAdminData(config.slug);

  return (
    <div className="min-h-screen bg-background">
      {/* Blue admin header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-widest mb-0.5">Admin</p>
            <h1 className="text-2xl font-bold">Survey Reports</h1>
            <p className="text-primary-foreground/80 text-sm mt-0.5">{config.title}</p>
          </div>
          <button
            onClick={() => navigate(`/diagnostics/${config.slug}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-foreground/30 text-primary-foreground text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Exit
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Failed to load data. Please refresh.</p>
        ) : (
          <AdminDashboard config={config} rows={rows} />
        )}
      </main>
    </div>
  );
}
