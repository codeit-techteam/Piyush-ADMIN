import { api } from "@/lib/api";
import type { ApiResponse, MarketplaceUser } from "@/types";

export async function listUsers() {
  const { data } = await api.get<ApiResponse<MarketplaceUser[]>>("/users");
  return data.data;
}
