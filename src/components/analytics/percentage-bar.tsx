"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface PercentageBarProps {
  percentage: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  barClassName?: string;
}

export const PercentageBar = memo(function PercentageBar({
  percentage,
  label,
  showValue = true,
  className,
  barClassName,
}: PercentageBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className={cn("space-y-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label ? <span className="truncate text-slate-600">{label}</span> : <span />}
          {showValue ? (
            <span className="shrink-0 font-semibold tabular-nums text-blue-700">{clamped}%</span>
          ) : null}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full bg-blue-600 transition-all duration-500", barClassName)}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
});
