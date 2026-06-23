"use client";

import { useState } from "react";
import { Building2, BadgeCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButtonWithTooltip } from "@/components/boutiques/action-button-with-tooltip";
import { BoutiqueViewModal } from "@/components/boutiques/boutique-view-modal";
import { VerificationStatusChip } from "@/components/boutiques/verification-status-chip";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBoutiques } from "@/hooks/use-boutiques";
import { usePatchBoutiqueAdmin } from "@/hooks/use-boutique-admin-controls";
import { deleteBoutique } from "@/lib/api/services/boutiques";
import { useQueryClient } from "@tanstack/react-query";
import type { Boutique } from "@/types";

function BoutiquesTableSkeleton() {
  return (
    <Card className="space-y-4">
      <Skeleton className="h-10 w-48" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </Card>
  );
}

function isBoutiqueVerified(boutique: Boutique) {
  return Boolean(boutique.is_verified ?? boutique.verified);
}

function isBoutiqueFeatured(boutique: Boutique) {
  return Boolean(boutique.is_featured ?? boutique.featured);
}

function isBoutiqueActive(boutique: Boutique) {
  return boutique.is_active !== false && boutique.status !== "inactive";
}

function canToggleVerify(boutique: Boutique) {
  return (boutique.verification_status ?? "PENDING").toUpperCase() === "APPROVED";
}

export default function BoutiquesPage() {
  const query = useBoutiques();
  const patchMutation = usePatchBoutiqueAdmin();
  const queryClient = useQueryClient();
  const boutiques = query.data ?? [];
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Boutique | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleVerifyToggle = async (boutique: Boutique) => {
    const next = !isBoutiqueVerified(boutique);
    try {
      await patchMutation.mutateAsync({
        id: boutique.id,
        payload: { is_verified: next },
      });
      toast.success(next ? "Boutique verified" : "Verification removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update verification");
    }
  };

  const handleFeatureToggle = async (boutique: Boutique) => {
    const next = !isBoutiqueFeatured(boutique);
    try {
      await patchMutation.mutateAsync({
        id: boutique.id,
        payload: { is_featured: next },
      });
      toast.success(next ? "Boutique featured" : "Boutique unfeatured");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update featured status");
    }
  };

  const handleSuspendToggle = async (boutique: Boutique) => {
    const next = !isBoutiqueActive(boutique);
    try {
      await patchMutation.mutateAsync({
        id: boutique.id,
        payload: { is_active: next },
      });
      toast.success(next ? "Boutique reinstated" : "Boutique suspended");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBoutique(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["boutiques"] });
      toast.success("Boutique deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete boutique");
    } finally {
      setIsDeleting(false);
    }
  };

  if (query.isLoading) {
    return <BoutiquesTableSkeleton />;
  }

  if (query.isError) {
    return <ErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Boutiques Management"
        subtitle="View boutique details, manage verification badges, featured placement, and suspension."
      />

      {boutiques.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No boutiques found"
          description="The API returned an empty list. Add boutiques or verify backend filters."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="admin-table min-w-[1100px]">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Image</th>
                <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 font-medium text-slate-700">Location</th>
                <th className="px-4 py-3 font-medium text-slate-700">Rating</th>
                <th className="px-4 py-3 font-medium text-slate-700">Verification</th>
                <th className="px-4 py-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {boutiques.map((boutique) => {
                const verified = isBoutiqueVerified(boutique);
                const featured = isBoutiqueFeatured(boutique);
                const active = isBoutiqueActive(boutique);
                const verifyEnabled = canToggleVerify(boutique);

                return (
                  <tr key={boutique.id} className="align-middle">
                    <td>
                      {boutique.image ? (
                        <img
                          src={boutique.image}
                          alt={boutique.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-600">
                          N/A
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{boutique.name}</span>
                        {verified ? (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-blue-600" aria-label="Verified" />
                        ) : null}
                        {featured ? (
                          <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />
                        ) : null}
                      </div>
                    </td>
                    <td>{boutique.location ?? "Unknown"}</td>
                    <td>
                      {typeof boutique.rating === "number" ? boutique.rating.toFixed(1) : "N/A"}
                    </td>
                    <td>
                      <VerificationStatusChip status={boutique.verification_status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewId(boutique.id)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(boutique)}
                        >
                          Delete
                        </Button>
                        <ActionButtonWithTooltip
                          variant="ghost"
                          disabled={!verifyEnabled || patchMutation.isPending}
                          title={
                            verifyEnabled
                              ? undefined
                              : "Complete document review in Jeweller Approvals first"
                          }
                          onClick={() => void handleVerifyToggle(boutique)}
                        >
                          {verified ? "Unverify" : "Verify"}
                        </ActionButtonWithTooltip>
                        <ActionButtonWithTooltip
                          disabled={!verified || patchMutation.isPending}
                          title={verified ? undefined : "Verify boutique before featuring"}
                          onClick={() => void handleFeatureToggle(boutique)}
                          className={featured ? "bg-amber-50 text-amber-800 hover:bg-amber-100" : undefined}
                        >
                          {featured ? "Unfeature" : "Feature"}
                        </ActionButtonWithTooltip>
                        <ActionButtonWithTooltip
                          variant="outline"
                          disabled={patchMutation.isPending}
                          onClick={() => void handleSuspendToggle(boutique)}
                        >
                          {active ? "Suspend" : "Reinstate"}
                        </ActionButtonWithTooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {viewId ? <BoutiqueViewModal boutiqueId={viewId} onClose={() => setViewId(null)} /> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <Card className="w-full max-w-md space-y-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900">Delete boutique?</h3>
            <p className="text-sm text-slate-600">
              This will soft-delete <span className="font-medium">{deleteTarget.name}</span>. The
              boutique will no longer appear to customers.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
