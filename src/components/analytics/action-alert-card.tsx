"use client";

import { memo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BoutiquePendingAction } from "@/types/analytics";

interface ActionAlertCardProps {
  data: BoutiquePendingAction;
}

export const ActionAlertCard = memo(function ActionAlertCard({ data }: ActionAlertCardProps) {
  const pendingOnly = data.pendingSteps.filter((step) => step.status === "pending");

  if (!data.hasPendingActions || pendingOnly.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-emerald-800">All requirements complete</p>
            <p className="text-xs text-emerald-700">{data.boutiqueName} has no pending actions.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-red-300 bg-red-50/40 p-4" role="alert">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white">
          <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-red-800">Action Required</p>
          <p className="mt-0.5 text-xs text-red-700/90">{data.boutiqueName}</p>
          <ul className="mt-3 space-y-2">
            {data.pendingSteps.map((step) => (
              <li
                key={step.key}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  step.status === "pending"
                    ? "border-red-200 bg-white text-red-800"
                    : "border-emerald-200 bg-emerald-50/60 text-emerald-800"
                }`}
              >
                {step.status === "pending" ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                )}
                <span>{step.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
});
