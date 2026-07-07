"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createNotificationRule,
  fetchNotificationPreview,
  fetchNotificationRules,
  sendNotificationRule,
  updateNotificationRule,
  type ListNotificationRulesParams,
  type NotificationRuleUpsertPayload,
  type SendNotificationRulePayload,
  type TargetAudienceConfig,
} from "@/lib/api/services/notification-rules";

const RULES_LIST_KEY = "notification-rules-list";

export function useNotificationRules(params: ListNotificationRulesParams) {
  return useQuery({
    queryKey: [RULES_LIST_KEY, params.limit, params.offset, params.type, params.enabled],
    queryFn: () => fetchNotificationRules(params),
    staleTime: 30_000,
    retry: 1,
    placeholderData: (previous) => previous,
  });
}

export function useCreateNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationRuleUpsertPayload) => createNotificationRule(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RULES_LIST_KEY] });
    },
  });
}

export function useUpdateNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NotificationRuleUpsertPayload> }) =>
      updateNotificationRule(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RULES_LIST_KEY] });
    },
  });
}

export function useNotificationPreview() {
  return useMutation({
    mutationFn: (params: { ruleId: string; variables?: Record<string, string>; targetAudience?: TargetAudienceConfig }) =>
      fetchNotificationPreview(params),
  });
}

export function useSendNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendNotificationRulePayload) => sendNotificationRule(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [RULES_LIST_KEY] });
    },
  });
}
