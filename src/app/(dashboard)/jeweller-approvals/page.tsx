"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { listBoutiques } from "@/lib/api/services/boutiques";
import { ROUTES } from "@/lib/constants/routes";
import { isAwaitingAdminReview } from "@/lib/jeweller-documents";
import { VerificationStatusChip } from "@/components/boutiques/verification-status-chip";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import type { Boutique, BoutiqueVerificationStatus } from "@/types";

type TabFilter = "pending" | "approved" | "rejected" | "all";

function normalizeVerificationStatus(
  status: BoutiqueVerificationStatus | string | null | undefined,
): BoutiqueVerificationStatus {
  const value = (status ?? "PENDING").toUpperCase();
  if (value === "APPROVED" || value === "REJECTED") return value;
  return "PENDING";
}

function matchesTab(store: Boutique, tab: TabFilter): boolean {
  const verification = normalizeVerificationStatus(store.verification_status);
  if (tab === "all") return true;
  if (tab === "pending") {
    return isAwaitingAdminReview(store.verification_status, store.store_status);
  }
  if (tab === "approved") return verification === "APPROVED";
  return verification === "REJECTED";
}

const TAB_LABELS: { key: TabFilter; label: string }[] = [
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function JewellerApprovalsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabFilter>("pending");

  const query = useQuery({
    queryKey: ["boutiques"],
    queryFn: listBoutiques,
    refetchInterval: 30_000,
  });

  const allJeweller = (query.data ?? []).filter((b) => b.is_self_managed);

  const counts: Record<TabFilter, number> = {
    pending: allJeweller.filter((b) =>
      isAwaitingAdminReview(b.verification_status, b.store_status),
    ).length,
    approved: allJeweller.filter(
      (b) => normalizeVerificationStatus(b.verification_status) === "APPROVED",
    ).length,
    rejected: allJeweller.filter(
      (b) => normalizeVerificationStatus(b.verification_status) === "REJECTED",
    ).length,
    all: allJeweller.length,
  };

  const filtered = allJeweller.filter((b) => matchesTab(b, tab));

  if (query.isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </section>
    );
  }

  if (query.isError) {
    return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  }

  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900">Jeweller Approvals</h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Review submitted verification documents. Approving unlocks the Verify button on the
          Boutiques page. Verification badge and featuring are managed separately.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl border p-3 text-left transition ${
              tab === key
                ? "border-blue-500/50 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-600">{label}</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                key === "pending"
                  ? "text-blue-600"
                  : key === "approved"
                    ? "text-emerald-700"
                    : key === "rejected"
                      ? "text-red-400"
                      : "text-slate-900"
              }`}
            >
              {counts[key]}
            </p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            {label}
            {counts[key] > 0 ? (
              <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs text-white">
                {counts[key]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-base font-medium text-slate-700">
            No stores in &ldquo;{TAB_LABELS.find((t) => t.key === tab)?.label}&rdquo;
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {tab === "pending"
              ? "No jeweller stores are awaiting document review."
              : "Nothing to show here."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="admin-table min-w-[800px]">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Store</th>
                <th className="px-4 py-3 font-medium text-slate-700">Owner</th>
                <th className="px-4 py-3 font-medium text-slate-700">Phone</th>
                <th className="px-4 py-3 font-medium text-slate-700">Location</th>
                <th className="px-4 py-3 font-medium text-slate-700">Products</th>
                <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 font-medium text-slate-700">Submitted</th>
                <th className="px-4 py-3 font-medium text-slate-700" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((boutique) => (
                <tr
                  key={boutique.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(ROUTES.storeReview(boutique.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(ROUTES.storeReview(boutique.id));
                    }
                  }}
                  className="cursor-pointer border-b border-slate-200/70 align-middle transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{boutique.name}</p>
                    {boutique.member_id ? (
                      <p className="text-xs text-slate-500">{boutique.member_id}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{boutique.owner_name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {boutique.contact_number ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {boutique.location ?? boutique.address ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {boutique.products_count != null ? boutique.products_count : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <VerificationStatusChip status={boutique.verification_status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {boutique.created_at
                      ? format(new Date(boutique.created_at), "dd MMM yyyy")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-blue-600">
                    <span className="inline-flex items-center gap-1 text-xs font-medium">
                      Review <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}
