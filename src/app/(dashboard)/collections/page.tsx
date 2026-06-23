"use client";

import { CmsSectionManager } from "@/components/cms/cms-section-manager-lazy";
import type { CollectionRow } from "@/lib/api/services/cms";

export default function CollectionsPage() {
  return (
    <CmsSectionManager<CollectionRow>
      section="collections"
      title="Collections"
      description="Curate the trending and featured collections that appear across the app — Everyday Elegance, Wedding Collection, Heritage Bridal, and more."
      imageFolder="collections"
      formFields={[
        { key: "title", label: "Collection title", placeholder: "Wedding Collection" },
        { key: "slug", label: "Slug", helper: "Used in deep links and URLs" },
        { key: "subtitle", label: "Subtitle", placeholder: "Short hook (optional)" },
        {
          key: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Description shown on the collection screen",
        },
        { key: "image", label: "Square card image", type: "image", imageFolder: "collections" },
        {
          key: "banner_image",
          label: "Banner image",
          type: "banner",
          imageFolder: "collections",
          helper: "Wide hero banner used inside the collection detail screen",
        },
        {
          key: "is_trending",
          label: "Show in “Trending Collections”",
          type: "boolean",
        },
        {
          key: "is_featured",
          label: "Show in featured carousels",
          type: "boolean",
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
        {
          key: "is_trending",
          header: "Trending",
          render: (row) => (row.is_trending ? "Yes" : "—"),
        },
        {
          key: "is_featured",
          header: "Featured",
          render: (row) => (row.is_featured ? "Yes" : "—"),
        },
      ]}
    />
  );
}
