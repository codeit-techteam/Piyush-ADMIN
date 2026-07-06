"use client";

import { memo } from "react";
import { format, parseISO } from "date-fns";
import { Activity, Calendar, Heart, Search, UserPlus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityDetailsResponse } from "@/types/analytics";

interface ActivityDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  date?: string;
  totalActivities?: number;
  data?: ActivityDetailsResponse;
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

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        <p className="text-[11px] font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

export const ActivityDetailsDrawer = memo(function ActivityDetailsDrawer({
  open,
  onClose,
  date,
  totalActivities,
  data,
  isLoading,
  isError,
}: ActivityDetailsDrawerProps) {
  if (!open) return null;

  const displayDate = formatDrawerDate(data?.date ?? date);
  const displayTotal = data?.totalCustomerActivities ?? totalActivities ?? 0;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Close activity details panel"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Customer activity details"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Customer Activities
            </p>
            <p className="text-sm font-semibold text-slate-900">{displayDate}</p>
            <p className="text-xs text-blue-700">
              {displayTotal} {displayTotal === 1 ? "activity" : "activities"}
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
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : null}

          {isError ? (
            <p className="text-sm text-red-600">Failed to load activity details. Close and try again.</p>
          ) : null}

          {!isLoading && !isError && data ? (
            <div className="grid grid-cols-2 gap-3">
              <StatTile icon={UserPlus} label="New Users" value={data.newUserRegistrations} />
              <StatTile icon={Heart} label="Wishlist" value={data.wishlistActivities} />
              <StatTile icon={Search} label="Searches" value={data.searchActivities} />
              <StatTile icon={Activity} label="Appointments" value={data.appointmentActivities} />
            </div>
          ) : null}

          {!isLoading && !isError && data && displayTotal === 0 ? (
            <p className="text-sm text-slate-500">No customer activity recorded on this date.</p>
          ) : null}
        </div>
      </aside>
    </>
  );
});
