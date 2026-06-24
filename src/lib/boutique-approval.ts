import type { Boutique, StoreApprovalStatus } from "@/types";

export type ApprovalTab = "pending" | "approved" | "rejected" | "all";

export function isPendingStoreStatus(status: StoreApprovalStatus | null | undefined): boolean {
  const value = (status ?? "pending").toLowerCase();
  return value === "pending" || value === "review";
}

export function isApprovedStoreStatus(status: StoreApprovalStatus | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "approved";
}

export function isRejectedStoreStatus(status: StoreApprovalStatus | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "rejected";
}

export function activeBoutiques(boutiques: Boutique[]): Boutique[] {
  return boutiques.filter((b) => !b.deleted_at);
}

export function matchesApprovalTab(boutique: Boutique, tab: ApprovalTab): boolean {
  if (tab === "all") return true;
  if (tab === "pending") return isPendingStoreStatus(boutique.store_status);
  if (tab === "approved") return isApprovedStoreStatus(boutique.store_status);
  return isRejectedStoreStatus(boutique.store_status);
}

export function approvalTabCounts(boutiques: Boutique[]): Record<ApprovalTab, number> {
  const active = activeBoutiques(boutiques);
  return {
    pending: active.filter((b) => isPendingStoreStatus(b.store_status)).length,
    approved: active.filter((b) => isApprovedStoreStatus(b.store_status)).length,
    rejected: active.filter((b) => isRejectedStoreStatus(b.store_status)).length,
    all: active.length,
  };
}

export function pendingApprovalCount(boutiques: Boutique[]): number {
  return activeBoutiques(boutiques).filter((b) => isPendingStoreStatus(b.store_status)).length;
}
