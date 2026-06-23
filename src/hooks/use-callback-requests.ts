"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignCallbackRequestAdmin,
  listCallbackRequestsAdmin,
  updateCallbackRequestStatusAdmin,
  type CallbackListFilters,
} from "@/lib/api/services/callback-requests";
import type { CallbackRequestStatus } from "@/types";

export function useCallbackRequests(filters?: CallbackListFilters) {
  return useQuery({
    queryKey: ["callback-requests", "admin", filters?.status ?? "all"],
    queryFn: () => listCallbackRequestsAdmin(filters),
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });
}

export function useAssignCallbackRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignCallbackRequestAdmin(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callback-requests", "admin"] });
    },
  });
}

export function useUpdateCallbackRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: CallbackRequestStatus;
    }) => updateCallbackRequestStatusAdmin(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callback-requests", "admin"] });
    },
  });
}
