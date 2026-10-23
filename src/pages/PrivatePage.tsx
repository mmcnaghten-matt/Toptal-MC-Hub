import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidSlug } from "@/lib/privatePage";

// A private standalone page: an HTML document stored in the database and shown in full on the hub, for signed-in Toptal accounts only
// (the database enforces it). The document runs in a sandboxed frame, so its own script works but cannot reach the hub's session.
export default function PrivatePage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["private-page", slug],
    retry: false,
    queryFn: async () => {
      if (!isValidSlug(slug)) return null;
      const { data, error } = await supabase.from("private_pages").select("title, html").eq("slug", slug).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-primary px-4 text-primary-foreground">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors hover:bg-primary-foreground/10">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span className="truncate text-sm font-medium">{data?.title ?? "Private page"}</span>
        <span className="ml-auto text-xs text-primary-foreground/70">Confidential</span>
      </header>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground" role="status">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : data ? (
        <iframe title={data.title} srcDoc={data.html} sandbox="allow-scripts" className="w-full flex-1 border-0 bg-white" />
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center" role="alert">
          <div>
            <p className="font-semibold text-foreground">Page not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error ? "It could not be loaded. Try again in a moment." : "This page does not exist, or you do not have access to it. Private pages open only for signed-in Toptal accounts."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
