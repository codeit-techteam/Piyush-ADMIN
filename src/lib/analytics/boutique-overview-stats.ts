import type { SupabaseClient } from "@supabase/supabase-js";
import type { BoutiqueOverviewStat, BoutiqueOverviewStats } from "@/types/analytics";
import { resolveAnalyticsDateRange } from "@/lib/analytics/resolve-date-range";

type OverviewQuery = {
  range?: string;
  from?: string;
  to?: string;
};

function aggregateByBoutiqueId(
  rows: Array<{ boutique_id?: string | null }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const id = row.boutique_id;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function pickTopBoutique(
  counts: Map<string, number>,
  boutiqueNameById: Map<string, string>,
): BoutiqueOverviewStat | null {
  let topId: string | null = null;
  let topCount = 0;

  for (const [id, count] of counts) {
    if (count > topCount) {
      topId = id;
      topCount = count;
    }
  }

  if (!topId || topCount === 0) {
    return null;
  }

  return {
    boutiqueId: topId,
    name: boutiqueNameById.get(topId) ?? "Unknown boutique",
    count: topCount,
  };
}

function isShowcaseProduct(row: {
  status?: string | null;
  is_draft?: boolean | null;
}) {
  if (row.is_draft === true) return false;
  const status = String(row.status ?? "active").toLowerCase();
  return !["deleted", "draft", "archived", "inactive"].includes(status);
}

function resolveProductBoutiqueId(row: {
  boutique_id?: string | null;
  primary_boutique_id?: string | null;
}) {
  return row.boutique_id ?? row.primary_boutique_id ?? null;
}

export async function computeBoutiqueOverviewStats(
  supabase: SupabaseClient,
  query: OverviewQuery = {},
): Promise<BoutiqueOverviewStats> {
  const range = resolveAnalyticsDateRange(query);

  const [appointmentsRes, productsRes, visitsRes, boutiquesRes] = await Promise.all([
    supabase
      .from("appointments")
      .select("boutique_id, created_at")
      .is("deleted_at", null)
      .not("boutique_id", "is", null)
      .gte("created_at", range.from)
      .lte("created_at", range.to),
    supabase
      .from("products")
      .select("boutique_id, primary_boutique_id, status, is_draft"),
    supabase
      .from("boutique_visits")
      .select("boutique_id, created_at")
      .not("boutique_id", "is", null)
      .gte("created_at", range.from)
      .lte("created_at", range.to),
    supabase.from("boutiques").select("id, name").is("deleted_at", null),
  ]);

  if (appointmentsRes.error) {
    console.warn("[boutique-overview] appointments query failed:", appointmentsRes.error.message);
  }
  if (productsRes.error) {
    console.warn("[boutique-overview] products query failed:", productsRes.error.message);
  }
  if (visitsRes.error) {
    console.warn("[boutique-overview] boutique_visits query failed:", visitsRes.error.message);
  }
  if (boutiquesRes.error) {
    console.warn("[boutique-overview] boutiques query failed:", boutiquesRes.error.message);
  }

  const boutiqueNameById = new Map(
    (boutiquesRes.data ?? []).map((b) => [String(b.id), String(b.name)]),
  );

  const appointmentRows = appointmentsRes.data ?? [];
  const mostAppointments = pickTopBoutique(
    aggregateByBoutiqueId(appointmentRows),
    boutiqueNameById,
  );

  const productCounts = new Map<string, number>();
  for (const row of productsRes.data ?? []) {
    if (!isShowcaseProduct(row)) continue;
    const boutiqueId = resolveProductBoutiqueId(row);
    if (!boutiqueId) continue;
    productCounts.set(boutiqueId, (productCounts.get(boutiqueId) ?? 0) + 1);
  }
  const maxProducts = pickTopBoutique(productCounts, boutiqueNameById);

  const visitCounts = aggregateByBoutiqueId(visitsRes.data ?? []);
  let mostViewed = pickTopBoutique(visitCounts, boutiqueNameById);

  // TODO: implement boutique_views tracking table if boutique_visits stays sparse
  if (!mostViewed && mostAppointments) {
    mostViewed = mostAppointments;
  }

  console.info("[boutique-overview] counts", {
    appointments: appointmentRows.length,
    products: productsRes.data?.length ?? 0,
    visits: visitsRes.data?.length ?? 0,
    mostAppointments: mostAppointments?.name,
    maxProducts: maxProducts?.name,
    mostViewed: mostViewed?.name,
  });

  return {
    range,
    cards: {
      mostViewed,
      mostAppointments,
      maxProducts,
    },
  };
}
