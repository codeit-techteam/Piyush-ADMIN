import type { AnalyticsSeriesPoint } from "@/types/analytics";

/** Derive growth % from existing chart series (UI-only; no API changes). */
export function computeSeriesGrowth(series?: AnalyticsSeriesPoint[]): {
  percent: number | null;
  label: string;
} {
  if (!series || series.length < 2) {
    return { percent: null, label: "" };
  }
  const prev = series[series.length - 2]?.value ?? 0;
  const curr = series[series.length - 1]?.value ?? 0;
  if (prev === 0) {
    return curr > 0 ? { percent: 100, label: "vs prior period" } : { percent: null, label: "" };
  }
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { percent: pct, label: "vs prior period" };
}

export function sparklinePoints(series?: AnalyticsSeriesPoint[], max = 8): number[] {
  if (!series?.length) return [];
  const slice = series.slice(-max);
  const maxVal = Math.max(...slice.map((p) => p.value), 1);
  return slice.map((p) => p.value / maxVal);
}
