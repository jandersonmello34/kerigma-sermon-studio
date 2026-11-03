import HolyricsPage from "@/components/views/HolyricsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/projecao")({
  head: () => ({
    meta: [
      { title: "Projeção Holyrics — Kerigma" },
      { name: "description", content: "Controle a projeção do Holyrics durante o culto." },
      { property: "og:title", content: "Projeção Holyrics — Kerigma" },
      { property: "og:description", content: "Controle a projeção do Holyrics durante o culto." },
    ],
  }),
  component: HolyricsPage,
});
