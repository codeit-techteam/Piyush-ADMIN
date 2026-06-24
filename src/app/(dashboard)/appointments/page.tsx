"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useAppointments } from "@/hooks/use-appointments";
import { useBoutiques } from "@/hooks/use-boutiques";
import { activeBoutiques, isApprovedStoreStatus } from "@/lib/boutique-approval";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { AdminAppointment, AppointmentStatus } from "@/types";

type StatusFilter = "all" | AppointmentStatus;

const PAGE_SIZE = 10;

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function StatusBadge({ status, badge }: { status: AppointmentStatus; badge: string }) {
  if (status === "cancelled") {
    return (
      <span className="inline-flex rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400">
        Cancelled
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
        Completed
      </span>
    );
  }
  if (badge === "past") {
    return (
      <span className="inline-flex rounded-full bg-slate-600/50 px-2.5 py-1 text-xs font-semibold text-slate-700">
        Past (upcoming)
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
      Upcoming
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </Card>
  );
}

function AppointmentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-12 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

const IST_TIMEZONE = "Asia/Kolkata";

function formatBookedAtIst(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/** Appointment slot: stored `date` + `time` from DB (India timezone for date). */
function formatAppointmentWhen(row: AdminAppointment) {
  const dateLabel = row.dateIso
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: IST_TIMEZONE,
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${row.dateIso}T12:00:00`))
    : row.date?.trim() || null;

  const timeLabel = row.time?.trim() || null;

  if (dateLabel && timeLabel) {
    return `${dateLabel}, ${timeLabel}`;
  }
  if (dateLabel) return dateLabel;
  if (timeLabel) return timeLabel;
  return "—";
}

function matchesSearch(row: AdminAppointment, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.customerName,
    row.customerPhone,
    row.userDisplayName,
    row.userPhone,
    row.boutiqueName,
    row.serviceRequested,
    row.consultationType,
    row.notes,
    row.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [boutiqueFilter, setBoutiqueFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;
  const appointmentsQuery = useAppointments({
    status: apiStatus ?? "all",
    boutiqueId: boutiqueFilter || undefined,
  });
  const boutiquesQuery = useBoutiques();

  const allRows = appointmentsQuery.data ?? [];
  const boutiques = boutiquesQuery.data ?? [];

  const approvedBoutiques = useMemo(
    () =>
      activeBoutiques(boutiques)
        .filter((b) => isApprovedStoreStatus(b.store_status))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [boutiques],
  );

  const filteredRows = useMemo(
    () => allRows.filter((row) => matchesSearch(row, search)),
    [allRows, search],
  );

  const summary = useMemo(
    () => ({
      total: filteredRows.length,
      upcoming: filteredRows.filter((r) => r.status === "upcoming").length,
      completed: filteredRows.filter((r) => r.status === "completed").length,
      cancelled: filteredRows.filter((r) => r.status === "cancelled").length,
    }),
    [filteredRows],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [statusFilter, boutiqueFilter, search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const rangeStart = filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredRows.length);

  if (appointmentsQuery.isLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Appointments Management</h1>
          <p className="mt-2 text-sm text-slate-600">Loading bookings from the platform…</p>
        </div>
        <AppointmentsSkeleton />
      </section>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Appointments Management</h1>
        </div>
        <ErrorState
          message={appointmentsQuery.error.message}
          onRetry={() => appointmentsQuery.refetch()}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            Appointments Management
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            View customer bookings and filter by boutique or status.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => appointmentsQuery.refetch()}
          disabled={appointmentsQuery.isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${appointmentsQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total shown" value={summary.total} />
        <StatCard label="Upcoming" value={summary.upcoming} />
        <StatCard label="Completed" value={summary.completed} />
        <StatCard label="Cancelled" value={summary.cancelled} />
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                statusFilter === tab.id
                  ? "bg-blue-100 text-blue-600"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="pl-9"
              placeholder="Search customer, phone, boutique, service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
            value={boutiqueFilter}
            onChange={(e) => {
              setBoutiqueFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All boutiques</option>
            {approvedBoutiques.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {filteredRows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-base font-medium text-slate-800">No appointments found</p>
          <p className="mt-2 text-sm text-slate-600">
            {search || boutiqueFilter || statusFilter !== "all"
              ? "Try clearing filters or search."
              : "New customer bookings will appear here when created in the app."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
        <Card className="overflow-x-auto p-0">
          <table className="admin-table min-w-[960px]">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Customer</th>
                <th className="px-4 py-3 font-medium text-slate-700">Phone</th>
                <th className="px-4 py-3 font-medium text-slate-700">Boutique</th>
                <th className="px-4 py-3 font-medium text-slate-700">Service</th>
                <th className="px-4 py-3 font-medium text-slate-700">When</th>
                <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 font-medium text-slate-700">Booked</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const displayName =
                  row.customerName ?? row.userDisplayName ?? "Guest";
                const displayPhone = row.customerPhone ?? row.userPhone ?? "—";
                const service =
                  row.serviceRequested ?? row.consultationType ?? "Consultation";
                const whenLabel = formatAppointmentWhen(row);
                const bookedAt = formatBookedAtIst(row.createdAt);

                return (
                  <tr key={row.id} className="border-b border-slate-200/80 align-middle">
                    <td className="px-4 py-3 font-medium text-slate-900">{displayName}</td>
                    <td className="px-4 py-3 text-slate-700">{displayPhone}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">{row.boutiqueName}</p>
                      {row.boutiqueSlug ? (
                        <p className="text-xs text-slate-500">{row.boutiqueSlug}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{service}</td>
                    <td className="px-4 py-3 text-slate-700">{whenLabel}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} badge={row.badge} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{bookedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Showing {rangeStart}–{rangeEnd} of {filteredRows.length}
            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
        </div>
      )}
    </section>
  );
}
