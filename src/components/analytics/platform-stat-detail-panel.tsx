"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AnalyticsAreaChart } from "@/components/analytics/analytics-area-chart";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { ROUTES } from "@/lib/constants/routes";
import type { PlatformAnalytics } from "@/types/analytics";

export type PlatformStatKey = "newUsers" | "appointments";

interface PlatformStatDetailPanelProps {
  statKey: PlatformStatKey;
  data: PlatformAnalytics;
}

const STAT_CONFIG: Record<
  PlatformStatKey,
  {
    title: string;
    description: string;
    href: string;
    viewAllLabel: string;
  }
> = {
  newUsers: {
    title: "New User Registrations",
    description: "Users who signed up during the selected period.",
    href: ROUTES.users,
    viewAllLabel: "View all users",
  },
  appointments: {
    title: "Appointment Activity",
    description: "Booking trends and top-performing boutiques by appointments.",
    href: ROUTES.appointments,
    viewAllLabel: "View all appointments",
  },
};

export function PlatformStatDetailPanel({ statKey, data }: PlatformStatDetailPanelProps) {
  const config = STAT_CONFIG[statKey];
  const { charts, sections, cards } = data;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={statKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{config.title}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{config.description}</p>
          </div>
          <Link
            href={config.href}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50"
          >
            {config.viewAllLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {statKey === "newUsers" ? (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                New Users
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                {cards.newUsers ?? 0}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Registrations in the selected date range.
              </p>
            </Card>
            <AnalyticsAreaChart title="User Growth" data={charts.userGrowth ?? []} />
          </div>
        ) : null}

        {statKey === "appointments" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <AnalyticsAreaChart title="Appointment Trends" data={charts.appointmentTrends ?? []} />
            <Card>
              <h4 className="mb-4 text-sm font-semibold text-slate-800">Top Performing Boutiques</h4>
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
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
