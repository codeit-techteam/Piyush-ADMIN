"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse, StoreReviewDetails } from "@/types";

export function useStoreReview(boutiqueId: string) {
  return useQuery({
    queryKey: ["store-review", boutiqueId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/store-review/${boutiqueId}`);
      const json = (await res.json()) as ApiResponse<StoreReviewDetails> & {
        message?: string;
      };
      if (!res.ok) {
        throw new Error(json.message ?? "Failed to load store review");
      }
      return json.data;
    },
    enabled: Boolean(boutiqueId),
  });
}
