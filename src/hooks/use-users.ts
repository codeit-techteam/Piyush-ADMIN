"use client";

import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/lib/api/services/users";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}
