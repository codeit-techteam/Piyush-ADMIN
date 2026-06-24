"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/tables/data-table";
import { ErrorState } from "@/components/feedback/error-state";
import { useProducts } from "@/hooks/use-products";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";
import { ROUTES } from "@/lib/constants/routes";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  boutique: string;
  price: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const { data, isLoading, isError, error } = useProducts();

  const rows = useMemo<ProductRow[]>(
    () =>
      (data ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category_name ?? product.category,
        boutique: product.boutique_name ?? "—",
        price: `INR ${Number(product.price ?? 0).toLocaleString("en-IN")}`,
      })),
    [data],
  );

  const totalProducts = data?.length ?? 0;

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-slate-600">
            {isLoading ? "Loading products…" : `${totalProducts} total products`}
          </p>
        </div>
        {isLoading ? <DashboardSkeleton /> : null}
        {isError ? (
          <ErrorState message={error.message} />
        ) : (
          <DataTable
            columns={[
              { key: "name", header: "Name" },
              { key: "category", header: "Category" },
              { key: "boutique", header: "Boutique" },
              { key: "price", header: "Price" },
            ]}
            data={isLoading ? [] : rows}
            getRowKey={(row) => row.id}
            onRowClick={(row) => router.push(ROUTES.productDetails(row.id))}
          />
        )}
      </section>
    </div>
  );
}
