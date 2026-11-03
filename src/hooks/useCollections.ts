import { supabase } from "@/integrations/supabase/client";
import type { Collection } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const collectionsQueryKey = ["collections"] as const;

export function useCollections() {
  return useQuery<Collection[]>({
    queryKey: collectionsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,name,created_at")
        .order("created_at");
      if (error) throw error;
      return data.map((c) => ({ id: c.id, name: c.name, createdAt: c.created_at }));
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("collections")
        .insert({ name })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: collectionsQueryKey }),
  });
}

export function useRenameCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("collections").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: collectionsQueryKey }),
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: collectionsQueryKey }),
  });
}
