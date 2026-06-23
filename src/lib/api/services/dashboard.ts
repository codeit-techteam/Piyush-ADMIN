import { api } from "@/lib/api";
import type { ApiResponse, DashboardStats } from "@/types";

export async function getDashboardStats() {
  const { data } = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
  return data.data;
}
