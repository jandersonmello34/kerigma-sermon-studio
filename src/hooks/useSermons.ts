import { supabase } from "@/integrations/supabase/client";
import type { Sermon, SermonFilter, SermonInput, SermonUpdate } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const sermonsQueryKey = ["sermons"] as const;

type Row = {
  id: string;
  title: string;
  body: string;
  bible_reference: string;
  theme: string;
  status: "draft" | "ready";
  duration_minutes: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id,title,body,bible_reference,theme,status,duration_minutes,created_at,updated_at";

function toSermon(r: Row): Sermon {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    bibleReference: r.bible_reference,
    theme: r.theme,
    status: r.status,
    durationMinutes: r.duration_minutes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toRow(input: SermonInput) {
  return {
    title: input.title,
    body: input.body,
    bible_reference: input.bibleReference,
    theme: input.theme,
    status: input.status,
    ...(input.durationMinutes ? { duration_minutes: input.durationMinutes } : {}),
  };
}

/** Same matching rule as the original app: case-insensitive on title, body or bible reference. */
export function matchesSearch(s: Sermon, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return (
    s.title.toLowerCase().includes(needle) ||
    s.body.toLowerCase().includes(needle) ||
    s.bibleReference.toLowerCase().includes(needle)
  );
}

async function fetchSermons(): Promise<Sermon[]> {
  const { data, error } = await supabase
    .from("sermons")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(toSermon);
}

export function useSermons(filter: SermonFilter = {}) {
  const { search, theme, status } = filter;
  return useQuery<Sermon[]>({
    queryKey: ["sermons", { search: search ?? "", theme: theme ?? "", status: status ?? "" }],
    queryFn: async () => {
      const all = await fetchSermons();
      return all.filter(
        (s) =>
          (!theme || s.theme === theme) &&
          (!status || s.status === status) &&
          (!search || matchesSearch(s, search)),
      );
    },
  });
}

export function useSermon(id: string | undefined) {
  return useQuery<Sermon | null>({
    queryKey: ["sermon", id ?? ""],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("sermons")
        .select(COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? toSermon(data as Row) : null;
    },
    enabled: id !== undefined,
  });
}

export function useCreateSermon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SermonInput) => {
      const { data, error } = await supabase
        .from("sermons")
        .insert(toRow(input))
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sermonsQueryKey });
    },
  });
}

export function useUpdateSermon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SermonUpdate }) => {
      const { data, error } = await supabase
        .from("sermons")
        .update(toRow(input))
        .eq("id", id)
        .select(COLUMNS)
        .maybeSingle();
      if (error) throw error;
      return data ? toSermon(data as Row) : null;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: sermonsQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["sermon", variables.id] });
    },
  });
}

export function useDeleteSermon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sermons").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sermonsQueryKey });
    },
  });
}
