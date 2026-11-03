import {
  getHolyricsConfigStatus,
  getHolyricsProjectionState,
  holyricsAction,
  listHolyricsImages,
  projectHolyricsImage,
  saveHolyricsConfig,
} from "@/lib/holyrics.functions";
import type { HolyricsConfig, HolyricsImage, ProjectionState } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

export const holyricsConfigQueryKey = ["holyrics", "config"] as const;
export const holyricsImagesQueryKey = ["holyrics", "images"] as const;
export const holyricsProjectionQueryKey = ["holyrics", "projection"] as const;

export function useHolyricsConfigStatus() {
  const fn = useServerFn(getHolyricsConfigStatus);
  return useQuery<boolean>({ queryKey: holyricsConfigQueryKey, queryFn: () => fn() });
}

export function useSaveHolyricsConfig() {
  const fn = useServerFn(saveHolyricsConfig);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: HolyricsConfig) => fn({ data: config }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["holyrics"] }),
  });
}

export function useHolyricsImages(enabled = true) {
  const fn = useServerFn(listHolyricsImages);
  return useQuery<HolyricsImage[]>({ queryKey: holyricsImagesQueryKey, queryFn: () => fn(), enabled, retry: false });
}

export function useHolyricsProjectionState(enabled = true) {
  const fn = useServerFn(getHolyricsProjectionState);
  return useQuery<ProjectionState | null>({
    queryKey: holyricsProjectionQueryKey,
    queryFn: () => fn(),
    enabled,
    retry: false,
  });
}

function useActionMutation(action: "next" | "previous" | "stop") {
  const fn = useServerFn(holyricsAction);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fn({ data: { action } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: holyricsProjectionQueryKey }),
  });
}

export function useProjectHolyricsImage() {
  const fn = useServerFn(projectHolyricsImage);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => fn({ data: { imageId } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: holyricsProjectionQueryKey }),
  });
}

export const useNextHolyricsSlide = () => useActionMutation("next");
export const usePreviousHolyricsSlide = () => useActionMutation("previous");
export const useStopHolyricsPresentation = () => useActionMutation("stop");
