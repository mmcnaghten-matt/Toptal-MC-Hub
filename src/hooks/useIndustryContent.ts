import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { industries, SubIndustry } from "@/data/industryData";
import { toast } from "sonner";

export interface DbSubIndustryContent {
  id: string;
  sub_industry_id: string;
  industry_id: string;
  sub_industry_name: string;
  industry_name: string;
  overview: string;
  challenges: string[];
  initiatives: string[];
  needs: Array<{
    name: string;
    signals: string[];
    mcOffers: string[];
    narrative: string;
  }>;
  updated_at: string;
  updated_by: string;
}

export interface ContentVersion {
  id: string;
  sub_industry_id: string;
  version_number: number;
  content: DbSubIndustryContent;
  created_at: string;
  created_by: string;
}

// Fetch content for a sub-industry, falling back to static data
export function useSubIndustryContent(subIndustryId: string | null) {
  return useQuery({
    queryKey: ["industry-content", subIndustryId],
    queryFn: async (): Promise<SubIndustry | null> => {
      if (!subIndustryId) return null;

      const { data, error } = await supabase
        .from("industry_content")
        .select("*")
        .eq("sub_industry_id", subIndustryId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching content:", error);
      }

      if (data) {
        return {
          id: data.sub_industry_id,
          name: data.sub_industry_name,
          overview: data.overview,
          challenges: data.challenges as unknown as string[],
          initiatives: data.initiatives as unknown as string[],
          needs: data.needs as unknown as SubIndustry["needs"],
          updatedAt: data.updated_at,
        };
      }

      // Fall back to static data
      for (const industry of industries) {
        const sub = industry.subIndustries.find((s) => s.id === subIndustryId);
        if (sub) return sub;
      }
      return null;
    },
    enabled: !!subIndustryId,
  });
}

// Fetch all content from DB
export function useAllIndustryContent() {
  return useQuery({
    queryKey: ["all-industry-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industry_content")
        .select("*")
        .order("industry_id, sub_industry_id");

      if (error) throw error;
      return (data || []) as unknown as DbSubIndustryContent[];
    },
  });
}

// Fetch version history
export function useContentVersions(subIndustryId: string | null) {
  return useQuery({
    queryKey: ["content-versions", subIndustryId],
    queryFn: async () => {
      if (!subIndustryId) return [];
      const { data, error } = await supabase
        .from("industry_content_versions")
        .select("*")
        .eq("sub_industry_id", subIndustryId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as ContentVersion[];
    },
    enabled: !!subIndustryId,
  });
}

// Save content (creates version snapshot first)
export function useSaveContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subIndustryId,
      industryId,
      subIndustryName,
      industryName,
      content,
    }: {
      subIndustryId: string;
      industryId: string;
      subIndustryName: string;
      industryName: string;
      content: { overview: string; challenges: string[]; initiatives: string[]; needs: SubIndustry["needs"] };
    }) => {
      // Get current content for versioning
      const { data: existing } = await supabase
        .from("industry_content")
        .select("*")
        .eq("sub_industry_id", subIndustryId)
        .maybeSingle();

      if (existing) {
        // Get next version number
        const { data: versions } = await supabase
          .from("industry_content_versions")
          .select("version_number")
          .eq("sub_industry_id", subIndustryId)
          .order("version_number", { ascending: false })
          .limit(1);

        const nextVersion = (versions?.[0]?.version_number || 0) + 1;

        // Snapshot current version
        await supabase.from("industry_content_versions").insert({
          sub_industry_id: subIndustryId,
          version_number: nextVersion,
          content: existing as any,
          created_by: "admin",
        });

        // Update current
        const { error } = await supabase
          .from("industry_content")
          .update({
            overview: content.overview,
            challenges: content.challenges as any,
            initiatives: content.initiatives as any,
            needs: content.needs as any,
            updated_by: "admin",
          })
          .eq("sub_industry_id", subIndustryId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("industry_content").insert({
          sub_industry_id: subIndustryId,
          industry_id: industryId,
          sub_industry_name: subIndustryName,
          industry_name: industryName,
          overview: content.overview,
          challenges: content.challenges as any,
          initiatives: content.initiatives as any,
          needs: content.needs as any,
          updated_by: "admin",
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industry-content"] });
      queryClient.invalidateQueries({ queryKey: ["all-industry-content"] });
      queryClient.invalidateQueries({ queryKey: ["content-versions"] });
      toast.success("Content saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });
}

// Revert to a previous version
export function useRevertContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subIndustryId, version }: { subIndustryId: string; version: ContentVersion }) => {
      const versionContent = version.content;

      // Snapshot current before reverting
      const { data: existing } = await supabase
        .from("industry_content")
        .select("*")
        .eq("sub_industry_id", subIndustryId)
        .maybeSingle();

      if (existing) {
        const { data: versions } = await supabase
          .from("industry_content_versions")
          .select("version_number")
          .eq("sub_industry_id", subIndustryId)
          .order("version_number", { ascending: false })
          .limit(1);

        const nextVersion = (versions?.[0]?.version_number || 0) + 1;

        await supabase.from("industry_content_versions").insert({
          sub_industry_id: subIndustryId,
          version_number: nextVersion,
          content: existing as any,
          created_by: "admin-revert",
        });
      }

      // Restore version content
      const { error } = await supabase
        .from("industry_content")
        .update({
          overview: versionContent.overview,
          challenges: versionContent.challenges as any,
          initiatives: versionContent.initiatives as any,
          needs: versionContent.needs as any,
          updated_by: "admin-revert",
        })
        .eq("sub_industry_id", subIndustryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industry-content"] });
      queryClient.invalidateQueries({ queryKey: ["all-industry-content"] });
      queryClient.invalidateQueries({ queryKey: ["content-versions"] });
      toast.success("Content reverted successfully");
    },
    onError: (error) => {
      toast.error("Failed to revert: " + error.message);
    },
  });
}

// Refresh content using AI
export function useRefreshContent() {
  return useMutation({
    mutationFn: async ({
      subIndustryId,
      subIndustryName,
      industryName,
    }: {
      subIndustryId: string;
      subIndustryName: string;
      industryName: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("refresh-industry-insights", {
        body: { subIndustryId, subIndustryName, industryName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as {
        overview: string;
        challenges: string[];
        initiatives: string[];
        needs: SubIndustry["needs"];
      };
    },
  });
}
