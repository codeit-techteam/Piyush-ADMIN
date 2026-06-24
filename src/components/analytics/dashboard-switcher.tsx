"use client";

import { motion } from "framer-motion";
import { BarChart3, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardLayer } from "@/types/analytics";

const TABS: { id: DashboardLayer; label: string; description: string; icon: typeof BarChart3 }[] = [
  {
    id: "platform",
    label: "Platform Analytics",
    description: "Global marketplace overview",
    icon: BarChart3,
  },
  {
    id: "customer",
    label: "Customer Analytics",
    description: "User behavior & interests",
    icon: Users,
  },
  {
    id: "boutique",
    label: "Boutique Analytics",
    description: "Per-boutique performance",
    icon: Store,
  },
];

interface DashboardSwitcherProps {
  active: DashboardLayer;
  onChange: (layer: DashboardLayer) => void;
}

export function DashboardSwitcher({ active, onChange }: DashboardSwitcherProps) {
  return (
    <motion.div
      className="grid gap-4 md:grid-cols-3"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "premium-card-hover relative overflow-hidden rounded-xl border p-5 text-left transition-all duration-200",
              isActive
                ? "border-blue-400 bg-gradient-to-br from-blue-50 to-white shadow-md shadow-blue-100"
                : "border-slate-200 bg-white hover:border-blue-200",
            )}
          >
            {isActive ? (
              <motion.div
                layoutId="dashboard-tab-glow"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
            ) : null}
            <div
              className={cn(
                "mb-3 inline-flex rounded-xl border p-2.5 transition-transform duration-200",
                isActive
                  ? "border-blue-200 bg-blue-100 scale-105"
                  : "border-slate-100 bg-slate-50",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-600")} />
            </div>
            <p className={cn("font-semibold", isActive ? "text-blue-800" : "text-slate-800")}>
              {tab.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{tab.description}</p>
          </button>
        );
      })}
    </motion.div>
  );
}
