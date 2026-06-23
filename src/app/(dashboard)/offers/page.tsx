"use client";

import { CmsSectionManager } from "@/components/cms/cms-section-manager-lazy";
import type { OfferRow } from "@/lib/api/services/cms";

export default function OffersPage() {
  return (
    <CmsSectionManager<OfferRow>
      section="offers"
      title="Offers"
      description="Promotional offers shown across the app. Set a discount text, expiry date, and link products or collections."
      imageFolder="offers"
      formFields={[
        { key: "title", label: "Title", placeholder: "Festive Bonanza" },
        { key: "subtitle", label: "Subtitle", placeholder: "Optional tagline" },
        { key: "slug", label: "Slug" },
        {
          key: "discount_text",
          label: "Discount text",
          placeholder: "e.g. Flat 20% off, Up to ₹5,000 off",
        },
        { key: "badge", label: "Badge text", placeholder: "e.g. Hot, New" },
        { key: "cta_label", label: "CTA label", placeholder: "Shop now" },
        {
          key: "cta_target",
          label: "CTA target",
          helper: "Optional deep link target (collection slug, screen, URL)",
        },
        { key: "starts_at", label: "Starts at", type: "date" },
        { key: "expires_at", label: "Expires at", type: "date" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "image", label: "Card image", type: "image", imageFolder: "offers" },
        {
          key: "banner_image",
          label: "Banner image",
          type: "banner",
          imageFolder: "offers",
        },
      ]}
      listColumns={[
        {
          key: "image",
          header: "Image",
          render: (row) =>
            row.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.image}
                alt={row.title}
                className="h-12 w-12 rounded-md object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-slate-100" />
            ),
        },
        { key: "title", header: "Title" },
        { key: "discount_text", header: "Discount" },
        {
          key: "expires_at",
          header: "Expires",
          render: (row) =>
            row.expires_at
              ? new Date(row.expires_at).toLocaleDateString()
              : "—",
        },
      ]}
    />
  );
}
