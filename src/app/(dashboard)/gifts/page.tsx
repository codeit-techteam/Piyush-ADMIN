"use client";

import { CmsSectionManager } from "@/components/cms/cms-section-manager-lazy";
import type { GiftCollectionRow } from "@/lib/api/services/cms";

export default function GiftsPage() {
  return (
    <CmsSectionManager<GiftCollectionRow>
      section="gifts"
      title="Gift Collections"
      description="Curated gift collections that show up under the Gifts section. Add a title, image, and the products that belong inside each one."
      imageFolder="gifts"
      formFields={[
        { key: "title", label: "Title", placeholder: "Gifts under ₹5,000" },
        { key: "slug", label: "Slug" },
        { key: "subtitle", label: "Subtitle" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "image", label: "Card image", type: "image", imageFolder: "gifts" },
        {
          key: "banner_image",
          label: "Banner image",
          type: "banner",
          imageFolder: "gifts",
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
      ]}
    />
  );
}
