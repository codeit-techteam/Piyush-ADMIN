"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { fetchAdminNotificationDetail } from "@/lib/api/services/notifications";
import { ROUTES } from "@/lib/constants/routes";

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notification-detail", id],
    queryFn: () => fetchAdminNotificationDetail(id),
    enabled: Boolean(id),
  });

  if (isError) {
    return (
      <ErrorState
        title="Unable to load notification"
        message="The notification may have been removed or the API is unavailable."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={ROUTES.notifications}
        className="inline-flex h-9 items-center text-sm text-slate-700 hover:text-slate-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to dashboard
      </Link>

      {isLoading || !data ? (
        <p className="text-slate-600">Loading...</p>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{data.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Sent {new Date(data.created_at).toLocaleString()} · {data.type} · Audience:{" "}
              {String(data.audience)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Recipients" value={data.totalRecipients} />
            <StatCard title="Read" value={data.readCount} />
            <StatCard title="Unread" value={data.unreadCount} />
            <StatCard title="Read Rate" value={`${data.readRate}%`} />
          </div>

          <Card className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p>
            <p className="text-slate-800">{data.message}</p>
            {data.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.image} alt="" className="mt-3 max-h-48 rounded-lg object-cover" />
            ) : null}
            <p className="text-xs text-slate-500">
              Action: {data.action_type ?? "none"}
              {data.action_id ? ` · ${data.action_id}` : ""}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
