"use client";

import { CmsSectionManager } from "@/components/cms/cms-section-manager-lazy";
import type { OccasionRow } from "@/lib/api/services/cms";

export default function OccasionsPage() {
  return (
    <CmsSectionManager<OccasionRow>
      section="occasions"
      title="Shop by Occasion"
      description="Manage the occasion cards that appear on the home screen. Drag rows to change the display order on the app."
      imageFolder="occasions"
      formFields={[
        {
          key: "title",
          label: "Title",
          placeholder: "Wedding, Engagement, Anniversary, Daily Wear…",
        },
        {
          key: "subtitle",
          label: "Subtitle / Tagline",
          placeholder: "Optional tagline shown below the title",
        },
        { key: "image", label: "Card image", type: "image", imageFolder: "occasions" },
        {
          key: "collection_slug",
          label: "Linked collection slug",
          helper: "Optional — taps this occasion will deep-link to the matching collection",
        },
        { key: "description", label: "Description", type: "textarea" },
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
        { key: "subtitle", header: "Subtitle" },
      ]}
    />
  );
}
