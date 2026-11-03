import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function SignOutButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await supabase.auth.signOut();
        setBusy(false);
        void navigate({ to: "/auth" });
      }}
    >
      <span className="inline-flex items-center justify-center gap-2">
        <LogOut className="size-4" aria-hidden="true" />
        Sair
      </span>
    </button>
  );
}
