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
import { useRemovePlacement, useRemoveTalent, useSetFractional, useTalentGuildAccess, useTalentProfiles } from "@/hooks/useTalentGuild";
import { GM_ROLE_ID, MAX_FRACTIONAL_LEADERS, TALENT_AREA_IDS, TALENT_ROLES, canFlagFractional, fractionalLeaderCount, groupTalent, type Placement, type TalentProfile } from "@/lib/talentGuild";

// Talent Guild: pre-identified talent ready to serve as Engagement Leader, Manager or Specialist, by service area. Restricted to the
// people on the access list (the database enforces it; this page also hides itself). Reached from Way of Working.

export default function TalentGuild() {
  const navigate = useNavigate();
  const { hasAccess, loading } = useTalentGuildAccess();
  const { data: people = [], isLoading, error } = useTalentProfiles(hasAccess);
  const remove = useRemoveTalent();
  const removePlacement = useRemovePlacement();
  const setFractional = useSetFractional();
  const [dialog, setDialog] = useState<{ cell: { service_area: string; role: string }; editing: TalentProfile | null } | null>(null);
  // `placement` set: take the person off that one service area; null: off the Talent Guild entirely
  const [removing, setRemoving] = useState<{ person: TalentProfile; placement: Placement | null } | null>(null);
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
          <p className="text-sm text-muted-foreground">The Talent Guild is limited to a few people. Contact the Management Consulting team to request access.</p>
          <Button variant="outline" onClick={() => navigate("/way-of-working")}>Back to Way of Working</Button>
        </div>
      </div>
    );
  }

  const toggleFractional = async (person: TalentProfile, placement: Placement) => {
    try {
      await setFractional.mutateAsync({ placementId: placement.id, value: !placement.fractional_leader });
      toast.success(placement.fractional_leader ? `${person.name} is no longer a Fractional Leader` : `${person.name} is now a Fractional Leader`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const { person, placement } = removing;
    try {
      if (placement && person.placements.length > 1) await removePlacement.mutateAsync({ person, placementId: placement.id });
      else await remove.mutateAsync(person.id);
      toast.success(placement && person.placements.length > 1 ? `${person.name} removed from ${AREA_BY_ID.get(placement.service_area)?.name ?? "the area"}` : `${person.name} removed`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRemoving(null);
    }
  };

  const removingFromArea = !!removing?.placement && removing.person.placements.length > 1;
  const removingAreaName = removing?.placement ? AREA_BY_ID.get(removing.placement.service_area)?.name ?? "this area" : "";

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
          <h1 className="text-2xl font-bold text-foreground">Talent Guild</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Talent identified in advance and ready to serve as an Engagement Leader, Manager or Specialist in each of four service areas. Add a profile to a cell by pasting its Toptal link.
          </p>
        </div>

        {error && <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">The Talent Guild could not be loaded: {(error as Error).message}</p>}
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading talent" />}

        {TALENT_AREA_IDS.map((areaId) => {
          const area = AREA_BY_ID.get(areaId)!;
          const total = TALENT_ROLES.reduce((n, r) => n + grouped[areaId][r.id].length, 0);
          const flagged = fractionalLeaderCount(people, areaId);
          return (
            <section key={areaId} className="fade-in overflow-hidden rounded-lg border border-border bg-card" style={{ borderLeft: `4px solid ${area.color.text}` }} data-testid={`area-${areaId}`}>
              <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                <h2 className="text-lg font-bold" style={{ color: area.color.text }}>{area.name}</h2>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: area.color.bg, color: area.color.text }}>{total}</span>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                {TALENT_ROLES.map((role) => {
                  const list = grouped[areaId][role.id];
                  return (
                    <div
                      key={role.id}
                      className={`flex flex-col rounded-lg p-3 ${role.id === "gm-member" ? "border border-dashed" : ""}`}
                      style={{ backgroundColor: `${area.color.text}0d`, ...(role.id === "gm-member" ? { borderColor: `${area.color.text}66` } : {}) }}
                      data-testid={`cell-${areaId}-${role.id}`}
                    >
                      <div className="mb-3 flex flex-col items-start gap-2">
                        <div className="min-h-[4.25rem] min-w-0">
                          <h3 className="text-sm font-semibold text-foreground">
                            {role.label}
                            <span className="ml-2 text-xs font-medium text-muted-foreground">{list.length}</span>
                          </h3>
                          {role.note && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{role.note}</p>}

                        </div>
                        <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
                          <Button type="button" size="sm" variant="outline" className="h-7 bg-card px-2 text-xs" onClick={() => setDialog({ cell: { service_area: areaId, role: role.id }, editing: null })} aria-label={`Add a profile to ${area.name}, ${role.label}`}>
                            <Plus className="mr-1 h-3 w-3" />
                            Add profile
                          </Button>
                          {role.id === GM_ROLE_ID && (
                            <span
                              className="text-[11px] font-medium"
                              style={{ color: area.color.text }}
                              title={`Up to ${MAX_FRACTIONAL_LEADERS} Fractional Leaders per service area; they are listed first`}
                              data-testid={`fractional-count-${areaId}`}
                            >
                              Fractional Leaders: {flagged}/{MAX_FRACTIONAL_LEADERS}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[36rem] space-y-2 overflow-y-auto pr-1" tabIndex={list.length > 3 ? 0 : undefined} aria-label={`${role.label} profiles`} data-testid={`list-${areaId}-${role.id}`}>
                        {list.map(({ person, placement }) => (
                          <TalentCard
                            key={placement.id}
                            person={person}
                            placement={placement}
                            color={area.color}
                            canFlag={canFlagFractional(people, areaId, placement.id)}
                            onEdit={() => setDialog({ cell: { service_area: placement.service_area, role: placement.role }, editing: person })}
                            onToggleFractional={() => void toggleFractional(person, placement)}
                            onRemoveFromArea={() => setRemoving({ person, placement })}
                            onRemoveFromGuild={() => setRemoving({ person, placement: null })}
                          />
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

      <TalentProfileDialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)} cell={dialog?.cell ?? { service_area: "finance", role: "manager" }} editing={dialog?.editing ?? null} people={people} />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{removingFromArea ? `Remove ${removing?.person.name} from ${removingAreaName}?` : `Remove ${removing?.person.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {removingFromArea
                ? `They stay on the Talent Guild in their other service areas. You can add them back to ${removingAreaName} later.`
                : "They will be taken off the Talent Guild in every service area. Their Toptal profile is not affected. You can add them again from their link."}
            </AlertDialogDescription>
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
