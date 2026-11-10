// The "AI-LED" mark on the first client agenda of each service area (see src/data/mcStorefront.ts): the agenda we lead with first.
export function AiLedChip({ color }: { color: string }) {
  return (
    <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white" style={{ backgroundColor: color }} data-testid="ai-led-chip">
      AI-LED
    </span>
  );
}
