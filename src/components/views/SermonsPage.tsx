import { type Sermon, SermonStatus } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections } from "@/hooks/useCollections";
import { useDeleteSermon, useSermons } from "@/hooks/useSermons";
import {
  excerpt,
  formatDate,
  formatStatus,
  statusBadgeClass,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreateSermonDialog } from "@/components/CreateSermonDialog";
import { Link } from "@tanstack/react-router";
import {
  BookOpenText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

const ALL_THEMES = "__all__";
const ALL_STATUS = "__all__";

const statusOptions: { value: string; label: string }[] = [
  { value: ALL_STATUS, label: "Todos os status" },
  { value: SermonStatus.draft, label: "Rascunho" },
  { value: SermonStatus.ready, label: "Pronto" },
];

function SermonCard({
  sermon,
  index,
  onRequestDelete,
}: {
  sermon: Sermon;
  index: number;
  onRequestDelete: (sermon: Sermon) => void;
}) {
  return (
    <Card
      data-ocid={`sermons.item.${index + 1}`}
      className="illuminated group relative overflow-hidden rounded-lg border-border bg-card shadow-none transition-smooth hover:border-primary/40 hover:shadow-gold-glow"
    >
      <CardContent className="flex h-full flex-col gap-3 p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <Link
            to="/sermoes/$sermonId"
            params={{ sermonId: sermon.id.toString() }}
            data-ocid={`sermons.open_link.${index + 1}`}
            className="min-w-0 flex-1 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <h2 className="font-display text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
              {sermon.title}
            </h2>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-ocid={`sermons.delete_button.${index + 1}`}
            aria-label={`Excluir sermão ${sermon.title}`}
            onClick={() => onRequestDelete(sermon)}
            className="size-8 shrink-0 text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <p className="text-sm font-medium text-primary/90">
          {sermon.bibleReference || "Sem referência bíblica"}
        </p>

        {sermon.body ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {excerpt(sermon.body, 120)}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Badge
            variant="outline"
            className={cn(
              "rounded-md border font-medium",
              statusBadgeClass(sermon.status),
            )}
          >
            {formatStatus(sermon.status)}
          </Badge>
          {sermon.theme ? (
            <Badge
              variant="outline"
              className="rounded-md border-border bg-secondary/60 font-medium text-secondary-foreground"
            >
              {sermon.theme}
            </Badge>
          ) : null}
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDate(sermon.updatedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SermonCardSkeleton() {
  return (
    <Card className="rounded-lg border-border bg-card shadow-none">
      <CardContent className="flex flex-col gap-3 p-5 pl-6">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SermonsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<string>(ALL_THEMES);
  const [status, setStatus] = useState<string>(ALL_STATUS);
  const [pendingDelete, setPendingDelete] = useState<Sermon | null>(null);

  const { data: collections } = useCollections();

  const filter = useMemo(
    () => ({
      search: search.trim() || undefined,
      theme: theme === ALL_THEMES ? undefined : theme,
      status: status === ALL_STATUS ? undefined : (status as SermonStatus),
    }),
    [search, theme, status],
  );

  const {
    data: sermons,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useSermons(filter);
  const deleteSermon = useDeleteSermon();

  const themeOptions = useMemo(() => {
    const names = new Set<string>();
    for (const collection of collections ?? []) {
      if (collection.name.trim()) names.add(collection.name);
    }
    for (const sermon of sermons ?? []) {
      if (sermon.theme.trim()) names.add(sermon.theme);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [collections, sermons]);

  const hasActiveFilters =
    search.trim().length > 0 || theme !== ALL_THEMES || status !== ALL_STATUS;

  const list = sermons ?? [];
  const showEmpty = !isLoading && !isError && list.length === 0;

  function clearFilters() {
    setSearch("");
    setTheme(ALL_THEMES);
    setStatus(ALL_STATUS);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteSermon.mutate(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <section data-ocid="sermons.page" className="mx-auto w-full max-w-6xl">
      <CreateSermonDialog open={createOpen} onOpenChange={setCreateOpen} />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Sermões
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize, escreva e prepare seus sermões.
          </p>
        </div>
        <Button
          type="button"
          data-ocid="sermons.new_button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-primary px-4 font-medium text-primary-foreground shadow-gold-glow transition-smooth hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Plus className="size-4" aria-hidden="true" />
          Novo sermão
        </Button>
      </header>

      <div
        data-ocid="sermons.filters.panel"
        className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            data-ocid="sermons.search_input"
            placeholder="Buscar por título, texto ou referência bíblica"
            aria-label="Buscar sermões"
            className="h-9 rounded-lg border-input bg-background pl-9"
          />
        </div>

        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger
            data-ocid="sermons.theme.select"
            aria-label="Filtrar por tema"
            className="h-9 w-full rounded-lg border-input bg-background sm:w-48"
          >
            <SelectValue placeholder="Tema" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_THEMES}>Todos os temas</SelectItem>
            {themeOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger
            data-ocid="sermons.status.select"
            aria-label="Filtrar por status"
            className="h-9 w-full rounded-lg border-input bg-background sm:w-44"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div
          data-ocid="sermons.loading_state"
          aria-busy="true"
          aria-live="polite"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, i) => `sermon-skeleton-${i}`).map(
            (id) => (
              <SermonCardSkeleton key={id} />
            ),
          )}
        </div>
      ) : isError ? (
        <Card
          data-ocid="sermons.error_state"
          className="rounded-lg border-destructive/40 bg-card shadow-none"
        >
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="font-display text-lg font-semibold">
              Não foi possível carregar seus sermões
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Verifique sua conexão e tente novamente.
            </p>
            <Button
              type="button"
              variant="outline"
              data-ocid="sermons.retry_button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="rounded-lg border-border"
            >
              {isFetching ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" aria-hidden="true" />
              )}
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : showEmpty ? (
        <Card
          data-ocid="sermons.empty_state"
          className="rounded-lg border-border bg-card shadow-none"
        >
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpenText className="size-8 text-primary" aria-hidden="true" />
            <p className="font-display text-lg font-semibold">
              {hasActiveFilters
                ? "Nenhum sermão encontrado"
                : "Comece seu primeiro sermão"}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Ajuste a busca ou os filtros para encontrar o que procura."
                : "Crie um sermão para organizar suas ideias, referências e temas."}
            </p>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                data-ocid="sermons.clear_filters_button"
                onClick={clearFilters}
                className="rounded-lg border-border"
              >
                Limpar filtros
              </Button>
            ) : (
              <Button
                type="button"
                data-ocid="sermons.empty_new_button"
                onClick={() => setCreateOpen(true)}
                className="rounded-lg bg-primary px-4 font-medium text-primary-foreground shadow-gold-glow transition-smooth hover:bg-primary/90"
              >
                <Plus className="size-4" aria-hidden="true" />
                Novo sermão
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          data-ocid="sermons.list"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {list.map((sermon, index) => (
            <SermonCard
              key={sermon.id.toString()}
              sermon={sermon}
              index={index}
              onRequestDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent
          data-ocid="sermons.delete_dialog"
          className="rounded-lg border-border bg-card"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Excluir sermão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir{" "}
              <span className="font-medium text-foreground">
                {pendingDelete?.title}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="sermons.cancel_button"
              className="rounded-lg border-border"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="sermons.confirm_button"
              onClick={confirmDelete}
              className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
