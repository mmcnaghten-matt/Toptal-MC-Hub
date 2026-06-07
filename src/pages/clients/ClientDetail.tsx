import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";
import { VERTICALS, CLIENTS, type VerticalId } from "@/data/clients";

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pipeline: { label: 'Pipeline',  bg: '#dbeafe', text: '#1d4ed8' },
  active:   { label: 'Active',    bg: '#d1fae5', text: '#065f46' },
  won:      { label: 'Won',       bg: '#a7f3d0', text: '#064e3b' },
  closed:   { label: 'Closed',    bg: '#f1f5f9', text: '#475569' },
};

export default function ClientDetail() {
  const { vertical, clientId } = useParams<{ vertical: string; clientId: string }>();
  const navigate = useNavigate();

  const verticalId = vertical as VerticalId;
  const v = vertical ? VERTICALS[verticalId] : null;
  const client = CLIENTS.find((c) => c.id === clientId && c.vertical === verticalId);

  if (!v) {
    navigate("/clients", { replace: true });
    return null;
  }

  if (!client) {
    navigate(`/clients/${verticalId}`, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen font-sans antialiased bg-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1b40] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/clients/${verticalId}`}
              className="text-blue-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {v.fullName}
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
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: v.color }}>
              {v.label} · {v.fullName}
            </p>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{client.name}</h1>
          {client.description && (
            <p className="text-blue-300/70 text-sm mt-2">{client.description}</p>
          )}
          {client.links && client.links.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {client.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 transition-colors"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Opportunities */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {client.opportunities.length === 0 ? (
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-10 text-center">
            <p className="text-sm font-semibold text-[#374151] mb-1">No opportunities added yet</p>
            <p className="text-xs text-[#9ca3af]">Content for this client is coming soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {client.opportunities.map((opp) => {
              const s = STATUS_STYLES[opp.status] ?? STATUS_STYLES.pipeline;
              return (
                <div key={opp.id} className="bg-white border border-[#e2e8f0] rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h2 className="text-base font-bold text-[#0f172a]">{opp.title}</h2>
                    <div className="flex items-center gap-2 shrink-0">
                      {opp.value && (
                        <span className="text-xs font-semibold text-[#374151] bg-[#f8fafc] border border-[#e2e8f0] rounded px-2 py-0.5">
                          {opp.value}
                        </span>
                      )}
                      <span
                        className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                        style={{ backgroundColor: s.bg, color: s.text }}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                  {opp.practice && (
                    <span className="inline-block text-xs font-medium bg-[#dbeafe] text-[#1e40af] rounded px-2 py-0.5 mb-2">
                      {opp.practice}
                    </span>
                  )}
                  <p className="text-sm text-[#374151] leading-relaxed">{opp.description}</p>
                  {opp.notes && (
                    <p className="text-xs text-[#6b7280] leading-relaxed mt-2 italic border-t border-[#f1f5f9] pt-2">{opp.notes}</p>
                  )}
                  {opp.url && (
                    <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#2563eb] hover:underline"
                      >
                        View document →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
