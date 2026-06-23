"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { AssetPreview } from "@/components/store-review/asset-preview";
import {
  ReviewField,
  ReviewFieldGrid,
  ReviewSection,
} from "@/components/store-review/review-field-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBoutiqueDetails } from "@/hooks/use-boutique-details";
import { usePatchBoutiqueAdmin } from "@/hooks/use-boutique-admin-controls";
import { VerificationStatusChip } from "@/components/boutiques/verification-status-chip";
import { toast } from "sonner";

export function BoutiqueViewModal({
  boutiqueId,
  onClose,
}: {
  boutiqueId: string;
  onClose: () => void;
}) {
  const detailsQuery = useBoutiqueDetails(boutiqueId);
  const patchMutation = usePatchBoutiqueAdmin();
  const boutique = detailsQuery.data;
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (boutique?.admin_note != null) {
      setAdminNote(boutique.admin_note);
    }
  }, [boutique?.admin_note]);

  const saveAdminNote = async () => {
    if (!boutique) return;
    try {
      await patchMutation.mutateAsync({
        id: boutique.id,
        payload: { admin_note: adminNote.trim() || null },
      });
      toast.success("Admin note saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <Card className="relative my-4 w-full max-w-4xl space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {boutique?.name ?? "Boutique details"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Read-only view — boutique content is owned by the jeweller.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {detailsQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading boutique…
          </div>
        ) : detailsQuery.isError || !boutique ? (
          <p className="py-8 text-center text-sm text-red-600">
            {detailsQuery.error?.message ?? "Failed to load boutique"}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <VerificationStatusChip status={boutique.verification_status} />
              {boutique.is_verified || boutique.verified ? (
                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                  Verified badge
                </span>
              ) : null}
              {boutique.is_featured || boutique.featured ? (
                <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  Featured
                </span>
              ) : null}
              {boutique.is_active === false || boutique.status === "inactive" ? (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Suspended
                </span>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {boutique.image ? (
                <AssetPreview url={boutique.image} label="Cover image" />
              ) : null}
              {boutique.logo_url ? (
                <AssetPreview url={boutique.logo_url} label="Logo" aspect="square" />
              ) : null}
            </div>

            {(boutique.gallery_images?.length ?? boutique.banner_images?.length ?? 0) > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {(boutique.gallery_images ?? boutique.banner_images ?? []).map((url) => (
                  <AssetPreview key={url} url={url} label="Gallery" />
                ))}
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <ReviewSection title="Store information">
                <ReviewFieldGrid>
                  <ReviewField label="Name" value={boutique.name} />
                  <ReviewField label="Location" value={boutique.location} />
                  <ReviewField
                    label="Address"
                    value={boutique.full_address ?? boutique.address}
                  />
                  <ReviewField label="Description" value={boutique.description} />
                  <ReviewField
                    label="Rating"
                    value={
                      typeof boutique.rating === "number"
                        ? `${boutique.rating.toFixed(1)} (${boutique.reviews_count ?? 0} reviews)`
                        : null
                    }
                  />
                </ReviewFieldGrid>
              </ReviewSection>

              <ReviewSection title="Contact">
                <ReviewFieldGrid>
                  <ReviewField
                    label="Phone"
                    value={boutique.phone_number ?? boutique.contact_number ?? boutique.phone}
                  />
                  <ReviewField
                    label="WhatsApp"
                    value={boutique.whatsapp_number ?? boutique.whatsapp}
                  />
                  <ReviewField label="Instagram" value={boutique.instagram_url ?? boutique.instagram} />
                  <ReviewField label="Website" value={boutique.website_url} />
                  <ReviewField label="Hours" value={boutique.opening_hours} />
                  <ReviewField
                    label="Working days"
                    value={
                      boutique.working_days?.length ? boutique.working_days.join(", ") : null
                    }
                  />
                </ReviewFieldGrid>
              </ReviewSection>
            </div>

            {boutique.verification_rejected_reason ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-medium">Rejection reason</p>
                <p className="mt-1">{boutique.verification_rejected_reason}</p>
              </div>
            ) : null}

            <ReviewSection title="Admin note (internal only)">
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Private notes visible only to admins…"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void saveAdminNote()}
                  disabled={patchMutation.isPending}
                >
                  {patchMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save note
                </Button>
              </div>
            </ReviewSection>
          </>
        )}
      </Card>
    </div>
  );
}
