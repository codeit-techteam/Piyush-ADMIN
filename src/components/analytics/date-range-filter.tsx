"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsPreset } from "@/types/analytics";

const PRESETS: { id: AnalyticsPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "custom", label: "Custom" },
];

const dateInputClassName = cn(
  "focus-gold h-9 w-[9.75rem] cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm transition-all duration-200",
  "hover:border-slate-300 focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-100",
  "[color-scheme:light]",
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-45",
  "hover:[&::-webkit-calendar-picker-indicator]:opacity-70",
);

function toDateInputValue(iso?: string) {
  return iso?.slice(0, 10) ?? "";
}

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
    <div className="flex flex-wrap items-center gap-3">
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
      </div>

      {preset === "custom" ? (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-linear-to-r from-slate-50 to-white px-3 py-2 shadow-sm"
        >
          <div className="hidden items-center gap-1.5 sm:flex">
            <CalendarDays className="h-4 w-4 text-blue-600" aria-hidden />
            <span className="text-xs font-medium text-slate-600">Range</span>
          </div>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden />

          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                From
              </span>
              <input
                type="date"
                value={toDateInputValue(from)}
                max={toDateInputValue(to) || undefined}
                onChange={(e) => {
                  if (!e.target.value) return;
                  onCustomChange(
                    new Date(e.target.value).toISOString(),
                    to ?? new Date(e.target.value).toISOString(),
                  );
                }}
                className={dateInputClassName}
              />
            </label>

            <ArrowRight
              className="mb-2.5 h-3.5 w-3.5 shrink-0 text-slate-300"
              aria-hidden
            />

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                To
              </span>
              <input
                type="date"
                value={toDateInputValue(to)}
                min={toDateInputValue(from) || undefined}
                onChange={(e) => {
                  if (!e.target.value) return;
                  onCustomChange(
                    from ?? new Date(e.target.value).toISOString(),
                    new Date(e.target.value).toISOString(),
                  );
                }}
                className={dateInputClassName}
              />
            </label>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
