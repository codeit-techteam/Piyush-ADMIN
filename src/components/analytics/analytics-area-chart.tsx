"use client";

import { useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
} from "recharts";
import { Card } from "@/components/ui/card";
import { enrichSeriesWithInsights } from "@/lib/analytics/insights";
import type { ChartPoint } from "@/types/analytics";

interface AnalyticsAreaChartProps {
  title: string;
  data?: ChartPoint[];
  valueFormatter?: (v: number) => string;
  emptyLabel?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueLabel?: string;
  growthLabel?: string;
  onPointClick?: (point: ChartPoint) => void;
  enableInsights?: boolean;
  clickHint?: string;
  drillDownLabel?: string;
}

const CHART_AXIS_DEFAULTS: Record<string, { yAxisLabel: string; valueLabel: string }> = {
  "User Activity Timeline": { yAxisLabel: "Activities", valueLabel: "Activities" },
  "Wishlist Growth": { yAxisLabel: "Items Added", valueLabel: "Items" },
  "Wishlist Trends": { yAxisLabel: "Items Added", valueLabel: "Wishlist Added" },
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

type ChartPayload = ChartPoint & { label?: string; fullDate?: string };

function toChartPoint(point: ChartPayload): ChartPoint {
  return {
    date: point.fullDate ?? point.date,
    value: point.value,
    previousValue: point.previousValue,
    difference: point.difference,
    growthPercent: point.growthPercent,
    trend: point.trend,
  };
}

function InsightTooltip({
  active,
  payload,
  xAxisLabel,
  valueFormatter,
  valueLabel,
  growthLabel = "vs previous day",
  enableInsights,
  onPointClick,
  drillDownLabel = "View product breakdown",
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartPayload }>;
  xAxisLabel: string;
  valueFormatter: (v: number) => string;
  valueLabel: string;
  growthLabel?: string;
  enableInsights: boolean;
  onPointClick?: (point: ChartPoint) => void;
  drillDownLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const growth = point.growthPercent ?? 0;
  const isUp = growth > 0;
  const isDown = growth < 0;
  const hasValue = Number(point.value ?? 0) > 0;
  const canDrillDown = Boolean(onPointClick && hasValue);

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-slate-500">
        {point.fullDate ? `Date: ${formatTooltipDate(point.fullDate)}` : xAxisLabel}
      </p>
      <p className="mt-1 text-sm font-semibold text-blue-700">
        {valueFormatter(Number(point.value))} {valueLabel}
      </p>
      {enableInsights ? (
        <div className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1.5 text-[11px]">
          <p className={isUp ? "text-emerald-700" : isDown ? "text-red-600" : "text-slate-500"}>
            {isUp ? "↑" : isDown ? "↓" : "—"} {Math.abs(growth)}% {growthLabel}
          </p>
          {typeof point.difference === "number" ? (
            <p className="text-slate-500">
              {point.difference >= 0 ? "+" : ""}
              {point.difference} compared to previous day
            </p>
          ) : null}
        </div>
      ) : null}
      {canDrillDown ? (
        <button
          type="button"
          className="pointer-events-auto mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
          onClick={(event) => {
            event.stopPropagation();
            onPointClick?.(toChartPoint(point));
          }}
        >
          {drillDownLabel}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function ClickableDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: ChartPayload;
}) {
  if (cx == null || cy == null || !payload) return null;

  const hasValue = Number(payload.value ?? 0) > 0;

  return (
    <g pointerEvents="none">
      <circle
        cx={cx}
        cy={cy}
        r={hasValue ? 6 : 3}
        fill={hasValue ? CHART_BLUE : "#94a3b8"}
        stroke="#ffffff"
        strokeWidth={2}
      />
    </g>
  );
}

export function AnalyticsAreaChart({
  title,
  data = [],
  valueFormatter = (v) => String(v),
  emptyLabel = "No data for selected range",
  xAxisLabel = "Date",
  yAxisLabel,
  valueLabel,
  growthLabel,
  onPointClick,
  enableInsights = true,
  clickHint = "Click any day on the chart to see which products drove those views",
  drillDownLabel = "View product breakdown",
}: AnalyticsAreaChartProps) {
  const axisDefaults = CHART_AXIS_DEFAULTS[title] ?? {
    yAxisLabel: "Count",
    valueLabel: "Count",
  };
  const resolvedYAxisLabel = yAxisLabel ?? axisDefaults.yAxisLabel;
  const resolvedValueLabel = valueLabel ?? axisDefaults.valueLabel;

  const enrichedData = useMemo(
    () => (enableInsights ? enrichSeriesWithInsights(data) : data),
    [data, enableInsights],
  );

  const chartData = useMemo(
    () =>
      enrichedData.map((p) => ({
        label: formatChartDate(p.date),
        date: p.date,
        fullDate: p.date,
        value: p.value,
        previousValue: p.previousValue,
        difference: p.difference,
        growthPercent: p.growthPercent,
        trend: p.trend,
      })),
    [enrichedData],
  );

  const gradientId = `fillBlue-${title.replace(/\s/g, "")}`;
  const yLabelWidth = Math.min(48, Math.max(28, resolvedYAxisLabel.length * 5.5));

  const clickBarSize = useMemo(() => {
    const count = chartData.length;
    if (count <= 1) return 48;
    return Math.min(56, Math.max(36, Math.floor(300 / count)));
  }, [chartData.length]);

  const handlePointSelect = useCallback(
    (payload: ChartPayload | undefined) => {
      if (!onPointClick || !payload || Number(payload.value ?? 0) <= 0) return;
      onPointClick(toChartPoint(payload));
    },
    [onPointClick],
  );

  const renderDot = useCallback(
    (props: { cx?: number; cy?: number; payload?: ChartPayload }) => <ClickableDot {...props} />,
    [],
  );

  const handleChartClick = useCallback(
    (state: MouseHandlerDataParam) => {
      const index =
        typeof state.activeTooltipIndex === "number"
          ? state.activeTooltipIndex
          : typeof state.activeIndex === "number"
            ? state.activeIndex
            : null;
      if (index == null || index < 0 || index >= chartData.length) return;
      handlePointSelect(chartData[index]);
    },
    [chartData, handlePointSelect],
  );

  const handleBarClick = useCallback(
    (barData: { payload?: ChartPayload }, index: number) => {
      handlePointSelect(barData?.payload ?? chartData[index]);
    },
    [chartData, handlePointSelect],
  );

  return (
    <Card className="premium-card-hover overflow-hidden">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {onPointClick ? (
          <p className="mt-0.5 text-[11px] text-slate-500">{clickHint}</p>
        ) : null}
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
              className={`min-w-0 flex-1${onPointClick ? " cursor-pointer" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  onClick={onPointClick ? handleChartClick : undefined}
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
                    cursor={
                      onPointClick
                        ? { fill: "rgba(37, 99, 235, 0.08)", stroke: "rgba(37, 99, 235, 0.25)", strokeWidth: 1 }
                        : { stroke: "rgba(37, 99, 235, 0.2)", strokeWidth: 1 }
                    }
                    isAnimationActive={false}
                    position={{ y: 0 }}
                    wrapperStyle={{ outline: "none", pointerEvents: onPointClick ? "auto" : "none" }}
                    content={
                      <InsightTooltip
                        xAxisLabel={xAxisLabel}
                        valueFormatter={valueFormatter}
                        valueLabel={resolvedValueLabel}
                        growthLabel={growthLabel}
                        enableInsights={enableInsights}
                        onPointClick={onPointClick}
                        drillDownLabel={drillDownLabel}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={CHART_BLUE}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2.5}
                    dot={onPointClick ? renderDot : false}
                    activeDot={
                      onPointClick
                        ? {
                            r: 8,
                            fill: CHART_BLUE,
                            stroke: "#ffffff",
                            strokeWidth: 2,
                          }
                        : { r: 5, fill: CHART_BLUE, stroke: "#ffffff", strokeWidth: 2 }
                    }
                    animationDuration={900}
                  />
                  {onPointClick ? (
                    <Bar
                      dataKey="value"
                      fill="transparent"
                      barSize={clickBarSize}
                      radius={0}
                      isAnimationActive={false}
                      cursor="pointer"
                      background={{ fill: "transparent", cursor: "pointer" }}
                      onClick={handleBarClick}
                    />
                  ) : null}
                </ComposedChart>
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
