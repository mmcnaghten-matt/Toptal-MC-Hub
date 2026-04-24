import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDiagnosticConfig } from "../config";
import type { DiagnosticConfig } from "../types";

export function useDiagnosticConfig(slug: string) {
  const local = getDiagnosticConfig(slug);

  return useQuery<DiagnosticConfig | null>({
    queryKey: ['diagnostic-config', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_configs' as never)
        .select('*')
        .eq('id', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return local ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
