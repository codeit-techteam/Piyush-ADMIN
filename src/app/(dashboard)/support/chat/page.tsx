"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone, RefreshCw, Search, Send } from "lucide-react";
import {
  useAgentTyping,
  useMarkSupportRead,
  usePatchSupportConversation,
  useSendSupportReply,
  useSupportAgents,
  useSupportConversationDetail,
  useSupportConversations,
  useSupportDashboardStats,
} from "@/hooks/use-support";
import { useSupportRealtime } from "@/hooks/use-support-realtime";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import type { AdminSupportConversation, SupportConversationStatus } from "@/types";

type StatusFilter = "all" | SupportConversationStatus;

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "waiting_for_customer", label: "Waiting" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

const STATUS_OPTIONS: SupportConversationStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "waiting_for_customer",
  "resolved",
  "closed",
];

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-blue-50 text-blue-600",
    assigned: "bg-blue-500/15 text-blue-400",
    in_progress: "bg-violet-500/15 text-violet-400",
    waiting_for_customer: "bg-orange-500/15 text-orange-400",
    resolved: "bg-emerald-500/15 text-emerald-700",
    closed: "bg-slate-600/50 text-slate-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? styles.open}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatIst(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function matchesSearch(row: AdminSupportConversation, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.customerName, row.ticketNumber, row.lastMessage]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export default function SupportCenterPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statsQuery = useSupportDashboardStats();
  const listQuery = useSupportConversations(statusFilter);
  const detailQuery = useSupportConversationDetail(selectedId);
  const agentsQuery = useSupportAgents();
  const sendReply = useSendSupportReply(selectedId ?? "");
  const patchConversation = usePatchSupportConversation(selectedId ?? "");
  const markRead = useMarkSupportRead(selectedId ?? "");
  const agentTyping = useAgentTyping(selectedId ?? "");
  useSupportRealtime(selectedId);
  const customerTyping = useQuery<boolean>({
    queryKey: ["support", "typing", selectedId],
    enabled: Boolean(selectedId),
    queryFn: () => false,
    staleTime: Infinity,
    initialData: false,
  });

  const filtered = useMemo(() => {
    const rows = listQuery.data ?? [];
    return rows.filter((r) => matchesSearch(r, search));
  }, [listQuery.data, search]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (selectedId) void markRead.mutate();
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detailQuery.data?.messages.length]);

  const conversation = detailQuery.data?.conversation;
  const messages = detailQuery.data?.messages ?? [];

  useEffect(() => {
    if (conversation?.internalNotes != null) {
      setInternalNotes(conversation.internalNotes);
    }
  }, [conversation?.id, conversation?.internalNotes]);

  const handleSend = async () => {
    const text = reply.trim();
    if (!text || !selectedId) return;
    await sendReply.mutateAsync(text);
    setReply("");
    void agentTyping.mutate({ isTyping: false });
  };

  const onReplyChange = (value: string) => {
    setReply(value);
    if (selectedId) {
      void agentTyping.mutate({
        isTyping: value.length > 0,
        agentId: conversation?.assignedAgentId ?? undefined,
      });
    }
  };

  if (listQuery.isError) {
    return (
      <ErrorState
        title="Support Center unavailable"
        message={listQuery.error?.message ?? "Could not load tickets."}
        onRetry={() => void listQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Center</h1>
          <p className="text-sm text-slate-600">
            Live customer support — tickets, chat, and agent assignment
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={ROUTES.supportCallbackRequests}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Phone className="h-4 w-4" />
            Callback Requests
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void listQuery.refetch();
              void statsQuery.refetch();
              if (selectedId) void detailQuery.refetch();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <StatCard label="Open Tickets" value={statsQuery.data?.openTickets ?? 0} />
            <StatCard label="Pending Replies" value={statsQuery.data?.pendingReplies ?? 0} />
            <StatCard label="Resolved" value={statsQuery.data?.resolvedTickets ?? 0} />
            <StatCard
              label="Avg Response"
              value={`${statsQuery.data?.averageResponseMinutes ?? 0}m`}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={statusFilter === tab.id ? "default" : "outline"}
            onClick={() => setStatusFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          className="pl-9"
          placeholder="Search ticket, customer, message..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid min-h-[560px] gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
            Conversations ({filtered.length})
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No tickets"
                description="Customer chats will appear here when started from the app."
              />
            ) : (
              filtered.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={`w-full border-b border-slate-200/80 px-4 py-3 text-left transition hover:bg-slate-50 ${
                    selectedId === row.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {row.ticketNumber}
                    </span>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {row.customerName ?? "Customer"}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                    {row.lastMessage ?? "—"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {row.assignedAgent?.name ?? "Unassigned"} • {formatIst(row.updatedAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="flex flex-col lg:col-span-3 overflow-hidden">
          {!selectedId || !conversation ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                icon={MessageCircle}
                title="Select a conversation"
                description="Choose a ticket from the list to view chat and reply."
              />
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-blue-600">
                      {conversation.ticketNumber}
                    </p>
                    <p className="text-sm text-slate-700">
                      {conversation.customerName ?? "Customer"} • ID {conversation.customerId.slice(0, 8)}…
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                      value={conversation.status}
                      onChange={(e) => {
                        void patchConversation.mutateAsync({
                          status: e.target.value as SupportConversationStatus,
                        });
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                      value={conversation.assignedAgentId ?? ""}
                      onChange={(e) => {
                        void patchConversation.mutateAsync({
                          assignedAgentId: e.target.value || null,
                        });
                      }}
                    >
                      <option value="">Unassigned</option>
                      {(agentsQuery.data ?? []).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[340px]">
                {detailQuery.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  messages.map((msg) => {
                    const isCustomer = msg.senderType === "customer";
                    const isSystem = msg.senderType === "system";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            isSystem
                              ? "bg-slate-100 text-slate-600 italic border border-slate-200"
                              : isCustomer
                                ? "bg-blue-600 text-white"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {msg.attachmentUrl && msg.messageType === "image" ? (
                            <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                              <img
                                src={msg.attachmentUrl}
                                alt="attachment"
                                className="mb-2 max-h-40 rounded-lg"
                              />
                            </a>
                          ) : null}
                          {msg.attachmentUrl && msg.messageType === "pdf" ? (
                            <a
                              href={msg.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mb-2 block text-blue-600 underline"
                            >
                              PDF attachment
                            </a>
                          ) : null}
                          <p>{msg.message}</p>
                          <p className="mt-1 text-[10px] opacity-60">
                            {formatIst(msg.createdAt)}
                            {isCustomer ? "" : ` • ${msg.deliveryStatus}`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {customerTyping.data ? (
                  <p className="text-xs italic text-slate-600">Customer is typing…</p>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-200 p-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Internal notes (agents only)
                </label>
                <textarea
                  className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  onBlur={() => {
                    if (internalNotes !== (conversation.internalNotes ?? "")) {
                      void patchConversation.mutateAsync({ internalNotes });
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={(e) => onReplyChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <Button onClick={() => void handleSend()} disabled={sendReply.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
