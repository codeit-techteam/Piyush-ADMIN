"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Clock,
  UserPlus,
} from "lucide-react";
import { AnalyticsAreaChart } from "@/components/analytics/analytics-area-chart";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import {
  PlatformStatDetailPanel,
  type PlatformStatKey,
} from "@/components/analytics/platform-stat-detail-panel";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { computeSeriesGrowth } from "@/lib/analytics-insights";
import type { PlatformAnalytics } from "@/types/analytics";

interface PlatformDashboardProps {
  data: PlatformAnalytics;
  isFetching?: boolean;
}

export function PlatformDashboard({ data }: PlatformDashboardProps) {
  const { cards, charts, sections } = data;
  const [selectedStat, setSelectedStat] = useState<PlatformStatKey | null>(null);

  const toggleStat = (key: PlatformStatKey) => {
    setSelectedStat((current) => (current === key ? null : key));
  };

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
          />
          <AnalyticsStatCard
            title="New Users"
            value={cards.newUsers ?? 0}
            icon={UserPlus}
            growthPercent={computeSeriesGrowth(charts.userGrowth).percent}
            trendSeries={charts.userGrowth}
            active={selectedStat === "newUsers"}
            onClick={() => toggleStat("newUsers")}
          />
          <AnalyticsStatCard
            title="Total Appointments"
            value={cards.totalAppointments ?? 0}
            icon={CalendarClock}
            growthPercent={computeSeriesGrowth(charts.appointmentTrends).percent}
            trendSeries={charts.appointmentTrends}
            active={selectedStat === "appointments"}
            onClick={() => toggleStat("appointments")}
          />
        </section>

        <AnimatePresence>
          {selectedStat ? (
            <motion.section
              key={selectedStat}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-5">
                <PlatformStatDetailPanel statKey={selectedStat} data={data} />
              </Card>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnalyticsAreaChart title="User Growth" data={charts.userGrowth ?? []} />
          <AnalyticsAreaChart
            title="Boutique Approval Trends"
            data={charts.boutiqueApprovalTrends ?? []}
          />
          <AnalyticsAreaChart title="Product Upload Trends" data={charts.productUploadTrends ?? []} />
          <AnalyticsAreaChart title="Appointment Trends" data={charts.appointmentTrends ?? []} />
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
    </AnimatePresence>
  );
}
