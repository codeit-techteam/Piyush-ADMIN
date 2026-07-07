"use client";

import { useCallback, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Clock,
  UserPlus,
} from "lucide-react";
import { AnalyticsAreaChart } from "@/components/analytics/analytics-area-chart";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import { PlatformDrillDownDrawer } from "@/components/analytics/platform-drill-down-drawer";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { usePlatformDayDetails } from "@/hooks/use-analytics";
import { ROUTES } from "@/lib/constants/routes";
import type { ChartPoint, PlatformAnalytics, PlatformDrilldownMetric } from "@/types/analytics";

interface PlatformDashboardProps {
  data: PlatformAnalytics;
  isFetching?: boolean;
}

const DRILLDOWN_TITLES: Record<PlatformDrilldownMetric, string> = {
  userGrowth: "New Users",
  appointmentTrends: "Appointments",
  boutiqueApprovalTrends: "Boutique Approvals",
  productUploadTrends: "Product Uploads",
};

function formatDrilldownDate(date: string) {
  try {
    return format(parseISO(date), "MMM d, yyyy");
  } catch {
    return date;
  }
}

export function PlatformDashboard({ data }: PlatformDashboardProps) {
  const { cards, charts, sections } = data;

  const [drilldown, setDrilldown] = useState<{ metric: PlatformDrilldownMetric; date: string } | null>(
    null,
  );

  const drilldownQuery = useMemo(
    () => (drilldown ? { date: drilldown.date, metric: drilldown.metric } : null),
    [drilldown],
  );
  const drilldownResult = usePlatformDayDetails(drilldownQuery, Boolean(drilldownQuery));

  const handleUserGrowthClick = useCallback((point: ChartPoint) => {
    const dateKey = (point.date ?? "").slice(0, 10);
    if (!dateKey || point.value <= 0) return;
    setDrilldown({ metric: "userGrowth", date: dateKey });
  }, []);

  const handleAppointmentClick = useCallback((point: ChartPoint) => {
    const dateKey = (point.date ?? "").slice(0, 10);
    if (!dateKey || point.value <= 0) return;
    setDrilldown({ metric: "appointmentTrends", date: dateKey });
  }, []);

  const closeDrilldown = useCallback(() => setDrilldown(null), []);

  const selectedPointValue = useMemo(() => {
    if (!drilldown) return 0;
    const series = drilldown.metric === "userGrowth" ? charts.userGrowth : charts.appointmentTrends;
    return series?.find((p) => p.date === drilldown.date)?.value ?? 0;
  }, [drilldown, charts.userGrowth, charts.appointmentTrends]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="platform"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-3 xl:items-stretch">
          <AnalyticsStatCard
            title="Pending Boutiques"
            value={cards.pendingBoutiques ?? 0}
            icon={Clock}
            href={ROUTES.boutiquesWithTab("pending")}
          />
          <AnalyticsStatCard
            title="New Users"
            value={cards.newUsers ?? 0}
            icon={UserPlus}
            trendSeries={charts.userGrowth}
            href={ROUTES.users}
          />
          <AnalyticsStatCard
            title="Total Appointments"
            value={cards.totalAppointments ?? 0}
            icon={CalendarClock}
            trendSeries={charts.appointmentTrends}
            href={ROUTES.appointments}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnalyticsAreaChart
            title="User Growth"
            data={charts.userGrowth ?? []}
            onPointClick={handleUserGrowthClick}
            clickHint="Click any day on the chart to see who signed up"
            drillDownLabel="View new users"
            enableInsights
          />
          <AnalyticsAreaChart
            title="Appointment Trends"
            data={charts.appointmentTrends ?? []}
            onPointClick={handleAppointmentClick}
            clickHint="Click any day on the chart to see the appointments booked"
            drillDownLabel="View appointments"
            enableInsights
          />
        </section>

        <section>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Top Performing Boutiques</h3>
            <DataTable
              columns={[
                { key: "name", header: "Boutique" },
                { key: "appointments", header: "Appointments" },
                { key: "location", header: "Location" },
              ]}
              data={(sections.topPerformingBoutiques ?? []).map((b) => ({
                ...b,
                location: b.location || "—",
              }))}
              bare
            />
          </Card>
        </section>

        <section>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Latest Registered Boutiques</h3>
            <DataTable
              columns={[
                { key: "name", header: "Name" },
                { key: "location", header: "Location" },
                { key: "store_status", header: "Store Status", asStatus: true },
              ]}
              data={(sections.latestRegisteredBoutiques ?? []) as Array<Record<string, string>>}
              bare
            />
          </Card>
        </section>
      </motion.div>

      <PlatformDrillDownDrawer
        open={Boolean(drilldown)}
        onClose={closeDrilldown}
        title={drilldown ? DRILLDOWN_TITLES[drilldown.metric] : ""}
        metric={drilldown?.metric ?? "userGrowth"}
        dateLabel={drilldown ? formatDrilldownDate(drilldown.date) : ""}
        totalValue={selectedPointValue}
        data={drilldownResult.data}
        isLoading={drilldownResult.isLoading}
        isError={drilldownResult.isError}
      />
    </AnimatePresence>
  );
}
