import type { AnalyticsPreset } from "@/types/analytics";

export interface ResolvedAnalyticsRange {
  from: string;
  to: string;
  preset: string;
}

export function resolveAnalyticsDateRange(query: {
  range?: AnalyticsPreset | string;
  from?: string;
  to?: string;
}): ResolvedAnalyticsRange {
  const rawRange = String(query.range || "30d").toLowerCase();
  const now = new Date();
  let from: Date;
  let to = query.to ? new Date(query.to) : now;

  if (query.from && query.to) {
    from = new Date(query.from);
    to = new Date(query.to);
  } else if (rawRange === "today") {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  } else if (rawRange === "7d" || rawRange === "7days") {
    from = new Date(now);
    from.setDate(from.getDate() - 7);
  } else if (rawRange === "30d" || rawRange === "30days") {
    from = new Date(now);
    from.setDate(from.getDate() - 30);
  } else {
    from = new Date(now);
    from.setDate(from.getDate() - 30);
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    from = new Date(now);
    from.setDate(from.getDate() - 30);
    to = now;
  }

  if (to.getTime() < from.getTime()) {
    const swap = from;
    from = to;
    to = swap;
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    preset: rawRange,
  };
}
