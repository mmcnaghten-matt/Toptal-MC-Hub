import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidSlug, readTokenClaims } from "@/lib/privatePage";

// A private standalone page: an HTML document stored in the database and shown in full on the hub, for signed-in Toptal accounts only
// (the database enforces it). The document runs in a sandboxed frame, so its own script works but cannot reach the hub's session.
export default function PrivatePage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["private-page", slug],
    retry: false,
    refetchOnMount: "always",
    queryFn: async () => {
      if (!isValidSlug(slug)) return null;
      const load = () => supabase.from("private_pages").select("title, html").eq("slug", slug).maybeSingle();
      // Make sure the page is asked for with the signed-in session, not before it is ready.
      await supabase.auth.getSession();
      let res = await load();
      if (res.error) throw new Error(res.error.message);
      // An empty answer can mean the sign-in token on this fresh load is stale: renew it once and ask again before saying "not found".
      if (!res.data) {
        await supabase.auth.refreshSession();
        res = await load();
        if (res.error) throw new Error(res.error.message);
      }
      return res.data;
    },
  });
  // Shown only when nothing was found: what the sign-in says about the account, to help work out why.
  const { data: details } = useQuery({
    queryKey: ["private-page-claims", slug, data === null],
    enabled: data === null,
    queryFn: async () => readTokenClaims((await supabase.auth.getSession()).data.session?.access_token),
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
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isFetching ? "Trying..." : "Try again"}
            </button>
            {details && (
              <p className="mt-4 text-xs text-muted-foreground" data-testid="private-page-details">
                Signed in as {details.email ?? "unknown"} · sign-in methods: {details.providers?.join(", ") ?? "none listed"} · email verified: {details.emailVerified ? "yes" : "no"}
                {details.expiresAt ? ` · sign-in valid until ${new Date(details.expiresAt).toLocaleTimeString()}` : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
