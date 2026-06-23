"use client";

import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";

export const ProductForm = dynamic(
  () => import("@/components/forms/product-form").then((mod) => ({ default: mod.ProductForm })),
  { loading: () => <DashboardSkeleton /> },
);
