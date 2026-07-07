"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  useNotificationRules,
  useSendNotificationRule,
  useUpdateNotificationRule,
} from "@/hooks/use-notification-rules";
import type { NotificationRule } from "@/lib/api/services/notification-rules";
import { NotificationRuleCard } from "./notification-rule-card";
import { NotificationRuleFormModal } from "./notification-rule-form-modal";
import { NotificationRulePreviewModal } from "./notification-rule-preview-modal";

const PAGE_SIZE = 6;

export function SmartEngagementSection() {
  const [page, setPage] = useState(1);
  const offset = (page - 1) * PAGE_SIZE;

  const rulesQuery = useNotificationRules({ limit: PAGE_SIZE, offset });
  const updateMutation = useUpdateNotificationRule();
  const sendMutation = useSendNotificationRule();

  const [previewRule, setPreviewRule] = useState<NotificationRule | null>(null);
  const [editRule, setEditRule] = useState<NotificationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sendingRuleId, setSendingRuleId] = useState<string | null>(null);

  const rows = rulesQuery.data?.rows ?? [];
  const total = rulesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleToggleEnabled = async (rule: NotificationRule) => {
    try {
      await updateMutation.mutateAsync({ id: rule.id, patch: { enabled: !rule.enabled } });
      toast.success(rule.enabled ? "Rule disabled" : "Rule enabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update rule");
    }
  };

  const handleSend = async (rule: NotificationRule) => {
    setSendingRuleId(rule.id);
    try {
      const result = await sendMutation.mutateAsync({ ruleId: rule.id });
      toast.success(`Sent to ${result.recipientCount} customer(s).`);
      setPreviewRule(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send notification");
    } finally {
      setSendingRuleId(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Smart Engagement Notifications</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Proactive notifications that drive product views, wishlist activity, boutique discovery, and
            return visits — separate from the acknowledgement history above.
          </p>
        </div>
        <Button type="button" onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Rule
        </Button>
      </div>

      <div className="mt-5">
        {rulesQuery.isError ? (
          <ErrorState
            message="Could not load Smart Engagement Notification rules."
            onRetry={() => void rulesQuery.refetch()}
          />
        ) : rulesQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-56 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No engagement rules yet"
            description="Create your first Smart Engagement Notification rule to start driving proactive customer engagement."
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {rows.map((rule) => (
                <NotificationRuleCard
                  key={rule.id}
                  rule={rule}
                  onPreview={setPreviewRule}
                  onEdit={setEditRule}
                  onSend={(r) => void handleSend(r)}
                  onToggleEnabled={(r) => void handleToggleEnabled(r)}
                  isToggling={updateMutation.isPending}
                  isSending={sendingRuleId === rule.id}
                />
              ))}
            </div>

            {total > PAGE_SIZE ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || rulesQuery.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || rulesQuery.isFetching}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {previewRule ? (
        <NotificationRulePreviewModal
          rule={previewRule}
          onClose={() => setPreviewRule(null)}
          onSend={(r) => void handleSend(r)}
          isSending={sendingRuleId === previewRule.id}
        />
      ) : null}

      {editRule ? (
        <NotificationRuleFormModal rule={editRule} onClose={() => setEditRule(null)} />
      ) : null}

      {isCreating ? <NotificationRuleFormModal onClose={() => setIsCreating(false)} /> : null}
    </Card>
  );
}
