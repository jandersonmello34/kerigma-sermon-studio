import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHolyricsConfigStatus,
  useHolyricsImages,
  useHolyricsProjectionState,
  useNextHolyricsSlide,
  usePreviousHolyricsSlide,
  useProjectHolyricsImage,
  useStopHolyricsPresentation,
} from "@/hooks/useHolyrics";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  MonitorPlay,
  Settings,
  Square,
} from "lucide-react";
import { useState } from "react";

type Feedback = { kind: "success" | "error"; message: string };

export default function HolyricsPage() {
  const configQuery = useHolyricsConfigStatus();
  const isConfigured = configQuery.data === true;

  const imagesQuery = useHolyricsImages(isConfigured);
  const projectionQuery = useHolyricsProjectionState(isConfigured);

  const projectImage = useProjectHolyricsImage();
  const nextSlide = useNextHolyricsSlide();
  const previousSlide = usePreviousHolyricsSlide();
  const stopPresentation = useStopHolyricsPresentation();

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const images = imagesQuery.data ?? [];
  const projection = projectionQuery.data ?? null;
  const isProjecting = projection !== null;

  const runAction = (
    action: { mutateAsync: () => Promise<unknown> },
    successMessage: string,
  ) => {
    setFeedback(null);
    action
      .mutateAsync()
      .then(() => setFeedback({ kind: "success", message: successMessage }))
      .catch(() =>
        setFeedback({
          kind: "error",
          message: "Não foi possível concluir a ação. Tente novamente.",
        }),
      );
  };

  const handleProject = (imageId: string, imageName: string) => {
    setFeedback(null);
    projectImage
      .mutateAsync(imageId)
      .then(() =>
        setFeedback({
          kind: "success",
          message: `“${imageName}” está sendo projetada.`,
        }),
      )
      .catch(() =>
        setFeedback({
          kind: "error",
          message: "Não foi possível projetar a imagem. Tente novamente.",
        }),
      );
  };

  if (configQuery.isLoading) {
    return (
      <section data-ocid="holyrics.page" className="mx-auto w-full max-w-6xl">
        <PageHeader />
        <div
          data-ocid="holyrics.loading_state"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }, (_, i) => `holyrics-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-40 rounded-lg" />
            ),
          )}
        </div>
      </section>
    );
  }

  if (!isConfigured) {
    return (
      <section data-ocid="holyrics.page" className="mx-auto w-full max-w-6xl">
        <PageHeader />
        <Card
          data-ocid="holyrics.not_configured_state"
          className="rounded-lg border-border bg-card shadow-none"
        >
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Settings className="size-6 text-primary" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold">
                Conexão com o Holyrics não configurada
              </h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Para listar e projetar imagens durante a pregação, informe a
                chave de API e o token do servidor do Holyrics.
              </p>
            </div>
            <Button
              asChild
              data-ocid="holyrics.settings_link"
              className="rounded-lg bg-primary text-primary-foreground shadow-gold-glow transition-smooth hover:bg-primary/90"
            >
              <Link to="/configuracoes">
                <Settings className="size-4" aria-hidden="true" />
                Ir para configurações
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section data-ocid="holyrics.page" className="mx-auto w-full max-w-6xl">
      <PageHeader />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <h2 className="mb-3 font-display text-lg font-semibold">
            Imagens disponíveis
          </h2>

          {imagesQuery.isLoading ? (
            <div
              data-ocid="holyrics.images.loading_state"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from(
                { length: 6 },
                (_, i) => `holyrics-image-skeleton-${i}`,
              ).map((id) => (
                <Skeleton key={id} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : imagesQuery.isError ? (
            <Card
              data-ocid="holyrics.images.error_state"
              className="rounded-lg border-border bg-card shadow-none"
            >
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle
                  className="size-7 text-destructive"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar as imagens do Holyrics.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="holyrics.images.retry_button"
                  className="rounded-lg"
                  onClick={() => void imagesQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          ) : images.length === 0 ? (
            <Card
              data-ocid="holyrics.images.empty_state"
              className="rounded-lg border-border bg-card shadow-none"
            >
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <ImageOff
                  className="size-7 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Nenhuma imagem disponível no Holyrics.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul
              data-ocid="holyrics.images.list"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {images.map((image, index) => {
                const isActive = projection?.itemName === image.name;
                return (
                  <li key={image.id}>
                    <Card
                      data-ocid={`holyrics.image.item.${index + 1}`}
                      className={`illuminated overflow-hidden rounded-lg border bg-card shadow-none transition-smooth ${
                        isActive ? "border-primary" : "border-border"
                      }`}
                    >
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        {image.thumbnail ? (
                          <img
                            src={image.thumbnail}
                            alt={image.name}
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <ImageOff
                              className="size-6 text-muted-foreground"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </div>
                      <CardContent className="flex items-center justify-between gap-3 p-3">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {image.name}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          data-ocid={`holyrics.image.project_button.${index + 1}`}
                          disabled={projectImage.isPending}
                          onClick={() => handleProject(image.id, image.name)}
                          className="shrink-0 rounded-lg bg-primary text-primary-foreground transition-smooth hover:bg-primary/90"
                        >
                          <MonitorPlay className="size-4" aria-hidden="true" />
                          Projetar
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card
            data-ocid="holyrics.projection.panel"
            className="rounded-lg border-border bg-card shadow-none"
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-2">
                <MonitorPlay
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                <h2 className="font-display text-lg font-semibold">
                  Projeção atual
                </h2>
              </div>

              {projectionQuery.isLoading ? (
                <Skeleton
                  data-ocid="holyrics.projection.loading_state"
                  className="h-20 rounded-lg"
                />
              ) : isProjecting && projection ? (
                <div
                  data-ocid="holyrics.projection.current"
                  className="rounded-lg border border-primary/40 bg-primary/5 p-3"
                >
                  <p className="truncate text-sm font-medium">
                    {projection.itemName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Slide {Number(projection.slideNumber)}
                  </p>
                </div>
              ) : (
                <div
                  data-ocid="holyrics.projection.idle_state"
                  className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
                >
                  Nenhuma imagem em projeção.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="holyrics.previous_button"
                  disabled={!isProjecting || previousSlide.isPending}
                  onClick={() =>
                    runAction(previousSlide, "Slide anterior exibido.")
                  }
                  className="rounded-lg"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  data-ocid="holyrics.next_button"
                  disabled={!isProjecting || nextSlide.isPending}
                  onClick={() => runAction(nextSlide, "Próximo slide exibido.")}
                  className="rounded-lg bg-primary text-primary-foreground transition-smooth hover:bg-primary/90"
                >
                  Próximo
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>

              <Button
                type="button"
                variant="destructive"
                data-ocid="holyrics.stop_button"
                disabled={!isProjecting || stopPresentation.isPending}
                onClick={() =>
                  runAction(stopPresentation, "Apresentação encerrada.")
                }
                className="w-full rounded-lg"
              >
                <Square className="size-4" aria-hidden="true" />
                Encerrar apresentação
              </Button>

              {feedback ? (
                <output
                  data-ocid={
                    feedback.kind === "success"
                      ? "holyrics.success_state"
                      : "holyrics.error_state"
                  }
                  className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                    feedback.kind === "success"
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-destructive/40 bg-destructive/10 text-destructive"
                  }`}
                >
                  {feedback.kind === "success" ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span>{feedback.message}</span>
                </output>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function PageHeader() {
  return (
    <header className="mb-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Projeção
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Projete imagens e controle a apresentação no Holyrics.
      </p>
    </header>
  );
}
