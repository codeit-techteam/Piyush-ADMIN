"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AnalyticsPreset } from "@/types/analytics";

const PRESETS: { id: AnalyticsPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "custom", label: "Custom" },
];

interface DateRangeFilterProps {
  preset: AnalyticsPreset;
  from?: string;
  to?: string;
  onPresetChange: (preset: AnalyticsPreset) => void;
  onCustomChange: (from: string, to: string) => void;
}

export function DateRangeFilter({
  preset,
  from,
  to,
  onPresetChange,
  onCustomChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPresetChange(p.id)}
          className={cn(
            "pill-filter",
            preset === p.id ? "pill-filter-active" : "text-slate-600 hover:text-slate-800",
          )}
        >
          {p.label}
        </button>
      ))}
      {preset === "custom" ? (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            type="date"
            value={from?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onCustomChange(new Date(e.target.value).toISOString(), to ?? new Date().toISOString())
            }
            className="focus-gold rounded-lg border border-white/[0.08] bg-[#071B3B]/60 px-2 py-1.5 text-xs text-slate-800"
          />
          <span className="text-slate-600">→</span>
          <input
            type="date"
            value={to?.slice(0, 10) ?? ""}
            onChange={(e) =>
              onCustomChange(from ?? new Date().toISOString(), new Date(e.target.value).toISOString())
            }
            className="focus-gold rounded-lg border border-white/[0.08] bg-[#071B3B]/60 px-2 py-1.5 text-xs text-slate-800"
          />
        </motion.div>
      ) : null}
    </div>
  );
}
