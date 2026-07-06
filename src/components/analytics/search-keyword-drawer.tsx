"use client";

import { memo } from "react";
import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import {
  CustomerInsightBoutiqueList,
  CustomerInsightProductList,
} from "@/components/analytics/customer-insight-lists";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchKeywordDrilldownResponse } from "@/types/analytics";

interface SearchKeywordDrawerProps {
  open: boolean;
  onClose: () => void;
  keyword?: string;
  searchCount?: number;
  data?: SearchKeywordDrilldownResponse;
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

export const SearchKeywordDrawer = memo(function SearchKeywordDrawer({
  open,
  onClose,
  keyword,
  searchCount,
  data,
  isLoading,
  isError,
}: SearchKeywordDrawerProps) {
  if (!open) return null;

  const displayKeyword = data?.keyword ?? keyword ?? "—";
  const displayCount = data?.searchCount ?? searchCount ?? 0;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Close search keyword panel"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Search keyword details"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Search Keyword</p>
            <p className="text-sm font-semibold text-slate-900">{displayKeyword}</p>
            <p className="text-xs text-blue-700">
              {displayCount} {displayCount === 1 ? "search" : "searches"}
            </p>
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
            <p className="text-sm text-red-600">Failed to load keyword details. Close and try again.</p>
          ) : null}

          {!isLoading && !isError ? (
            <>
              <CustomerInsightProductList
                title="Related Products"
                items={data?.relatedProducts ?? []}
                emptyLabel="No related products found for this keyword."
              />
              <CustomerInsightProductList
                title="Top Viewed Products"
                items={data?.topViewedProducts ?? []}
                emptyLabel="No product views from searchers yet."
              />
              <CustomerInsightBoutiqueList
                title="Top Boutiques"
                items={data?.topBoutiques ?? []}
                emptyLabel="No boutique views from searchers yet."
              />
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
});
