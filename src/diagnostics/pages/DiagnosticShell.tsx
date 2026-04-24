import { useParams, Routes, Route, Navigate } from "react-router-dom";
import { getDiagnosticConfig } from "../config";
import DiagnosticPasswordGate from "../components/DiagnosticPasswordGate";
import SurveyPage from "./SurveyPage";
import ReportPage from "./ReportPage";
import AdminPage from "./AdminPage";

export default function DiagnosticShell() {
  const { slug } = useParams<{ slug: string }>();
  const config = getDiagnosticConfig(slug ?? '');

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Diagnostic not found.</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route index element={<Navigate to="survey" replace />} />

      <Route
        path="survey"
        element={
          <DiagnosticPasswordGate slug={config.slug} role="respondent">
            <SurveyPage config={config} />
          </DiagnosticPasswordGate>
        }
      />

      {/* No password on report — the responseId in the URL is already a secret */}
      <Route path="report/:responseId" element={<ReportPage config={config} />} />

      <Route
        path="admin"
        element={
          <DiagnosticPasswordGate slug={config.slug} role="admin">
            <AdminPage config={config} />
          </DiagnosticPasswordGate>
        }
      />
    </Routes>
  );
}
