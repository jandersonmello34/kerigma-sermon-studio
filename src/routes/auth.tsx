import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import "@lovable.dev/cloud-auth-js/styles.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type Search = { redirect?: string };

function safePath(p: string | undefined) {
  return p && p.startsWith("/") && !p.startsWith("//") ? p : "/sermoes";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Kerigma" },
      { name: "description", content: "Entre para acessar seus sermões e a projeção do Holyrics." },
      { property: "og:title", content: "Entrar — Kerigma" },
      { property: "og:description", content: "Entre para acessar seus sermões e a projeção do Holyrics." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const target = safePath(redirect);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: target });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void navigate({ to: target });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, target]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + target },
        });
        if (error) throw error;
        toast.success("Verifique seu e-mail", { description: "Enviamos um link de confirmação." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("E-mail enviado", { description: "Siga o link para criar uma nova senha." });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(String(result.error.message ?? result.error));
  }

  return (
    <main className="atmosphere flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-elevated">
        <div className="flex flex-col items-center gap-2 text-center">
          <Sparkles className="size-6 text-primary" aria-hidden="true" />
          <h1 className="font-display text-3xl font-semibold text-gradient-gold">Kerigma</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signup"
              ? "Crie sua conta para preparar sermões."
              : mode === "forgot"
                ? "Informe seu e-mail para redefinir a senha."
                : "Entre para acessar seus sermões e a projeção do Holyrics."}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="w-full shadow-gold-glow" disabled={busy}>
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
          </Button>
        </form>
        {mode !== "forgot" && (
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => void oauth("google")}>
              Continuar com Google
            </Button>
            <button type="button" className="lovable-auth-button w-full" onClick={() => void oauth("lovable")}>
              Continue with Lovable
            </button>
          </div>
        )}
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          {mode === "signin" && (
            <>
              <button type="button" className="hover:text-primary" onClick={() => setMode("signup")}>Não tem conta? Criar conta</button>
              <button type="button" className="hover:text-primary" onClick={() => setMode("forgot")}>Esqueci minha senha</button>
            </>
          )}
          {mode !== "signin" && (
            <button type="button" className="hover:text-primary" onClick={() => setMode("signin")}>Já tenho conta — entrar</button>
          )}
        </div>
      </div>
    </main>
  );
}
