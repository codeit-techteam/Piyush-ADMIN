"use client";

import { motion } from "framer-motion";
import { Activity, Clock, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RealtimeStripProps {
  onlineUsers: number;
  activeBoutiques: number;
  pendingApprovals: number;
}

export function RealtimeStrip({ onlineUsers, activeBoutiques, pendingApprovals }: RealtimeStripProps) {
  const items = [
    { label: "Online users", value: onlineUsers, icon: Activity },
    { label: "Active boutiques", value: activeBoutiques, icon: Clock },
    { label: "Pending approvals", value: pendingApprovals, icon: ShieldAlert },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="premium-card-hover"
          >
            <Card className="flex items-center gap-4 border-blue-100">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <motion.p
                  key={item.value}
                  className="text-xl font-semibold tabular-nums text-blue-700"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                >
                  {item.value}
                </motion.p>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
