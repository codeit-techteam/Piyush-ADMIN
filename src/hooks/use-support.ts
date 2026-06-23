"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSupportDashboardStats,
  getSupportConversationAdmin,
  listSupportAgentsAdmin,
  listSupportConversationsAdmin,
  markSupportConversationReadAdmin,
  patchSupportConversationAdmin,
  sendSupportAgentMessage,
  setAgentTypingAdmin,
} from "@/lib/api/services/support";
import type { AdminSupportMessage, SupportConversationStatus } from "@/types";

export function useSupportDashboardStats() {
  return useQuery({
    queryKey: ["support", "stats"],
    queryFn: fetchSupportDashboardStats,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useSupportConversations(status: SupportConversationStatus | "all" = "all") {
  return useQuery({
    queryKey: ["support", "conversations", status],
    queryFn: () => listSupportConversationsAdmin(status),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useSupportConversationDetail(conversationId: string | null) {
  return useQuery({
    queryKey: ["support", "conversation", conversationId],
    queryFn: () => getSupportConversationAdmin(conversationId!),
    enabled: Boolean(conversationId),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

export function useSupportAgents() {
  return useQuery({
    queryKey: ["support", "agents"],
    queryFn: listSupportAgentsAdmin,
    staleTime: 60_000,
  });
}

export function useSendSupportReply(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      sendSupportAgentMessage(conversationId, { message }),
    onSuccess: (saved) => {
      if (saved) {
        queryClient.setQueryData<{
          conversation: unknown;
          messages: AdminSupportMessage[];
        }>(["support", "conversation", conversationId], (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.id === saved.id)) return old;
          return { ...old, messages: [...old.messages, saved] };
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["support", "conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["support", "stats"] });
    },
  });
}

export function usePatchSupportConversation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchSupportConversationAdmin.bind(null, conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["support", "conversation", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["support", "conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["support", "stats"] });
    },
  });
}

export function useMarkSupportRead(conversationId: string) {
  return useMutation({
    mutationFn: () => markSupportConversationReadAdmin(conversationId),
  });
}

export function useAgentTyping(conversationId: string) {
  return useMutation({
    mutationFn: ({ isTyping, agentId }: { isTyping: boolean; agentId?: string }) =>
      setAgentTypingAdmin(conversationId, isTyping, agentId),
  });
}
