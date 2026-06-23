import { api } from "@/lib/api";
import type {
  AdminSupportConversation,
  AdminSupportConversationDetail,
  AdminSupportMessage,
  ApiResponse,
  SupportAgent,
  SupportConversationStatus,
  SupportDashboardStats,
} from "@/types";

export async function fetchSupportDashboardStats() {
  const { data } = await api.get<ApiResponse<SupportDashboardStats>>("/support/admin/stats");
  return data.data;
}

export async function listSupportConversationsAdmin(status?: SupportConversationStatus | "all") {
  const params: Record<string, string> = {};
  if (status && status !== "all") params.status = status;
  const { data } = await api.get<ApiResponse<AdminSupportConversation[]>>(
    "/support/admin/conversations",
    { params },
  );
  return data.data ?? [];
}

export async function getSupportConversationAdmin(conversationId: string) {
  const { data } = await api.get<ApiResponse<AdminSupportConversationDetail>>(
    `/support/admin/conversations/${encodeURIComponent(conversationId)}`,
  );
  return data.data;
}

export async function sendSupportAgentMessage(
  conversationId: string,
  payload: { message: string; agentId?: string | null },
) {
  const { data } = await api.post<ApiResponse<AdminSupportMessage>>(
    `/support/admin/conversations/${encodeURIComponent(conversationId)}/messages`,
    payload,
  );
  return data.data;
}

export async function patchSupportConversationAdmin(
  conversationId: string,
  patch: {
    status?: SupportConversationStatus;
    assignedAgentId?: string | null;
    internalNotes?: string;
  },
) {
  const { data } = await api.patch<ApiResponse<AdminSupportConversation>>(
    `/support/admin/conversations/${encodeURIComponent(conversationId)}`,
    patch,
  );
  return data.data;
}

export async function markSupportConversationReadAdmin(conversationId: string) {
  await api.post(`/support/admin/conversations/${encodeURIComponent(conversationId)}/read`, {});
}

export async function setAgentTypingAdmin(conversationId: string, isTyping: boolean, agentId?: string) {
  await api.post(`/support/admin/conversations/${encodeURIComponent(conversationId)}/typing`, {
    isTyping,
    agentId,
  });
}

export async function listSupportAgentsAdmin() {
  const { data } = await api.get<ApiResponse<SupportAgent[]>>("/support/admin/agents");
  return data.data ?? [];
}
