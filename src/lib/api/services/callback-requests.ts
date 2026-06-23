import { api } from "@/lib/api";
import type { AdminCallbackRequest, ApiResponse, CallbackRequestStatus } from "@/types";

export type CallbackListFilters = {
  status?: CallbackRequestStatus | "all";
};

export async function listCallbackRequestsAdmin(filters?: CallbackListFilters) {
  const params: Record<string, string> = {};
  if (filters?.status && filters.status !== "all") {
    params.status = filters.status;
  }

  const { data } = await api.get<ApiResponse<AdminCallbackRequest[]>>(
    "/callback-requests/admin",
    { params },
  );
  return data.data ?? [];
}

export async function assignCallbackRequestAdmin(id: string) {
  const { data } = await api.patch<ApiResponse<AdminCallbackRequest>>(
    `/callback-requests/admin/${encodeURIComponent(id)}`,
    { action: "assign" },
  );
  return data.data;
}

export async function updateCallbackRequestStatusAdmin(
  id: string,
  status: CallbackRequestStatus,
) {
  const { data } = await api.patch<ApiResponse<AdminCallbackRequest>>(
    `/callback-requests/admin/${encodeURIComponent(id)}`,
    { status },
  );
  return data.data;
}

export async function getCallbackNextStatus(current: CallbackRequestStatus) {
  const { data } = await api.get<ApiResponse<{ next: CallbackRequestStatus | null }>>(
    "/callback-requests/admin/next-status",
    { params: { current } },
  );
  return data.data?.next ?? null;
}
