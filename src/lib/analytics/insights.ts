import type { ChartPoint, RankedItem } from "@/types/analytics";

/** Compute day-over-day growth insights for chart series (client-side fallback). */
export function enrichSeriesWithInsights(series: ChartPoint[] = []): ChartPoint[] {
  return series.map((point, index) => {
    const value = Number(point.value ?? 0);
    const previousValue = index > 0 ? Number(series[index - 1]?.value ?? 0) : 0;
    const difference = value - previousValue;

    let growthPercent = 0;
    if (previousValue > 0) {
      growthPercent = Math.round((difference / previousValue) * 10000) / 100;
    } else if (value > 0) {
      growthPercent = 100;
    }

    const trend = difference > 0 ? "up" : difference < 0 ? "down" : "flat";

    return {
      ...point,
      value,
      previousValue,
      difference,
      growthPercent,
      trend,
    };
  });
}

/** Attach view-share percentages to ranked product rows. */
export function withViewPercentages<T extends { count: number; percentage?: number }>(
  rows: T[],
): Array<T & { percentage: number }> {
  const total = rows.reduce((sum, row) => sum + Number(row.count ?? 0), 0);
  return rows.map((row) => {
    const existing = row.percentage;
    const percentage =
      existing != null && existing > 0
        ? existing
        : total > 0
          ? Math.round((Number(row.count) / total) * 10000) / 100
          : 0;
    return { ...row, percentage };
  });
}

export function enrichTopPerformingProducts(items: RankedItem[]): RankedItem[] {
  return withViewPercentages(items).map((item) => ({
    ...item,
    meta: { ...item.meta, percentage: item.percentage },
  }));
}
