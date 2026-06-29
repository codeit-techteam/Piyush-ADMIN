"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getBoutiqueAnalytics,
  getBoutiqueOverviewStats,
  getCustomerAnalytics,
  getPlatformAnalytics,
  listAnalyticsBoutiques,
} from "@/lib/api/services/analytics";
import type { DateRangeQuery } from "@/types/analytics";

const REFRESH_MS = 60_000;

export function usePlatformAnalytics(query: DateRangeQuery, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "platform", query],
    queryFn: () => getPlatformAnalytics(query),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
    retry: 2,
  });
}

export function useBoutiqueAnalytics(query: DateRangeQuery & { boutiqueId?: string }, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "boutique", query],
    queryFn: () => getBoutiqueAnalytics(query),
    enabled: enabled && Boolean(query.boutiqueId),
    refetchInterval: enabled && query.boutiqueId ? REFRESH_MS : false,
    retry: 2,
  });
}

export function useBoutiqueOverviewStats(query: DateRangeQuery, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "boutique-overview", query],
    queryFn: () => getBoutiqueOverviewStats(query),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
    retry: 2,
  });
}

export function useCustomerAnalytics(query: DateRangeQuery, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "customer", query],
    queryFn: () => getCustomerAnalytics(query),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
    retry: 2,
  });
}

export function useAnalyticsBoutiques() {
  return useQuery({
    queryKey: ["analytics", "boutiques"],
    queryFn: listAnalyticsBoutiques,
    staleTime: 5 * 60_000,
  });
}
