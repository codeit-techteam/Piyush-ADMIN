import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchNotificationStats,
  listAdminNotifications,
  sendNotification,
  type SendNotificationPayload,
} from "@/lib/api/services/notifications";

export function useNotificationStats() {
  return useQuery({
    queryKey: ["notification-stats"],
    queryFn: fetchNotificationStats,
    staleTime: 30_000,
    retry: 1,
    throwOnError: false,
  });
}

export function useAdminNotificationsList(limit = 30, offset = 0) {
  return useQuery({
    queryKey: ["admin-notifications-list", limit, offset],
    queryFn: () => listAdminNotifications(limit, offset),
    staleTime: 30_000,
    retry: 1,
    throwOnError: false,
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendNotificationPayload) => sendNotification(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-notifications-list"] });
    },
  });
}
