"use client";

import { memo } from "react";
import { Lightbulb } from "lucide-react";
import { AnalyticsCard } from "@/components/analytics/analytics-card";

interface InsightCardProps {
  title?: string;
  insight: string;
  action?: string;
}

export const InsightCard = memo(function InsightCard({
  title = "Recommended Action",
  insight,
  action,
}: InsightCardProps) {
  return (
    <AnalyticsCard
      title={title}
      className="border-blue-100 bg-gradient-to-br from-blue-50/80 to-white"
    >
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
          <Lightbulb className="h-4 w-4 text-blue-700" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-slate-700">{insight}</p>
          {action ? (
            <p className="text-xs font-medium text-blue-700">{action}</p>
          ) : null}
        </div>
      </div>
    </AnalyticsCard>
  );
});
