"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { sparklinePoints } from "@/lib/analytics-insights";
import type { AnalyticsSeriesPoint } from "@/types/analytics";
import { cn } from "@/lib/utils";

interface AnalyticsStatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  highlight?: boolean;
  icon?: LucideIcon;
  growthPercent?: number | null;
  trendSeries?: AnalyticsSeriesPoint[];
}

function MiniSparkline({ series }: { series?: AnalyticsSeriesPoint[] }) {
  const points = sparklinePoints(series);
  if (points.length < 2) return null;
  const w = 64;
  const h = 24;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - p * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-80" aria-hidden>
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

export function AnalyticsStatCard({
  title,
  value,
  subText,
  highlight,
  icon: Icon,
  growthPercent,
  trendSeries,
}: AnalyticsStatCardProps) {
  const hasGrowth = growthPercent != null && !Number.isNaN(growthPercent);
  const positive = (growthPercent ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="premium-card-hover"
    >
      <Card
        className={cn(
          "premium-card-hover relative overflow-hidden",
          highlight && "border-blue-300 bg-gradient-to-br from-blue-50 to-white",
        )}
      >
        {highlight ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {Icon ? (
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                  highlight
                    ? "border-blue-200 bg-blue-100"
                    : "border-slate-100 bg-slate-50",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", highlight ? "text-blue-600" : "text-slate-500")}
                />
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {title}
              </p>
              <p
                className={cn(
                  "mt-1 text-3xl font-semibold tabular-nums tracking-tight",
                  highlight
                    ? "bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent"
                    : "text-slate-900",
                )}
              >
                {value}
              </p>
            </div>
          </div>
          <MiniSparkline series={trendSeries} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasGrowth ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                positive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700",
              )}
            >
              {positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {positive ? "+" : ""}
              {growthPercent}%
            </span>
          ) : null}
          {subText ? <span className="text-xs text-slate-500">{subText}</span> : null}
          {!subText && hasGrowth ? (
            <span className="text-xs text-slate-500">This period</span>
          ) : null}
        </div>
      </Card>
    </motion.div>
  );
}
