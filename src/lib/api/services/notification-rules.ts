import { api } from "@/lib/api";
import type { ApiResponse } from "@/types";

export type NotificationRuleType =
  | "new_product"
  | "price_drop"
  | "new_collection"
  | "nearby_boutique"
  | "trending_product"
  | "festival_campaign"
  | "wishlist_reminder"
  | "appointment_reminder"
  | "recently_viewed_reminder"
  | "boutique_recommendation";

/** What the notification links to (its CTA destination) — only one selectable. */
export type NotificationTargetType = "none" | "product" | "collection" | "boutique" | "category" | "url";

export type NotificationStyle = "default" | "large_image" | "banner";

export type TargetAudienceMode =
  | "all"
  | "selected"
  | "city"
  | "boutique_followers"
  | "wishlist_users"
  | "category_interested"
  | "keyword_interested";

export type TargetAudienceConfig = {
  mode: TargetAudienceMode;
  selectedUserIds?: string[];
  city?: string | null;
  boutiqueId?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  keyword?: string | null;
};

export type NotificationRulePriority = "low" | "medium" | "high";

export type NotificationRuleTemplate = {
  title: string;
  message: string;
  image?: string | null;
};

export type NotificationRule = {
  id: string;
  title: string;
  description: string | null;
  type: NotificationRuleType;
  trigger: string;
  enabled: boolean;
  targetAudience: TargetAudienceConfig;
  template: NotificationRuleTemplate;
  ctaText: string | null;
  ctaLink: string | null;
  priority: NotificationRulePriority;
  /** Notification Target — what the CTA opens in the Customer App. */
  targetType: NotificationTargetType;
  targetId: string | null;
  /** Auto-generated from targetType + targetId, e.g. `/products/:id`. Read-only. */
  deepLink: string | null;
  thumbnail: string | null;
  notificationStyle: NotificationStyle;
  bannerColor: string | null;
  createdBy: string | null;
  lastSentAt: string | null;
  totalSentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type NotificationRuleListResult = {
  rows: NotificationRule[];
  total: number;
};

export type ListNotificationRulesParams = {
  limit?: number;
  offset?: number;
  type?: NotificationRuleType;
  enabled?: boolean;
};

export type NotificationRuleUpsertPayload = {
  title: string;
  description?: string | null;
  type: NotificationRuleType;
  trigger?: string;
  enabled?: boolean;
  targetAudience: TargetAudienceConfig;
  template: NotificationRuleTemplate;
  ctaText?: string | null;
  ctaLink?: string | null;
  priority?: NotificationRulePriority;
  targetType?: NotificationTargetType;
  targetId?: string | null;
  notificationStyle?: NotificationStyle;
  bannerColor?: string | null;
};

export type NotificationRulePreview = {
  ruleId: string;
  type: NotificationRuleType;
  title: string;
  message: string;
  image: string | null;
  thumbnail: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  targetType: NotificationTargetType;
  targetId: string | null;
  deepLink: string | null;
  notificationStyle: NotificationStyle;
  bannerColor: string | null;
  priority: NotificationRulePriority;
  targetAudience: TargetAudienceConfig;
  targetAudienceSummary: string;
  estimatedRecipients: number;
};

export type SendNotificationRulePayload = {
  ruleId: string;
  variables?: Record<string, string>;
  targetAudience?: TargetAudienceConfig;
};

export type SendNotificationRuleResult = {
  notification: { id: string; title: string; message: string; type: string; created_at: string };
  recipientCount: number;
  targetAudience: TargetAudienceConfig;
};

export async function fetchNotificationRules(params: ListNotificationRulesParams = {}) {
  const { data } = await api.get<ApiResponse<NotificationRuleListResult>>("/admin/notification-rules", {
    params: {
      limit: params.limit ?? 10,
      offset: params.offset ?? 0,
      type: params.type,
      enabled: params.enabled,
    },
  });
  return data.data;
}

export async function createNotificationRule(payload: NotificationRuleUpsertPayload) {
  const { data } = await api.post<ApiResponse<NotificationRule>>("/admin/notification-rules", payload);
  return data.data;
}

export async function updateNotificationRule(id: string, patch: Partial<NotificationRuleUpsertPayload>) {
  const { data } = await api.put<ApiResponse<NotificationRule>>(`/admin/notification-rules/${id}`, patch);
  return data.data;
}

export async function fetchNotificationPreview(params: {
  ruleId: string;
  variables?: Record<string, string>;
  targetAudience?: TargetAudienceConfig;
}) {
  const { data } = await api.get<ApiResponse<NotificationRulePreview>>("/admin/notification-preview", {
    params: {
      ruleId: params.ruleId,
      variables: params.variables ? JSON.stringify(params.variables) : undefined,
      targetAudience: params.targetAudience ? JSON.stringify(params.targetAudience) : undefined,
    },
  });
  return data.data;
}

export async function sendNotificationRule(payload: SendNotificationRulePayload) {
  const { data } = await api.post<ApiResponse<SendNotificationRuleResult>>("/admin/send-notification", payload);
  return data.data;
}
