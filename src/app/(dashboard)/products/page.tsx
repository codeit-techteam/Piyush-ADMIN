"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/tables/data-table";
import { ErrorState } from "@/components/feedback/error-state";
import { useProducts } from "@/hooks/use-products";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  status: string;
  price: string;
  owner: string;
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
        status: product.status,
        price: `INR ${Number(product.price ?? 0).toLocaleString("en-IN")}`,
        owner: product.owner_jeweller_id ? "Jeweller" : "Platform",
      })),
    [data],
  );

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Products Oversight</h1>
            <p className="text-sm text-slate-600">
              View jeweller-owned product data. Use detail view for Flag / Suspend / Correction.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push(ROUTES.productActivity)} variant="outline">
              Activity Feed
            </Button>
            <Button onClick={() => router.push(ROUTES.newProduct)} variant="outline">
              Add Platform Product
            </Button>
          </div>
        </div>
        {isLoading ? <DashboardSkeleton /> : null}
        {isError ? (
          <ErrorState message={error.message} />
        ) : (
          <DataTable
            columns={[
              { key: "name", header: "Name" },
              { key: "category", header: "Category" },
              { key: "status", header: "Status", asStatus: true },
              { key: "price", header: "Price" },
              { key: "owner", header: "Owner" },
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
