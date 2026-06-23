"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AssetPreview } from "@/components/store-review/asset-preview";
import {
  ReviewField,
  ReviewFieldGrid,
  ReviewSection,
} from "@/components/store-review/review-field-grid";
import { VerificationStatusChip } from "@/components/boutiques/verification-status-chip";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { useBoutiqueDetails } from "@/hooks/use-boutique-details";

export default function BoutiqueReadOnlyPage() {
  const params = useParams<{ id: string }>();
  const detailsQuery = useBoutiqueDetails(params.id);
  const boutique = detailsQuery.data;

  if (detailsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading boutique…
      </div>
    );
  }

  if (detailsQuery.isError || !boutique) {
    return (
      <ErrorState
        message={detailsQuery.error?.message ?? "Boutique not found"}
        onRetry={() => detailsQuery.refetch()}
      />
    );
  }

  return (
    <section className="space-y-6">
      <Link
        href="/boutiques"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to boutiques
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{boutique.name}</h1>
        <VerificationStatusChip status={boutique.verification_status} />
      </div>

      <p className="text-sm text-slate-600">
        Read-only view. Use the boutiques list to verify, feature, or suspend this store.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {boutique.image ? <AssetPreview url={boutique.image} label="Cover image" /> : null}
        {boutique.logo_url ? (
          <AssetPreview url={boutique.logo_url} label="Logo" aspect="square" />
        ) : null}
      </div>

      <Card className="space-y-5 p-5">
        <ReviewSection title="Store information">
          <ReviewFieldGrid>
            <ReviewField label="Name" value={boutique.name} />
            <ReviewField label="Location" value={boutique.location} />
            <ReviewField label="Address" value={boutique.full_address ?? boutique.address} />
            <ReviewField label="Description" value={boutique.description} />
          </ReviewFieldGrid>
        </ReviewSection>

        <ReviewSection title="Contact">
          <ReviewFieldGrid>
            <ReviewField
              label="Phone"
              value={boutique.phone_number ?? boutique.contact_number ?? boutique.phone}
            />
            <ReviewField label="WhatsApp" value={boutique.whatsapp_number ?? boutique.whatsapp} />
            <ReviewField label="Instagram" value={boutique.instagram_url ?? boutique.instagram} />
            <ReviewField label="Website" value={boutique.website_url} />
          </ReviewFieldGrid>
        </ReviewSection>
      </Card>
    </section>
  );
}
