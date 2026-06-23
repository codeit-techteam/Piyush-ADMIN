"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  Clock,
  Layers,
  Package,
  Users,
} from "lucide-react";
import { AnalyticsAreaChart } from "@/components/analytics/analytics-area-chart";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { computeSeriesGrowth } from "@/lib/analytics-insights";
import type { PlatformAnalytics } from "@/types/analytics";

interface PlatformDashboardProps {
  data: PlatformAnalytics;
  isFetching?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function PlatformDashboard({ data }: PlatformDashboardProps) {
  const { cards, charts, sections } = data;

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
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnalyticsStatCard
            title="Total Users"
            value={cards.totalUsers ?? 0}
            highlight
            icon={Users}
            growthPercent={computeSeriesGrowth(charts.userGrowth).percent}
            trendSeries={charts.userGrowth}
          />
          <AnalyticsStatCard
            title="Total Boutiques"
            value={cards.totalBoutiques ?? 0}
            icon={Building2}
            growthPercent={computeSeriesGrowth(charts.boutiqueApprovalTrends).percent}
            trendSeries={charts.boutiqueApprovalTrends}
          />
          <AnalyticsStatCard
            title="Pending Boutiques"
            value={cards.pendingBoutiques ?? 0}
            icon={Clock}
            subText="Awaiting review"
          />
          <AnalyticsStatCard
            title="Total Products"
            value={cards.totalProducts ?? 0}
            icon={Package}
            growthPercent={computeSeriesGrowth(charts.productUploadTrends).percent}
            trendSeries={charts.productUploadTrends}
          />
          <AnalyticsStatCard
            title="Total Collections"
            value={cards.totalCollections ?? 0}
            icon={Layers}
          />
          <AnalyticsStatCard
            title="Total Appointments"
            value={cards.totalAppointments ?? 0}
            icon={CalendarClock}
            growthPercent={computeSeriesGrowth(charts.appointmentTrends).percent}
            trendSeries={charts.appointmentTrends}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnalyticsAreaChart title="User Growth" data={charts.userGrowth ?? []} />
          <AnalyticsAreaChart
            title="Boutique Approval Trends"
            data={charts.boutiqueApprovalTrends ?? []}
          />
          <AnalyticsAreaChart title="Product Upload Trends" data={charts.productUploadTrends ?? []} />
          <AnalyticsAreaChart title="Appointment Trends" data={charts.appointmentTrends ?? []} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Top Performing Boutiques</h3>
            <DataTable
              columns={[
                { key: "name", header: "Boutique" },
                { key: "appointments", header: "Appointments" },
                { key: "revenue", header: "Revenue" },
              ]}
              data={(sections.topPerformingBoutiques ?? []).map((b) => ({
                ...b,
                revenue: formatCurrency(b.revenue),
              }))}
              bare
            />
          </Card>
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Recent Activities</h3>
            <DataTable
              columns={[
                { key: "action", header: "Action" },
                { key: "createdAt", header: "When" },
              ]}
              data={(sections.recentActivities ?? []).map((a) => ({
                action: a.action,
                createdAt: a.createdAt ? new Date(a.createdAt).toLocaleString() : "—",
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
    </AnimatePresence>
  );
}
