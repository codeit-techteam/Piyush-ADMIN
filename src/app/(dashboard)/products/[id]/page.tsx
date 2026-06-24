"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  ReviewField,
  ReviewFieldGrid,
  ReviewSection,
} from "@/components/store-review/review-field-grid";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { setProductCustomerVisibility } from "@/lib/api/services/products";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { useProduct } from "@/hooks/use-products";
import type { Product, ProductPriceBreakupWrite } from "@/types";

function isProductVisible(status: Product["status"]) {
  return String(status).toLowerCase() === "active";
}

function formatPrice(price: number) {
  return `INR ${Number(price ?? 0).toLocaleString("en-IN")}`;
}

function formatBreakupValue(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return formatPrice(Number(value));
}

const PRICE_BREAKUP_ROWS: Array<{ key: keyof ProductPriceBreakupWrite; label: string }> = [
  { key: "gold", label: "Gold" },
  { key: "gemstone", label: "Gemstone" },
  { key: "makingCharge", label: "Making charge" },
  { key: "gst", label: "GST" },
  { key: "total", label: "Total" },
];

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();
  const { data: product, isLoading, isError, error } = useProduct(productId ?? "");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const gallery = useMemo(() => {
    if (!product) return [];
    const relation = product.product_images?.map((item) => item.image_url) ?? [];
    const merged = [...relation, ...product.images, product.image ?? ""].filter(Boolean);
    return [...new Set(merged)];
  }, [product]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id]);

  const selectedImage = gallery[selectedImageIndex] ?? gallery[0];
  const isTrending = Boolean(product?.is_trending ?? product?.trending);
  const categoryLabel = product?.category_name ?? product?.category ?? "Uncategorized";
  const boutiqueLabel = product?.boutique_name ?? "Unknown boutique";
  const breakup = product?.price_breakup;
  const hasBreakup = breakup && PRICE_BREAKUP_ROWS.some(({ key }) => breakup[key] != null);

  const onToggleVisibility = async () => {
    if (!product) return;
    const visible = isProductVisible(product.status);
    const confirmed = window.confirm(
      visible
        ? `Make "${product.name}" inactive? It will be hidden from the customer app.`
        : `Make "${product.name}" active? It will be visible in the customer app.`,
    );
    if (!confirmed) return;

    setIsUpdatingVisibility(true);
    try {
      await setProductCustomerVisibility(product.id, product, !visible);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["products", product.id] });
      toast.success(
        visible
          ? "Product is now inactive in the customer app"
          : "Product is now active in the customer app",
      );
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error ? toggleError.message : "Unable to update product visibility",
      );
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return <ErrorState message={error.message} />;
  }

  if (!product) {
    return <ErrorState message="Product not found" />;
  }

  return (
    <section className="space-y-6 pb-8">
      <div className="space-y-3">
        <Link
          href={ROUTES.products}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">
                {product.name || "Untitled Product"}
              </h1>
              <StatusBadge status={product.status} />
              {isTrending ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  <Sparkles className="h-3 w-3" />
                  Trending
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-600">
              {boutiqueLabel} · {categoryLabel}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Button
              variant="outline"
              disabled={isUpdatingVisibility}
              onClick={() => void onToggleVisibility()}
            >
              {isUpdatingVisibility ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isProductVisible(product.status) ? (
                <EyeOff className="mr-2 h-4 w-4" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {isProductVisible(product.status) ? "Make inactive" : "Make active"}
            </Button>
            <p className="text-xs text-slate-500">
              Inactive products are hidden from the customer app.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card className="space-y-4 p-4">
          {selectedImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase/CDN URLs */}
              <img
                alt={product.name}
                className="aspect-square w-full rounded-lg border border-slate-200 object-cover"
                src={selectedImage}
              />
              {gallery.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                        index === selectedImageIndex
                          ? "border-blue-600"
                          : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="h-16 w-16 object-cover"
                        src={url}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">No images uploaded yet.</p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-1 p-5">
            <p className="text-sm font-medium text-slate-500">Price</p>
            <p className="text-2xl font-semibold text-slate-900">{formatPrice(product.price)}</p>
            {product.discount_percentage != null && product.discount_percentage > 0 ? (
              <p className="text-sm text-emerald-600">
                {product.discount_percentage}% discount applied
              </p>
            ) : null}
          </Card>

          <Card className="space-y-5 p-5">
            <ReviewSection title="Details">
              <ReviewFieldGrid>
                <ReviewField label="Category" value={categoryLabel} />
                <ReviewField label="Boutique" value={boutiqueLabel} />
                <ReviewField
                  label="Created"
                  value={format(new Date(product.createdAt), "dd MMM yyyy, h:mm a")}
                />
                <ReviewField
                  label="Updated"
                  value={
                    product.updatedAt
                      ? format(new Date(product.updatedAt), "dd MMM yyyy, h:mm a")
                      : "Not available"
                  }
                />
                {product.rating != null ? (
                  <ReviewField label="Rating" value={String(product.rating)} />
                ) : null}
                {product.reviews_count != null ? (
                  <ReviewField label="Reviews" value={String(product.reviews_count)} />
                ) : null}
              </ReviewFieldGrid>
            </ReviewSection>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-slate-900">
              {product.description?.trim() || "No description provided."}
            </p>
          </Card>

          <Card className="space-y-5 p-5">
            <ReviewSection title="Additional details">
              <ReviewFieldGrid>
                <ReviewField label="Gender" value={product.gender} />
                <ReviewField label="Occasion" value={product.occasion} />
                <ReviewField label="Style" value={product.style} />
                <ReviewField label="Collection" value={product.collection_name} />
                <ReviewField label="Metal" value={product.specifications?.metal} />
                <ReviewField label="Approx. weight" value={product.specifications?.approxWeight} />
                <ReviewField label="Diamond carat" value={product.specifications?.diamondCarat} />
                <ReviewField label="Dimensions" value={product.specifications?.dimensions} />
                <ReviewField
                  label="Available sizes"
                  value={
                    product.available_sizes?.length
                      ? product.available_sizes.join(", ")
                      : null
                  }
                />
                <ReviewField
                  label="Available metals"
                  value={
                    product.available_metals?.length
                      ? product.available_metals.join(", ")
                      : null
                  }
                />
              </ReviewFieldGrid>
            </ReviewSection>
          </Card>

          {hasBreakup ? (
            <Card className="space-y-4 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Price breakup
              </h2>
              <dl className="divide-y divide-slate-100">
                {PRICE_BREAKUP_ROWS.map(({ key, label }) =>
                  breakup?.[key] != null ? (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                    >
                      <dt className="text-slate-600">{label}</dt>
                      <dd className="font-medium text-slate-900">{formatBreakupValue(breakup[key])}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </Card>
          ) : null}
        </div>
      </div>
    </section>
  );
}
