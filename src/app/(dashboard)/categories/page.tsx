"use client";

import { CmsSectionManager } from "@/components/cms/cms-section-manager-lazy";
import type { CategoryRow } from "@/lib/api/services/cms";

export default function CategoriesPage() {
  return (
    <CmsSectionManager<CategoryRow>
      section="categories"
      title="Categories"
      description="Bangles, Rings, Necklaces and every other category surfaced on the Collections screen and category chips."
      imageFolder="categories"
      formFields={[
        { key: "name", label: "Name", placeholder: "Rings, Necklaces, Bangles…" },
        { key: "slug", label: "Slug", helper: "Auto-generated when blank" },
        { key: "subtitle", label: "Subtitle", placeholder: "Optional tagline" },
        { key: "description", label: "Description", type: "textarea" },
        {
          key: "image",
          label: "Category image",
          type: "image",
          imageFolder: "categories",
          helper:
            "Square hero for Collections and Home. Shown on the app when no custom upload is set.",
        },
      ]}
      listColumns={[
        {
          key: "image",
          header: "Preview",
          render: (row) => {
            const src = row.image ?? row.category_image_url;
            return src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={row.name}
                className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-500">
                No image
              </div>
            );
          },
        },
        { key: "name", header: "Name" },
        { key: "subtitle", header: "Subtitle" },
      ]}
      rowTitle={(row) => row.name}
    />
  );
}
