import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeProfileUrl, planPlacements, type Placement, type ReadProfile, type TalentProfile } from "@/lib/talentGuild";

// Talent Guild data (called the Talent Bench until November 2026; the database objects keep the old names: talent_profiles,
// talent_bench_access, has_talent_bench_access). Every read and write is checked by row-level security (public.has_talent_bench_access), so these calls return
// nothing, or an error, for anyone who is not on the list; the page also hides itself.

// The new tables are not in the generated database types, so use an untyped handle for them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tables = () => supabase as unknown as { from: (table: string) => any; rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }> };

const ACCESS_KEY = ["talent-guild-access"];
const PROFILES_KEY = ["talent-profiles"];

/** Whether the signed-in person may use the Talent Guild. `loading` is true until the answer is known. */
export function useTalentGuildAccess() {
  const q = useQuery({
    queryKey: ACCESS_KEY,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await tables().rpc("has_talent_bench_access");
      return !error && data === true;
    },
    staleTime: 5 * 60_000,
  });
  return { hasAccess: q.data === true, loading: q.isLoading };
}

const PROFILE_SELECT = "*, talent_placements(id, service_area, role, fractional_leader)";
type ProfileRow = Omit<TalentProfile, "placements"> & { talent_placements?: Placement[] | null };

export function useTalentProfiles(enabled: boolean) {
  return useQuery({
    queryKey: PROFILES_KEY,
    enabled,
    queryFn: async (): Promise<TalentProfile[]> => {
      const { data, error } = await tables().from("talent_profiles").select(PROFILE_SELECT).order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as ProfileRow[]).map(({ talent_placements, ...row }) => ({ ...row, placements: talent_placements ?? [] }));
    },
  });
}

export type TalentInput = Pick<TalentProfile, "name" | "location" | "headline" | "summary" | "highlights" | "profile_url" | "photo">;
/** One service area for a person: the role they hold there, and whether they are flagged Fractional Leader (GM column only). */
export type PlacementInput = Pick<Placement, "service_area" | "role" | "fractional_leader">;

const duplicateMessage = "That profile is already on the Talent Guild.";
const fail = (message: string) => new Error(message.includes("duplicate key") && message.includes("profile_url") ? duplicateMessage : message);

/**
 * Saves a person and the service areas they are in. A new person is added with their areas (if the areas cannot be saved, the half-made
 * person is removed again). An existing person is updated, and their areas are brought in line: removed areas deleted, changed ones updated,
 * new ones added.
 */
export function useSaveTalent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input, placements, existing = [] }: { id?: string; input: TalentInput; placements: PlacementInput[]; existing?: Placement[] }) => {
      const row = { ...input, profile_url: normalizeProfileUrl(input.profile_url), updated_at: new Date().toISOString() };
      const db = tables();
      if (!id) {
        const { data: auth } = await supabase.auth.getUser();
        const { data, error } = await db.from("talent_profiles").insert({ ...row, added_by: auth.user?.email ?? null }).select("id").single();
        if (error) throw fail(error.message);
        const { error: placeError } = await db.from("talent_placements").insert(placements.map((pl) => ({ ...pl, profile_id: data.id })));
        if (placeError) {
          await db.from("talent_profiles").delete().eq("id", data.id);
          throw fail(placeError.message);
        }
        return;
      }
      const { error } = await db.from("talent_profiles").update(row).eq("id", id);
      if (error) throw fail(error.message);
      const plan = planPlacements(existing, placements);
      for (const placementId of plan.remove) {
        const { error: e } = await db.from("talent_placements").delete().eq("id", placementId);
        if (e) throw fail(e.message);
      }
      for (const change of plan.update) {
        const { error: e } = await db.from("talent_placements").update({ role: change.role, fractional_leader: change.fractional_leader }).eq("id", change.id);
        if (e) throw fail(e.message);
      }
      if (plan.add.length) {
        const { error: e } = await db.from("talent_placements").insert(plan.add.map((pl) => ({ ...pl, profile_id: id })));
        if (e) throw fail(e.message);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  });
}

/** Takes a person off the Talent Guild entirely (all their service areas). */
export function useRemoveTalent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await tables().from("talent_profiles").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  });
}

/** Removes a person from one service area; if it was their only one, they come off the Talent Guild. */
export function useRemovePlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ person, placementId }: { person: TalentProfile; placementId: string }) => {
      const db = tables();
      const { error } = person.placements.length <= 1
        ? await db.from("talent_profiles").delete().eq("id", person.id)
        : await db.from("talent_placements").delete().eq("id", placementId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  });
}

/** Flags or unflags a placement as Fractional Leader. The database refuses a third one in a service area. */
export function useSetFractional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ placementId, value }: { placementId: string; value: boolean }) => {
      const { error } = await tables().from("talent_placements").update({ fractional_leader: value }).eq("id", placementId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  });
}

/** Asks the talent-profile function to read a Toptal profile (from the pasted text, or by fetching the link when there is none). */
export async function readTalentProfile(profileUrl: string, text: string): Promise<{ profile: ReadProfile; warnings: string[] }> {
  const { data, error } = await supabase.functions.invoke("talent-profile", { body: { profileUrl, text } });
  if (error) {
    // functions.invoke hides the response body on non-2xx; the function puts a readable message in it.
    const res = (error as { context?: Response }).context;
    const detail = await res?.json?.().catch(() => null);
    throw new Error(detail?.error || error.message || "Could not read the profile");
  }
  if (data?.error) throw new Error(data.error);
  if (!data?.profile) throw new Error("The profile could not be read. Paste its text and try again.");
  return { profile: data.profile as ReadProfile, warnings: (data.warnings ?? []) as string[] };
}
