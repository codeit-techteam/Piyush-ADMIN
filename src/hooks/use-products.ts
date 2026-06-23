"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductById, listProducts } from "@/lib/api/services/products";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => getProductById(id),
    enabled: Boolean(id),
    retry: 2,
  });
}
