"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteBoutique, getBoutiqueDetails, updateBoutique } from "@/lib/api/services/boutiques";
import type { BoutiqueDetails, UpdateBoutiquePayload } from "@/types";

export function useBoutiqueDetails(id: string) {
  return useQuery({
    queryKey: ["boutiques", id],
    queryFn: () => getBoutiqueDetails(id),
    enabled: Boolean(id),
  });
}

export function useUpdateBoutique(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBoutiquePayload) => updateBoutique(id, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["boutiques", id] });
      const previous = queryClient.getQueryData<BoutiqueDetails>(["boutiques", id]);
      queryClient.setQueryData<BoutiqueDetails>(["boutiques", id], (old) =>
        old
          ? ({
              ...old,
              ...payload,
              updated_at: new Date().toISOString(),
            } as BoutiqueDetails)
          : old,
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["boutiques", id], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["boutiques", id], data);
      queryClient.invalidateQueries({ queryKey: ["boutiques"] });
    },
  });
}

export function useDeleteBoutique(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteBoutique(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["boutiques", id] });
      queryClient.invalidateQueries({ queryKey: ["boutiques"] });
    },
  });
}
