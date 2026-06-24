"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/error-state";
import {
  useAdminNotificationsList,
  useNotificationStats,
} from "@/hooks/use-notifications-admin";
import { env } from "@/config/env";
import { ROUTES } from "@/lib/constants/routes";

const PAGE_SIZE = 10;

const backendHint = env.NEXT_PUBLIC_BACKEND_API_URL
  ? `Backend: ${env.NEXT_PUBLIC_BACKEND_API_URL}`
  : "Set NEXT_PUBLIC_BACKEND_API_URL in .env.local";

export default function NotificationsDashboardPage() {
  const [page, setPage] = useState(1);
  const offset = (page - 1) * PAGE_SIZE;

  const statsQuery = useNotificationStats();
  const listQuery = useAdminNotificationsList(PAGE_SIZE, offset);

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

  const totalSent = statsQuery.data?.totalSent ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalSent / PAGE_SIZE));
  const notifications = listQuery.data ?? [];
  const hasNextPage = page < totalPages && notifications.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notification Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Single engine powers bell, notification center, in-app alerts, and push delivery.
          </p>
          <p className="mt-2 text-sm text-slate-700">
            {statsQuery.isLoading
              ? "Loading notification count…"
              : `${totalSent} notification${totalSent === 1 ? "" : "s"} sent`}
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

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-slate-900">Recent notifications</h2>
        {listError ? (
          <p className="mt-3 text-sm text-blue-700">
            Could not load the notification list. Ensure the backend is running on port 5105.
          </p>
        ) : listQuery.isLoading ? (
          <p className="mt-3 text-sm text-slate-600">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No notifications sent yet.</p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-slate-200">
              {notifications.map((row) => (
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

            {totalSent > PAGE_SIZE || page > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || listQuery.isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage || listQuery.isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
