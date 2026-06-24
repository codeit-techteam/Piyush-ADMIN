"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
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
  trendSeries?: AnalyticsSeriesPoint[];
  href?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
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
  trendSeries,
  href,
  onClick,
  active,
  className,
}: AnalyticsStatCardProps) {
  const interactive = Boolean(href || onClick);

  const card = (
    <Card
      className={cn(
        "premium-card-hover relative flex h-full min-h-[136px] flex-col overflow-hidden",
        highlight && !active && "border-blue-300 bg-gradient-to-br from-blue-50 to-white",
        active && "border-blue-400 bg-gradient-to-br from-blue-50 to-white ring-2 ring-blue-500/40",
        interactive && "cursor-pointer transition-shadow hover:shadow-md",
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

        {subText ? (
          <div className="mt-4 flex min-h-[22px] flex-1 flex-wrap items-end gap-2">
            <span className="text-xs text-slate-500">{subText}</span>
          </div>
        ) : null}
      </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("premium-card-hover h-full min-w-0", className)}
    >
      {href && !onClick ? (
        <Link
          href={href}
          className="block h-full w-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {card}
        </Link>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          className="block h-full w-full rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {card}
        </button>
      ) : (
        card
      )}
    </motion.div>
  );
}
