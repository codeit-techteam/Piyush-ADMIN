"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, Eye, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BoutiqueOverviewStat, BoutiqueOverviewStats } from "@/types/analytics";

interface BoutiqueOverviewCardsProps {
  data?: BoutiqueOverviewStats;
  isLoading?: boolean;
  isError?: boolean;
}

function formatCount(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

function OverviewCard({
  title,
  stat,
  countLabel,
  icon: Icon,
}: {
  title: string;
  stat: BoutiqueOverviewStat | null | undefined;
  countLabel: (count: number) => string;
  icon: LucideIcon;
}) {
  const name = stat?.name ?? "No data yet";
  const subLabel = stat ? countLabel(stat.count) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="premium-card-hover h-full min-w-0"
    >
      <Card className="premium-card-hover relative flex h-full min-h-[136px] flex-col overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
            <Icon className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        </div>

        <p className="mt-4 line-clamp-2 text-2xl font-semibold tracking-tight text-slate-900">
          {name}
        </p>

        <div className="mt-auto flex min-h-[22px] flex-1 flex-wrap items-end gap-2 pt-2">
          {subLabel ? <span className="text-xs text-slate-500">{subLabel}</span> : null}
        </div>
      </Card>
    </motion.div>
  );
}

function OverviewCardsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      role="status"
      aria-label="Loading boutique overview"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[136px] rounded-xl" />
      ))}
    </div>
  );
}

export function BoutiqueOverviewCards({ data, isLoading, isError }: BoutiqueOverviewCardsProps) {
  if (isLoading) {
    return <OverviewCardsSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OverviewCard title="Most Viewed Boutique" stat={null} countLabel={() => ""} icon={Eye} />
        <OverviewCard
          title="Most Appointments Booked"
          stat={null}
          countLabel={() => ""}
          icon={CalendarCheck}
        />
        <OverviewCard title="Max Products Showcased" stat={null} countLabel={() => ""} icon={Package} />
      </section>
    );
  }

  const { cards } = data;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <OverviewCard
        title="Most Viewed Boutique"
        stat={cards.mostViewed}
        countLabel={(count) => `${formatCount(count)} views`}
        icon={Eye}
      />
      <OverviewCard
        title="Most Appointments Booked"
        stat={cards.mostAppointments}
        countLabel={(count) => `${formatCount(count)} appointments`}
        icon={CalendarCheck}
      />
      <OverviewCard
        title="Max Products Showcased"
        stat={cards.maxProducts}
        countLabel={(count) => `${formatCount(count)} products`}
        icon={Package}
      />
    </section>
  );
}
