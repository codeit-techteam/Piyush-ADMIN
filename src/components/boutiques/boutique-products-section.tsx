"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listBoutiqueProducts } from "@/lib/api/services/boutiques";
import { ROUTES } from "@/lib/constants/routes";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";

function formatPrice(price: number) {
  return `₹${Number(price ?? 0).toLocaleString("en-IN")}`;
}

function productDateLabel(product: { created_at?: string | null; updated_at?: string | null }) {
  const raw = product.created_at ?? product.updated_at;
  if (!raw) return "—";
  return format(new Date(raw), "dd MMM yyyy");
}

function productStatusLabel(status?: string, isDraft?: boolean) {
  if (isDraft) return "Draft";
  return status ?? "active";
}

export function BoutiqueProductsSection({ boutiqueId }: { boutiqueId: string }) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["boutique-products", boutiqueId],
    queryFn: () => listBoutiqueProducts(boutiqueId, true),
    enabled: Boolean(boutiqueId),
  });

  const products = query.data ?? [];

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Products</h2>
        </div>
        <span className="text-sm text-slate-500">{products.length} total</span>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-red-600">
          {query.error instanceof Error ? query.error.message : "Failed to load products"}
        </p>
      ) : products.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No products added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[640px]">
            <thead>
              <tr>
                <th className="px-3 py-2 font-medium text-slate-700">Product</th>
                <th className="px-3 py-2 font-medium text-slate-700">Category</th>
                <th className="px-3 py-2 font-medium text-slate-700">Price</th>
                <th className="px-3 py-2 font-medium text-slate-700">Status</th>
                <th className="px-3 py-2 font-medium text-slate-700">Date added</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(ROUTES.productDetails(product.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(ROUTES.productDetails(product.id));
                    }
                  }}
                  className="cursor-pointer border-b border-slate-200/70 align-middle transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                          <Package className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                      <span className="font-medium text-slate-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {product.category?.name ?? product.collection_name ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">{formatPrice(product.price)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={productStatusLabel(product.status, product.is_draft)} />
                  </td>
                  <td className="px-3 py-3 text-slate-600">{productDateLabel(product)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
