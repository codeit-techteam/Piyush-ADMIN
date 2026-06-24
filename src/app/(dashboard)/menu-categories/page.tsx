"use client";

import { CmsSectionManager } from "@/components/cms/cms-section-manager-lazy";
import type { MenuCategoryRow } from "@/lib/api/services/cms";

export default function MenuCategoriesPage() {
  return (
    <CmsSectionManager<MenuCategoryRow>
      section="menu"
      title="Hamburger Menu — Shop For"
      description="Controls every row inside the side menu: Women, Men, Kids, Offers, Gifts, etc. Drag rows to reorder them."
      imageFolder="menu"
      formFields={[
        { key: "title", label: "Title", placeholder: "Women, Men, Kids & Infants…" },
        { key: "slug", label: "Slug" },
        { key: "subtitle", label: "Subtitle", placeholder: "Optional secondary label" },
        { key: "icon", label: "Icon (lucide name)", placeholder: "e.g. shopping-bag" },
        {
          key: "image",
          label: "Image",
          type: "image",
          imageFolder: "menu",
          helper: "Used when the menu row shows a thumbnail",
        },
        {
          key: "badge",
          label: "Badge text",
          placeholder: "e.g. New, Hot, Bestsellers",
        },
        {
          key: "collection_slug",
          label: "Linked collection slug",
          helper: "Tapping this menu row opens the matching collection",
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
        { key: "badge", header: "Badge" },
        { key: "collection_slug", header: "Linked slug" },
      ]}
    />
  );
}
