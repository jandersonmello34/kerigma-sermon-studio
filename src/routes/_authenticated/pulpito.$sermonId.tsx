import PulpitPage from "@/components/views/PulpitPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pulpito/$sermonId")({
  head: () => ({
    meta: [
      { title: "Modo púlpito — Kerigma" },
      { name: "description", content: "Pregue seu sermão com temporizador e alertas visuais de tempo." },
      { property: "og:title", content: "Modo púlpito — Kerigma" },
      { property: "og:description", content: "Temporizador do sermão com borda luminosa de alerta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PulpitPage,
});
