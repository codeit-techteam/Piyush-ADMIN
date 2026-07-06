"use client";

import { memo } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Heart, Store, X } from "lucide-react";
import { PercentageBar } from "@/components/analytics/percentage-bar";
import { Skeleton } from "@/components/ui/skeleton";
import type { WishlistDetailsResponse } from "@/types/analytics";

interface WishlistDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  date?: string;
  wishlistAdded?: number;
  data?: WishlistDetailsResponse;
  isLoading?: boolean;
  isError?: boolean;
}

function formatDrawerDate(raw?: string | null) {
  if (!raw) return "—";
  try {
    return format(parseISO(raw), "MMMM d, yyyy");
  } catch {
    return raw;
  }
}

export const WishlistDetailsDrawer = memo(function WishlistDetailsDrawer({
  open,
  onClose,
  date,
  wishlistAdded,
  data,
  isLoading,
  isError,
}: WishlistDetailsDrawerProps) {
  if (!open) return null;

  const displayDate = formatDrawerDate(data?.date ?? date);
  const displayAdded = data?.wishlistAdded ?? wishlistAdded ?? 0;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Close wishlist details panel"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist growth details"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Wishlist Activity
            </p>
            <p className="text-sm font-semibold text-slate-900">{displayDate}</p>
            <p className="flex items-center gap-1 text-xs text-rose-600">
              <Heart className="h-3.5 w-3.5" aria-hidden />
              {displayAdded} Added
            </p>
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
            <p className="text-sm text-red-600">Failed to load wishlist details. Close and try again.</p>
          ) : null}

          {!isLoading && !isError ? (
            <>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Top Wishlisted Products</h3>
                {(data?.topWishlistedProducts ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No products wishlisted on this date.</p>
                ) : (
                  <ul className="space-y-3">
                    {(data?.topWishlistedProducts ?? []).map((item) => (
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
                            <p className="truncate text-sm font-medium text-slate-800">
                              {item.productName}
                            </p>
                            {item.boutiqueName ? (
                              <p className="text-[11px] text-slate-500">{item.boutiqueName}</p>
                            ) : null}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-rose-600">
                                {item.count} {item.count === 1 ? "add" : "adds"}
                              </span>
                              <span className="text-xs font-semibold text-slate-700">
                                {item.percentage}%
                              </span>
                            </div>
                            <PercentageBar percentage={item.percentage} showValue={false} className="mt-1.5" />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <Store className="h-4 w-4 text-slate-500" aria-hidden />
                  Top Wishlisted Boutique
                </h3>
                {data?.topWishlistedBoutique ? (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {data.topWishlistedBoutique.boutiqueName}
                      </p>
                      <span className="shrink-0 text-xs font-semibold text-blue-700">
                        {data.topWishlistedBoutique.count} adds
                      </span>
                    </div>
                    <PercentageBar
                      percentage={data.topWishlistedBoutique.percentage}
                      showValue={false}
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No boutique wishlist activity on this date.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
});
