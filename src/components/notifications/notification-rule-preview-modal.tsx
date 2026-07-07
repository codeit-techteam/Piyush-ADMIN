"use client";

import { useEffect } from "react";
import { Loader2, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotificationPreview } from "@/hooks/use-notification-rules";
import type { NotificationRule } from "@/lib/api/services/notification-rules";
import { RULE_TYPE_LABELS, TARGET_TYPE_LABELS } from "./notification-rule-constants";
import { NotificationCardPreview } from "./notification-card-preview";

interface NotificationRulePreviewModalProps {
  rule: NotificationRule;
  onClose: () => void;
  onSend: (rule: NotificationRule) => void;
  isSending?: boolean;
}

export function NotificationRulePreviewModal({
  rule,
  onClose,
  onSend,
  isSending,
}: NotificationRulePreviewModalProps) {
  const previewMutation = useNotificationPreview();

  useEffect(() => {
    previewMutation.mutate({ ruleId: rule.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule.id]);

  const preview = previewMutation.data;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <Card className="relative my-4 w-full max-w-lg space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {RULE_TYPE_LABELS[rule.type]}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Notification Preview</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {previewMutation.isPending ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading preview…
          </div>
        ) : previewMutation.isError || !preview ? (
          <p className="py-8 text-center text-sm text-red-600">
            {previewMutation.error instanceof Error
              ? previewMutation.error.message
              : "Failed to load preview"}
          </p>
        ) : (
          <>
            <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-100 p-4">
              <NotificationCardPreview
                title={preview.title}
                message={preview.message}
                image={preview.image ?? preview.thumbnail}
                ctaText={preview.ctaText}
                notificationStyle={preview.notificationStyle}
                bannerColor={preview.bannerColor}
              />
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Target Audience
                </dt>
                <dd className="mt-0.5 font-medium text-slate-900">{preview.targetAudienceSummary}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Estimated Recipients
                </dt>
                <dd className="mt-0.5 font-medium text-slate-900">{preview.estimatedRecipients}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Notification Target
                </dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {TARGET_TYPE_LABELS[preview.targetType]}
                </dd>
              </div>
              {preview.deepLink ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Deep Link</dt>
                  <dd className="mt-0.5 font-mono text-xs text-slate-700">{preview.deepLink}</dd>
                </div>
              ) : null}
            </dl>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                type="button"
                disabled={!rule.enabled || isSending || preview.estimatedRecipients === 0}
                onClick={() => onSend(rule)}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Sending…" : "Send Now"}
              </Button>
            </div>
            {!rule.enabled ? (
              <p className="text-right text-xs text-slate-500">Enable this rule to send it.</p>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
