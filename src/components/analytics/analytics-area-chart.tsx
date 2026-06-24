"use client";

import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { AnalyticsSeriesPoint } from "@/types/analytics";

interface AnalyticsAreaChartProps {
  title: string;
  data?: AnalyticsSeriesPoint[];
  valueFormatter?: (v: number) => string;
  emptyLabel?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueLabel?: string;
}

const CHART_AXIS_DEFAULTS: Record<string, { yAxisLabel: string; valueLabel: string }> = {
  "User Activity Timeline": { yAxisLabel: "Activities", valueLabel: "Activities" },
  "Wishlist Growth": { yAxisLabel: "Items Added", valueLabel: "Items" },
  "User Growth": { yAxisLabel: "New Users", valueLabel: "Users" },
  "Boutique Approval Trends": { yAxisLabel: "Approvals", valueLabel: "Approvals" },
  "Product Upload Trends": { yAxisLabel: "Products Uploaded", valueLabel: "Products" },
  "Appointment Trends": { yAxisLabel: "Appointments", valueLabel: "Appointments" },
  "Product View Trends": { yAxisLabel: "Product Views", valueLabel: "Views" },
};

const CHART_BLUE = "#2563eb";

function formatChartDate(raw: string) {
  try {
    return format(parseISO(raw), "MMM d");
  } catch {
    return raw.slice(5);
  }
}

function formatTooltipDate(raw: string) {
  try {
    return format(parseISO(raw), "MMM d, yyyy");
  } catch {
    return raw;
  }
}

export function AnalyticsAreaChart({
  title,
  data = [],
  valueFormatter = (v) => String(v),
  emptyLabel = "No data for selected range",
  xAxisLabel = "Date",
  yAxisLabel,
  valueLabel,
}: AnalyticsAreaChartProps) {
  const axisDefaults = CHART_AXIS_DEFAULTS[title] ?? {
    yAxisLabel: "Count",
    valueLabel: "Count",
  };
  const resolvedYAxisLabel = yAxisLabel ?? axisDefaults.yAxisLabel;
  const resolvedValueLabel = valueLabel ?? axisDefaults.valueLabel;

  const chartData = data.map((p) => ({
    label: formatChartDate(p.date),
    fullDate: p.date,
    value: p.value,
  }));
  const gradientId = `fillBlue-${title.replace(/\s/g, "")}`;
  const yLabelWidth = Math.min(48, Math.max(28, resolvedYAxisLabel.length * 5.5));

  return (
    <Card className="premium-card-hover overflow-hidden">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      {chartData.length === 0 ? (
        <p className="flex h-56 items-center justify-center text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div>
          <div className="flex h-56">
            <div
              className="flex shrink-0 items-center justify-center"
              style={{ width: yLabelWidth }}
              aria-hidden
            >
              <span className="-rotate-90 whitespace-nowrap text-[11px] font-medium tracking-wide text-slate-500">
                {resolvedYAxisLabel}
              </span>
            </div>
            <motion.div
              className="min-w-0 flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
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
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={valueFormatter}
                    width={36}
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
                    labelStyle={{ color: "#64748b", fontSize: 11, fontWeight: 500 }}
                    itemStyle={{ color: "#2563eb" }}
                    labelFormatter={(_, payload) => {
                      const point = payload?.[0]?.payload as { fullDate?: string } | undefined;
                      return point?.fullDate
                        ? `${xAxisLabel}: ${formatTooltipDate(point.fullDate)}`
                        : xAxisLabel;
                    }}
                    formatter={(value) => [valueFormatter(Number(value)), resolvedValueLabel]}
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
          </div>
          <p className="-mt-1 text-center text-[11px] font-medium tracking-wide text-slate-500">
            {xAxisLabel}
          </p>
        </div>
      )}
    </Card>
  );
}
