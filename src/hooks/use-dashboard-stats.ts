"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/api/services/dashboard";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });
}
