import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHolyricsConfigStatus,
  useSaveHolyricsConfig,
} from "@/hooks/useHolyrics";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  KeyRound,
  Loader2,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useState } from "react";

export default function HolyricsSettingsPage() {
  const statusQuery = useHolyricsConfigStatus();
  const saveConfig = useSaveHolyricsConfig();

  const [apiKey, setApiKey] = useState("");
  const [serverToken, setServerToken] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const isConfigured = statusQuery.data === true;
  const canSubmit =
    apiKey.trim().length > 0 &&
    serverToken.trim().length > 0 &&
    !saveConfig.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const payload = { apiKey: apiKey.trim(), serverToken: serverToken.trim() };
    setFeedback(null);

    saveConfig.mutate(payload, {
      onSuccess: () => {
        setApiKey("");
        setServerToken("");
        setFeedback({
          kind: "success",
          message: "Conexão com o Holyrics salva com sucesso.",
        });
      },
      onError: () => {
        setFeedback({
          kind: "error",
          message:
            "Não foi possível salvar a conexão. Verifique os dados e tente novamente.",
        });
      },
    });
  }

  return (
    <section
      data-ocid="holyrics_settings.page"
      className="mx-auto w-full max-w-3xl"
    >
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte o Kerigma ao seu servidor Holyrics para projetar imagens
          durante a pregação.
        </p>
      </header>

      <div className="mb-6">
        {statusQuery.isLoading ? (
          <div
            data-ocid="holyrics_settings.status.loading_state"
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : statusQuery.isError ? (
          <Alert
            data-ocid="holyrics_settings.status.error_state"
            variant="destructive"
            className="rounded-lg border-destructive/40 bg-card"
          >
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Não foi possível verificar a conexão</AlertTitle>
            <AlertDescription>
              Recarregue a página para tentar novamente.
            </AlertDescription>
          </Alert>
        ) : (
          <div
            data-ocid="holyrics_settings.status.panel"
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3",
              isConfigured
                ? "border-success/40 bg-success/10"
                : "border-border bg-card",
            )}
          >
            {isConfigured ? (
              <CheckCircle2
                className="size-5 shrink-0 text-success"
                aria-hidden="true"
              />
            ) : (
              <PlugZap
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {isConfigured
                  ? "Conexão configurada"
                  : "Conexão ainda não configurada"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isConfigured
                  ? "O Kerigma já possui as credenciais do Holyrics. Você pode atualizá-las abaixo."
                  : "Informe a chave de API e o token do servidor para começar."}
              </p>
            </div>
          </div>
        )}
      </div>

      <Card className="rounded-lg border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {isConfigured ? "Atualizar credenciais" : "Credenciais do Holyrics"}
          </CardTitle>
          <CardDescription>
            Encontre esses valores nas configurações de API do seu Holyrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            data-ocid="holyrics_settings.form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="holyrics-api-key">Chave de API</Label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="holyrics-api-key"
                  data-ocid="holyrics_settings.api_key.input"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Cole a chave de API do Holyrics"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="holyrics-server-token">Token do servidor</Label>
              <div className="relative">
                <ShieldCheck
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="holyrics-server-token"
                  data-ocid="holyrics_settings.server_token.input"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Cole o token do servidor Holyrics"
                  value={serverToken}
                  onChange={(event) => setServerToken(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {feedback ? (
              <Alert
                data-ocid={
                  feedback.kind === "success"
                    ? "holyrics_settings.success_state"
                    : "holyrics_settings.error_state"
                }
                variant={feedback.kind === "error" ? "destructive" : "default"}
                className={cn(
                  "rounded-lg",
                  feedback.kind === "success" &&
                    "border-success/40 bg-success/10 text-foreground [&>svg]:text-success",
                )}
              >
                {feedback.kind === "success" ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <AlertCircle aria-hidden="true" />
                )}
                <AlertTitle>
                  {feedback.kind === "success"
                    ? "Tudo certo"
                    : "Erro ao salvar"}
                </AlertTitle>
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                data-ocid="holyrics_settings.submit_button"
                disabled={!canSubmit}
                className="rounded-lg bg-primary text-primary-foreground shadow-gold-glow transition-smooth hover:bg-primary/90"
              >
                {saveConfig.isPending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : null}
                {saveConfig.isPending ? "Salvando…" : "Salvar conexão"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div
        data-ocid="holyrics_settings.reachability.panel"
        className="mt-6 flex gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3"
      >
        <Globe
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="min-w-0 text-sm">
          <p className="font-medium">Servidor acessível pela internet</p>
          <p className="mt-1 text-muted-foreground">
            Para que a projeção funcione, o servidor do Holyrics precisa estar
            acessível pela internet. Se ele estiver rodando apenas na rede
            local, a projeção não conseguirá alcançá-lo — libere o acesso
            externo ou use um endereço público antes de salvar as credenciais.
          </p>
        </div>
      </div>
    </section>
  );
}
