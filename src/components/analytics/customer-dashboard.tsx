"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AnalyticsAreaChart } from "@/components/analytics/analytics-area-chart";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import { RankedList } from "@/components/analytics/ranked-list";
import type { CustomerAnalytics } from "@/types/analytics";

interface CustomerDashboardProps {
  data: CustomerAnalytics;
}

export function CustomerDashboard({ data }: CustomerDashboardProps) {
  const { cards, charts, sections } = data;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="customer"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnalyticsStatCard title="Total Customers" value={cards.totalCustomers ?? 0} highlight />
          <AnalyticsStatCard title="New Users" value={cards.newUsers ?? 0} />
          <AnalyticsStatCard title="Wishlist Activity" value={cards.wishlistActivity ?? 0} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnalyticsAreaChart title="User Activity Timeline" data={charts.userActivityTimeline ?? []} />
          <AnalyticsAreaChart title="Wishlist Growth" data={charts.wishlistGrowth ?? []} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RankedList title="Top Search Keywords" items={sections.topSearchKeywords ?? []} />
          <RankedList title="Most Viewed Categories" items={sections.mostViewedCategories ?? []} />
        </section>
      </motion.div>
    </AnimatePresence>
  );
}
