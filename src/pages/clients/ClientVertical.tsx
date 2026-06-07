import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";
import { VERTICALS, CLIENTS, type VerticalId } from "@/data/clients";

export default function ClientVertical() {
  const { vertical } = useParams<{ vertical: string }>();
  const navigate = useNavigate();

  const verticalId = vertical as VerticalId;
  const v = vertical ? VERTICALS[verticalId] : null;

  if (!v) {
    navigate("/clients", { replace: true });
    return null;
  }

  const clients = CLIENTS.filter((c) => c.vertical === verticalId);

  return (
    <div className="min-h-screen font-sans antialiased bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1b40] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/clients"
              className="text-blue-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Verticals
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <ToptalLogo className="h-9" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-300/80">
            MC Clients · Confidential
          </p>
        </div>
      </header>

      {/* Page heading */}
      <div className="bg-[#0d1b40] border-b border-white/10 pb-10 pt-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: v.color }}>
              {v.label}
            </p>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{v.fullName}</h1>
          <p className="text-blue-300/70 text-sm mt-2">{v.description}</p>
        </div>
      </div>

      {/* Client list */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {clients.length === 0 ? (
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-10 text-center">
            <p className="text-sm font-semibold text-[#374151] mb-1">No clients added yet</p>
            <p className="text-xs text-[#9ca3af]">Content for this vertical is coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {clients.map((client) => {
              const oppCount = client.opportunities.length;
              const activeCount = client.opportunities.filter((o) => o.status === 'active' || o.status === 'pipeline').length;

              return (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clients/${verticalId}/${client.id}`)}
                  className="text-left bg-white border border-[#e2e8f0] rounded-xl p-5 hover:border-[#93c5fd] hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-base font-bold text-[#0f172a]">{client.name}</h2>
                    <span className="text-xs text-[#9ca3af] group-hover:text-[#2563eb] transition-colors shrink-0 ml-3">→</span>
                  </div>
                  {client.description && (
                    <p className="text-xs text-[#6b7280] leading-relaxed mb-3">{client.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-auto">
                    {oppCount === 0 ? (
                      <span className="text-[10px] text-[#9ca3af] italic">No opportunities yet</span>
                    ) : (
                      <>
                        <span className="text-xs text-[#6b7280]">{oppCount} {oppCount === 1 ? 'opportunity' : 'opportunities'}</span>
                        {activeCount > 0 && (
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
                            {activeCount} active
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
