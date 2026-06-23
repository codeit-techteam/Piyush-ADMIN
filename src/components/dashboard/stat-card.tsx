"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon?: LucideIcon;
}

export function StatCard({ title, value, subText, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="premium-card-hover"
    >
      <Card className="premium-card-hover">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
          ) : null}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
            {subText ? <p className="mt-1 text-xs text-slate-500">{subText}</p> : null}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
