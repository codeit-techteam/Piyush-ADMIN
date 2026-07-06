"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Package, TrendingDown, TrendingUp } from "lucide-react";
import { AnalyticsCard } from "@/components/analytics/analytics-card";
import { PercentageBar } from "@/components/analytics/percentage-bar";
import { withViewPercentages } from "@/lib/analytics/insights";
import { ROUTES } from "@/lib/constants/routes";
import type { ProductPercentage, RankedItem } from "@/types/analytics";

interface TopProductsCardProps {
  title?: string;
  items: RankedItem[];
  emptyLabel?: string;
  topCount?: number;
}

function toProductPercentage(item: {
  id: string;
  label: string;
  count: number;
  percentage?: number;
  meta?: Record<string, unknown>;
}): ProductPercentage {
  return {
    id: item.id,
    label: item.label,
    count: item.count,
    percentage: item.percentage ?? Number(item.meta?.percentage ?? 0),
    image: typeof item.meta?.image === "string" ? item.meta.image : null,
    growthPercent: typeof item.meta?.growthPercent === "number" ? item.meta.growthPercent : undefined,
    boutiqueId: typeof item.meta?.boutiqueId === "string" ? item.meta.boutiqueId : undefined,
    boutiqueName: typeof item.meta?.boutiqueName === "string" ? item.meta.boutiqueName : undefined,
  };
}

export const TopProductsCard = memo(function TopProductsCard({
  title = "Top Performing Products",
  items,
  emptyLabel = "No data yet",
  topCount = 5,
}: TopProductsCardProps) {
  const [expanded, setExpanded] = useState(false);

  const normalized = useMemo(() => {
    const mapped = items.map(toProductPercentage);
    return withViewPercentages(mapped);
  }, [items]);

  const { visible, others } = useMemo(() => {
    const top = normalized.slice(0, topCount);
    const rest = normalized.slice(topCount);
    const othersCount = rest.reduce((sum, item) => sum + item.count, 0);
    const othersPct = rest.reduce((sum, item) => sum + item.percentage, 0);
    return {
      visible: top,
      others:
        rest.length > 0
          ? {
              count: othersCount,
              percentage: Math.round(othersPct * 100) / 100,
              items: rest,
            }
          : null,
    };
  }, [normalized, topCount]);

  if (normalized.length === 0) {
    return (
      <AnalyticsCard title={title}>
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      </AnalyticsCard>
    );
  }

  const list = expanded && others ? [...visible, ...others.items] : visible;

  return (
    <AnalyticsCard title={title}>
      <ul className="space-y-3">
        {list.map((item, index) => {
          const growth = item.growthPercent ?? 0;
          const isUp = growth > 0;
          const isDown = growth < 0;

          return (
            <li key={item.id}>
              <Link
                href={ROUTES.productDetails(item.id)}
                className="group block rounded-lg border border-slate-100 bg-slate-50/80 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800 group-hover:text-blue-700">
                          {item.label}
                        </p>
                        {item.boutiqueName ? (
                          <p className="truncate text-[11px] text-slate-500">{item.boutiqueName}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-blue-700">{item.percentage}%</p>
                        <p className="text-[11px] tabular-nums text-slate-500">{item.count} views</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <PercentageBar percentage={item.percentage} showValue={false} className="flex-1" />
                      {(isUp || isDown) && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                            isUp ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {isUp ? (
                            <TrendingUp className="h-3 w-3" aria-hidden />
                          ) : (
                            <TrendingDown className="h-3 w-3" aria-hidden />
                          )}
                          {Math.abs(growth)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}

        {!expanded && others ? (
          <li className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-slate-700">Others</span>
              <div className="text-right">
                <span className="font-semibold text-blue-700">{others.percentage}%</span>
                <span className="ml-2 text-slate-500">{others.count} views</span>
              </div>
            </div>
            <PercentageBar percentage={others.percentage} showValue={false} className="mt-2" />
          </li>
        ) : null}
      </ul>

      {others ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              See more ({others.items.length} more) <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      ) : null}
    </AnalyticsCard>
  );
});
