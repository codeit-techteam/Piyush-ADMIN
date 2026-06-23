"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { computeSeriesGrowth } from "@/lib/analytics-insights";
import type { AnalyticsSeriesPoint } from "@/types/analytics";
import { cn } from "@/lib/utils";

interface AnalyticsAreaChartProps {
  title: string;
  data?: AnalyticsSeriesPoint[];
  valueFormatter?: (v: number) => string;
  emptyLabel?: string;
}

const CHART_BLUE = "#2563eb";

export function AnalyticsAreaChart({
  title,
  data = [],
  valueFormatter = (v) => String(v),
  emptyLabel = "No data for selected range",
}: AnalyticsAreaChartProps) {
  const chartData = data.map((p) => ({
    label: p.date.slice(5),
    value: p.value,
  }));
  const gradientId = `fillBlue-${title.replace(/\s/g, "")}`;
  const insight = computeSeriesGrowth(data);
  const positive = (insight.percent ?? 0) >= 0;

  return (
    <Card className="premium-card-hover overflow-hidden">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {insight.percent != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
              positive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {title.split(" ")[0]} {positive ? "↑" : "↓"} {Math.abs(insight.percent)}%
          </span>
        ) : null}
      </div>
      {chartData.length === 0 ? (
        <p className="flex h-56 items-center justify-center text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <motion.div
          className="h-56 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_BLUE} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_BLUE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={valueFormatter}
              />
              <Tooltip
                cursor={{ stroke: "rgba(37, 99, 235, 0.2)", strokeWidth: 1 }}
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                  color: "#0f172a",
                }}
                labelStyle={{ color: "#64748b", fontSize: 11 }}
                itemStyle={{ color: "#2563eb" }}
                formatter={(value) => [valueFormatter(Number(value)), "Value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_BLUE}
                fill={`url(#${gradientId})`}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: CHART_BLUE,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
      {insight.percent != null && chartData.length > 0 ? (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="text-slate-600">Insight:</span>{" "}
          <span className={positive ? "text-emerald-600" : "text-red-600"}>
            {positive ? "Growing" : "Declining"}
          </span>{" "}
          {Math.abs(insight.percent)}% {insight.label}
        </p>
      ) : null}
    </Card>
  );
}
