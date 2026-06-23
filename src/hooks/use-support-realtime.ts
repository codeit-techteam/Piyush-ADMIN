"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AdminSupportMessage } from "@/types";
import { getAdminSupabase } from "@/lib/supabase";

function isMessage(payload: unknown): payload is AdminSupportMessage {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as AdminSupportMessage;
  return typeof p.id === "string" && typeof p.senderType === "string";
}

/**
 * Instant support updates via Supabase broadcast (works without customer JWT).
 */
export function useSupportRealtime(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const supabase = getAdminSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`support:${conversationId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "message:new" }, ({ payload }) => {
        if (!isMessage(payload)) return;
        queryClient.setQueryData<{
          conversation: unknown;
          messages: AdminSupportMessage[];
        }>(["support", "conversation", conversationId], (old) => {
          if (!old) return old;
          if (old.messages.some((m) => m.id === payload.id)) return old;
          return { ...old, messages: [...old.messages, payload] };
        });
        void queryClient.invalidateQueries({ queryKey: ["support", "conversations"] });
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as { participantType?: string; isTyping?: boolean };
        if (p?.participantType === "customer") {
          queryClient.setQueryData(["support", "typing", conversationId], Boolean(p.isTyping));
        }
      })
      .on("broadcast", { event: "messages:read" }, ({ payload }) => {
        const p = payload as { readerType?: string };
        if (p?.readerType === "agent") {
          queryClient.setQueryData<{
            conversation: unknown;
            messages: AdminSupportMessage[];
          }>(["support", "conversation", conversationId], (old) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.map((m) =>
                m.senderType === "customer"
                  ? { ...m, deliveryStatus: "read" as const, isRead: true }
                  : m,
              ),
            };
          });
        }
        if (p?.readerType === "customer") {
          queryClient.setQueryData<{
            conversation: unknown;
            messages: AdminSupportMessage[];
          }>(["support", "conversation", conversationId], (old) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.map((m) =>
                m.senderType === "agent" || m.senderType === "system"
                  ? { ...m, deliveryStatus: "read" as const, isRead: true }
                  : m,
              ),
            };
          });
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}
