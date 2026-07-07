"use client";

import { Eye, Pencil, Send, Zap, ZapOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { NotificationRule } from "@/lib/api/services/notification-rules";
import { describeTargetAudience, PRIORITY_LABELS, RULE_TYPE_LABELS } from "./notification-rule-constants";

interface NotificationRuleCardProps {
  rule: NotificationRule;
  onPreview: (rule: NotificationRule) => void;
  onEdit: (rule: NotificationRule) => void;
  onSend: (rule: NotificationRule) => void;
  onToggleEnabled: (rule: NotificationRule) => void;
  isToggling?: boolean;
  isSending?: boolean;
}

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-red-500",
};

export function NotificationRuleCard({
  rule,
  onPreview,
  onEdit,
  onSend,
  onToggleEnabled,
  isToggling,
  isSending,
}: NotificationRuleCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {RULE_TYPE_LABELS[rule.type]}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{rule.title}</h3>
        </div>
        <StatusBadge status={rule.enabled ? "active" : "inactive"} />
      </div>

      {rule.description ? <p className="text-sm text-slate-600">{rule.description}</p> : null}

      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Trigger</dt>
          <dd className="mt-0.5 text-slate-800">{rule.trigger}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Target Audience</dt>
          <dd className="mt-0.5 text-slate-800">{describeTargetAudience(rule.targetAudience)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Priority</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-slate-800">
            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[rule.priority]}`} />
            {PRIORITY_LABELS[rule.priority]}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Sent</dt>
          <dd className="mt-0.5 text-slate-800">
            {rule.totalSentCount} time{rule.totalSentCount === 1 ? "" : "s"}
            {rule.lastSentAt ? ` · ${new Date(rule.lastSentAt).toLocaleDateString()}` : ""}
          </dd>
        </div>
      </dl>

      <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <Button type="button" variant="outline" size="sm" onClick={() => onPreview(rule)}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Preview
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(rule)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!rule.enabled || isSending}
          onClick={() => onSend(rule)}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          {isSending ? "Sending…" : "Send"}
        </Button>
        <Button
          type="button"
          variant={rule.enabled ? "destructive" : "default"}
          size="sm"
          disabled={isToggling}
          onClick={() => onToggleEnabled(rule)}
        >
          {rule.enabled ? (
            <ZapOff className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Zap className="mr-1.5 h-3.5 w-3.5" />
          )}
          {rule.enabled ? "Disable" : "Enable"}
        </Button>
      </div>
    </Card>
  );
}
