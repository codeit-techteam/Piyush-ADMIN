import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";
import type {
  BoutiqueAnalytics,
  BoutiqueAnalyticsOption,
  BoutiqueOverviewStats,
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

function enrichTopPerformingBoutiqueLocations(
  platform: PlatformAnalytics,
  boutiques: BoutiqueAnalyticsOption[],
): PlatformAnalytics {
  const locationById = new Map(boutiques.map((b) => [b.id, b.location ?? null]));

  return {
    ...platform,
    sections: {
      ...platform.sections,
      topPerformingBoutiques: (platform.sections.topPerformingBoutiques ?? []).map((boutique) => ({
        ...boutique,
        location: boutique.location ?? locationById.get(boutique.id) ?? null,
      })),
    },
  };
}

export async function getPlatformAnalytics(query?: DateRangeQuery) {
  const params = buildParams(query);

  const [platformRes, boutiques] = await Promise.all([
    api.get<ApiResponse<PlatformAnalytics>>("/analytics/platform", {
      params,
      timeout: 60000,
    }),
    listAnalyticsBoutiques().catch(() => [] as BoutiqueAnalyticsOption[]),
  ]);

  return enrichTopPerformingBoutiqueLocations(platformRes.data.data, boutiques);
}

export async function getBoutiqueAnalytics(query: DateRangeQuery) {
  const { data } = await api.get<ApiResponse<BoutiqueAnalytics>>("/analytics/boutique", {
    params: buildParams(query),
    timeout: 60000,
  });
  return data.data;
}

export async function getBoutiqueOverviewStats(query?: DateRangeQuery) {
  const params = new URLSearchParams();
  if (query?.range) params.set("range", query.range);
  if (query?.from) params.set("from", query.from);
  if (query?.to) params.set("to", query.to);

  const qs = params.toString();
  const res = await fetch(`/api/admin/analytics/boutique-overview${qs ? `?${qs}` : ""}`);
  const json = (await res.json()) as ApiResponse<BoutiqueOverviewStats> & {
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.message ?? "Failed to load boutique overview stats");
  }

  return json.data;
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
