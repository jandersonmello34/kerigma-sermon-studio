import {
  generateSermonOutline,
  suggestSermonImprovements,
  suggestSermonReferences,
} from "@/lib/ai.functions";
import type {
  ImprovementSuggestion,
  ReferenceSuggestion,
  StructureSuggestion,
} from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

export function useGenerateOutline() {
  const fn = useServerFn(generateSermonOutline);
  return useMutation<StructureSuggestion, Error, { title: string; theme: string; body: string }>({
    mutationFn: (data) => fn({ data }),
  });
}

export function useSuggestImprovements() {
  const fn = useServerFn(suggestSermonImprovements);
  return useMutation<ImprovementSuggestion[], Error, string>({
    mutationFn: (body) => fn({ data: { body } }),
  });
}

export function useSuggestReferences() {
  const fn = useServerFn(suggestSermonReferences);
  return useMutation<ReferenceSuggestion[], Error, string>({
    mutationFn: (theme) => fn({ data: { theme } }),
  });
}
