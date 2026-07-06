"use client";

import { memo } from "react";
import { format, parseISO } from "date-fns";
import { Heart, X } from "lucide-react";
import {
  CustomerInsightBoutiqueList,
  CustomerInsightProductList,
} from "@/components/analytics/customer-insight-lists";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryDetailDrilldownResponse } from "@/types/analytics";

interface CategoryDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  category?: string;
  views?: number;
  data?: CategoryDetailDrilldownResponse;
  isLoading?: boolean;
  isError?: boolean;
}

function formatRangeDate(raw: string) {
  try {
    return format(parseISO(raw), "MMM d, yyyy");
  } catch {
    return raw.slice(0, 10);
  }
}

export const CategoryDetailDrawer = memo(function CategoryDetailDrawer({
  open,
  onClose,
  category,
  views,
  data,
  isLoading,
  isError,
}: CategoryDetailDrawerProps) {
  if (!open) return null;

  const displayCategory = data?.category ?? category ?? "—";
  const displayViews = data?.views ?? views ?? 0;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Close category detail panel"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Category details"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
            <p className="text-sm font-semibold text-slate-900">{displayCategory}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="font-medium text-blue-700">{displayViews} views</span>
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-rose-500" aria-hidden />
                {data?.wishlistCount ?? 0} wishlist
              </span>
            </div>
            {data?.range ? (
              <p className="mt-0.5 text-[11px] text-slate-500">
                {formatRangeDate(data.range.from)} – {formatRangeDate(data.range.to)}
              </p>
            ) : null}
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

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : null}

          {isError ? (
            <p className="text-sm text-red-600">Failed to load category details. Close and try again.</p>
          ) : null}

          {!isLoading && !isError ? (
            <>
              <CustomerInsightProductList
                title="Top Products"
                items={data?.topProducts ?? []}
                emptyLabel="No products viewed in this category yet."
              />
              <CustomerInsightBoutiqueList
                title="Top Boutiques"
                items={data?.topBoutiques ?? []}
                emptyLabel="No boutique views in this category yet."
              />
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
});
