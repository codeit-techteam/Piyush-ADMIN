"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchBoutiqueAdmin } from "@/lib/api/services/boutiques";
import type { Boutique, PatchBoutiqueAdminPayload } from "@/types";

export function usePatchBoutiqueAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatchBoutiqueAdminPayload }) =>
      patchBoutiqueAdmin(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["boutiques"] });
      const previous = queryClient.getQueryData<Boutique[]>(["boutiques"]);
      queryClient.setQueryData<Boutique[]>(["boutiques"], (old) =>
        old?.map((boutique) =>
          boutique.id === id
            ? {
                ...boutique,
                ...payload,
                verified:
                  payload.is_verified !== undefined ? payload.is_verified : boutique.verified,
                is_verified:
                  payload.is_verified !== undefined ? payload.is_verified : boutique.is_verified,
                featured:
                  payload.is_featured !== undefined ? payload.is_featured : boutique.featured,
                is_featured:
                  payload.is_featured !== undefined ? payload.is_featured : boutique.is_featured,
              }
            : boutique,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["boutiques"], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["boutiques", data.id], data);
      queryClient.invalidateQueries({ queryKey: ["boutiques"] });
    },
  });
}
