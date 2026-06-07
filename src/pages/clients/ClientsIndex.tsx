import { useNavigate } from "react-router-dom";
import ToptalLogo from "@/components/ToptalLogo";
import { VERTICALS, VERTICAL_ORDER, CLIENTS } from "@/data/clients";

export default function ClientsIndex() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans antialiased bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1b40] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <ToptalLogo className="h-9" />
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-300/80">
            MC Clients · Confidential
          </p>
        </div>
      </header>

      {/* Page heading */}
      <div className="bg-[#0d1b40] border-b border-white/10 pb-10 pt-10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400 mb-3">
            Toptal Management Consulting
          </p>
          <h1 className="text-3xl font-extrabold text-white">MC Account Repository</h1>
          <p className="text-blue-300/70 text-sm mt-2">Client context, engagement history, and active opportunities by vertical</p>
        </div>
      </div>

      {/* Vertical cards */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {VERTICAL_ORDER.map((verticalId) => {
            const v = VERTICALS[verticalId];
            const clientCount = CLIENTS.filter((c) => c.vertical === verticalId).length;

            return (
              <button
                key={verticalId}
                onClick={() => navigate(`/clients/${verticalId}`)}
                className="text-left bg-white border border-[#e2e8f0] rounded-xl p-5 hover:border-[#93c5fd] hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: v.color }}
                  />
                  <span
                    className="text-sm font-extrabold"
                    style={{ color: v.color }}
                  >
                    {v.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#0f172a] mb-1.5 leading-snug">{v.fullName}</p>
                <p className="text-xs text-[#6b7280] leading-relaxed mb-4">{v.description}</p>
                <div className="flex items-center justify-between">
                  {clientCount === 0 ? (
                    <span className="text-[10px] text-[#9ca3af] italic">No clients yet</span>
                  ) : (
                    <span
                      className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                      style={{ backgroundColor: `${v.color}15`, color: v.color }}
                    >
                      {clientCount} {clientCount === 1 ? 'client' : 'clients'}
                    </span>
                  )}
                  <span className="text-xs text-[#9ca3af] group-hover:text-[#2563eb] transition-colors">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
