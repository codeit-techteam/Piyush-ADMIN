"use client";

import { memo } from "react";
import { format, parseISO } from "date-fns";
import { ChevronRight, Search } from "lucide-react";
import { AnalyticsCard } from "@/components/analytics/analytics-card";
import type { RankedItem } from "@/types/analytics";

interface TopSearchKeywordsProps {
  rows: RankedItem[];
  emptyLabel?: string;
  onKeywordClick?: (keyword: RankedItem) => void;
}

function formatLastSearchDate(raw?: string) {
  if (!raw) return "—";
  try {
    return format(parseISO(raw), "MMM d, yyyy");
  } catch {
    return raw;
  }
}

export const TopSearchKeywords = memo(function TopSearchKeywords({
  rows,
  emptyLabel = "No customer activity available yet.",
  onKeywordClick,
}: TopSearchKeywordsProps) {
  return (
    <AnalyticsCard
      title="Top Search Keywords"
      subtitle="What customers are searching for most"
    >
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onKeywordClick?.(row)}
                className="group flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  #{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    <p className="truncate text-sm font-semibold text-slate-800">{row.label}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {row.count} {row.count === 1 ? "Search" : "Searches"}
                    <span className="mx-1.5 text-slate-300">·</span>
                    Last: {formatLastSearchDate(row.meta?.lastSearchDate as string | undefined)}
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AnalyticsCard>
  );
});
