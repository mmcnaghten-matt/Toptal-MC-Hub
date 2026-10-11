import { Loader2, Server, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: string;
  website?: string;
  /** Signed in with a toptal.com account (the server checks this again). */
  eligible: boolean;
  busy: boolean;
  error: string | null;
  onWait: () => void;
  onBackground: () => void;
}

// Shown when the form is submitted: wait on this page, or let the server run it and open the report later from the page.
export function SubmitChoiceDialog({ open, onOpenChange, company, website, eligible, busy, error, onWait, onBackground }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Research {company}</DialogTitle>
          <DialogDescription>
            This research takes about 5 to 7 minutes{website ? ` (company website: ${website})` : ""}. How would you like to run it?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onWait}
            disabled={busy}
            className="flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          >
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>
              <span className="block font-semibold text-foreground">Wait here</span>
              <span className="block text-sm text-muted-foreground">Keep this page open. The report appears here when it is done.</span>
            </span>
          </button>

          <div className={eligible ? "rounded-lg border border-border p-4" : "rounded-lg border border-border bg-muted/40 p-4"}>
            <div className="flex items-start gap-3">
              <Server className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">Run in the background</p>
                {eligible ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      You can close this page. Come back later: the report appears under <span className="font-medium">Your recent reports</span> on this page.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">The report is saved for 30 days and only you can open it. Nothing is emailed.</p>
                    <button
                      type="button"
                      onClick={onBackground}
                      disabled={busy}
                      className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Run in the background
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Background runs are only available when you are signed in with your @toptal.com account.</p>
                )}
                {error && <p role="alert" className="mt-2 text-sm font-medium text-destructive">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
