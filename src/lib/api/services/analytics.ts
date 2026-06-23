import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";
import type {
  BoutiqueAnalytics,
  BoutiqueAnalyticsOption,
  CustomerAnalytics,
  DateRangeQuery,
  DashboardLayer,
  PlatformAnalytics,
} from "@/types/analytics";

function buildParams(query: DateRangeQuery = {}) {
  const params: Record<string, string> = {};
  if (query.range) params.range = query.range;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.boutiqueId) params.boutiqueId = query.boutiqueId;
  return params;
}

export async function getPlatformAnalytics(query?: DateRangeQuery) {
  const { data } = await api.get<ApiResponse<PlatformAnalytics>>("/analytics/platform", {
    params: buildParams(query),
    timeout: 60000,
  });
  return data.data;
}

export async function getBoutiqueAnalytics(query: DateRangeQuery) {
  const { data } = await api.get<ApiResponse<BoutiqueAnalytics>>("/analytics/boutique", {
    params: buildParams(query),
    timeout: 60000,
  });
  return data.data;
}

export async function getCustomerAnalytics(query?: DateRangeQuery) {
  const { data } = await api.get<ApiResponse<CustomerAnalytics>>("/analytics/customer", {
    params: buildParams(query),
    timeout: 60000,
  });
  return data.data;
}

export async function listAnalyticsBoutiques() {
  const { data } = await api.get<ApiResponse<BoutiqueAnalyticsOption[]>>("/analytics/boutiques", {
    timeout: 30000,
  });
  return data.data;
}

export function getAnalyticsExportUrl(type: DashboardLayer, format: "csv" | "pdf", query?: DateRangeQuery) {
  const base = api.defaults.baseURL ?? "";
  const params = new URLSearchParams({ type, ...buildParams(query) });
  return `${base}/analytics/export/${format}?${params.toString()}`;
}
