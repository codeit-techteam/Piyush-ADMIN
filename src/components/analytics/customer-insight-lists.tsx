"use client";

import { memo } from "react";
import { PercentageBar } from "@/components/analytics/percentage-bar";
import type { CustomerInsightBoutique, CustomerInsightProduct } from "@/types/analytics";

interface CustomerInsightProductListProps {
  title: string;
  items: CustomerInsightProduct[];
  countLabel?: string;
  emptyLabel?: string;
}

export const CustomerInsightProductList = memo(function CustomerInsightProductList({
  title,
  items,
  countLabel = "views",
  emptyLabel = "No products found.",
}: CustomerInsightProductListProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
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
                  {item.boutiqueName ? (
                    <p className="text-[11px] text-slate-500">{item.boutiqueName}</p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {typeof item.views === "number" ? (
                      <span className="text-xs font-semibold text-blue-700">
                        {item.views} {countLabel}
                      </span>
                    ) : null}
                    {typeof item.percentage === "number" ? (
                      <span className="text-xs font-semibold text-slate-700">{item.percentage}%</span>
                    ) : null}
                  </div>
                  {typeof item.percentage === "number" ? (
                    <PercentageBar percentage={item.percentage} showValue={false} className="mt-1.5" />
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

interface CustomerInsightBoutiqueListProps {
  title: string;
  items: CustomerInsightBoutique[];
  emptyLabel?: string;
}

export const CustomerInsightBoutiqueList = memo(function CustomerInsightBoutiqueList({
  title,
  items,
  emptyLabel = "No boutiques found.",
}: CustomerInsightBoutiqueListProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.boutiqueId}
              className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-800">{item.boutiqueName}</p>
                <span className="shrink-0 text-xs font-semibold text-blue-700">{item.views} views</span>
              </div>
              {typeof item.percentage === "number" ? (
                <PercentageBar percentage={item.percentage} showValue={false} className="mt-2" />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
