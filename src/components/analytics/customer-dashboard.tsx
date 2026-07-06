"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnalyticsAreaChart } from "@/components/analytics/analytics-area-chart";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import { CategoryDetailDrawer } from "@/components/analytics/category-detail-drawer";
import { MostViewedCategories } from "@/components/analytics/most-viewed-categories";
import { SearchKeywordDrawer } from "@/components/analytics/search-keyword-drawer";
import { TopSearchKeywords } from "@/components/analytics/top-search-keywords";
import {
  useCategoryDetailDrilldown,
  useSearchKeywordDrilldown,
} from "@/hooks/use-analytics";
import { ROUTES } from "@/lib/constants/routes";
import type { CustomerAnalytics, RankedItem } from "@/types/analytics";

const EMPTY_ACTIVITY_LABEL = "No customer activity available yet.";

interface CustomerDashboardProps {
  data: CustomerAnalytics;
}

function hasCustomerActivity(data: CustomerAnalytics) {
  const { cards, charts, sections } = data;
  const hasCards =
    (cards.totalCustomers ?? 0) > 0 ||
    (cards.newUsers ?? 0) > 0 ||
    (cards.wishlistActivity ?? 0) > 0;
  const hasCharts =
    (charts.userActivityTimeline ?? []).some((p) => p.value > 0) ||
    (charts.wishlistGrowth ?? []).some((p) => p.value > 0);
  const hasSections =
    (sections.topSearchKeywords ?? []).length > 0 ||
    (sections.mostViewedCategories ?? []).length > 0;
  return hasCards || hasCharts || hasSections;
}

export function CustomerDashboard({ data }: CustomerDashboardProps) {
  const { cards, charts, sections, range } = data;
  const emptyLabel = hasCustomerActivity(data) ? "No data for selected range" : EMPTY_ACTIVITY_LABEL;

  const [selectedKeyword, setSelectedKeyword] = useState<RankedItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RankedItem | null>(null);

  const dateQuery = useMemo(
    () => ({
      range: range.preset as "today" | "7d" | "30d" | "custom",
      from: range.from,
      to: range.to,
    }),
    [range],
  );

  const searchDrilldownQuery = useMemo(
    () =>
      selectedKeyword
        ? {
            ...dateQuery,
            keyword: selectedKeyword.label,
          }
        : null,
    [dateQuery, selectedKeyword],
  );

  const categoryDrilldownQuery = useMemo(
    () =>
      selectedCategory
        ? {
            ...dateQuery,
            category: selectedCategory.label,
          }
        : null,
    [dateQuery, selectedCategory],
  );

  const searchDrilldown = useSearchKeywordDrilldown(searchDrilldownQuery, Boolean(searchDrilldownQuery));
  const categoryDrilldown = useCategoryDetailDrilldown(
    categoryDrilldownQuery,
    Boolean(categoryDrilldownQuery),
  );

  const handleKeywordClick = useCallback((keyword: RankedItem) => {
    setSelectedKeyword(keyword);
  }, []);

  const handleCategoryClick = useCallback((category: RankedItem) => {
    setSelectedCategory(category);
  }, []);

  const closeKeywordDrawer = useCallback(() => {
    setSelectedKeyword(null);
  }, []);

  const closeCategoryDrawer = useCallback(() => {
    setSelectedCategory(null);
  }, []);

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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnalyticsStatCard title="Total Customers" value={cards.totalCustomers ?? 0} highlight />
          <AnalyticsStatCard title="New Users" value={cards.newUsers ?? 0} href={ROUTES.users} />
          <AnalyticsStatCard title="Wishlist Activity" value={cards.wishlistActivity ?? 0} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnalyticsAreaChart
            title="User Activity Timeline"
            data={charts.userActivityTimeline ?? []}
            enableInsights
            emptyLabel={emptyLabel}
          />
          <AnalyticsAreaChart
            title="Wishlist Trends"
            data={charts.wishlistGrowth ?? []}
            enableInsights
            emptyLabel={emptyLabel}
            valueLabel="Wishlist Added"
            growthLabel="Growth compared to previous day"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <TopSearchKeywords
            rows={sections.topSearchKeywords ?? []}
            emptyLabel={EMPTY_ACTIVITY_LABEL}
            onKeywordClick={handleKeywordClick}
          />
          <MostViewedCategories
            rows={sections.mostViewedCategories ?? []}
            emptyLabel={EMPTY_ACTIVITY_LABEL}
            onCategoryClick={handleCategoryClick}
          />
        </section>

        <SearchKeywordDrawer
          open={Boolean(selectedKeyword)}
          onClose={closeKeywordDrawer}
          keyword={selectedKeyword?.label}
          searchCount={selectedKeyword?.count}
          data={searchDrilldown.data}
          isLoading={searchDrilldown.isLoading}
          isError={searchDrilldown.isError}
        />

        <CategoryDetailDrawer
          open={Boolean(selectedCategory)}
          onClose={closeCategoryDrawer}
          category={selectedCategory?.label}
          views={selectedCategory?.count}
          data={categoryDrilldown.data}
          isLoading={categoryDrilldown.isLoading}
          isError={categoryDrilldown.isError}
        />
      </motion.div>
    </AnimatePresence>
  );
}
