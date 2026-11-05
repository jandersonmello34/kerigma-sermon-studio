import IdeaWizardPage from "@/components/views/IdeaWizardPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/sermoes/florescer")({
  head: () => ({
    meta: [
      { title: "Florescer uma ideia — Kerigma" },
      { name: "description", content: "Da ideia inicial ao primeiro rascunho de esboço, com apoio de IA." },
      { property: "og:title", content: "Florescer uma ideia — Kerigma" },
      { property: "og:description", content: "Da ideia inicial ao primeiro rascunho de esboço." },
    ],
  }),
  component: IdeaWizardPage,
});
