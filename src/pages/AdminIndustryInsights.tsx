import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { industries, SubIndustry } from "@/data/industryData";
import {
  useSubIndustryContent,
  useContentVersions,
  useSaveContent,
  useRevertContent,
  useRefreshContent,
  ContentVersion,
} from "@/hooks/useIndustryContent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronLeft, RefreshCw, Save, History, RotateCcw, Edit3, Eye, Plus, Trash2, Loader2, ShieldX } from "lucide-react";
import ToptalLogo from "@/components/ToptalLogo";
import SignOutButton from "@/components/SignOutButton";
import { toast } from "sonner";
import { useAdminRole } from "@/hooks/useAdminRole";

export default function AdminIndustryInsights() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<{
    overview: string;
    challenges: string[];
    initiatives: string[];
    needs: SubIndustry["needs"];
  } | null>(null);

  // Edit state
  const [editOverview, setEditOverview] = useState("");
  const [editChallenges, setEditChallenges] = useState<string[]>([]);
  const [editInitiatives, setEditInitiatives] = useState<string[]>([]);
  const [editNeeds, setEditNeeds] = useState<SubIndustry["needs"]>([]);

  const { data: currentContent, isLoading: contentLoading } = useSubIndustryContent(selectedSubId);
  const { data: versions, isLoading: versionsLoading } = useContentVersions(selectedSubId);
  const saveContent = useSaveContent();
  const revertContent = useRevertContent();
  const refreshContent = useRefreshContent();

  const selectedIndustry = industries.find((i) => i.id === selectedIndustryId);
  const selectedSub = selectedIndustry?.subIndustries.find((s) => s.id === selectedSubId);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-sm space-y-4 p-6 text-center">
          <ShieldX className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">You don't have admin privileges. Contact an administrator to request access.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Back to Portal</Button>
        </div>
      </div>
    );
  }

  const startEdit = () => {
    if (!currentContent) return;
    setEditOverview(currentContent.overview);
    setEditChallenges([...currentContent.challenges]);
    setEditInitiatives([...currentContent.initiatives]);
    setEditNeeds(currentContent.needs.map((n) => ({ ...n, signals: [...n.signals], mcOffers: [...n.mcOffers] })));
    setEditMode(true);
    setShowHistory(false);
    setShowPreview(false);
  };

  const handleSave = () => {
    if (!selectedSubId || !selectedIndustry || !selectedSub) return;
    saveContent.mutate(
      {
        subIndustryId: selectedSubId,
        industryId: selectedIndustry.id,
        subIndustryName: selectedSub.name,
        industryName: selectedIndustry.name,
        content: {
          overview: editOverview,
          challenges: editChallenges,
          initiatives: editInitiatives,
          needs: editNeeds,
        },
      },
      { onSuccess: () => setEditMode(false) }
    );
  };

  const handleRefresh = () => {
    if (!selectedSubId || !selectedIndustry || !selectedSub) return;
    refreshContent.mutate(
      {
        subIndustryId: selectedSubId,
        subIndustryName: selectedSub.name,
        industryName: selectedIndustry.name,
      },
      {
        onSuccess: (data) => {
          setPreviewContent(data);
          setShowPreview(true);
          setShowHistory(false);
          toast.success("AI refresh complete — review the preview below");
        },
        onError: (error) => {
          toast.error("AI refresh failed: " + error.message);
        },
      }
    );
  };

  const applyPreview = () => {
    if (!previewContent || !selectedSubId || !selectedIndustry || !selectedSub) return;
    saveContent.mutate(
      {
        subIndustryId: selectedSubId,
        industryId: selectedIndustry.id,
        subIndustryName: selectedSub.name,
        industryName: selectedIndustry.name,
        content: previewContent,
      },
      {
        onSuccess: () => {
          setShowPreview(false);
          setPreviewContent(null);
        },
      }
    );
  };

  const handleRevert = (version: ContentVersion) => {
    if (!selectedSubId) return;
    revertContent.mutate({ subIndustryId: selectedSubId, version });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 bg-primary">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-primary-foreground/10 text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-primary-foreground">
                Admin: Industry Insights Manager
              </h1>
              <p className="text-xs text-primary-foreground/70">Content Management & AI Refresh</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SignOutButton />
            <ToptalLogo className="h-8" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Industry & Sub-industry selector */}
        {!selectedSubId ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Select a Sub-Sector to Manage</h2>
            {industries.map((industry) => (
              <div key={industry.id} className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{industry.name}</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {industry.subIndustries.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedIndustryId(industry.id);
                        setSelectedSubId(sub.id);
                        setEditMode(false);
                        setShowHistory(false);
                        setShowPreview(false);
                        setPreviewContent(null);
                      }}
                      className="rounded-lg border border-border bg-card p-4 text-left hover:bg-accent transition-colors"
                    >
                      <p className="font-medium text-card-foreground">{sub.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sub.overview}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => { setSelectedSubId(null); setEditMode(false); setShowHistory(false); setShowPreview(false); }}>
                <ChevronLeft className="h-4 w-4 mr-1" /> All Sub-Sectors
              </Button>
              <h2 className="text-lg font-bold text-foreground flex-1">{selectedSub?.name}</h2>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshContent.isPending}>
                {refreshContent.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                AI Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={startEdit} disabled={editMode || contentLoading}>
                <Edit3 className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowHistory(!showHistory); setShowPreview(false); }}>
                <History className="h-4 w-4 mr-1" /> History
              </Button>
            </div>

            {contentLoading && <p className="text-muted-foreground">Loading content...</p>}

            {/* AI Preview */}
            {showPreview && previewContent && (
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" /> AI-Generated Preview
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={applyPreview} disabled={saveContent.isPending}>
                      {saveContent.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Apply & Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setShowPreview(false); setPreviewContent(null); }}>
                      Discard
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Overview</p>
                  <p className="text-sm text-foreground">{previewContent.overview}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Challenges ({previewContent.challenges.length})</p>
                    <ul className="space-y-1">{previewContent.challenges.map((c, i) => <li key={i} className="text-sm text-foreground">• {c}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Initiatives ({previewContent.initiatives.length})</p>
                    <ul className="space-y-1">{previewContent.initiatives.map((init, i) => <li key={i} className="text-sm text-foreground">• {init}</li>)}</ul>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Needs ({previewContent.needs.length})</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {previewContent.needs.map((need, i) => (
                      <div key={i} className="rounded border border-border p-3 space-y-1">
                        <p className="font-medium text-sm text-foreground">{need.name}</p>
                        <p className="text-xs text-muted-foreground">Signals: {need.signals.join(", ")}</p>
                        <p className="text-xs text-primary">Offers: {need.mcOffers.join(", ")}</p>
                        <p className="text-xs text-muted-foreground italic">{need.narrative}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Version History */}
            {showHistory && (
              <div className="rounded-lg border border-border bg-card p-6 space-y-3">
                <h3 className="font-bold text-card-foreground flex items-center gap-2">
                  <History className="h-4 w-4" /> Version History
                </h3>
                {versionsLoading && <p className="text-sm text-muted-foreground">Loading versions...</p>}
                {versions && versions.length === 0 && <p className="text-sm text-muted-foreground">No previous versions yet.</p>}
                {versions?.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Version {v.version_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleString()} · by {v.created_by}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevert(v)}
                      disabled={revertContent.isPending}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revert
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Mode */}
            {editMode && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Editing Content</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saveContent.isPending}>
                      {saveContent.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>

                {/* Overview */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Overview</label>
                  <Textarea value={editOverview} onChange={(e) => setEditOverview(e.target.value)} rows={3} />
                </div>

                {/* Challenges */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Challenges</label>
                  {editChallenges.map((c, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Textarea
                        value={c}
                        onChange={(e) => {
                          const updated = [...editChallenges];
                          updated[i] = e.target.value;
                          setEditChallenges(updated);
                        }}
                        rows={2}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => setEditChallenges(editChallenges.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setEditChallenges([...editChallenges, ""])}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Challenge
                  </Button>
                </div>

                {/* Initiatives */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Initiatives</label>
                  {editInitiatives.map((init, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Textarea
                        value={init}
                        onChange={(e) => {
                          const updated = [...editInitiatives];
                          updated[i] = e.target.value;
                          setEditInitiatives(updated);
                        }}
                        rows={2}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => setEditInitiatives(editInitiatives.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setEditInitiatives([...editInitiatives, ""])}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Initiative
                  </Button>
                </div>

                {/* Needs */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Industry Needs</label>
                  {editNeeds.map((need, ni) => (
                    <div key={ni} className="rounded-lg border border-border p-4 mb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={need.name}
                          onChange={(e) => {
                            const updated = [...editNeeds];
                            updated[ni] = { ...updated[ni], name: e.target.value };
                            setEditNeeds(updated);
                          }}
                          placeholder="Need name"
                          className="font-medium"
                        />
                        <Button variant="ghost" size="icon" onClick={() => setEditNeeds(editNeeds.filter((_, idx) => idx !== ni))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Signals (one per line)</label>
                        <Textarea
                          value={need.signals.join("\n")}
                          onChange={(e) => {
                            const updated = [...editNeeds];
                            updated[ni] = { ...updated[ni], signals: e.target.value.split("\n") };
                            setEditNeeds(updated);
                          }}
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">MC Offers (one per line)</label>
                        <Textarea
                          value={need.mcOffers.join("\n")}
                          onChange={(e) => {
                            const updated = [...editNeeds];
                            updated[ni] = { ...updated[ni], mcOffers: e.target.value.split("\n") };
                            setEditNeeds(updated);
                          }}
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Narrative</label>
                        <Textarea
                          value={need.narrative}
                          onChange={(e) => {
                            const updated = [...editNeeds];
                            updated[ni] = { ...updated[ni], narrative: e.target.value };
                            setEditNeeds(updated);
                          }}
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditNeeds([...editNeeds, { name: "", signals: [""], mcOffers: [""], narrative: "" }])
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Need
                  </Button>
                </div>
              </div>
            )}

            {/* Read-only view (when not editing) */}
            {!editMode && !showPreview && currentContent && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Overview</p>
                  <p className="text-sm text-card-foreground">{currentContent.overview}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Challenges</p>
                    <ul className="space-y-1">{currentContent.challenges.map((c, i) => <li key={i} className="text-sm text-card-foreground">• {c}</li>)}</ul>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Initiatives</p>
                    <ul className="space-y-1">{currentContent.initiatives.map((init, i) => <li key={i} className="text-sm text-card-foreground">• {init}</li>)}</ul>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Needs ({currentContent.needs.length})</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {currentContent.needs.map((need, i) => (
                      <div key={i} className="rounded border border-border p-3">
                        <p className="font-medium text-sm text-foreground">{need.name}</p>
                        <p className="text-xs text-primary mt-1">{need.mcOffers.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
