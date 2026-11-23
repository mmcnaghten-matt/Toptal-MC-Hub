import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TalentAvatar } from "@/components/TalentAvatar";
import { AREA_BY_ID } from "@/data/mcStorefront";
import { readTalentProfile, useSaveTalent, type PlacementInput, type TalentInput } from "@/hooks/useTalentGuild";
import { fileToThumbnail, toThumbnail } from "@/lib/imageResize";
import {
  GM_ROLE_ID,
  MAX_FRACTIONAL_LEADERS,
  TALENT_AREA_IDS,
  TALENT_ROLES,
  fractionalLeaderCount,
  isToptalProfileUrl,
  nameFromProfileUrl,
  normalizeProfileUrl,
  placementErrors,
  profileErrors,
  type TalentProfile,
} from "@/lib/talentGuild";

interface Draft {
  name: string;
  location: string;
  headline: string;
  summary: string;
  highlights: string;
  profile_url: string;
  photo: string | null;
}

const blank = (): Draft => ({ name: "", location: "", headline: "", summary: "", highlights: "", profile_url: "", photo: null });
const fromProfile = (p: TalentProfile): Draft => ({
  name: p.name, location: p.location, headline: p.headline, summary: p.summary, highlights: p.highlights.join("\n"), profile_url: p.profile_url, photo: p.photo,
});
const toInput = (d: Draft): TalentInput => ({
  name: d.name.trim(),
  location: d.location.trim(),
  headline: d.headline.trim(),
  summary: d.summary.trim(),
  highlights: d.highlights.split("\n").map((h) => h.trim()).filter(Boolean).slice(0, 6),
  profile_url: d.profile_url.trim(),
  photo: d.photo,
});
const areaName = (id: string) => AREA_BY_ID.get(id)?.name ?? id;
const roleLabel = (id: string) => TALENT_ROLES.find((r) => r.id === id)?.label ?? id;

/**
 * Add a talent profile (or edit one) and say which service areas they are in and their role in each. Adding: paste the profile link (and, if
 * you like, the profile text) -> the profile is read -> check it -> save. A link that is already on the Talent Guild opens that person with
 * the area you clicked in added, instead of making a second copy.
 */
export function TalentProfileDialog({
  open,
  onOpenChange,
  cell,
  editing,
  people,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: { service_area: string; role: string };
  editing?: TalentProfile | null;
  /** Everyone on the Talent Guild: to find a link that is already there and to count Fractional Leaders. */
  people: TalentProfile[];
}) {
  const [step, setStep] = useState<"link" | "review">("link");
  const [draft, setDraft] = useState<Draft>(blank());
  const [placements, setPlacements] = useState<PlacementInput[]>([]);
  // The person being changed: the one opened for editing, or one found already on the Talent Guild from the pasted link.
  const [target, setTarget] = useState<TalentProfile | null>(null);
  const [text, setText] = useState("");
  const [reading, setReading] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [problem, setProblem] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const save = useSaveTalent();

  useEffect(() => {
    if (!open) return;
    setText("");
    setNotes([]);
    setProblem("");
    setReading(false);
    if (editing) {
      setTarget(editing);
      setDraft(fromProfile(editing));
      setPlacements(editing.placements.map(({ service_area, role, fractional_leader }) => ({ service_area, role, fractional_leader })));
      setStep("review");
    } else {
      setTarget(null);
      setDraft(blank());
      setPlacements([{ service_area: cell.service_area, role: cell.role, fractional_leader: false }]);
      setStep("link");
    }
  }, [open, editing, cell.service_area, cell.role]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setPlacement = (i: number, patch: Partial<PlacementInput>) => setPlacements((list) => list.map((pl, j) => (j === i ? { ...pl, ...patch } : pl)));
  const others = people.filter((p) => p.id !== target?.id);
  const full = (area: string) => fractionalLeaderCount(others, area) >= MAX_FRACTIONAL_LEADERS;
  const area = AREA_BY_ID.get(placements[0]?.service_area ?? cell.service_area);
  const color = area?.color ?? { text: "#2B44D4", bg: "#EEF2FF" };
  const usedAreas = new Set(placements.map((pl) => pl.service_area));

  const changeArea = (i: number, id: string) => setPlacement(i, { service_area: id, fractional_leader: placements[i].fractional_leader && !full(id) });
  const changeRole = (i: number, role: string) => setPlacement(i, { role, fractional_leader: role === GM_ROLE_ID ? placements[i].fractional_leader : false });
  const addArea = () => {
    const next = TALENT_AREA_IDS.find((id) => !usedAreas.has(id));
    if (next) setPlacements((list) => [...list, { service_area: next, role: "manager", fractional_leader: false }]);
  };

  /** This link is already on the Talent Guild: open that person, with the clicked-in area added if they are not in it yet. */
  const openExisting = (found: TalentProfile) => {
    const own: PlacementInput[] = found.placements.map(({ service_area, role, fractional_leader }) => ({ service_area, role, fractional_leader }));
    const inCell = own.find((pl) => pl.service_area === cell.service_area);
    setTarget(found);
    setDraft(fromProfile(found));
    setPlacements(inCell ? own : [...own, { service_area: cell.service_area, role: cell.role, fractional_leader: false }]);
    setNotes([
      inCell
        ? `${found.name} is already on the Talent Guild in ${areaName(cell.service_area)} as ${roleLabel(inCell.role)}. Change their areas and roles below if you need to.`
        : `${found.name} is already on the Talent Guild. ${areaName(cell.service_area)} has been added to their areas: check the role, then save.`,
    ]);
    setStep("review");
  };

  const read = async () => {
    setProblem("");
    if (!isToptalProfileUrl(draft.profile_url)) {
      setProblem("Enter the Toptal profile link, for example https://www.toptal.com/management-consultants/resume/first-last");
      return;
    }
    const found = people.find((p) => normalizeProfileUrl(p.profile_url) === normalizeProfileUrl(draft.profile_url));
    if (found) {
      openExisting(found);
      return;
    }
    setReading(true);
    try {
      const { profile, warnings } = await readTalentProfile(draft.profile_url.trim(), text);
      const extra = [...warnings];
      let photo: string | null = null;
      if (profile.photo) {
        try {
          photo = await toThumbnail(profile.photo);
        } catch {
          extra.push("The photo could not be resized; the card will show initials.");
        }
      }
      setDraft((d) => ({ ...d, name: profile.name, location: profile.location, headline: profile.headline, summary: profile.summary, highlights: profile.highlights.join("\n"), photo }));
      setNotes(extra);
      setStep("review");
    } catch (e) {
      setProblem((e as Error).message);
    } finally {
      setReading(false);
    }
  };

  const byHand = () => {
    const found = people.find((p) => normalizeProfileUrl(p.profile_url) === normalizeProfileUrl(draft.profile_url));
    if (found) {
      openExisting(found);
      return;
    }
    setDraft((d) => ({ ...d, name: d.name || nameFromProfileUrl(d.profile_url) }));
    setNotes([]);
    setStep("review");
  };

  const choosePhoto = async (file?: File) => {
    if (!file) return;
    try {
      set({ photo: await fileToThumbnail(file) });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const submit = async () => {
    const errors = [...profileErrors({ name: draft.name, summary: draft.summary, profile_url: draft.profile_url }), ...placementErrors(placements, others)];
    if (errors.length) {
      setProblem(errors.join(". "));
      return;
    }
    try {
      await save.mutateAsync({ id: target?.id, input: toInput(draft), placements, existing: target?.placements ?? [] });
      toast.success(target ? "Saved" : `${draft.name.trim()} added to the Talent Guild`);
      onOpenChange(false);
    } catch (e) {
      setProblem((e as Error).message);
    }
  };

  const editingExisting = !!target;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingExisting ? "Edit talent profile" : `Add a talent profile`}</DialogTitle>
          <DialogDescription>
            {step === "link"
              ? `${areaName(cell.service_area)} · ${roleLabel(cell.role)}`
              : editingExisting
                ? "Change the details, or the service areas they are in and their role in each."
                : "Check what was read from the profile, fix anything, choose their service areas, then save."}
          </DialogDescription>
        </DialogHeader>

        {step === "link" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="talent-url">Toptal profile link</Label>
              <Input id="talent-url" value={draft.profile_url} onChange={(e) => set({ profile_url: e.target.value })} placeholder="https://www.toptal.com/management-consultants/resume/first-last" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="talent-text">Profile text <span className="font-normal text-muted-foreground">(optional: the link is read for you; paste the profile here if it cannot be)</span></Label>
              <Textarea id="talent-text" value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder="Paste the profile text here" />
            </div>
            {problem && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{problem}</p>}
            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="ghost" onClick={byHand} disabled={reading || !isToptalProfileUrl(draft.profile_url)}>Fill in by hand</Button>
              <Button type="button" onClick={read} disabled={reading}>
                {reading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {reading ? "Reading profile…" : "Read profile"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <TalentAvatar name={draft.name || "?"} photo={draft.photo} color={color} size={64} />
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void choosePhoto(e.target.files?.[0]); e.target.value = ""; }} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-3.5 w-3.5" />{draft.photo ? "Change photo" : "Choose a photo"}</Button>
                {draft.photo && <Button type="button" variant="ghost" size="sm" onClick={() => set({ photo: null })}><X className="mr-1 h-3.5 w-3.5" />Remove photo</Button>}
              </div>
            </div>
            {notes.length > 0 && <ul className="space-y-0.5 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{notes.map((n) => <li key={n}>{n}</li>)}</ul>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="talent-name">Name</Label>
                <Input id="talent-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="talent-location">Location</Label>
                <Input id="talent-location" value={draft.location} onChange={(e) => set({ location: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="talent-headline">Headline</Label>
              <Input id="talent-headline" value={draft.headline} onChange={(e) => set({ headline: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="talent-summary">Short summary</Label>
              <Textarea id="talent-summary" value={draft.summary} onChange={(e) => set({ summary: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="talent-highlights">Highlights <span className="font-normal text-muted-foreground">(one per line)</span></Label>
              <Textarea id="talent-highlights" value={draft.highlights} onChange={(e) => set({ highlights: e.target.value })} rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="talent-link">Toptal profile link</Label>
              <Input id="talent-link" value={draft.profile_url} onChange={(e) => set({ profile_url: e.target.value })} />
            </div>

            <fieldset className="space-y-2 rounded-md border border-border p-3" data-testid="placements-editor">
              <legend className="px-1 text-sm font-medium">Service areas and roles</legend>
              <p className="text-xs text-muted-foreground">A person can be in several service areas, with a different role in each.</p>
              {placements.map((pl, i) => {
                const flagFull = !pl.fractional_leader && full(pl.service_area);
                return (
                  <div key={i} className="space-y-2 rounded-md bg-muted/40 p-2" data-testid={`placement-${i}`}>
                    <div className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <div className="space-y-1">
                        <Label className="text-xs">Service area</Label>
                        <Select value={pl.service_area} onValueChange={(v) => changeArea(i, v)}>
                          <SelectTrigger aria-label={`Service area ${i + 1}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TALENT_AREA_IDS.filter((id) => id === pl.service_area || !usedAreas.has(id)).map((id) => <SelectItem key={id} value={id}>{areaName(id)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Role</Label>
                        <Select value={pl.role} onValueChange={(v) => changeRole(i, v)}>
                          <SelectTrigger aria-label={`Role ${i + 1}`}><SelectValue /></SelectTrigger>
                          <SelectContent>{TALENT_ROLES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setPlacements((list) => list.filter((_, j) => j !== i))} disabled={placements.length <= 1} aria-label={`Remove ${areaName(pl.service_area)}`}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {pl.role === GM_ROLE_ID && (
                      <div className="flex items-start gap-2">
                        <Checkbox id={`talent-fl-${i}`} checked={pl.fractional_leader} disabled={flagFull} onCheckedChange={(v) => setPlacement(i, { fractional_leader: v === true })} />
                        <Label htmlFor={`talent-fl-${i}`} className="text-xs font-normal leading-snug">
                          Fractional Leader for {areaName(pl.service_area)}
                          <span className="block text-muted-foreground">
                            {flagFull ? `${MAX_FRACTIONAL_LEADERS} are already flagged in this area. Remove one on its card first.` : `Up to ${MAX_FRACTIONAL_LEADERS} per service area; listed first.`}
                          </span>
                        </Label>
                      </div>
                    )}
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addArea} disabled={usedAreas.size >= TALENT_AREA_IDS.length}>
                <Plus className="mr-1 h-3.5 w-3.5" />Add another service area
              </Button>
            </fieldset>

            {problem && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{problem}</p>}
            <DialogFooter className="gap-2">
              {!editingExisting && <Button type="button" variant="ghost" onClick={() => { setProblem(""); setStep("link"); }} disabled={save.isPending}>Back</Button>}
              <Button type="button" onClick={submit} disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingExisting ? "Save changes" : "Add to Talent Guild"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
