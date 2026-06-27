"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Package, Search, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceRangeSlider } from "@/components/products/price-range-slider";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useBoutiques } from "@/hooks/use-boutiques";
import { activeBoutiques, isApprovedStoreStatus } from "@/lib/boutique-approval";
import { ROUTES } from "@/lib/constants/routes";
import type { Product } from "@/types";

const PAGE_SIZE = 20;
const PRICE_FILTER_DEBOUNCE_MS = 500;

type SortOption = "recent" | "oldest" | "name" | "price-asc" | "price-desc";

function resolveProductImage(product: Product): string | null {
  const fromRelation =
    product.product_images?.find((img) => img.is_primary)?.image_url ??
    product.product_images?.[0]?.image_url ??
    null;

  const candidates = [
    product.thumbnail_image,
    product.primary_image,
    product.image,
    fromRelation,
    product.images?.[0],
    product.gallery_images?.[0],
  ];

  return candidates.find((url) => typeof url === "string" && url.trim().length > 0) ?? null;
}

function formatPrice(price: number) {
  return `INR ${Number(price ?? 0).toLocaleString("en-IN")}`;
}

function formatInrAmount(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function roundPriceBound(value: number, mode: "floor" | "ceil") {
  if (value <= 0) return 0;
  if (value <= 10_000) {
    return mode === "floor" ? Math.floor(value / 100) * 100 : Math.ceil(value / 100) * 100;
  }
  return mode === "floor" ? Math.floor(value / 1000) * 1000 : Math.ceil(value / 1000) * 1000;
}

function computePriceBounds(products: Product[]) {
  const prices = products
    .map((product) => Number(product.price ?? 0))
    .filter((price) => Number.isFinite(price) && price >= 0);

  if (prices.length === 0) {
    return { min: 0, max: 100_000 };
  }

  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const min = roundPriceBound(rawMin, "floor");
  const max = Math.max(min + 100, roundPriceBound(rawMax, "ceil"));

  return { min, max };
}

export default function ProductsPage() {
  const router = useRouter();
  const { data, isLoading, isError, error } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: boutiques = [] } = useBoutiques();

  const [search, setSearch] = useState("");
  const [boutiqueFilter, setBoutiqueFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);

  const products = data ?? [];

  const priceBounds = useMemo(() => computePriceBounds(products), [products]);

  const [sliderRange, setSliderRange] = useState<[number, number]>(() => [
    priceBounds.min,
    priceBounds.max,
  ]);
  const [debouncedRange, setDebouncedRange] = useState<[number, number]>(sliderRange);

  useEffect(() => {
    setSliderRange([priceBounds.min, priceBounds.max]);
    setDebouncedRange([priceBounds.min, priceBounds.max]);
  }, [priceBounds.min, priceBounds.max]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedRange(sliderRange);
    }, PRICE_FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [sliderRange]);

  const hasPriceFilter =
    debouncedRange[0] > priceBounds.min || debouncedRange[1] < priceBounds.max;
  const minPrice = hasPriceFilter ? debouncedRange[0] : undefined;
  const maxPrice = hasPriceFilter ? debouncedRange[1] : undefined;

  const hasActiveFilters = Boolean(search || boutiqueFilter || categoryFilter || hasPriceFilter);

  const clearPriceFilter = () => {
    setSliderRange([priceBounds.min, priceBounds.max]);
    setDebouncedRange([priceBounds.min, priceBounds.max]);
  };

  const approvedBoutiques = useMemo(
    () =>
      activeBoutiques(boutiques)
        .filter((b) => isApprovedStoreStatus(b.store_status))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [boutiques],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    let rows = products.filter((product) => {
      if (query && !product.name.toLowerCase().includes(query)) {
        return false;
      }
      if (boutiqueFilter && product.boutique_id !== boutiqueFilter && product.primary_boutique_id !== boutiqueFilter) {
        return false;
      }
      if (categoryFilter && product.category_id !== categoryFilter) {
        return false;
      }
      const price = Number(product.price ?? 0);
      if (minPrice != null && price < minPrice) {
        return false;
      }
      if (maxPrice != null && price > maxPrice) {
        return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "price-asc") {
        return Number(a.price ?? 0) - Number(b.price ?? 0);
      }

      if (sortBy === "price-desc") {
        return Number(b.price ?? 0) - Number(a.price ?? 0);
      }

      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();

      if (sortBy === "oldest") {
        return aTime - bTime;
      }

      return bTime - aTime;
    });

    return rows;
  }, [products, search, boutiqueFilter, categoryFilter, minPrice, maxPrice, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, boutiqueFilter, categoryFilter, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const rangeStart = filteredProducts.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredProducts.length);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Products</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isLoading
            ? "Loading products…"
            : `${products.length} total products${filteredProducts.length !== products.length ? ` · ${filteredProducts.length} shown` : ""}`}
        </p>
      </div>

      {isLoading ? <DashboardSkeleton /> : null}

      {isError ? <ErrorState message={error.message} /> : null}

      {!isLoading && !isError ? (
        <>
          <Card className="space-y-4 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                className="pl-9"
                placeholder="Search by product name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                value={boutiqueFilter}
                onChange={(e) => setBoutiqueFilter(e.target.value)}
              >
                <option value="">All boutiques</option>
                {approvedBoutiques.map((boutique) => (
                  <option key={boutique.id} value={boutique.id}>
                    {boutique.name}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="recent">Recently added</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name (A–Z)</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Price Range (₹)</p>
                <p className="text-sm text-slate-600">
                  {formatInrAmount(sliderRange[0])} – {formatInrAmount(sliderRange[1])}
                </p>
              </div>

              <PriceRangeSlider
                min={priceBounds.min}
                max={priceBounds.max}
                value={sliderRange}
                onChange={setSliderRange}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  {formatInrAmount(priceBounds.min)} – {formatInrAmount(priceBounds.max)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={clearPriceFilter}
                  disabled={!hasPriceFilter}
                >
                  Clear
                </Button>
              </div>
            </div>

            {hasPriceFilter ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {formatInrAmount(debouncedRange[0])} – {formatInrAmount(debouncedRange[1])}
                  <button
                    type="button"
                    onClick={clearPriceFilter}
                    className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                    aria-label="Clear price filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            ) : null}
          </Card>

          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-base font-medium text-slate-800">No products found</p>
              <p className="mt-2 text-sm text-slate-600">
                {hasActiveFilters
                  ? "Try clearing filters or search."
                  : "Products will appear here when boutiques add them."}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <Card className="overflow-x-auto p-0">
                <table className="admin-table min-w-[880px]">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700">Product</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Category</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Boutique</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => {
                      const imageUrl = resolveProductImage(product);

                      return (
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
                          className="cursor-pointer border-b border-slate-200/80 align-middle transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imageUrl}
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
                          <td className="px-4 py-3 text-slate-700">
                            {product.category_name ?? product.category ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {product.boutique_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatPrice(product.price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Showing {rangeStart}–{rangeEnd} of {filteredProducts.length}
                  {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
