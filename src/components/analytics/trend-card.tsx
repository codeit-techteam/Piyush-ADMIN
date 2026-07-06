"use client";

import { memo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { AnalyticsCard } from "@/components/analytics/analytics-card";
import type { ChartPoint } from "@/types/analytics";

interface TrendCardProps {
  title: string;
  point: ChartPoint;
  valueLabel?: string;
  formatter?: (value: number) => string;
}

export const TrendCard = memo(function TrendCard({
  title,
  point,
  valueLabel = "Count",
  formatter = (v) => String(v),
}: TrendCardProps) {
  const growth = point.growthPercent ?? 0;
  const isUp = growth > 0;
  const isDown = growth < 0;

  return (
    <AnalyticsCard title={title}>
      <p className="text-2xl font-bold tabular-nums text-slate-900">
        {formatter(point.value)}
        <span className="ml-1 text-sm font-medium text-slate-500">{valueLabel}</span>
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {isUp ? (
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        ) : isDown ? (
          <TrendingDown className="h-3.5 w-3.5 text-red-500" aria-hidden />
        ) : null}
        <span
          className={
            isUp ? "font-medium text-emerald-700" : isDown ? "font-medium text-red-600" : "text-slate-500"
          }
        >
          {isUp ? "↑" : isDown ? "↓" : "—"} {Math.abs(growth)}%
        </span>
        <span className="text-slate-500">vs previous day</span>
      </div>
    </AnalyticsCard>
  );
});
