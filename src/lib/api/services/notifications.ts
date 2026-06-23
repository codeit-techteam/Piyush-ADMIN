import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";

export type NotificationAudience = "all" | "customers" | "boutique_owners" | "selected";

export type NotificationType =
  | "offer"
  | "appointment"
  | "callback"
  | "system"
  | "gold_rate"
  | "collection"
  | "promotion"
  | "profile";

export type NotificationActionType =
  | "none"
  | "offer"
  | "appointment"
  | "collection"
  | "boutique"
  | "url";

export type SendNotificationPayload = {
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  selectedUserIds?: string[];
  imageUrl?: string | null;
  actionType?: NotificationActionType;
  actionId?: string | null;
  metadata?: Record<string, unknown>;
};

export type NotificationStats = {
  totalSent: number;
  delivered: number;
  read: number;
  unread: number;
  readRate: number;
};

export type AdminNotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  image?: string | null;
  action_type?: string;
  action_id?: string | null;
  created_at: string;
};

export type AdminNotificationDetail = AdminNotificationRow & {
  audience: string;
  totalRecipients: number;
  readCount: number;
  unreadCount: number;
  readRate: number;
  metadata?: Record<string, unknown>;
};

export type SendNotificationResult = {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
  };
  recipientCount: number;
  audience: NotificationAudience;
};

export async function fetchNotificationStats() {
  const { data } = await api.get<ApiResponse<NotificationStats>>("/notifications/stats");
  return data.data;
}

export async function sendNotification(payload: SendNotificationPayload) {
  const { data } = await api.post<ApiResponse<SendNotificationResult>>(
    "/notifications/send",
    payload,
  );
  return data.data;
}

export async function listAdminNotifications(limit = 50, offset = 0) {
  const { data } = await api.get<ApiResponse<AdminNotificationRow[]>>("/notifications/admin", {
    params: { limit, offset },
  });
  return data.data;
}

export async function fetchAdminNotificationDetail(notificationId: string) {
  const { data } = await api.get<ApiResponse<AdminNotificationDetail>>(
    `/notifications/admin/${notificationId}`,
  );
  return data.data;
}
