"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";
import { ProductCurationForm } from "@/components/products/product-curation-form";
import { ProductOversightActions } from "@/components/products/product-oversight-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProductGovernance } from "@/lib/api/services/product-governance";
import { deleteProduct } from "@/lib/api/services/products";
import { useProduct } from "@/hooks/use-products";
import type { ProductGovernanceState } from "@/lib/api/services/product-governance";

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();
  const { data: product, isLoading, isError, error } = useProduct(productId ?? "");

  const governanceQuery = useQuery({
    queryKey: ["product-governance", productId],
    queryFn: () => getProductGovernance(productId ?? ""),
    enabled: Boolean(productId),
  });

  const gallery = useMemo(() => {
    if (!product) return [];
    const relation = product.product_images?.map((item) => item.image_url) ?? [];
    const merged = [...relation, ...product.images, product.image ?? ""].filter(Boolean);
    return [...new Set(merged)];
  }, [product]);

  const governance = governanceQuery.data?.governance as ProductGovernanceState | undefined;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["products", productId] });
    await queryClient.invalidateQueries({ queryKey: ["product-governance", productId] });
  };

  const onDelete = async () => {
    if (!product) return;
    const confirmed = window.confirm(`Delete product "${product.name}"?`);
    if (!confirmed) return;

    try {
      await deleteProduct(product.id);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
      router.push("/products");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Unable to delete product");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">Product Oversight</h1>
          <StatusBadge status={product.status} />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/products")} variant="outline">
            Back
          </Button>
          <Button onClick={onDelete} variant="destructive">
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Product Data (Read-only)</h2>
          <p className="text-sm text-slate-600">
            Jeweller-owned fields are displayed for oversight only. Admin cannot edit price,
            description, title, or images.
          </p>
          {gallery.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {gallery.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase/CDN URLs
                <img
                  key={url}
                  alt={product.name}
                  className="h-36 w-full rounded-md border border-slate-200 object-cover"
                  src={url}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No images uploaded yet.</p>
          )}
          <dl className="grid gap-3 text-sm">
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Name</dt>
              <dd className="text-slate-900">{product.name || "Untitled Product"}</dd>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Description</dt>
              <dd className="text-slate-900">{product.description || "No description provided"}</dd>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Category</dt>
              <dd className="text-slate-900">
                {product.category_name ?? product.category ?? "Uncategorized"}
              </dd>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Boutique</dt>
              <dd className="text-slate-900">{product.boutique_name ?? "Unknown boutique"}</dd>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Price</dt>
              <dd className="text-lg font-semibold text-slate-900">
                INR {Number(product.price ?? 0).toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Owner Jeweller ID</dt>
              <dd className="text-slate-900">{product.owner_jeweller_id ?? "Platform-managed"}</dd>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Trending</dt>
              <dd className="text-slate-900">{product.is_trending ? "Yes" : "No"}</dd>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Created</dt>
              <dd className="text-slate-900">
                {format(new Date(product.createdAt), "dd MMM yyyy, hh:mm a")}
              </dd>
            </div>
            <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium text-slate-500">Updated</dt>
              <dd className="text-slate-900">
                {product.updatedAt
                  ? format(new Date(product.updatedAt), "dd MMM yyyy, hh:mm a")
                  : "Not available"}
              </dd>
            </div>
            {product.last_admin_action_at ? (
              <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
                <dt className="font-medium text-slate-500">Last admin action</dt>
                <dd className="text-slate-900">
                  {format(new Date(product.last_admin_action_at), "dd MMM yyyy, hh:mm a")}
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 p-4">
            <h2 className="text-lg font-semibold text-slate-900">Admin Oversight Actions</h2>
            <ProductOversightActions
              governance={governance}
              onChanged={refresh}
              productId={product.id}
              productStatus={product.status}
            />
          </Card>

          <Card className="space-y-4 p-4">
            <h2 className="text-lg font-semibold text-slate-900">Platform Curation</h2>
            <ProductCurationForm onSaved={refresh} product={product} />
          </Card>
        </div>
      </div>
    </div>
  );
}
