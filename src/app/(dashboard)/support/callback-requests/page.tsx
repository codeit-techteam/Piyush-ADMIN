"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  useAssignCallbackRequest,
  useCallbackRequests,
  useUpdateCallbackRequestStatus,
} from "@/hooks/use-callback-requests";
import { getCallbackNextStatus } from "@/lib/api/services/callback-requests";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { AdminCallbackRequest, CallbackRequestStatus } from "@/types";

type StatusFilter = "all" | CallbackRequestStatus;

const PAGE_SIZE = 10;

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "closed", label: "Closed" },
];

const SLOT_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const STATUS_LABELS: Record<CallbackRequestStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  closed: "Closed",
};

const TIMELINE_STEPS: { key: CallbackRequestStatus; label: string }[] = [
  { key: "pending", label: "Created" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const STATUS_ORDER: CallbackRequestStatus[] = [
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "closed",
];

function statusIndex(status: CallbackRequestStatus) {
  return STATUS_ORDER.indexOf(status);
}

function StatusBadge({ status }: { status: CallbackRequestStatus }) {
  const styles: Record<CallbackRequestStatus, string> = {
    pending: "bg-blue-50 text-blue-600",
    assigned: "bg-blue-500/15 text-blue-400",
    in_progress: "bg-violet-500/15 text-violet-400",
    completed: "bg-emerald-500/15 text-emerald-700",
    closed: "bg-slate-600/50 text-slate-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
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

function formatIst(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function matchesSearch(row: AdminCallbackRequest, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.customerName,
    row.mobileNumber,
    row.referenceId,
    row.requirement,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function CallbackSkeleton() {
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

type ConfirmState = {
  id: string;
  nextStatus: CallbackRequestStatus;
  label: string;
};

export default function CallbackRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [drawerRow, setDrawerRow] = useState<AdminCallbackRequest | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmIsAssign, setConfirmIsAssign] = useState(false);

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;
  const query = useCallbackRequests({ status: apiStatus ?? "all" });
  const assignMutation = useAssignCallbackRequest();
  const updateMutation = useUpdateCallbackRequestStatus();

  const allRows = query.data ?? [];

  const filteredRows = useMemo(
    () => allRows.filter((row) => matchesSearch(row, search)),
    [allRows, search],
  );

  const summary = useMemo(
    () => ({
      total: filteredRows.length,
      pending: filteredRows.filter((r) => r.status === "pending").length,
      inProgress: filteredRows.filter((r) => r.status === "in_progress").length,
      completed: filteredRows.filter((r) => r.status === "completed").length,
    }),
    [filteredRows],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const rangeStart = filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredRows.length);

  const busy = assignMutation.isPending || updateMutation.isPending;

  const openStatusConfirm = async (row: AdminCallbackRequest) => {
    const next = await getCallbackNextStatus(row.status);
    if (!next) return;
    setConfirmIsAssign(false);
    setConfirm({
      id: row.id,
      nextStatus: next,
      label: `Move request ${row.referenceId} to "${STATUS_LABELS[next]}"?`,
    });
  };

  useEffect(() => {
    if (!drawerRow) return;
    const fresh = allRows.find((r) => r.id === drawerRow.id);
    if (fresh && fresh.updatedAt !== drawerRow.updatedAt) {
      setDrawerRow(fresh);
    }
  }, [allRows, drawerRow]);

  const handleAssign = (row: AdminCallbackRequest) => {
    if (row.status !== "pending") return;
    setConfirmIsAssign(true);
    setConfirm({
      id: row.id,
      nextStatus: "assigned",
      label: `Assign callback request ${row.referenceId} to support?`,
    });
  };

  const onConfirmAction = async () => {
    if (!confirm) return;
    if (confirmIsAssign) {
      await assignMutation.mutateAsync(confirm.id);
    } else {
      await updateMutation.mutateAsync({
        id: confirm.id,
        status: confirm.nextStatus,
      });
    }
    setConfirm(null);
    setConfirmIsAssign(false);
    if (drawerRow?.id === confirm.id) {
      const updated = allRows.find((r) => r.id === confirm.id);
      if (updated) setDrawerRow({ ...updated, status: confirm.nextStatus });
    }
  };

  if (query.isLoading) {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Callback Requests</h1>
          <p className="mt-2 text-sm text-slate-600">Loading support requests…</p>
        </div>
        <CallbackSkeleton />
      </section>
    );
  }

  if (query.isError) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-semibold">Callback Requests</h1>
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-blue-600/90">
            Support Management
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold">
            <Headphones className="h-5 w-5 text-blue-600" />
            Callback Requests
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage customer callback requests from the mobile app.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Requests" value={summary.total} />
        <StatCard label="Pending" value={summary.pending} />
        <StatCard label="In Progress" value={summary.inProgress} />
        <StatCard label="Completed" value={summary.completed} />
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

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            className="pl-9"
            placeholder="Search name, mobile, reference ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="No support requests found"
          description={
            search || statusFilter !== "all"
              ? "Try clearing filters or search."
              : "When customers request a callback in the app, new entries will appear here automatically."
          }
        />
      ) : (
        <div className="space-y-3">
          <Card className="overflow-x-auto p-0">
            <table className="admin-table min-w-[1000px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-700">Reference ID</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Customer Name</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Mobile</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Time Slot</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Requirement</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Created</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => {
                  const canAdvance = row.status !== "closed";
                  return (
                    <tr key={row.id} className="border-b border-slate-200/80 align-middle">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700/90">
                        {row.referenceId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {row.customerName ?? "Guest"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.mobileNumber}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {SLOT_LABELS[row.preferredTimeSlot] ?? row.preferredTimeSlot}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">
                        {row.requirement}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatIst(row.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDrawerRow(row)}
                          >
                            View
                          </Button>
                          {row.status === "pending" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() => void handleAssign(row)}
                            >
                              Assign
                            </Button>
                          ) : null}
                          {canAdvance ? (
                            <Button
                              size="sm"
                              disabled={busy || row.status === "closed"}
                              onClick={() => void openStatusConfirm(row)}
                            >
                              Update Status
                            </Button>
                          ) : null}
                        </div>
                      </td>
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

      {drawerRow ? (
        <CallbackDrawer
          row={drawerRow}
          onClose={() => setDrawerRow(null)}
          onAssign={() => void handleAssign(drawerRow)}
          onUpdateStatus={() => void openStatusConfirm(drawerRow)}
          busy={busy}
        />
      ) : null}

      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md space-y-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Confirm status update</h3>
            <p className="text-sm text-slate-600">{confirm.label}</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirm(null);
                  setConfirmIsAssign(false);
                }}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button onClick={() => void onConfirmAction()} disabled={busy}>
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}

function CallbackDrawer({
  row,
  onClose,
  onAssign,
  onUpdateStatus,
  busy,
}: {
  row: AdminCallbackRequest;
  onClose: () => void;
  onAssign: () => void;
  onUpdateStatus: () => void;
  busy: boolean;
}) {
  const currentIdx = statusIndex(row.status);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Request details</p>
            <p className="font-mono text-sm font-semibold text-blue-700">{row.referenceId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <DetailField label="Customer Name" value={row.customerName ?? "Guest"} />
          <DetailField label="Mobile Number" value={row.mobileNumber} />
          <DetailField
            label="Preferred Slot"
            value={SLOT_LABELS[row.preferredTimeSlot] ?? row.preferredTimeSlot}
          />
          <DetailField label="Requirement" value={row.requirement} multiline />
          <DetailField label="Submission Date" value={formatIst(row.createdAt)} />
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Timeline
            </p>
            <ol className="space-y-3 border-l border-slate-200 pl-4">
              {TIMELINE_STEPS.map((step) => {
                const stepIdx = statusIndex(step.key);
                const done = currentIdx >= stepIdx;
                const active = row.status === step.key;
                return (
                  <li key={step.key} className="relative">
                    <span
                      className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 ${
                        done
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-600 bg-white"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        active ? "text-blue-600" : done ? "text-slate-800" : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
          <StatusBadge status={row.status} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-5">
          {row.status === "pending" ? (
            <Button variant="outline" disabled={busy} onClick={onAssign}>
              Assign
            </Button>
          ) : null}
          {row.status !== "closed" ? (
            <Button disabled={busy} onClick={onUpdateStatus}>
              Update Status
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </aside>
    </>
  );
}

function DetailField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-sm text-slate-900 ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
