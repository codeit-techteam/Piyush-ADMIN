"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBoutiqueCompletionMeta } from "@/lib/api/services/boutique-completion";

export function useBoutiqueCompletionMeta(boutiqueIds: string[]) {
  const sortedKey = [...boutiqueIds].sort().join(",");

  return useQuery({
    queryKey: ["boutique-completion", sortedKey],
    queryFn: () => fetchBoutiqueCompletionMeta(boutiqueIds),
    enabled: boutiqueIds.length > 0,
    staleTime: 30_000,
  });
}
