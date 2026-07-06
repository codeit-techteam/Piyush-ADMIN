"use client";

import { memo } from "react";
import { AnalyticsCard } from "@/components/analytics/analytics-card";
import type { RankedItem } from "@/types/analytics";

interface RankingCardProps {
  title: string;
  items: RankedItem[];
  emptyLabel?: string;
  renderValue?: (item: RankedItem) => React.ReactNode;
}

export const RankingCard = memo(function RankingCard({
  title,
  items,
  emptyLabel = "No data yet",
  renderValue = (item) => (
    <span className="font-semibold tabular-nums text-blue-700">{item.count}</span>
  ),
}: RankingCardProps) {
  return (
    <AnalyticsCard title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm"
            >
              <span className="truncate text-slate-700">
                <span className="mr-2 font-medium text-blue-600">#{index + 1}</span>
                {item.label}
              </span>
              {renderValue(item)}
            </li>
          ))}
        </ul>
      )}
    </AnalyticsCard>
  );
});
