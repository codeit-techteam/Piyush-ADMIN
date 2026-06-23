"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AnalyticsAreaChart } from "@/components/analytics/analytics-area-chart";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import { RankedList } from "@/components/analytics/ranked-list";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import type { BoutiqueAnalytics } from "@/types/analytics";

interface BoutiqueDashboardProps {
  data: BoutiqueAnalytics;
  isFetching?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function BoutiqueDashboard({ data, isFetching }: BoutiqueDashboardProps) {
  const { cards, charts, sections } = data;

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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AnalyticsStatCard title="Total Products" value={cards.totalProducts} highlight />
          <AnalyticsStatCard title="Collection Views" value={cards.totalCollectionViews} />
          <AnalyticsStatCard title="Wishlist Saves" value={cards.totalWishlistSaves} />
          <AnalyticsStatCard title="Appointments" value={cards.appointmentBookings} />
          <AnalyticsStatCard title="Revenue" value={formatCurrency(cards.revenueGenerated)} highlight />
          <AnalyticsStatCard title="Conversion Rate" value={`${cards.conversionRate}%`} />
          <AnalyticsStatCard title="Profile Visits" value={cards.profileVisits} />
          <AnalyticsStatCard
            title="Calls / WhatsApp"
            value={`${cards.callClicks} / ${cards.whatsappClicks}`}
            subText={isFetching ? "Refreshing…" : undefined}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnalyticsAreaChart title="Product View Trends" data={charts.productViewTrends} />
          <AnalyticsAreaChart title="Appointment Trends" data={charts.appointmentTrends} />
          <AnalyticsAreaChart title="Revenue Analytics" data={charts.revenueAnalytics} valueFormatter={formatCurrency} />
          <AnalyticsAreaChart title="Customer Engagement" data={charts.customerEngagement} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <RankedList title="Top Performing Products" items={sections.topPerformingProducts} />
          <RankedList title="Low Performing Products" items={sections.lowPerformingProducts} />
          <RankedList title="Traffic Sources" items={sections.trafficSources} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-3 text-sm font-medium text-slate-700">Recently Added Products</h3>
            <DataTable
              columns={[
                { key: "name", header: "Product" },
                { key: "price", header: "Price" },
              ]}
              data={sections.recentlyAddedProducts.map((p) => ({
                name: String(p.name ?? "—"),
                price: p.price != null ? formatCurrency(Number(p.price)) : "—",
              }))}
            />
          </Card>
          <RankedList title="Most Booked Collections" items={sections.mostBookedCollections} />
        </section>
      </motion.div>
    </AnimatePresence>
  );
}
