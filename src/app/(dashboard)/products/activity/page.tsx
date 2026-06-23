"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/feedback/error-state";
import { DashboardSkeleton } from "@/components/loaders/dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getProductActivityFeed } from "@/lib/api/services/product-governance";

const ACTION_TYPES = [
  { value: "", label: "All actions" },
  { value: "edit", label: "Jeweller edits" },
  { value: "flag", label: "Flags" },
  { value: "suspend", label: "Suspensions" },
  { value: "correction", label: "Correction requests" },
];

function actionLabel(type: string) {
  switch (type) {
    case "edit":
      return "Jeweller edit";
    case "flag":
      return "Flag";
    case "suspend":
      return "Suspension";
    case "correction":
      return "Correction request";
    default:
      return type;
  }
}

export default function ProductActivityPage() {
  const router = useRouter();
  const [actionType, setActionType] = useState("");
  const [jewellerId, setJewellerId] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["product-activity", actionType, jewellerId],
    queryFn: () =>
      getProductActivityFeed({
        action_type: actionType || undefined,
        jeweller_id: jewellerId.trim() || undefined,
        limit: 100,
      }),
  });

  const events = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Product Activity Feed</h1>
          <p className="text-sm text-slate-600">
            Recent jeweller edits, flags, suspensions, and correction requests across the platform.
          </p>
        </div>
        <Button onClick={() => router.push("/products")} variant="outline">
          Back to Products
        </Button>
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-3">
        <Select
          className="w-full"
          onChange={(e) => setActionType(e.target.value)}
          value={actionType}
        >
          {ACTION_TYPES.map((item) => (
            <option key={item.value || "all"} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input
          onChange={(e) => setJewellerId(e.target.value)}
          placeholder="Filter by jeweller user ID"
          value={jewellerId}
        />
        <Button onClick={() => refetch()} variant="outline">
          Refresh
        </Button>
      </Card>

      {isLoading ? <DashboardSkeleton /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isLoading && !isError ? (
        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-slate-600">No activity recorded yet.</p>
          ) : (
            events.map((event) => (
              <Card
                key={`${event.action_type}-${event.id}`}
                className="cursor-pointer space-y-2 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                onClick={() => router.push(`/products/${event.product_id}`)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {actionLabel(event.action_type)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {format(new Date(event.created_at), "dd MMM yyyy, hh:mm a")}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  Product: {event.product_name ?? event.product_id}
                </p>
                {event.action_type === "edit" ? (
                  <p className="text-sm text-slate-600">
                    {event.field_name}: {event.old_value ?? "—"} → {event.new_value ?? "—"}
                  </p>
                ) : null}
                {event.action_type === "flag" ? (
                  <p className="text-sm text-amber-800">
                    {event.reason_code}
                    {event.reason_text ? ` — ${event.reason_text}` : ""}
                  </p>
                ) : null}
                {event.action_type === "suspend" ? (
                  <p className="text-sm text-red-700">{event.reason_text}</p>
                ) : null}
                {event.action_type === "correction" ? (
                  <p className="text-sm text-yellow-800">
                    Field: {event.field_name} — {event.message}
                  </p>
                ) : null}
              </Card>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
