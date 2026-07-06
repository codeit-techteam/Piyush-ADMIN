import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductDrilldownResponse } from "@/types/analytics";
import { withViewPercentages } from "@/lib/analytics/insights";

export interface ProductDrilldownQuery {
  boutiqueId: string;
  date: string;
  page?: number;
  limit?: number;
  sort?: "viewsDesc" | "viewsAsc";
}

function normalizeDateKey(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed.slice(0, 10);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayBoundsFromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

function resolveProductImage(product: {
  primary_image?: string | null;
  thumbnail?: string | null;
  featured_image?: string | null;
  image?: string | null;
}) {
  return (
    product.primary_image ??
    product.thumbnail ??
    product.featured_image ??
    product.image ??
    null
  );
}

export async function computeProductDrilldown(
  supabase: SupabaseClient,
  query: ProductDrilldownQuery,
): Promise<ProductDrilldownResponse> {
  const boutiqueId = query.boutiqueId.trim();
  const dateKey = normalizeDateKey(query.date);

  if (!boutiqueId) {
    throw new Error("boutiqueId is required");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("date is required (YYYY-MM-DD)");
  }

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 10));
  const sortAsc = (query.sort ?? "viewsDesc").toLowerCase() === "viewsasc";
  const { from, to } = dayBoundsFromDateKey(dateKey);

  const [viewsRes, productsRes, boutiqueRes] = await Promise.all([
    supabase
      .from("product_views")
      .select("product_id, boutique_id, created_at")
      .eq("boutique_id", boutiqueId)
      .gte("created_at", from)
      .lte("created_at", to)
      .limit(10000),
    supabase
      .from("products")
      .select("id, name, price, image, primary_image, thumbnail, featured_image, boutique_id")
      .eq("boutique_id", boutiqueId)
      .limit(500),
    supabase.from("boutiques").select("id, name").eq("id", boutiqueId).maybeSingle(),
  ]);

  if (viewsRes.error) {
    throw new Error(viewsRes.error.message);
  }
  if (productsRes.error) {
    throw new Error(productsRes.error.message);
  }
  if (boutiqueRes.error) {
    throw new Error(boutiqueRes.error.message);
  }

  const boutiqueName = boutiqueRes.data?.name ?? "Boutique";
  const productMap = new Map((productsRes.data ?? []).map((p) => [p.id, p]));

  const viewCounts = new Map<string, number>();
  for (const row of viewsRes.data ?? []) {
    if (!row.product_id) continue;
    viewCounts.set(row.product_id, (viewCounts.get(row.product_id) ?? 0) + 1);
  }

  const totalViews = viewsRes.data?.length ?? 0;

  let ranked = [...viewCounts.entries()].map(([productId, views]) => {
    const product = productMap.get(productId);
    return {
      productId,
      productName: product?.name ?? "Unknown product",
      views,
      boutiqueId,
      boutiqueName,
      image: product ? resolveProductImage(product) : null,
      price: product?.price ?? null,
    };
  });

  ranked.sort((a, b) => (sortAsc ? a.views - b.views : b.views - a.views));

  const withPct = withViewPercentages(ranked.map((r) => ({ ...r, count: r.views }))).map(
    (row) => ({
      productId: row.productId,
      productName: row.productName,
      views: row.views,
      percentage: row.percentage,
      boutiqueId: row.boutiqueId,
      boutiqueName: row.boutiqueName,
      image: row.image,
      price: row.price,
    }),
  );

  const total = withPct.length;
  const start = (page - 1) * limit;
  const items = withPct.slice(start, start + limit);
  const topProduct = withPct[0] ?? null;

  return {
    date: dateKey,
    boutiqueId,
    boutiqueName,
    totalViews,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    items,
    topInsight: topProduct
      ? {
          productName: topProduct.productName,
          percentage: topProduct.percentage,
          views: topProduct.views,
          recommendedAction: `Promote ${topProduct.productName} — ${topProduct.percentage}% of daily views`,
        }
      : null,
  };
}
