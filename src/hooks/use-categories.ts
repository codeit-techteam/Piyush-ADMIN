"use client";

import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/api/services/categories";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    retry: 2,
  });
}
