import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Kerigma" },
      { name: "description", content: "Defina uma nova senha para sua conta Kerigma." },
      { property: "og:title", content: "Nova senha — Kerigma" },
      { property: "og:description", content: "Defina uma nova senha para sua conta Kerigma." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Senha atualizada");
    void navigate({ to: "/sermoes" });
  }

  return (
    <main className="atmosphere flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-8 shadow-elevated">
        <h1 className="font-display text-2xl font-semibold">Nova senha</h1>
        <div className="space-y-2">
          <Label htmlFor="pw">Senha</Label>
          <Input id="pw" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>Salvar</Button>
      </form>
    </main>
  );
}
