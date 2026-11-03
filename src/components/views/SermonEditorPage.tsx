import { type SermonInput, SermonStatus } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGenerateOutline,
  useSuggestImprovements,
  useSuggestReferences,
} from "@/hooks/useAiAssistance";
import { useCollections } from "@/hooks/useCollections";
import {
  useCreateSermon,
  useSermon,
  useUpdateSermon,
} from "@/hooks/useSermons";
import { formatDateTime } from "@/lib/format";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Bold,
  BookMarked,
  Check,
  Heading2,
  Italic,
  Lightbulb,
  List,
  Loader2,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Draft = {
  title: string;
  body: string;
  bibleReference: string;
  theme: string;
  status: SermonStatus;
};

const emptyDraft: Draft = {
  title: "",
  body: "",
  bibleReference: "",
  theme: "",
  status: SermonStatus.draft,
};

function parseSermonId(raw: string | undefined): bigint | undefined {
  if (!raw || raw === "novo") return undefined;
  try {
    return BigInt(raw);
  } catch {
    return undefined;
  }
}

export default function SermonEditorPage() {
  const params = useParams({ strict: false }) as { sermonId?: string };
  const navigate = useNavigate();
  const sermonId = parseSermonId(params.sermonId);
  const isEditing = sermonId !== undefined;

  const sermonQuery = useSermon(sermonId);
  const collectionsQuery = useCollections();
  const createSermon = useCreateSermon();
  const updateSermon = useUpdateSermon();

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [initialized, setInitialized] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // One-time initialization of the draft from the loaded sermon.
  useEffect(() => {
    if (isEditing && sermonQuery.data && !initialized) {
      const sermon = sermonQuery.data;
      setDraft({
        title: sermon.title,
        body: sermon.body,
        bibleReference: sermon.bibleReference,
        theme: sermon.theme,
        status: sermon.status,
      });
      setInitialized(true);
    }
  }, [isEditing, sermonQuery.data, initialized]);

  const isSaving = createSermon.isPending || updateSermon.isPending;
  const canSave = draft.title.trim().length > 0 && !isSaving;

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveState((current) => (current === "idle" ? current : "idle"));
  }

  function insertAtCursor(prefix: string, suffix = "") {
    const el = bodyRef.current;
    if (!el) {
      update("body", `${draft.body}${prefix}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = draft.body.slice(start, end);
    const next = `${draft.body.slice(0, start)}${prefix}${selected}${suffix}${draft.body.slice(end)}`;
    update("body", next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function handleSave() {
    if (!canSave) return;
    setSaveState("idle");
    const input: SermonInput = {
      title: draft.title.trim(),
      body: draft.body,
      bibleReference: draft.bibleReference.trim(),
      theme: draft.theme.trim(),
      status: draft.status,
    };
    if (isEditing && sermonId !== undefined) {
      updateSermon.mutate(
        { id: sermonId, input },
        {
          onSuccess: () => {
            setSaveState("saved");
            toast.success("Sermão salvo", {
              description: "Suas alterações foram gravadas.",
            });
          },
          onError: () => {
            setSaveState("error");
            toast.error("Não foi possível salvar", {
              description: "Tente novamente em instantes.",
            });
          },
        },
      );
    } else {
      createSermon.mutate(input, {
        onSuccess: (id) => {
          toast.success("Sermão criado", {
            description: "Seu novo sermão foi salvo.",
          });
          void navigate({
            to: "/sermoes/$sermonId",
            params: { sermonId: id.toString() },
          });
        },
        onError: () => {
          setSaveState("error");
          toast.error("Não foi possível criar o sermão", {
            description: "Tente novamente em instantes.",
          });
        },
      });
    }
  }

  if (isEditing && sermonQuery.isLoading) {
    return <EditorSkeleton />;
  }

  if (isEditing && !sermonQuery.isLoading && !sermonQuery.data) {
    return (
      <section
        data-ocid="sermon_editor.page"
        className="mx-auto w-full max-w-3xl"
      >
        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle
              className="size-8 text-destructive"
              aria-hidden="true"
            />
            <h1 className="font-display text-xl font-semibold">
              Sermão não encontrado
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Este sermão pode ter sido removido ou não pertence à sua conta.
            </p>
            <Button
              type="button"
              variant="outline"
              data-ocid="sermon_editor.back_button"
              onClick={() => void navigate({ to: "/" })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar para sermões
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section
      data-ocid="sermon_editor.page"
      className="mx-auto w-full max-w-6xl"
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid="sermon_editor.back_button"
            className="-ml-2 mb-2 text-muted-foreground hover:text-primary"
            onClick={() => void navigate({ to: "/" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Sermões
          </Button>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {isEditing ? "Editar sermão" : "Novo sermão"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEditing
              ? "Refine o conteúdo e prepare a mensagem para a pregação."
              : "Comece a escrever sua mensagem e deixe a assistência sugerir o caminho."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && sermonQuery.data && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Atualizado em {formatDateTime(sermonQuery.data.updatedAt)}
            </span>
          )}
          <Button
            type="button"
            data-ocid="sermon_editor.save_button"
            disabled={!canSave}
            onClick={handleSave}
            className="rounded-lg bg-primary text-primary-foreground shadow-gold-glow transition-smooth hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {isSaving ? "Salvando…" : "Salvar sermão"}
          </Button>
        </div>
      </header>

      {saveState === "saved" && (
        <output
          data-ocid="sermon_editor.success_state"
          className="mb-6 flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success"
        >
          <Check className="size-4 shrink-0" aria-hidden="true" />
          Sermão salvo com sucesso. Suas alterações permanecem após recarregar a
          página.
        </output>
      )}
      {saveState === "error" && (
        <div
          data-ocid="sermon_editor.error_state"
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          Não foi possível salvar o sermão. Verifique sua conexão e tente
          novamente.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="rounded-lg border-border bg-card shadow-none">
            <CardContent className="flex flex-col gap-5 pt-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sermon-title">Título</Label>
                <Input
                  id="sermon-title"
                  data-ocid="sermon_editor.title_input"
                  value={draft.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="Ex.: A graça que transforma"
                  className="font-display text-lg"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sermon-reference">
                    Referência bíblica principal
                  </Label>
                  <Input
                    id="sermon-reference"
                    data-ocid="sermon_editor.reference_input"
                    value={draft.bibleReference}
                    onChange={(event) =>
                      update("bibleReference", event.target.value)
                    }
                    placeholder="Ex.: João 3:16"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sermon-theme">Tema</Label>
                  <Input
                    id="sermon-theme"
                    data-ocid="sermon_editor.theme_input"
                    value={draft.theme}
                    onChange={(event) => update("theme", event.target.value)}
                    placeholder="Ex.: Fé"
                    list="sermon-theme-options"
                  />
                  <datalist id="sermon-theme-options">
                    {(collectionsQuery.data ?? []).map((collection) => (
                      <option
                        key={collection.id.toString()}
                        value={collection.name}
                      />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="sermon-status">Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) =>
                    update("status", value as SermonStatus)
                  }
                >
                  <SelectTrigger
                    id="sermon-status"
                    data-ocid="sermon_editor.status_select"
                    className="w-full sm:w-56"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SermonStatus.draft}>Rascunho</SelectItem>
                    <SelectItem value={SermonStatus.ready}>Pronto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <CardTitle className="font-display text-lg">
                Corpo do sermão
              </CardTitle>
              <div className="flex items-center gap-1">
                <ToolbarButton
                  label="Negrito"
                  ocid="sermon_editor.bold_button"
                  onClick={() => insertAtCursor("**", "**")}
                >
                  <Bold className="size-4" aria-hidden="true" />
                </ToolbarButton>
                <ToolbarButton
                  label="Itálico"
                  ocid="sermon_editor.italic_button"
                  onClick={() => insertAtCursor("_", "_")}
                >
                  <Italic className="size-4" aria-hidden="true" />
                </ToolbarButton>
                <ToolbarButton
                  label="Título de seção"
                  ocid="sermon_editor.heading_button"
                  onClick={() => insertAtCursor("\n## ")}
                >
                  <Heading2 className="size-4" aria-hidden="true" />
                </ToolbarButton>
                <ToolbarButton
                  label="Lista"
                  ocid="sermon_editor.list_button"
                  onClick={() => insertAtCursor("\n- ")}
                >
                  <List className="size-4" aria-hidden="true" />
                </ToolbarButton>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                id="sermon-body"
                ref={bodyRef}
                data-ocid="sermon_editor.body_textarea"
                value={draft.body}
                onChange={(event) => update("body", event.target.value)}
                placeholder="Escreva a introdução, os pontos principais e a aplicação…"
                className="min-h-[420px] resize-y font-body leading-relaxed"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Use **negrito**, _itálico_, ## para títulos de seção e - para
                listas.
              </p>
            </CardContent>
          </Card>
        </div>

        <AiAssistancePanel
          title={draft.title}
          theme={draft.theme}
          body={draft.body}
          onApplyOutline={(outline) =>
            update(
              "body",
              draft.body.trim().length > 0
                ? `${draft.body}\n\n${outline}`
                : outline,
            )
          }
          onApplyImprovement={(suggestion) =>
            update(
              "body",
              draft.body.trim().length > 0
                ? `${draft.body}\n\n> ${suggestion}`
                : `> ${suggestion}`,
            )
          }
          onApplyReference={(reference) =>
            update(
              "bibleReference",
              draft.bibleReference.trim().length > 0
                ? `${draft.bibleReference}; ${reference}`
                : reference,
            )
          }
        />
      </div>
    </section>
  );
}

function ToolbarButton({
  label,
  ocid,
  onClick,
  children,
}: {
  label: string;
  ocid: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      data-ocid={ocid}
      onClick={onClick}
      className="size-8 text-muted-foreground hover:text-primary"
    >
      {children}
    </Button>
  );
}

function AiAssistancePanel({
  title,
  theme,
  body,
  onApplyOutline,
  onApplyImprovement,
  onApplyReference,
}: {
  title: string;
  theme: string;
  body: string;
  onApplyOutline: (outline: string) => void;
  onApplyImprovement: (suggestion: string) => void;
  onApplyReference: (reference: string) => void;
}) {
  const generateOutline = useGenerateOutline();
  const suggestImprovements = useSuggestImprovements();
  const suggestReferences = useSuggestReferences();

  const canGenerate = title.trim().length > 0 || body.trim().length > 0;
  const canSuggest = body.trim().length > 0;
  const canSuggestRefs = theme.trim().length > 0;

  return (
    <aside
      data-ocid="sermon_editor.ai_panel"
      className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start"
    >
      <Card className="rounded-lg border-primary/30 bg-card shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Assistência de IA
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Gere um esboço, receba sugestões de clareza e descubra referências
            relacionadas.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="sermon_editor.generate_outline_button"
            disabled={!canGenerate || generateOutline.isPending}
            onClick={() => generateOutline.mutate({ title, theme, body })}
            className="justify-start rounded-lg border-border"
          >
            {generateOutline.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wand2 className="size-4 text-primary" aria-hidden="true" />
            )}
            Gerar esboço estruturado
          </Button>
          <Button
            type="button"
            variant="outline"
            data-ocid="sermon_editor.suggest_improvements_button"
            disabled={!canSuggest || suggestImprovements.isPending}
            onClick={() => suggestImprovements.mutate(body)}
            className="justify-start rounded-lg border-border"
          >
            {suggestImprovements.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Lightbulb className="size-4 text-primary" aria-hidden="true" />
            )}
            Sugerir melhorias
          </Button>
          <Button
            type="button"
            variant="outline"
            data-ocid="sermon_editor.suggest_references_button"
            disabled={!canSuggestRefs || suggestReferences.isPending}
            onClick={() => suggestReferences.mutate(theme)}
            className="justify-start rounded-lg border-border"
          >
            {suggestReferences.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <BookMarked className="size-4 text-primary" aria-hidden="true" />
            )}
            Sugerir referências bíblicas
          </Button>
          {!canGenerate && (
            <p className="text-xs text-muted-foreground">
              Adicione um título ou comece o corpo para gerar um esboço.
            </p>
          )}
        </CardContent>
      </Card>

      {generateOutline.isPending && (
        <AiLoadingState
          label="Gerando esboço…"
          ocid="sermon_editor.outline_loading"
        />
      )}
      {generateOutline.isError && (
        <AiErrorState
          message="Não foi possível gerar o esboço."
          ocid="sermon_editor.outline_error"
        />
      )}
      {generateOutline.data && (
        <Card
          data-ocid="sermon_editor.outline_result"
          className="rounded-lg border-border bg-card shadow-none"
        >
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">
              Esboço sugerido
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {generateOutline.data.summary}
            </p>
            <pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 font-body text-sm leading-relaxed">
              {generateOutline.data.outline}
            </pre>
            <Button
              type="button"
              size="sm"
              data-ocid="sermon_editor.apply_outline_button"
              onClick={() => {
                onApplyOutline(generateOutline.data.outline);
                toast.success("Esboço aplicado ao sermão");
              }}
              className="self-start rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="size-4" aria-hidden="true" />
              Aplicar ao sermão
            </Button>
          </CardContent>
        </Card>
      )}

      {suggestImprovements.isPending && (
        <AiLoadingState
          label="Analisando clareza e estrutura…"
          ocid="sermon_editor.improvements_loading"
        />
      )}
      {suggestImprovements.isError && (
        <AiErrorState
          message="Não foi possível analisar o sermão."
          ocid="sermon_editor.improvements_error"
        />
      )}
      {suggestImprovements.data && suggestImprovements.data.length > 0 && (
        <Card
          data-ocid="sermon_editor.improvements_result"
          className="rounded-lg border-border bg-card shadow-none"
        >
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">
              Melhorias sugeridas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {suggestImprovements.data.map((item, index) => (
              <div
                key={`${item.issue}-${item.suggestion}`}
                data-ocid={`sermon_editor.improvement_item.${index + 1}`}
                className="illuminated rounded-md border border-border bg-muted/30 py-2 pl-4 pr-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  {item.issue}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {item.suggestion}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  data-ocid={`sermon_editor.apply_improvement_button.${index + 1}`}
                  onClick={() => {
                    onApplyImprovement(item.suggestion);
                    toast.success("Sugestão aplicada ao sermão");
                  }}
                  className="mt-1 h-7 px-2 text-primary hover:text-primary"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  Aplicar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {suggestReferences.isPending && (
        <AiLoadingState
          label="Buscando referências relacionadas…"
          ocid="sermon_editor.references_loading"
        />
      )}
      {suggestReferences.isError && (
        <AiErrorState
          message="Não foi possível sugerir referências."
          ocid="sermon_editor.references_error"
        />
      )}
      {suggestReferences.data && suggestReferences.data.length > 0 && (
        <Card
          data-ocid="sermon_editor.references_result"
          className="rounded-lg border-border bg-card shadow-none"
        >
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">
              Referências relacionadas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {suggestReferences.data.map((item, index) => (
              <div
                key={`${item.reference}-${item.reason}`}
                data-ocid={`sermon_editor.reference_item.${index + 1}`}
                className="rounded-md border border-border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 font-mono text-primary"
                  >
                    {item.reference}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-ocid={`sermon_editor.apply_reference_button.${index + 1}`}
                    onClick={() => {
                      onApplyReference(item.reference);
                      toast.success("Referência adicionada");
                    }}
                    className="h-7 px-2 text-primary hover:text-primary"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    Usar
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </aside>
  );
}

function AiLoadingState({ label, ocid }: { label: string; ocid: string }) {
  return (
    <Card
      data-ocid={ocid}
      className="rounded-lg border-border bg-card shadow-none"
    >
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2
            className="size-4 animate-spin text-primary"
            aria-hidden="true"
          />
          {label}
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

function AiErrorState({ message, ocid }: { message: string; ocid: string }) {
  return (
    <Card
      data-ocid={ocid}
      className="rounded-lg border-destructive/40 bg-destructive/10 shadow-none"
    >
      <CardContent className="flex items-start gap-2 pt-6 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{message} Tente novamente.</span>
      </CardContent>
    </Card>
  );
}

function EditorSkeleton() {
  return (
    <section
      data-ocid="sermon_editor.loading_state"
      className="mx-auto w-full max-w-6xl"
    >
      <Skeleton className="mb-3 h-8 w-56" />
      <Skeleton className="mb-6 h-4 w-80" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </section>
  );
}
