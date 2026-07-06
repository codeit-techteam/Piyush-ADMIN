"use client";

import { memo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PercentageBar } from "@/components/analytics/percentage-bar";
import { InsightCard } from "@/components/analytics/insight-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDrilldownResponse } from "@/types/analytics";

interface DrillDownDrawerProps {
  open: boolean;
  onClose: () => void;
  dateLabel: string;
  totalViews: number;
  data?: ProductDrilldownResponse;
  isLoading?: boolean;
  isError?: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export const DrillDownDrawer = memo(function DrillDownDrawer({
  open,
  onClose,
  dateLabel,
  totalViews,
  data,
  isLoading,
  isError,
  page,
  onPageChange,
}: DrillDownDrawerProps) {
  const [sortAsc, setSortAsc] = useState(false);

  if (!open) return null;

  const items = [...(data?.items ?? [])].sort((a, b) =>
    sortAsc ? a.views - b.views : b.views - a.views,
  );

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Close drill-down panel"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Product view drill-down"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Product View Drill-down</p>
            <p className="text-sm font-semibold text-slate-900">{dateLabel}</p>
            <p className="text-xs text-blue-700">{totalViews} total views</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {data?.topInsight ? (
            <div className="mb-4">
              <InsightCard
                insight={`${data.topInsight.percentage}% of views from ${data.topInsight.productName}`}
                action={data.topInsight.recommendedAction}
              />
            </div>
          ) : null}

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Top Products</h3>
            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Sort: {sortAsc ? "Views ↑" : "Views ↓"}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : null}

          {isError ? (
            <p className="text-sm text-red-600">
              Failed to load drill-down data. Close and try again.
            </p>
          ) : null}

          {!isLoading && !isError && items.length === 0 ? (
            <p className="text-sm text-slate-500">No product views on this date.</p>
          ) : null}

          {!isLoading && !isError && items.length > 0 ? (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div className="flex gap-3">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-500">
                        N/A
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">{item.boutiqueName}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-blue-700">{item.views} views</span>
                        <span className="text-xs font-semibold text-slate-700">{item.percentage}%</span>
                      </div>
                      <PercentageBar percentage={item.percentage} showValue={false} className="mt-1.5" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {data && data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
});
