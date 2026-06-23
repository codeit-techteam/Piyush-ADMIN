import { api } from "@/lib/api";
import type { ApiResponse, CategoryOption } from "@/types";

export async function listCategories() {
  const { data } = await api.get<ApiResponse<Array<{ id: string; name: string }>>>("/categories");
  return (data.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  })) satisfies CategoryOption[];
}
