"use client";

import { useQuery } from "@tanstack/react-query";
import { listBoutiques } from "@/lib/api/services/boutiques";

export function useBoutiques() {
  return useQuery({
    queryKey: ["boutiques"],
    queryFn: listBoutiques,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}
