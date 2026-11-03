import SermonEditorPage from "@/components/views/SermonEditorPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/sermoes/$sermonId")({
  head: () => ({
    meta: [
      { title: "Editor de sermão — Kerigma" },
      { name: "description", content: "Escreva seu sermão com apoio de IA para esboço, clareza e referências." },
      { property: "og:title", content: "Editor de sermão — Kerigma" },
      { property: "og:description", content: "Escreva seu sermão com apoio de IA." },
    ],
  }),
  component: SermonEditorPage,
});
