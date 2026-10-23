import { L2_COLORS } from "@/data/mcStorefront";

// An MC offering. Catalog offerings arrive as "L2 > L3" and show the L3 with its area above in the area's colour;
// older free-text names ("AI Consulting") show as plain text.
export function OfferingPill({ value }: { value: string }) {
  const [l2, l3] = value.split(" > ");
  const colors = l3 ? L2_COLORS[l2] : undefined;
  if (!colors) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
        {value}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: colors.text }}>
        {l2}
      </span>
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {l3}
      </span>
    </span>
  );
}
