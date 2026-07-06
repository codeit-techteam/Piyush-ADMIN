"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getBoutiqueAnalytics,
  getBoutiqueOverviewStats,
  getBoutiquePendingActions,
  getCategoryDetailDrilldown,
  getCustomerAnalytics,
  getPlatformAnalytics,
  getProductDrilldown,
  getSearchKeywordDrilldown,
  listAnalyticsBoutiques,
} from "@/lib/api/services/analytics";
import type { CustomerInsightDrilldownQuery, DateRangeQuery, DrilldownQuery } from "@/types/analytics";

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

export function useSearchKeywordDrilldown(query: CustomerInsightDrilldownQuery | null, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "search-drilldown", query],
    queryFn: () => getSearchKeywordDrilldown(query!),
    enabled: enabled && Boolean(query?.keyword),
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCategoryDetailDrilldown(query: CustomerInsightDrilldownQuery | null, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "category-drilldown", query],
    queryFn: () => getCategoryDetailDrilldown(query!),
    enabled: enabled && Boolean(query?.category),
    staleTime: 30_000,
    retry: 2,
  });
}

export function useProductDrilldown(query: DrilldownQuery | null, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "product-drilldown", query],
    queryFn: () => getProductDrilldown(query!),
    enabled: enabled && Boolean(query?.boutiqueId && query?.date),
    staleTime: 30_000,
    retry: 2,
  });
}

export function useBoutiquePendingActions(boutiqueId?: string, enabled = true) {
  return useQuery({
    queryKey: ["analytics", "boutique-pending", boutiqueId],
    queryFn: () => getBoutiquePendingActions(boutiqueId!),
    enabled: enabled && Boolean(boutiqueId),
    staleTime: 60_000,
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
