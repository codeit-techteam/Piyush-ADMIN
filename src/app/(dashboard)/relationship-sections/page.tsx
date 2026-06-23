"use client";

import { CmsSectionManager } from "@/components/cms/cms-section-manager-lazy";
import type { RelationshipRow } from "@/lib/api/services/cms";

export default function RelationshipSectionsPage() {
  return (
    <CmsSectionManager<RelationshipRow>
      section="relationship"
      title="Shop by relationship"
      description="Vertical cards on Discover. If products are linked, tapping opens a listing of only those products. Otherwise the optional collection slug opens that marketing collection."
      imageFolder="relationships"
      formFields={[
        { key: "title", label: "Title", placeholder: "For Her" },
        { key: "slug", label: "Slug", helper: "Unique id for admin sync (e.g. for-her)." },
        { key: "subtitle", label: "Subtitle", placeholder: "CURATED ELEGANCE" },
        {
          key: "collection_slug",
          label: "Collection slug (fallback)",
          placeholder: "women",
          helper: "Used when no products are attached. Must match a collection slug.",
        },
        {
          key: "image",
          label: "Banner image",
          type: "banner",
          imageFolder: "relationships",
        },
      ]}
      listColumns={[
        { key: "title", header: "Title" },
        { key: "subtitle", header: "Subtitle" },
        { key: "collection_slug", header: "Collection" },
      ]}
    />
  );
}
