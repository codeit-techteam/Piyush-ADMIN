"use client";

import Link from "next/link";
import { BellRing, Send } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import {
  useAdminNotificationsList,
  useNotificationStats,
} from "@/hooks/use-notifications-admin";
import { env } from "@/config/env";
import { ROUTES } from "@/lib/constants/routes";

const backendHint = env.NEXT_PUBLIC_BACKEND_API_URL
  ? `Backend: ${env.NEXT_PUBLIC_BACKEND_API_URL}`
  : "Set NEXT_PUBLIC_BACKEND_API_URL in .env.local";

export default function NotificationsDashboardPage() {
  const statsQuery = useNotificationStats();
  const listQuery = useAdminNotificationsList(30, 0);

  const statsError = statsQuery.isError;
  const listError = listQuery.isError;
  const backendDown = statsError && listError;

  if (backendDown) {
    return (
      <ErrorState
        title="Unable to reach the backend API"
        message={`Start the backend server (npm run dev in /backend, port 5105). ${backendHint}`}
        onRetry={() => {
          void statsQuery.refetch();
          void listQuery.refetch();
        }}
      />
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notification Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Single engine powers bell, notification center, in-app alerts, and push delivery.
          </p>
        </div>
        <Link
          href={ROUTES.notificationsSend}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Send className="mr-2 h-4 w-4" />
          Send Notification
        </Link>
      </div>

      {statsError ? (
        <p className="rounded-md border border-blue-500/30 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Analytics unavailable. {backendHint}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Sent"
            value={statsQuery.isLoading ? "—" : (stats?.totalSent ?? 0)}
          />
          <StatCard title="Unread" value={statsQuery.isLoading ? "—" : (stats?.unread ?? 0)} />
          <StatCard title="Read" value={statsQuery.isLoading ? "—" : (stats?.read ?? 0)} />
          <StatCard
            title="Read Rate"
            value={statsQuery.isLoading ? "—" : `${stats?.readRate ?? 0}%`}
          />
        </div>
      )}

      <Card className="flex items-start gap-4 p-5">
        <div className="rounded-full bg-slate-100 p-3">
          <BellRing className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Centralized engine</h2>
          <p className="mt-1 text-sm text-slate-600">
            All channels read from <code className="text-slate-700">notifications</code> +{" "}
            <code className="text-slate-700">user_notifications</code>. Realtime updates the app;
            Expo Push handles background/closed states.
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Recent notifications</h2>
        {listError ? (
          <p className="mt-3 text-sm text-blue-700">
            Could not load the notification list. Ensure the backend is running on port 5105.
          </p>
        ) : listQuery.isLoading ? (
          <p className="mt-3 text-sm text-slate-600">Loading...</p>
        ) : (listQuery.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No notifications sent yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-800">
            {listQuery.data!.map((row) => (
              <li key={row.id} className="py-3">
                <Link
                  href={ROUTES.notificationDetail(row.id)}
                  className="block hover:text-blue-600"
                >
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">{row.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.type} · {new Date(row.created_at).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
