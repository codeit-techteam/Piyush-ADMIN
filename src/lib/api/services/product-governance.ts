import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";

export type FlagReasonCode =
  | "PRICE_SUSPICIOUS"
  | "IMAGE_VIOLATION"
  | "DESCRIPTION_MISLEADING"
  | "OTHER";

export type CorrectionFieldName =
  | "name"
  | "price"
  | "description"
  | "images"
  | "available_sizes"
  | "available_metals"
  | "specifications"
  | "price_breakup";

export interface ProductFlag {
  id: string;
  product_id: string;
  admin_id: string;
  reason_code: FlagReasonCode;
  reason_text: string | null;
  auto_resolve: boolean;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface ProductSuspension {
  id: string;
  product_id: string;
  admin_id: string;
  reason_text: string;
  suspended_at: string;
  reinstated_at: string | null;
  reinstated_by: string | null;
}

export interface ProductCorrectionRequest {
  id: string;
  product_id: string;
  admin_id: string;
  field_name: CorrectionFieldName;
  message: string;
  auto_resolve: boolean;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface ProductGovernanceState {
  active_flag: ProductFlag | null;
  active_suspension: ProductSuspension | null;
  open_correction_requests: ProductCorrectionRequest[];
  has_pending_correction: boolean;
}

export interface ProductActivityEvent {
  id: string;
  action_type: "edit" | "flag" | "suspend" | "correction";
  product_id: string;
  product_name: string | null;
  jeweller_id?: string;
  admin_id?: string;
  field_name?: string;
  old_value?: string | null;
  new_value?: string | null;
  reason_code?: FlagReasonCode;
  reason_text?: string | null;
  message?: string;
  resolved_at?: string | null;
  reinstated_at?: string | null;
  created_at: string;
}

export async function getProductGovernance(productId: string) {
  const { data } = await api.get<
    ApiResponse<Record<string, unknown> & { governance?: ProductGovernanceState }>
  >(`/admin/products/${productId}/governance`);
  return data.data;
}

export async function flagProduct(
  productId: string,
  payload: {
    reason_code: FlagReasonCode;
    reason_text?: string;
    auto_resolve?: boolean;
  },
) {
  const { data } = await api.post<ApiResponse<ProductFlag>>(
    `/admin/products/${productId}/flag`,
    payload,
  );
  return data.data;
}

export async function clearProductFlag(productId: string) {
  const { data } = await api.post<ApiResponse<{ cleared_flag_id: string; status: string }>>(
    `/admin/products/${productId}/clear-flag`,
  );
  return data.data;
}

export async function suspendProduct(productId: string, reasonText: string) {
  const { data } = await api.post<ApiResponse<ProductSuspension>>(
    `/admin/products/${productId}/suspend`,
    { reason_text: reasonText },
  );
  return data.data;
}

export async function reinstateProduct(productId: string) {
  const { data } = await api.post<ApiResponse<{ reinstated_suspension_id: string; status: string }>>(
    `/admin/products/${productId}/reinstate`,
  );
  return data.data;
}

export async function requestProductCorrection(
  productId: string,
  payload: {
    field_name: CorrectionFieldName;
    message: string;
    auto_resolve?: boolean;
  },
) {
  const { data } = await api.post<ApiResponse<ProductCorrectionRequest>>(
    `/admin/products/${productId}/correction-request`,
    payload,
  );
  return data.data;
}

export async function resolveCorrectionRequest(productId: string, requestId: string) {
  const { data } = await api.post<ApiResponse<{ resolved_request_id: string }>>(
    `/admin/products/${productId}/correction-requests/${requestId}/resolve`,
  );
  return data.data;
}

export async function updateProductCuration(
  productId: string,
  payload: { is_trending?: boolean; category_id?: string | null },
) {
  const { data } = await api.patch<ApiResponse<Record<string, unknown>>>(
    `/admin/products/${productId}/curation`,
    payload,
  );
  return data.data;
}

export async function getProductActivityFeed(params?: {
  jeweller_id?: string;
  action_type?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}) {
  const { data } = await api.get<ApiResponse<ProductActivityEvent[]>>(
    "/admin/product-activity",
    { params },
  );
  return data.data ?? [];
}
