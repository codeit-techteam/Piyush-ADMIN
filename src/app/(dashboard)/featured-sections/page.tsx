"use client";

import { CmsSectionManager } from "@/components/cms/cms-section-manager-lazy";
import type { FeaturedSectionRow } from "@/lib/api/services/cms";

export default function FeaturedSectionsPage() {
  return (
    <CmsSectionManager<FeaturedSectionRow>
      section="featured"
      title="Featured Sections"
      description="Trending Now, Curated For You, Recommended, etc. Each section becomes a horizontal product rail on the home screen."
      imageFolder="featured"
      formFields={[
        { key: "title", label: "Section title", placeholder: "Trending Now" },
        { key: "slug", label: "Slug" },
        { key: "subtitle", label: "Subtitle", placeholder: "Optional sub-heading" },
        { key: "description", label: "Description", type: "textarea" },
        {
          key: "layout",
          label: "Layout",
          helper: "carousel | grid | banner. Defaults to 'carousel' if blank.",
          placeholder: "carousel",
        },
        {
          key: "banner_image",
          label: "Optional banner image",
          type: "banner",
          imageFolder: "featured",
        },
      ]}
      listColumns={[
        { key: "title", header: "Title" },
        { key: "subtitle", header: "Subtitle" },
        { key: "layout", header: "Layout" },
      ]}
    />
  );
}
