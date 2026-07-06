"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  subtitle?: string;
}

export const AnalyticsCard = memo(function AnalyticsCard({
  title,
  children,
  className,
  action,
  subtitle,
}: AnalyticsCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
});
