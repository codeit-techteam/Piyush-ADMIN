"use client";

import { memo } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlatformDayDetailsResponse, PlatformDrilldownMetric } from "@/types/analytics";

interface PlatformDrillDownDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  metric: PlatformDrilldownMetric;
  dateLabel: string;
  totalValue: number;
  data?: PlatformDayDetailsResponse;
  isLoading?: boolean;
  isError?: boolean;
}

const EMPTY_LABEL: Record<PlatformDrilldownMetric, string> = {
  userGrowth: "No new users registered on this date.",
  appointmentTrends: "No appointments booked on this date.",
  boutiqueApprovalTrends: "No boutiques were approved on this date.",
  productUploadTrends: "No products were uploaded on this date.",
};

const UNIT_LABEL: Record<PlatformDrilldownMetric, string> = {
  userGrowth: "new users",
  appointmentTrends: "appointments",
  boutiqueApprovalTrends: "approvals",
  productUploadTrends: "products",
};

function formatDrawerDate(raw?: string | null) {
  if (!raw) return "—";
  try {
    return format(parseISO(raw), "MMMM d, yyyy");
  } catch {
    return raw;
  }
}

function formatItemTime(raw: string) {
  try {
    return format(parseISO(raw), "h:mm a");
  } catch {
    return "";
  }
}

export const PlatformDrillDownDrawer = memo(function PlatformDrillDownDrawer({
  open,
  onClose,
  title,
  metric,
  dateLabel,
  totalValue,
  data,
  isLoading,
  isError,
}: PlatformDrillDownDrawerProps) {
  if (!open) return null;

  const displayDate = formatDrawerDate(data?.date ?? dateLabel);
  const displayTotal = data?.total ?? totalValue ?? 0;
  const items = data?.items ?? [];

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
        aria-label={`${title} drill-down`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {title}
            </p>
            <p className="text-sm font-semibold text-slate-900">{displayDate}</p>
            <p className="text-xs text-blue-700">
              {displayTotal} {UNIT_LABEL[metric]}
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : null}

          {isError ? (
            <p className="text-sm text-red-600">
              Failed to load details for this date. Close and try again.
            </p>
          ) : null}

          {!isLoading && !isError && items.length === 0 ? (
            <p className="text-sm text-slate-500">{EMPTY_LABEL[metric]}</p>
          ) : null}

          {!isLoading && !isError && items.length > 0 ? (
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                      {item.subtitle ? (
                        <p className="truncate text-[11px] text-slate-500">{item.subtitle}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      {item.badge ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {item.badge}
                        </span>
                      ) : null}
                      <p className="mt-1 text-[11px] text-slate-400">{formatItemTime(item.createdAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {!isLoading && !isError && items.length > 0 && data && data.total > items.length ? (
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Showing {items.length} of {data.total}
            </p>
          ) : null}
        </div>
      </aside>
    </>
  );
});
