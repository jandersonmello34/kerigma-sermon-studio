import HolyricsSettingsPage from "@/components/views/HolyricsSettingsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Kerigma" },
      { name: "description", content: "Conecte o Kerigma ao seu Holyrics." },
      { property: "og:title", content: "Configurações — Kerigma" },
      { property: "og:description", content: "Conecte o Kerigma ao seu Holyrics." },
    ],
  }),
  component: HolyricsSettingsPage,
});
