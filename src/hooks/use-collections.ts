"use client";

import { useQuery } from "@tanstack/react-query";

import { listCmsItems, type CollectionRow } from "@/lib/api/services/cms";

export function useCollections() {
  return useQuery({
    queryKey: ["cms-collections"],
    queryFn: () => listCmsItems<CollectionRow>("collections"),
    staleTime: 30_000,
    retry: 2,
  });
}
