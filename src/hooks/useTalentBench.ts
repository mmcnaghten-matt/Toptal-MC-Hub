import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeProfileUrl, type ReadProfile, type TalentProfile } from "@/lib/talentBench";

// Talent Bench data. Every read and write is checked by row-level security (public.has_talent_bench_access), so these calls return
// nothing, or an error, for anyone who is not on the list; the page also hides itself.

// The new tables are not in the generated database types, so use an untyped handle for them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tables = () => supabase as unknown as { from: (table: string) => any; rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }> };

const ACCESS_KEY = ["talent-bench-access"];
const PROFILES_KEY = ["talent-profiles"];

/** Whether the signed-in person may use the Talent Bench. `loading` is true until the answer is known. */
export function useTalentBenchAccess() {
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

export function useTalentProfiles(enabled: boolean) {
  return useQuery({
    queryKey: PROFILES_KEY,
    enabled,
    queryFn: async (): Promise<TalentProfile[]> => {
      const { data, error } = await tables().from("talent_profiles").select("*").order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as TalentProfile[];
    },
  });
}

export type TalentInput = Pick<TalentProfile, "service_area" | "role" | "name" | "location" | "headline" | "summary" | "highlights" | "profile_url" | "photo">;

const duplicateMessage = "That profile is already on the Talent Bench.";

export function useSaveTalent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: TalentInput }) => {
      const row = { ...input, profile_url: normalizeProfileUrl(input.profile_url), updated_at: new Date().toISOString() };
      if (id) {
        const { error } = await tables().from("talent_profiles").update(row).eq("id", id);
        if (error) throw new Error(error.message.includes("duplicate key") ? duplicateMessage : error.message);
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await tables().from("talent_profiles").insert({ ...row, added_by: auth.user?.email ?? null });
      if (error) throw new Error(error.message.includes("duplicate key") ? duplicateMessage : error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILES_KEY }),
  });
}

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
