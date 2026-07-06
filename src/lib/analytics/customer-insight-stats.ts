import type { SupabaseClient } from "@supabase/supabase-js";
import { withViewPercentages } from "@/lib/analytics/insights";
import { resolveAnalyticsDateRange } from "@/lib/analytics/resolve-date-range";
import type {
  CategoryDetailDrilldownResponse,
  CustomerInsightBoutique,
  CustomerInsightProduct,
  MatchingCategory,
  RankedItem,
  RecentSearchEntry,
  SearchKeywordDrilldownResponse,
} from "@/types/analytics";

type DateRangeQuery = {
  range?: string;
  from?: string;
  to?: string;
};

function resolveProductImage(product: {
  primary_image?: string | null;
  thumbnail?: string | null;
  featured_image?: string | null;
  image?: string | null;
} | null) {
  if (!product) return null;
  return (
    product.primary_image ??
    product.thumbnail ??
    product.featured_image ??
    product.image ??
    null
  );
}

function topCounts<T>(
  rows: T[],
  keyFn: (row: T) => { id: string; label: string; meta?: Record<string, unknown> } | null,
  limit = 10,
) {
  const map = new Map<string, { id: string; label: string; count: number; meta?: Record<string, unknown> }>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    const existing = map.get(key.id) ?? { id: key.id, label: key.label, count: 0, meta: key.meta };
    existing.count += 1;
    map.set(key.id, existing);
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function enrichCustomerSections(
  supabase: SupabaseClient,
  query: DateRangeQuery,
  sections: {
    topSearchKeywords?: RankedItem[];
    mostViewedCategories?: RankedItem[];
  },
) {
  const range = resolveAnalyticsDateRange(query);
  const topSearchKeywords = await enrichSearchKeywords(
    supabase,
    range.from,
    range.to,
    sections.topSearchKeywords ?? [],
  );
  const mostViewedCategories = withViewPercentages(sections.mostViewedCategories ?? []);

  return { topSearchKeywords, mostViewedCategories };
}

async function enrichSearchKeywords(
  supabase: SupabaseClient,
  from: string,
  to: string,
  keywords: RankedItem[],
) {
  if (keywords.length === 0) return keywords;

  const needsDates = keywords.some((row) => !row.meta?.lastSearchDate);
  if (!needsDates) return keywords;

  const { data, error } = await supabase
    .from("search_history")
    .select("keyword, created_at")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.warn("[customer-insight-stats] search_history enrich failed:", error.message);
    return keywords;
  }

  const lastDateByKeyword = new Map<string, string>();
  for (const row of data ?? []) {
    const key = String(row.keyword ?? "").trim().toLowerCase();
    if (!key || lastDateByKeyword.has(key)) continue;
    lastDateByKeyword.set(key, row.created_at);
  }

  return keywords.map((row) => ({
    ...row,
    meta: {
      ...row.meta,
      lastSearchDate: row.meta?.lastSearchDate ?? lastDateByKeyword.get(row.id) ?? null,
    },
  }));
}

export async function computeSearchKeywordDrilldown(
  supabase: SupabaseClient,
  query: DateRangeQuery & { keyword?: string },
): Promise<SearchKeywordDrilldownResponse> {
  const keyword = String(query.keyword ?? "").trim();
  if (!keyword) {
    throw new Error("keyword is required");
  }

  const range = resolveAnalyticsDateRange(query);
  const keywordLower = keyword.toLowerCase();

  const [searchRes, viewsRes, productsRes, boutiquesRes] = await Promise.all([
    supabase
      .from("search_history")
      .select("keyword, user_id, created_at")
      .gte("created_at", range.from)
      .lte("created_at", range.to)
      .limit(8000),
    supabase
      .from("recently_viewed")
      .select("product_id, boutique_id, user_id, viewed_at")
      .gte("viewed_at", range.from)
      .lte("viewed_at", range.to)
      .limit(8000),
    supabase
      .from("products")
      .select(
        "id, name, price, image, primary_image, thumbnail, featured_image, boutique_id, categories!category_id(name)",
      )
      .limit(2000),
    supabase.from("boutiques").select("id, name").limit(500),
  ]);

  if (searchRes.error) throw new Error(searchRes.error.message);
  if (viewsRes.error) throw new Error(viewsRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (boutiquesRes.error) throw new Error(boutiquesRes.error.message);

  const searchRows = (searchRes.data ?? [])
    .filter((row) => String(row.keyword ?? "").trim().toLowerCase() === keywordLower)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const searchCount = searchRows.length;
  const searcherIds = new Set(searchRows.map((row) => row.user_id).filter(Boolean));

  const boutiqueMap = new Map((boutiquesRes.data ?? []).map((b) => [b.id, b.name ?? "Boutique"]));
  const productMap = new Map((productsRes.data ?? []).map((p) => [p.id, p]));

  const matchingProducts = (productsRes.data ?? []).filter((p) =>
    String(p.name ?? "").toLowerCase().includes(keywordLower),
  );

  const relatedProducts: CustomerInsightProduct[] = matchingProducts.slice(0, 10).map((p) => ({
    productId: p.id,
    productName: p.name ?? "Unknown product",
    boutiqueId: p.boutique_id ?? undefined,
    boutiqueName: boutiqueMap.get(p.boutique_id) ?? "Boutique",
    image: resolveProductImage(p),
    price: p.price ?? null,
  }));

  const matchingCategories: MatchingCategory[] = withViewPercentages(
    topCounts(
      matchingProducts.filter((p) => (p.categories as { name?: string } | null)?.name),
      (p) => {
        const name = (p.categories as { name?: string } | null)?.name ?? "";
        return { id: name.toLowerCase(), label: name };
      },
      10,
    ),
  ).map((row) => ({ id: row.id, label: row.label, count: row.count, percentage: row.percentage }));

  const recentSearches: RecentSearchEntry[] = searchRows.slice(0, 10).map((row) => ({
    searchedAt: row.created_at,
  }));

  const searcherViews = (viewsRes.data ?? []).filter((row) => searcherIds.has(row.user_id));

  const topViewedProducts: CustomerInsightProduct[] = withViewPercentages(
    topCounts(
      searcherViews.filter((row) => row.product_id),
      (row) => {
        const product = productMap.get(row.product_id);
        return {
          id: row.product_id,
          label: product?.name ?? "Unknown product",
          meta: {
            boutiqueId: row.boutique_id ?? product?.boutique_id,
            boutiqueName: boutiqueMap.get(row.boutique_id ?? product?.boutique_id) ?? "Boutique",
            image: resolveProductImage(product ?? null),
            price: product?.price ?? null,
          },
        };
      },
      10,
    ),
  ).map((row) => ({
    productId: row.id,
    productName: row.label,
    views: row.count,
    percentage: row.percentage,
    boutiqueId: row.meta?.boutiqueId as string | undefined,
    boutiqueName: row.meta?.boutiqueName as string | undefined,
    image: row.meta?.image as string | null | undefined,
    price: row.meta?.price as number | null | undefined,
  }));

  const topBoutiques: CustomerInsightBoutique[] = withViewPercentages(
    topCounts(
      searcherViews.filter((row) => row.boutique_id),
      (row) => ({
        id: row.boutique_id,
        label: boutiqueMap.get(row.boutique_id) ?? "Boutique",
      }),
      10,
    ),
  ).map((row) => ({
    boutiqueId: row.id,
    boutiqueName: row.label,
    views: row.count,
    percentage: row.percentage,
  }));

  return {
    keyword,
    searchCount,
    range,
    relatedProducts,
    topViewedProducts,
    topBoutiques,
    matchingCategories,
    recentSearches,
  };
}

export async function computeCategoryDetailDrilldown(
  supabase: SupabaseClient,
  query: DateRangeQuery & { category?: string },
): Promise<CategoryDetailDrilldownResponse> {
  const category = String(query.category ?? "").trim();
  if (!category) {
    throw new Error("category is required");
  }

  const range = resolveAnalyticsDateRange(query);
  const categoryLower = category.toLowerCase();

  const [productsRes, viewsRes, wishlistRes, boutiquesRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, price, image, primary_image, thumbnail, featured_image, boutique_id, categories!category_id(name)",
      )
      .limit(2000),
    supabase
      .from("recently_viewed")
      .select("product_id, boutique_id, user_id, viewed_at")
      .gte("viewed_at", range.from)
      .lte("viewed_at", range.to)
      .limit(8000),
    supabase
      .from("wishlist_items")
      .select("product_id, user_id, created_at")
      .gte("created_at", range.from)
      .lte("created_at", range.to)
      .limit(8000),
    supabase.from("boutiques").select("id, name").limit(500),
  ]);

  if (productsRes.error) throw new Error(productsRes.error.message);
  if (viewsRes.error) throw new Error(viewsRes.error.message);
  if (wishlistRes.error) throw new Error(wishlistRes.error.message);
  if (boutiquesRes.error) throw new Error(boutiquesRes.error.message);

  const categoryProducts = (productsRes.data ?? []).filter(
    (p) => String((p.categories as { name?: string } | null)?.name ?? "").trim().toLowerCase() === categoryLower,
  );
  const productIds = new Set(categoryProducts.map((p) => p.id));
  const productMap = new Map(categoryProducts.map((p) => [p.id, p]));
  const boutiqueMap = new Map((boutiquesRes.data ?? []).map((b) => [b.id, b.name ?? "Boutique"]));

  const categoryViews = (viewsRes.data ?? []).filter((row) => productIds.has(row.product_id));
  const categoryWishlists = (wishlistRes.data ?? []).filter((row) => productIds.has(row.product_id));

  const topProducts: CustomerInsightProduct[] = withViewPercentages(
    topCounts(categoryViews, (row) => {
      const product = productMap.get(row.product_id);
      return {
        id: row.product_id,
        label: product?.name ?? "Unknown product",
        meta: {
          boutiqueId: row.boutique_id ?? product?.boutique_id,
          boutiqueName: boutiqueMap.get(row.boutique_id ?? product?.boutique_id) ?? "Boutique",
          image: resolveProductImage(product ?? null),
          price: product?.price ?? null,
        },
      };
    }, 10),
  ).map((row) => ({
    productId: row.id,
    productName: row.label,
    views: row.count,
    percentage: row.percentage,
    boutiqueId: row.meta?.boutiqueId as string | undefined,
    boutiqueName: row.meta?.boutiqueName as string | undefined,
    image: row.meta?.image as string | null | undefined,
    price: row.meta?.price as number | null | undefined,
  }));

  const topBoutiques: CustomerInsightBoutique[] = withViewPercentages(
    topCounts(
      categoryViews.filter((row) => row.boutique_id),
      (row) => ({
        id: row.boutique_id,
        label: boutiqueMap.get(row.boutique_id) ?? "Boutique",
      }),
      10,
    ),
  ).map((row) => ({
    boutiqueId: row.id,
    boutiqueName: row.label,
    views: row.count,
    percentage: row.percentage,
  }));

  const displayName =
    (categoryProducts[0]?.categories as { name?: string } | null)?.name ?? category;

  return {
    category: displayName,
    views: categoryViews.length,
    wishlistCount: categoryWishlists.length,
    range,
    topProducts,
    topBoutiques,
  };
}
