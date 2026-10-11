import { Loader2, Mail, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: string;
  website?: string;
  /** The signed-in person's Toptal address, null when there is none. Shown read-only; it cannot be changed. */
  email: string | null;
  emailBusy: boolean;
  emailError: string | null;
  onWait: () => void;
  onEmail: () => void;
}

// Shown when the form is submitted: wait on this page, or have the finished report emailed.
export function SubmitChoiceDialog({ open, onOpenChange, company, website, email, emailBusy, emailError, onWait, onEmail }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !emailBusy && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Research {company}</DialogTitle>
          <DialogDescription>
            This research takes about 5 to 7 minutes{website ? ` (company website: ${website})` : ""}. How would you like to get the report?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onWait}
            disabled={emailBusy}
            className="flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          >
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>
              <span className="block font-semibold text-foreground">Wait here</span>
              <span className="block text-sm text-muted-foreground">Keep this page open. The report appears here when it is done.</span>
            </span>
          </button>

          <div className={email ? "rounded-lg border border-border p-4" : "rounded-lg border border-border bg-muted/40 p-4"}>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">Email me the report</p>
                {email ? (
                  <>
                    <p className="text-sm text-muted-foreground">You can close this page. We will send a link to:</p>
                    <p className="mt-1 break-all rounded bg-muted px-2 py-1 text-sm font-medium text-foreground" data-testid="report-email">{email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reports are only sent to your own Toptal login address. The report is saved for 30 days and only you can open it.
                    </p>
                    <button
                      type="button"
                      onClick={onEmail}
                      disabled={emailBusy}
                      className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {emailBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                      Email me the report
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Emailed reports are only available when you are signed in with your @toptal.com account.</p>
                )}
                {emailError && <p role="alert" className="mt-2 text-sm font-medium text-destructive">{emailError}</p>}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
