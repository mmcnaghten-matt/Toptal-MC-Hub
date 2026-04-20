import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
      title="Sign out"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}
