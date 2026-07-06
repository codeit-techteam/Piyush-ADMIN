"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Package, Sparkles } from "lucide-react";
import { ActionAlertCard } from "@/components/analytics/action-alert-card";
import { AnalyticsAreaChart } from "@/components/analytics/analytics-area-chart";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import { DrillDownDrawer } from "@/components/analytics/drill-down-drawer";
import { InsightCard } from "@/components/analytics/insight-card";
import { TopProductsCard } from "@/components/analytics/top-products-card";
import { Card } from "@/components/ui/card";
import { useBoutiquePendingActions, useProductDrilldown } from "@/hooks/use-analytics";
import { ROUTES } from "@/lib/constants/routes";
import type { BoutiqueAnalytics, ChartPoint } from "@/types/analytics";

interface BoutiqueDashboardProps {
  data: BoutiqueAnalytics;
  isFetching?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatAddedDate(raw?: unknown) {
  if (!raw || typeof raw !== "string") return "—";
  return format(new Date(raw), "dd MMM yyyy");
}

function formatDrilldownDate(date: string) {
  try {
    return format(parseISO(date), "MMM d, yyyy");
  } catch {
    return date;
  }
}

export function BoutiqueDashboard({ data, isFetching }: BoutiqueDashboardProps) {
  const { cards, charts, sections } = data;
  const recentProducts = sections.recentlyAddedProducts;

  const [drilldownDate, setDrilldownDate] = useState<string | null>(null);
  const [drilldownPage, setDrilldownPage] = useState(1);

  const pendingActions = useBoutiquePendingActions(data.boutiqueId, Boolean(data.boutiqueId));

  const drilldownQuery = useMemo(
    () =>
      drilldownDate
        ? {
            boutiqueId: data.boutiqueId,
            date: drilldownDate,
            page: drilldownPage,
            limit: 10,
            sort: "viewsDesc" as const,
          }
        : null,
    [data.boutiqueId, drilldownDate, drilldownPage],
  );

  const drilldown = useProductDrilldown(drilldownQuery, Boolean(drilldownQuery));

  const topProduct = sections.topPerformingProducts[0];
  const topInsight = topProduct
    ? {
        insight: `${topProduct.percentage ?? topProduct.meta?.percentage ?? 0}% of views from ${topProduct.label}`,
        action: `Promote ${topProduct.label} — consider hero banner placement`,
      }
    : null;

  const handleChartClick = useCallback((point: ChartPoint) => {
    const dateKey = (point.date ?? "").slice(0, 10);
    if (!dateKey || point.value <= 0) return;
    setDrilldownPage(1);
    setDrilldownDate(dateKey);
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldownDate(null);
    setDrilldownPage(1);
  }, []);

  const selectedPoint = drilldownDate
    ? charts.productViewTrends.find((p) => p.date === drilldownDate)
    : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`boutique-${data.boutiqueId}`}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {pendingActions.data ? (
          <ActionAlertCard data={pendingActions.data} />
        ) : null}

        {topInsight ? (
          <InsightCard insight={topInsight.insight} action={topInsight.action} />
        ) : null}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <AnalyticsStatCard title="Boutique Views" value={cards.profileVisits} highlight />
          <AnalyticsStatCard title="Total Products" value={cards.totalProducts} href={ROUTES.products} />
          <AnalyticsStatCard title="Wishlist Saves" value={cards.totalWishlistSaves} />
          <AnalyticsStatCard title="Appointments" value={cards.appointmentBookings} href={ROUTES.appointments} />
          <AnalyticsStatCard
            title="Calls / WhatsApp"
            value={`${cards.callClicks} / ${cards.whatsappClicks}`}
            subText={isFetching ? "Refreshing…" : undefined}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnalyticsAreaChart
            title="Product View Trends"
            data={charts.productViewTrends}
            onPointClick={handleChartClick}
            enableInsights
          />
          <AnalyticsAreaChart title="Appointment Trends" data={charts.appointmentTrends} enableInsights />
        </section>

        <section>
          <TopProductsCard items={sections.topPerformingProducts} />
        </section>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recently Added Products</h3>
                <p className="text-xs text-slate-500">Latest products added to this boutique</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {recentProducts.length} {recentProducts.length === 1 ? "product" : "products"}
            </span>
          </div>

          {recentProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <Package className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No products yet</p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                New products added to this boutique will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentProducts.map((product, index) => {
                const id = String(product.id ?? "");
                const name = String(product.name ?? "Untitled product");
                const price =
                  product.price != null ? formatCurrency(Number(product.price)) : "—";
                const image = typeof product.image === "string" ? product.image : null;
                const addedOn = formatAddedDate(product.createdAt);

                return (
                  <motion.div
                    key={id || `recent-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                  >
                    <Link
                      href={id ? ROUTES.productDetails(id) : "#"}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 pb-2 pt-6">
                          <p className="truncate text-sm font-medium text-white">{name}</p>
                        </div>
                        <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-700 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                          View
                          <ArrowUpRight className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <span className="text-sm font-semibold text-blue-700">{price}</span>
                        <span className="text-[11px] text-slate-500">{addedOn}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      <DrillDownDrawer
        open={Boolean(drilldownDate)}
        onClose={closeDrilldown}
        dateLabel={drilldownDate ? formatDrilldownDate(drilldownDate) : ""}
        totalViews={selectedPoint?.value ?? drilldown.data?.totalViews ?? 0}
        data={drilldown.data}
        isLoading={drilldown.isLoading}
        isError={drilldown.isError}
        page={drilldownPage}
        onPageChange={setDrilldownPage}
      />
    </AnimatePresence>
  );
}
