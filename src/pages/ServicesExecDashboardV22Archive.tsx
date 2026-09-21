import { Link } from "react-router-dom";
import mockupHtml from "@/assets/services-exec-dashboard-mockup.html?raw";

export default function ServicesExecDashboardV22Archive() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="bg-amber-50 border-b border-amber-200 py-2.5 shrink-0">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center gap-2 text-xs text-amber-800">
          <span className="font-semibold">Archived reference — v22, superseded by the v23.0 dashboards.</span>
          <Link to="/services-exec-dashboard-mockup" className="font-semibold underline hover:text-amber-900 transition-colors">
            View current dashboards →
          </Link>
        </div>
      </div>
      <iframe
        srcDoc={mockupHtml}
        title="Toptal Services Performance — Dashboard Suite (v22 Archive)"
        style={{ width: "100vw", flex: 1, border: "none", display: "block" }}
      />
    </div>
  );
}
