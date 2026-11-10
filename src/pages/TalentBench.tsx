import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Plus, ShieldX } from "lucide-react";
import { toast } from "sonner";
import ToptalLogo from "@/components/ToptalLogo";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TalentCard } from "@/components/TalentCard";
import { TalentProfileDialog } from "@/components/TalentProfileDialog";
import { AREA_BY_ID } from "@/data/mcStorefront";
import { useRemoveTalent, useTalentBenchAccess, useTalentProfiles } from "@/hooks/useTalentBench";
import { TALENT_AREA_IDS, TALENT_ROLES, groupTalent, type TalentProfile } from "@/lib/talentBench";

// Talent Bench: pre-identified talent ready to serve as Engagement Leader, Manager or Specialist, by service area. Restricted to the
// people on the access list (the database enforces it; this page also hides itself). Reached from Way of Working.

export default function TalentBench() {
  const navigate = useNavigate();
  const { hasAccess, loading } = useTalentBenchAccess();
  const { data: people = [], isLoading, error } = useTalentProfiles(hasAccess);
  const remove = useRemoveTalent();
  const [dialog, setDialog] = useState<{ cell: { service_area: string; role: string }; editing: TalentProfile | null } | null>(null);
  const [removing, setRemoving] = useState<TalentProfile | null>(null);
  const grouped = useMemo(() => groupTalent(people), [people]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 p-6 text-center">
          <ShieldX className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">The Talent Bench is limited to a few people. Contact the Management Consulting team to request access.</p>
          <Button variant="outline" onClick={() => navigate("/way-of-working")}>Back to Way of Working</Button>
        </div>
      </div>
    );
  }

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      toast.success(`${removing.name} removed`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-primary">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/way-of-working")} className="flex items-center gap-1 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground">
            <ChevronLeft className="h-4 w-4" />
            Way of Working
          </button>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-primary-foreground/10 px-2.5 py-0.5 text-xs font-medium text-primary-foreground/90">Confidential</span>
            <ToptalLogo className="h-8" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="fade-in max-w-3xl">
          <h1 className="text-2xl font-bold text-foreground">Talent Bench</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Talent identified in advance and ready to serve as an Engagement Leader, Manager or Specialist in each of three service areas. Add a profile to a cell by pasting its Toptal link.
          </p>
        </div>

        {error && <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">The Talent Bench could not be loaded: {(error as Error).message}</p>}
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading talent" />}

        {TALENT_AREA_IDS.map((areaId) => {
          const area = AREA_BY_ID.get(areaId)!;
          const total = TALENT_ROLES.reduce((n, r) => n + grouped[areaId][r.id].length, 0);
          return (
            <section key={areaId} className="fade-in overflow-hidden rounded-lg border border-border bg-card" style={{ borderLeft: `4px solid ${area.color.text}` }} data-testid={`area-${areaId}`}>
              <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                <h2 className="text-lg font-bold" style={{ color: area.color.text }}>{area.name}</h2>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: area.color.bg, color: area.color.text }}>{total}</span>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-3">
                {TALENT_ROLES.map((role) => {
                  const list = grouped[areaId][role.id];
                  return (
                    <div key={role.id} className="flex flex-col rounded-lg p-3" style={{ backgroundColor: `${area.color.text}0d` }} data-testid={`cell-${areaId}-${role.id}`}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {role.label}
                          <span className="ml-2 text-xs font-medium text-muted-foreground">{list.length}</span>
                        </h3>
                        <Button type="button" size="sm" variant="outline" className="h-7 bg-card px-2 text-xs" onClick={() => setDialog({ cell: { service_area: areaId, role: role.id }, editing: null })} aria-label={`Add a profile to ${area.name}, ${role.label}`}>
                          <Plus className="mr-1 h-3 w-3" />
                          Add profile
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {list.map((p) => (
                          <TalentCard key={p.id} person={p} color={area.color} onEdit={() => setDialog({ cell: { service_area: p.service_area, role: p.role }, editing: p })} onRemove={() => setRemoving(p)} />
                        ))}
                        {list.length === 0 && !isLoading && <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">No profiles yet</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <TalentProfileDialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)} cell={dialog?.cell ?? { service_area: "finance", role: "manager" }} editing={dialog?.editing ?? null} />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>They will be taken off the Talent Bench. Their Toptal profile is not affected. You can add them again from their link.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
