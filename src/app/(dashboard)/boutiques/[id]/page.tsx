"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { AssetPreview } from "@/components/store-review/asset-preview";
import {
  ReviewField,
  ReviewFieldGrid,
  ReviewSection,
} from "@/components/store-review/review-field-grid";
import { BoutiqueProductsSection } from "@/components/boutiques/boutique-products-section";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
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

  const addressDisplay = boutique.full_address ?? boutique.address ?? boutique.location ?? "—";
  const hoursDisplay =
    boutique.opening_hours ??
    (boutique.opening_time && boutique.closing_time
      ? `${boutique.opening_time} – ${boutique.closing_time}`
      : null);

  return (
    <section className="space-y-6 pb-8">
      <div className="space-y-2">
        <Link
          href="/boutiques"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to boutiques
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Building2 className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{boutique.name}</h1>
            <p className="text-sm text-slate-600">ID: {boutique.id}</p>
          </div>
          <StatusBadge status={boutique.store_status ?? boutique.status ?? "pending"} />
        </div>
        {boutique.created_at ? (
          <p className="text-sm text-slate-500">
            Added {format(new Date(boutique.created_at), "dd MMM yyyy, h:mm a")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {boutique.image ? <AssetPreview url={boutique.image} label="Cover image" /> : null}
        {boutique.logo_url ? (
          <AssetPreview url={boutique.logo_url} label="Logo" aspect="square" />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-5 p-5">
          <ReviewSection title="Store information">
            <ReviewFieldGrid>
              <ReviewField label="Name" value={boutique.name} />
              <ReviewField label="Location" value={boutique.location} />
              <ReviewField label="Description" value={boutique.description} />
              <ReviewField label="Rating" value={boutique.rating != null ? String(boutique.rating) : null} />
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

        <Card className="space-y-5 p-5">
          <ReviewSection title="Address & location">
            <ReviewFieldGrid>
              <ReviewField label="Full address" value={addressDisplay} />
              <ReviewField label="Area / city" value={boutique.location} />
            </ReviewFieldGrid>
          </ReviewSection>

          <ReviewSection title="Business hours">
            <ReviewFieldGrid>
              <ReviewField label="Hours" value={hoursDisplay} />
              <ReviewField
                label="Working days"
                value={
                  boutique.working_days && boutique.working_days.length > 0
                    ? boutique.working_days.join(", ")
                    : null
                }
              />
            </ReviewFieldGrid>
          </ReviewSection>
        </Card>
      </div>

      <BoutiqueProductsSection boutiqueId={boutique.id} />
    </section>
  );
}
