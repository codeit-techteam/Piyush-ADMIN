"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import { DashboardSwitcher } from "@/components/analytics/dashboard-switcher";
import { DateRangeFilter } from "@/components/analytics/date-range-filter";
import { ExportToolbar } from "@/components/analytics/export-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Store } from "lucide-react";
import {
  useAnalyticsBoutiques,
  useBoutiqueAnalytics,
  useCustomerAnalytics,
  usePlatformAnalytics,
} from "@/hooks/use-analytics";
import type { AnalyticsPreset, DashboardLayer, DateRangeQuery } from "@/types/analytics";

const PlatformDashboard = dynamic(
  () =>
    import("@/components/analytics/platform-dashboard").then((m) => ({
      default: m.PlatformDashboard,
    })),
  { loading: () => <AnalyticsSkeleton /> },
);

const BoutiqueDashboard = dynamic(
  () =>
    import("@/components/analytics/boutique-dashboard").then((m) => ({
      default: m.BoutiqueDashboard,
    })),
  { loading: () => <AnalyticsSkeleton /> },
);

const CustomerDashboard = dynamic(
  () =>
    import("@/components/analytics/customer-dashboard").then((m) => ({
      default: m.CustomerDashboard,
    })),
  { loading: () => <AnalyticsSkeleton /> },
);

export default function DashboardPage() {
  const [layer, setLayer] = useState<DashboardLayer>("platform");
  const [preset, setPreset] = useState<AnalyticsPreset>("30d");
  const [customFrom, setCustomFrom] = useState<string>();
  const [customTo, setCustomTo] = useState<string>();
  const [boutiqueId, setBoutiqueId] = useState<string>("");

  const dateQuery: DateRangeQuery = useMemo(() => {
    const q: DateRangeQuery = { range: preset };
    if (preset === "custom" && customFrom && customTo) {
      q.from = customFrom;
      q.to = customTo;
    }
    if (layer === "boutique" && boutiqueId) {
      q.boutiqueId = boutiqueId;
    }
    return q;
  }, [preset, customFrom, customTo, layer, boutiqueId]);

  const platform = usePlatformAnalytics(dateQuery, layer === "platform");
  const boutique = useBoutiqueAnalytics({ ...dateQuery, boutiqueId }, layer === "boutique");
  const customer = useCustomerAnalytics(dateQuery, layer === "customer");
  const boutiquesList = useAnalyticsBoutiques();

  const activeQuery =
    layer === "platform" ? platform : layer === "boutique" ? boutique : customer;

  const handlePresetChange = (next: AnalyticsPreset) => {
    setPreset(next);
    if (next !== "custom") {
      setCustomFrom(undefined);
      setCustomTo(undefined);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Real-time business intelligence and platform analytics."
        actions={<ExportToolbar layer={layer} query={dateQuery} />}
      />

      <DashboardSwitcher active={layer} onChange={setLayer} />

      <div className="premium-card flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <DateRangeFilter
          preset={preset}
          from={customFrom}
          to={customTo}
          onPresetChange={handlePresetChange}
          onCustomChange={(from, to) => {
            setCustomFrom(from);
            setCustomTo(to);
            setPreset("custom");
          }}
        />
        {layer === "boutique" ? (
          <Select
            value={boutiqueId}
            onChange={(e) => setBoutiqueId(e.target.value)}
            className="min-w-[220px] lg:max-w-xs"
          >
            <option value="">Select boutique…</option>
            {(boutiquesList.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.location ? ` — ${b.location}` : ""}
              </option>
            ))}
          </Select>
        ) : null}
      </div>

      {activeQuery.isLoading ? <AnalyticsSkeleton /> : null}

      {activeQuery.isError ? (
        <ErrorState
          message={activeQuery.error?.message ?? "Failed to load analytics"}
          onRetry={() => void activeQuery.refetch()}
        />
      ) : null}

      <AnimatePresence mode="wait">
        {layer === "platform" && platform.data && !platform.isLoading ? (
          <PlatformDashboard data={platform.data} isFetching={platform.isFetching} />
        ) : null}

        {layer === "boutique" ? (
          !boutiqueId ? (
            <EmptyState
              icon={Store}
              title="Choose a boutique"
              description="Pick a boutique from the dropdown above to explore performance metrics, revenue trends, and customer engagement."
              hint="Use the boutique selector in the filter bar"
            />
          ) : boutique.data && !boutique.isLoading ? (
            <BoutiqueDashboard data={boutique.data} isFetching={boutique.isFetching} />
          ) : null
        ) : null}

        {layer === "customer" && customer.data && !customer.isLoading ? (
          <CustomerDashboard data={customer.data} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
