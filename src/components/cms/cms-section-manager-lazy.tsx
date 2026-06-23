"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";
import type { CmsSectionManagerProps } from "@/components/cms/cms-section-manager";
import type { CmsBase } from "@/lib/api/services/cms";

const DynamicCmsSectionManager = dynamic(
  () =>
    import("@/components/cms/cms-section-manager").then((mod) => ({
      default: mod.CmsSectionManager,
    })),
  { loading: () => <DashboardSkeleton /> },
);

export function CmsSectionManager<T extends CmsBase = CmsBase>(
  props: CmsSectionManagerProps<T>,
) {
  const Component = DynamicCmsSectionManager as ComponentType<CmsSectionManagerProps<T>>;
  return <Component {...props} />;
}
