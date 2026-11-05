import BiblePage from "@/components/views/BiblePage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/biblia")({
  head: () => ({
    meta: [
      { title: "Bíblia — Kerigma" },
      { name: "description", content: "Leia a Bíblia em NVI, ACF e AA e compare versões lado a lado." },
      { property: "og:title", content: "Bíblia — Kerigma" },
      { property: "og:description", content: "Leia e compare versões da Bíblia." },
    ],
  }),
  component: BiblePage,
});
