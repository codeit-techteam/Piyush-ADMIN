import { api } from "@/lib/api";
import { enrichTopPerformingProducts, withViewPercentages } from "@/lib/analytics/insights";
import type { ApiResponse } from "@/types";
import type {
  ActivityDetailsResponse,
  BoutiqueAnalytics,
  BoutiqueAnalyticsOption,
  BoutiqueOverviewStats,
  BoutiquePendingAction,
  CustomerActivityDetailsQuery,
  CustomerAnalytics,
  CustomerInsightDrilldownQuery,
  CategoryDetailDrilldownResponse,
  DateRangeQuery,
  DashboardLayer,
  DrilldownQuery,
  PlatformAnalytics,
  PlatformDayDetailsQuery,
  PlatformDayDetailsResponse,
  ProductDrilldownResponse,
  SearchKeywordDrilldownResponse,
  WishlistDetailsResponse,
} from "@/types/analytics";

function buildInsightParams(query: CustomerInsightDrilldownQuery = {}) {
  const params: Record<string, string> = {};
  if (query.range) params.range = query.range;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.keyword) params.keyword = query.keyword;
  if (query.category) params.category = query.category;
  if (query.categoryId) params.categoryId = query.categoryId;
  return params;
}

function buildDateDetailParams(query: CustomerActivityDetailsQuery = {}) {
  const params: Record<string, string> = {};
  if (query.date) params.date = query.date;
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate) params.endDate = query.endDate;
  if (query.range) params.range = query.range;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  return params;
}

async function enrichCustomerAnalyticsSections(
  data: CustomerAnalytics,
  query?: DateRangeQuery,
): Promise<CustomerAnalytics> {
  const categories = withViewPercentages(data.sections.mostViewedCategories ?? []);

  try {
    const res = await fetch("/api/admin/analytics/customer-sections-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        range: query?.range ?? data.range.preset,
        from: query?.from ?? data.range.from,
        to: query?.to ?? data.range.to,
        sections: {
          topSearchKeywords: data.sections.topSearchKeywords ?? [],
          mostViewedCategories: categories,
        },
      }),
    });
    const json = (await res.json()) as ApiResponse<{
      topSearchKeywords: CustomerAnalytics["sections"]["topSearchKeywords"];
      mostViewedCategories: CustomerAnalytics["sections"]["mostViewedCategories"];
    }>;

    if (res.ok && json.data) {
      return {
        ...data,
        sections: {
          topSearchKeywords: json.data.topSearchKeywords,
          mostViewedCategories: json.data.mostViewedCategories,
        },
      };
    }
  } catch {
    // Fall back to client-side percentage enrichment only.
  }

  return {
    ...data,
    sections: {
      ...data.sections,
      mostViewedCategories: categories,
    },
  };
}

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

export async function getPlatformDayDetails(query: PlatformDayDetailsQuery) {
  const { data } = await api.get<ApiResponse<PlatformDayDetailsResponse>>(
    "/analytics/platform/day-details",
    { params: { date: query.date.slice(0, 10), metric: query.metric }, timeout: 30000 },
  );
  return data.data;
}

export async function getBoutiqueAnalytics(query: DateRangeQuery) {
  const { data } = await api.get<ApiResponse<BoutiqueAnalytics>>("/analytics/boutique", {
    params: buildParams(query),
    timeout: 60000,
  });
  const boutique = data.data;
  return {
    ...boutique,
    sections: {
      ...boutique.sections,
      topPerformingProducts: enrichTopPerformingProducts(boutique.sections.topPerformingProducts),
    },
  };
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
  try {
    const { data } = await api.get<ApiResponse<CustomerAnalytics>>("/analytics/customers/analytics", {
      params: buildParams(query),
      timeout: 60000,
    });
    return enrichCustomerAnalyticsSections(data.data, query);
  } catch {
    const legacy = await getLegacyCustomerAnalytics(query);
    return enrichCustomerAnalyticsSections(legacy, query);
  }
}

/** @deprecated Use getCustomerAnalytics — kept for backward compatibility */
export async function getLegacyCustomerAnalytics(query?: DateRangeQuery) {
  const { data } = await api.get<ApiResponse<CustomerAnalytics>>("/analytics/customer", {
    params: buildParams(query),
    timeout: 60000,
  });
  return data.data;
}

export async function getSearchKeywordDrilldown(query: CustomerInsightDrilldownQuery) {
  const { data } = await api.get<ApiResponse<SearchKeywordDrilldownResponse>>(
    "/analytics/customers/search-keyword-details",
    { params: buildInsightParams(query), timeout: 30000 },
  );
  return data.data;
}

export async function getCategoryDetailDrilldown(query: CustomerInsightDrilldownQuery) {
  const { data } = await api.get<ApiResponse<CategoryDetailDrilldownResponse>>(
    "/analytics/customers/category-details",
    { params: buildInsightParams(query), timeout: 30000 },
  );
  return data.data;
}

export async function getActivityDetails(query: CustomerActivityDetailsQuery) {
  const { data } = await api.get<ApiResponse<ActivityDetailsResponse>>(
    "/analytics/customers/activity-details",
    { params: buildDateDetailParams(query), timeout: 30000 },
  );
  return data.data;
}

export async function getWishlistDetails(query: CustomerActivityDetailsQuery) {
  const { data } = await api.get<ApiResponse<WishlistDetailsResponse>>(
    "/analytics/customers/wishlist-details",
    { params: buildDateDetailParams(query), timeout: 30000 },
  );
  return data.data;
}

export async function getProductDrilldown(query: DrilldownQuery) {
  const params = new URLSearchParams({
    boutiqueId: query.boutiqueId,
    date: query.date.slice(0, 10),
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 10),
    sort: query.sort ?? "viewsDesc",
  });

  const res = await fetch(`/api/admin/analytics/product-drilldown?${params.toString()}`);
  const json = (await res.json()) as ApiResponse<ProductDrilldownResponse> & {
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.message ?? "Failed to load product drilldown");
  }

  return json.data;
}

export async function getBoutiquePendingActions(boutiqueId: string) {
  const { data } = await api.get<ApiResponse<BoutiquePendingAction>>(
    "/analytics/boutique-pending-actions",
    {
      params: { boutiqueId },
      timeout: 30000,
    },
  );
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
