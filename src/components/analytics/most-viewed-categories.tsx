"use client";

import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { AnalyticsCard } from "@/components/analytics/analytics-card";
import { PercentageBar } from "@/components/analytics/percentage-bar";
import type { RankedItem } from "@/types/analytics";

interface MostViewedCategoriesProps {
  rows: RankedItem[];
  emptyLabel?: string;
  onCategoryClick?: (category: RankedItem) => void;
}

export const MostViewedCategories = memo(function MostViewedCategories({
  rows,
  emptyLabel = "No customer activity available yet.",
  onCategoryClick,
}: MostViewedCategoriesProps) {
  return (
    <AnalyticsCard
      title="Most Viewed Categories"
      subtitle="Customer interest by jewellery category"
    >
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onCategoryClick?.(row)}
                className="group w-full rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">{row.label}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-semibold text-blue-700">{row.percentage ?? 0}%</span>
                    <ChevronRight
                      className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{row.count} views</span>
                </div>
                <PercentageBar percentage={row.percentage ?? 0} showValue={false} className="mt-2" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AnalyticsCard>
  );
});
