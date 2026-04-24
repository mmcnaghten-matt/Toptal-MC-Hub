import DiagnosticLayout from "../components/DiagnosticLayout";
import AdminDashboard from "../components/AdminDashboard";
import { useAdminData } from "../hooks/useAdminData";
import type { DiagnosticConfig } from "../types";

interface Props {
  config: DiagnosticConfig;
}

export default function AdminPage({ config }: Props) {
  const { data: rows = [], isLoading, error } = useAdminData(config.slug);

  return (
    <DiagnosticLayout title={`${config.title} — Admin`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Failed to load data. Please refresh.</p>
      ) : (
        <AdminDashboard config={config} rows={rows} />
      )}
    </DiagnosticLayout>
  );
}
