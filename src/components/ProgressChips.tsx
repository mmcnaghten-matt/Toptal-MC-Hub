import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProgressChip } from "@/services/industryResearchPipeline";

// Small status chips shown while a research run is in progress.
export function ProgressChips({ chips }: { chips: ProgressChip[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <span
          key={c.id}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            c.status === "pending" && "border-border text-muted-foreground",
            c.status === "running" && "border-primary/30 bg-primary/5 text-primary",
            c.status === "done" && "border-green-200 bg-green-50 text-green-700",
            c.status === "retried" && "border-amber-200 bg-amber-50 text-amber-700",
            c.status === "failed" && "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {c.status === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : c.status === "failed" ? (
            <AlertCircle className="h-3 w-3" />
          ) : c.status === "pending" ? (
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
          {c.label}
        </span>
      ))}
    </div>
  );
}
