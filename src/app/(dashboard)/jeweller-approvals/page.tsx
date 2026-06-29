"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  approveBoutiqueStore,
  listBoutiques,
  notifyBoutiqueJeweller,
  rejectBoutiqueStore,
  rereviewBoutiqueStore,
  suspendBoutiqueStore,
} from "@/lib/api/services/boutiques";
import {
  activeBoutiques,
  approvalTabCounts,
  isPendingStoreStatus,
  matchesApprovalTab,
  type ApprovalTab,
} from "@/lib/boutique-approval";
import { rowHighlightClass } from "@/lib/boutique-completion";
import { ROUTES } from "@/lib/constants/routes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import {
  ApprovalStatusBadge,
  resolveCompletionForBoutique,
} from "@/components/boutiques/boutique-completion-summary";
import { useBoutiqueCompletionMeta } from "@/hooks/use-boutique-completion";
import { getBoutiqueCity, getBoutiqueState } from "@/lib/boutique-location";
import type { Boutique } from "@/types";

type SortOption = "recent" | "oldest" | "name-asc" | "name-desc";

const TAB_LABELS: { key: ApprovalTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
];

const VALID_TABS = new Set<ApprovalTab>(TAB_LABELS.map(({ key }) => key));

function parseTabParam(value: string | null): ApprovalTab {
  if (value && VALID_TABS.has(value as ApprovalTab)) {
    return value as ApprovalTab;
  }
  return "all";
}

function StoreActions({
  boutique,
  onMutated,
}: {
  boutique: Boutique;
  onMutated: () => void;
}) {
  const queryClient = useQueryClient();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const storeStatus = (boutique.store_status ?? "pending").toLowerCase();

  const runAction = async (action: string, fn: () => Promise<void>) => {
    setBusyAction(action);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["boutiques"] });
      await queryClient.invalidateQueries({ queryKey: ["boutique-completion"] });
      onMutated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyAction(null);
    }
  };

  const handleApprove = () =>
    runAction("approve", async () => {
      await approveBoutiqueStore(boutique.id);
      if (boutique.jeweller_user_id) {
        await notifyBoutiqueJeweller({
          jeweller_user_id: boutique.jeweller_user_id,
          boutique_id: boutique.id,
          event: "approved",
        });
      }
      toast.success(`${boutique.name} approved`);
    });

  const handleReject = () =>
    runAction("reject", async () => {
      await rejectBoutiqueStore(boutique.id);
      if (boutique.jeweller_user_id) {
        await notifyBoutiqueJeweller({
          jeweller_user_id: boutique.jeweller_user_id,
          boutique_id: boutique.id,
          event: "rejected",
          reason: "Your store application was not approved. Please contact support for details.",
        });
      }
      toast.success(`${boutique.name} rejected`);
    });

  const handleSuspend = () =>
    runAction("suspend", async () => {
      await suspendBoutiqueStore(boutique.id);
      toast.success(`${boutique.name} suspended`);
    });

  const handleRereview = () =>
    runAction("rereview", async () => {
      await rereviewBoutiqueStore(boutique.id);
      toast.success(`${boutique.name} moved back to review`);
    });

  const isBusy = busyAction !== null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {storeStatus === "pending" || storeStatus === "review" ? (
        <>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-emerald-600 hover:bg-emerald-700"
            disabled={isBusy}
            onClick={(e) => {
              e.stopPropagation();
              void handleApprove();
            }}
          >
            {busyAction === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-8"
            disabled={isBusy}
            onClick={(e) => {
              e.stopPropagation();
              void handleReject();
            }}
          >
            {busyAction === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reject"}
          </Button>
        </>
      ) : null}

      {storeStatus === "approved" ? (
        <>
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Approved
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={isBusy}
            onClick={(e) => {
              e.stopPropagation();
              void handleSuspend();
            }}
          >
            {busyAction === "suspend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Suspend"}
          </Button>
        </>
      ) : null}

      {storeStatus === "rejected" ? (
        <>
          <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            Rejected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={isBusy}
            onClick={(e) => {
              e.stopPropagation();
              void handleRereview();
            }}
          >
            {busyAction === "rereview" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Re-review"}
          </Button>
        </>
      ) : null}
    </div>
  );
}

export default function BoutiquesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ApprovalTab>(() => parseTabParam(searchParams.get("tab")));
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  useEffect(() => {
    setTab(parseTabParam(searchParams.get("tab")));
  }, [searchParams]);

  const selectTab = (next: ApprovalTab) => {
    setTab(next);
    router.replace(ROUTES.boutiquesWithTab(next), { scroll: false });
  };

  const query = useQuery({
    queryKey: ["boutiques"],
    queryFn: listBoutiques,
    refetchInterval: 30_000,
  });

  const allBoutiques = activeBoutiques(query.data ?? []);
  const counts = approvalTabCounts(query.data ?? []);
  const filtered = useMemo(() => {
    const tabFiltered = allBoutiques.filter((b) => matchesApprovalTab(b, tab));
    return [...tabFiltered].sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (sortBy === "oldest") {
        return aTime - bTime;
      }
      return bTime - aTime;
    });
  }, [allBoutiques, tab, sortBy]);

  const completionBoutiqueIds = useMemo(
    () =>
      filtered
        .filter((b) => b.is_self_managed && isPendingStoreStatus(b.store_status))
        .map((b) => b.id),
    [filtered],
  );

  const completionQuery = useBoutiqueCompletionMeta(completionBoutiqueIds);
  const completionMeta = completionQuery.data;

  const openDetails = (boutique: Boutique) => {
    if (boutique.is_self_managed) {
      router.push(ROUTES.storeReview(boutique.id));
      return;
    }
    router.push(`${ROUTES.boutiques}/${boutique.id}`);
  };

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
          <Building2 className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900">Boutiques</h1>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Review, approve, and manage all boutiques on the platform.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => selectTab(key)}
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
            onClick={() => selectTab(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === key
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            {label}
            {counts[key] > 0 ? (
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                  tab === key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {counts[key]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <select
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="recent">Recently added</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">A–Z</option>
          <option value="name-desc">Z–A</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-base font-medium text-slate-700">
            No stores in &ldquo;{TAB_LABELS.find((t) => t.key === tab)?.label}&rdquo;
          </p>
          <p className="mt-1 text-sm text-slate-500">Nothing to show here.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="admin-table min-w-[1000px]">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Store</th>
                <th className="px-4 py-3 font-medium text-slate-700">Owner</th>
                <th className="px-4 py-3 font-medium text-slate-700">Phone</th>
                <th className="px-4 py-3 font-medium text-slate-700">Location</th>
                <th className="px-4 py-3 font-medium text-slate-700">State</th>
                <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 font-medium text-slate-700">Submitted</th>
                <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((boutique) => {
                const completion = resolveCompletionForBoutique(boutique, completionMeta);

                return (
                <tr
                  key={boutique.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(boutique)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetails(boutique);
                    }
                  }}
                  className={`cursor-pointer border-b border-slate-200/70 align-middle transition-colors focus:outline-none ${rowHighlightClass(boutique, completion)}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{boutique.name}</p>
                    {boutique.member_id ? (
                      <p className="text-xs text-slate-500">{boutique.member_id}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {boutique.is_self_managed ? (boutique.owner_name ?? "-") : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {boutique.phone_number ?? boutique.contact_number ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {getBoutiqueCity(boutique) ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {getBoutiqueState(boutique) ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {isPendingStoreStatus(boutique.store_status) ? (
                      <ApprovalStatusBadge boutique={boutique} completion={completion} />
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
                        {boutique.store_status ?? "pending"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {boutique.created_at
                      ? format(new Date(boutique.created_at), "dd MMM yyyy")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <StoreActions boutique={boutique} onMutated={() => query.refetch()} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}
