"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useStoreReview } from "@/hooks/use-store-review";
import {
  approveBoutiqueStore,
  notifyBoutiqueJeweller,
  rejectBoutiqueStore,
} from "@/lib/api/services/boutiques";
import { ROUTES } from "@/lib/constants/routes";
import {
  MIN_PRODUCTS_FOR_LAUNCH,
} from "@/lib/jeweller-documents";
import { isPendingStoreStatus } from "@/lib/boutique-approval";
import { AssetPreview } from "@/components/store-review/asset-preview";
import {
  ReviewField,
  ReviewFieldGrid,
  ReviewSection,
} from "@/components/store-review/review-field-grid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { BoutiqueProductsSection } from "@/components/boutiques/boutique-products-section";
import type { StoreApprovalStatus, StoreReviewDetails } from "@/types";

function StatusBadge({ status }: { status: StoreApprovalStatus | null }) {
  if (status === "review") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
        Pending Review
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-600">
        Onboarding
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-600">
      {status ?? "Unknown"}
    </span>
  );
}

function RejectDialog({
  store,
  onClose,
  onSuccess,
}: {
  store: StoreReviewDetails;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setIsSubmitting(true);
    try {
      await rejectBoutiqueStore(store.id);

      if (store.jeweller_user_id) {
        await notifyBoutiqueJeweller({
          jeweller_user_id: store.jeweller_user_id,
          boutique_id: store.id,
          reason: reason.trim(),
          event: "rejected",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["boutiques"] });
      await queryClient.invalidateQueries({ queryKey: ["store-review", store.id] });
      toast.success("Store rejected — jeweller notified");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject store");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 p-4">
      <Card className="w-full max-w-md space-y-4 border-slate-200">
        <h4 className="text-lg font-semibold text-slate-900">Reject Store</h4>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">{store.name}</span> — provide a reason
          that will be sent to the jeweller.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. GST certificate is not clearly readable. Please re-upload a high-quality scan."
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleReject()}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm Reject
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function StoreReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const storeId = params.id;
  const reviewQuery = useStoreReview(storeId);
  const [showReject, setShowReject] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const store = reviewQuery.data;

  const handleApprove = async () => {
    if (!store) return;
    setIsApproving(true);
    try {
      await approveBoutiqueStore(store.id);

      if (store.jeweller_user_id) {
        await notifyBoutiqueJeweller({
          jeweller_user_id: store.jeweller_user_id,
          boutique_id: store.id,
          event: "approved",
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["boutiques"] });
      await queryClient.invalidateQueries({ queryKey: ["store-review", store.id] });
      toast.success(`${store.name} approved`);
      router.push(ROUTES.boutiques);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve store");
    } finally {
      setIsApproving(false);
    }
  };

  if (reviewQuery.isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </section>
    );
  }

  if (reviewQuery.isError || !store) {
    return (
      <ErrorState
        message={reviewQuery.error?.message ?? "Store not found"}
        onRetry={() => reviewQuery.refetch()}
      />
    );
  }

  const gstDoc = store.documents.find((d) => d.type === "gst");
  const bisDoc = store.documents.find((d) => d.type === "bis");
  const otherDocs = store.documents.filter((d) => d.type !== "gst" && d.type !== "bis");
  const canReview = isPendingStoreStatus(store.store_status);
  const ownerDisplay =
    store.owner_name ??
    store.ownerProfile?.full_name ??
    "—";
  const addressDisplay =
    store.full_address ?? store.address ?? store.location ?? "—";
  const hoursDisplay =
    store.opening_hours ??
    (store.opening_time && store.closing_time
      ? `${store.opening_time} – ${store.closing_time}`
      : null);

  return (
    <section className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href={ROUTES.boutiques}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to boutiques
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{store.name}</h1>
              <p className="text-sm text-slate-600">
                {store.member_id ? `Member ID: ${store.member_id}` : `ID: ${store.id}`}
              </p>
            </div>
            <StatusBadge status={store.store_status} />
          </div>
        </div>
        {store.created_at ? (
          <p className="text-sm text-slate-500">
            Submitted {format(new Date(store.created_at), "dd MMM yyyy, h:mm a")}
          </p>
        ) : null}
      </div>

      {store.store_status === "pending" ? (
        <Card className="border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            This store is still in onboarding and has not been launched yet. It will appear for
            admin review only after the jeweller adds at least {MIN_PRODUCTS_FOR_LAUNCH} products
            and submits the store for review.
          </p>
          {store.products_count > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Products added so far: {store.products_count} / {MIN_PRODUCTS_FOR_LAUNCH}
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* Verification assets */}
      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-slate-900">Verification assets</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {store.logo_url ? (
            <AssetPreview url={store.logo_url} label="Store logo" aspect="square" />
          ) : (
            <p className="text-sm text-slate-500 md:col-span-1">No store logo uploaded.</p>
          )}
          {store.cover_image_url ? (
            <AssetPreview url={store.cover_image_url} label="Store banner / cover" />
          ) : store.banner_images[0] ? (
            <AssetPreview url={store.banner_images[0]} label="Store banner" />
          ) : (
            <p className="text-sm text-slate-500 md:col-span-1">No store banner uploaded.</p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {gstDoc?.file_url ? (
            <AssetPreview url={gstDoc.file_url} label="GST certificate" />
          ) : (
            <p className="text-sm text-slate-500">No GST document uploaded.</p>
          )}
          {bisDoc?.file_url ? (
            <AssetPreview url={bisDoc.file_url} label="BIS hallmark certificate" />
          ) : (
            <p className="text-sm text-slate-500">No BIS document uploaded.</p>
          )}
        </div>
        {otherDocs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {otherDocs.map((doc) =>
              doc.file_url ? (
                <AssetPreview key={doc.id} url={doc.file_url} label={doc.name || doc.type} />
              ) : null,
            )}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-5 p-5">
          <ReviewSection title="Store information">
            <ReviewFieldGrid>
              <ReviewField label="Store name" value={store.name} />
              <ReviewField label="Tagline" value={store.store_tagline} />
              <ReviewField label="Description" value={store.description} />
              <ReviewField
                label="Onboarding"
                value={
                  store.is_onboarding_done
                    ? "Completed"
                    : store.onboarding_step != null
                      ? `In progress (step ${store.onboarding_step})`
                      : "In progress"
                }
              />
              <ReviewField
                label="Products"
                value={`${store.products_count} (minimum ${MIN_PRODUCTS_FOR_LAUNCH} required to launch)`}
              />
            </ReviewFieldGrid>
          </ReviewSection>

          <ReviewSection title="Owner details">
            <ReviewFieldGrid>
              <ReviewField label="Owner name" value={ownerDisplay} />
              <ReviewField label="Account email" value={store.email ?? store.ownerProfile?.email} />
              <ReviewField
                label="Account phone"
                value={store.ownerProfile?.phone ?? store.contact_number}
              />
            </ReviewFieldGrid>
          </ReviewSection>

          <ReviewSection title="Contact information">
            <ReviewFieldGrid>
              <ReviewField label="Store phone" value={store.contact_number ?? store.phone_number} />
              <ReviewField label="WhatsApp" value={store.whatsapp_number ?? store.whatsapp} />
              <ReviewField label="Website" value={store.website_url} />
              <ReviewField
                label="Instagram"
                value={store.instagram_url ?? store.instagram}
              />
            </ReviewFieldGrid>
          </ReviewSection>
        </Card>

        <Card className="space-y-5 p-5">
          <ReviewSection title="Address & location">
            <ReviewFieldGrid>
              <ReviewField label="Full address" value={addressDisplay} />
              <ReviewField label="Area / city" value={store.location} />
              <ReviewField
                label="Coordinates"
                value={
                  store.latitude != null && store.longitude != null ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      {store.latitude}, {store.longitude}
                    </span>
                  ) : null
                }
              />
            </ReviewFieldGrid>
          </ReviewSection>

          <ReviewSection title="Business hours">
            <ReviewFieldGrid>
              <ReviewField label="Hours" value={hoursDisplay} />
              <ReviewField
                label="Working days"
                value={
                  store.working_days.length > 0
                    ? store.working_days.join(", ")
                    : null
                }
              />
            </ReviewFieldGrid>
          </ReviewSection>
        </Card>
      </div>

      <BoutiqueProductsSection boutiqueId={store.id} />

      {canReview ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:left-72">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Review all documents before approving. Approval activates the store on the customer app.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={() => setShowReject(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => void handleApprove()}
                disabled={isApproving}
              >
                {isApproving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve store
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showReject && store ? (
        <RejectDialog
          store={store}
          onClose={() => setShowReject(false)}
          onSuccess={() => {
            setShowReject(false);
            router.push(ROUTES.boutiques);
          }}
        />
      ) : null}
    </section>
  );
}
