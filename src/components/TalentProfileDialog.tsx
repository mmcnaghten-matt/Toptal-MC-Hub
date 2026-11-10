import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TalentAvatar } from "@/components/TalentAvatar";
import { AREA_BY_ID } from "@/data/mcStorefront";
import { readTalentProfile, useSaveTalent, type TalentInput } from "@/hooks/useTalentBench";
import { fileToThumbnail, toThumbnail } from "@/lib/imageResize";
import { TALENT_AREA_IDS, TALENT_ROLES, isToptalProfileUrl, nameFromProfileUrl, profileErrors, type TalentProfile } from "@/lib/talentBench";

interface Draft {
  service_area: string;
  role: string;
  name: string;
  location: string;
  headline: string;
  summary: string;
  highlights: string;
  profile_url: string;
  photo: string | null;
}

const blank = (service_area: string, role: string): Draft => ({ service_area, role, name: "", location: "", headline: "", summary: "", highlights: "", profile_url: "", photo: null });
const fromProfile = (p: TalentProfile): Draft => ({ ...p, highlights: p.highlights.join("\n"), photo: p.photo });
const toInput = (d: Draft): TalentInput => ({
  service_area: d.service_area,
  role: d.role,
  name: d.name.trim(),
  location: d.location.trim(),
  headline: d.headline.trim(),
  summary: d.summary.trim(),
  highlights: d.highlights.split("\n").map((h) => h.trim()).filter(Boolean).slice(0, 6),
  profile_url: d.profile_url.trim(),
  photo: d.photo,
});

/**
 * Add a talent profile to a cell (service area + role), or edit and move an existing one.
 * Adding: paste the profile link (and, if you like, the profile text) -> the profile is read -> check it -> save.
 */
export function TalentProfileDialog({ open, onOpenChange, cell, editing }: { open: boolean; onOpenChange: (open: boolean) => void; cell: { service_area: string; role: string }; editing?: TalentProfile | null }) {
  const [step, setStep] = useState<"link" | "review">("link");
  const [draft, setDraft] = useState<Draft>(blank(cell.service_area, cell.role));
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
      setDraft(fromProfile(editing));
      setStep("review");
    } else {
      setDraft(blank(cell.service_area, cell.role));
      setStep("link");
    }
  }, [open, editing, cell.service_area, cell.role]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const area = AREA_BY_ID.get(draft.service_area);
  const color = area?.color ?? { text: "#2B44D4", bg: "#EEF2FF" };

  const read = async () => {
    setProblem("");
    if (!isToptalProfileUrl(draft.profile_url)) {
      setProblem("Enter the Toptal profile link, for example https://www.toptal.com/management-consultants/resume/first-last");
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
    const errors = profileErrors({ name: draft.name, summary: draft.summary, profile_url: draft.profile_url, service_area: draft.service_area, role: draft.role });
    if (errors.length) {
      setProblem(errors.join(". "));
      return;
    }
    try {
      await save.mutateAsync({ id: editing?.id, input: toInput(draft) });
      toast.success(editing ? "Saved" : `${draft.name.trim()} added to the Talent Bench`);
      onOpenChange(false);
    } catch (e) {
      setProblem((e as Error).message);
    }
  };

  const roleLabel = TALENT_ROLES.find((r) => r.id === draft.role)?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit talent profile" : `Add a talent profile`}</DialogTitle>
          <DialogDescription>
            {step === "link" ? `${area?.name ?? ""} · ${roleLabel}` : editing ? "Change the details, or move the person to another service area or role." : "Check what was read from the profile, fix anything, then save."}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Service area</Label>
                <Select value={draft.service_area} onValueChange={(v) => set({ service_area: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TALENT_AREA_IDS.map((id) => <SelectItem key={id} value={id}>{AREA_BY_ID.get(id)?.name ?? id}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={draft.role} onValueChange={(v) => set({ role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TALENT_ROLES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {problem && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{problem}</p>}
            <DialogFooter className="gap-2">
              {!editing && <Button type="button" variant="ghost" onClick={() => { setProblem(""); setStep("link"); }} disabled={save.isPending}>Back</Button>}
              <Button type="button" onClick={submit} disabled={save.isPending}>
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Add to Talent Bench"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
