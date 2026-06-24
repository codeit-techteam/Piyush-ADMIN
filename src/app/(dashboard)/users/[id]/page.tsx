"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, CalendarClock, Heart, Loader2, Package, User } from "lucide-react";
import { toast } from "sonner";
import {
  ReviewField,
  ReviewFieldGrid,
  ReviewSection,
} from "@/components/store-review/review-field-grid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUserDetails } from "@/hooks/use-user-details";
import { setCustomerAccountStatus } from "@/lib/api/services/users";
import { ROUTES } from "@/lib/constants/routes";
import { useState } from "react";

function formatPrice(price: number) {
  return `₹${Number(price ?? 0).toLocaleString("en-IN")}`;
}

function formatAppointmentWhen(date: string | null, time: string | null, startsAt: string | null) {
  if (startsAt) {
    return format(new Date(startsAt), "dd MMM yyyy, h:mm a");
  }
  if (date && time) return `${date} · ${time}`;
  return date ?? time ?? "—";
}

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useUserDetails(params.id);
  const user = query.data;
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleAccountStatus = async (action: "terminate" | "reactivate") => {
    if (!user) return;
    const confirmed = window.confirm(
      action === "terminate"
        ? `Terminate ${user.name}'s account? They will not be able to sign in again until reactivated.`
        : `Reactivate ${user.name}'s account? They will be able to sign in again.`,
    );
    if (!confirmed) return;

    setIsUpdatingStatus(true);
    try {
      await setCustomerAccountStatus(user.id, action);
      await queryClient.invalidateQueries({ queryKey: ["users", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        action === "terminate" ? "Customer account terminated" : "Customer account reactivated",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update account");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (query.isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </section>
    );
  }

  if (query.isError || !user) {
    return (
      <ErrorState
        message={query.error?.message ?? "Customer not found"}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <section className="space-y-6 pb-8">
      <div className="space-y-2">
        <Link
          href={ROUTES.users}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {user.profile_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_image}
              alt={user.name}
              className="h-16 w-16 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
              <User className="h-7 w-7 text-slate-400" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-600">Customer profile</p>
          </div>
          {user.is_terminated ? (
            <StatusBadge status="terminated" className="mt-1" />
          ) : (
            <StatusBadge status="active" className="mt-1" />
          )}
          </div>
          <div className="flex gap-2">
            {user.is_terminated ? (
              <Button
                variant="outline"
                disabled={isUpdatingStatus}
                onClick={() => void handleAccountStatus("reactivate")}
              >
                {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reactivate account
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={isUpdatingStatus}
                onClick={() => void handleAccountStatus("terminate")}
              >
                {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Terminate account
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="space-y-5 p-5">
        <ReviewSection title="Contact details">
          <ReviewFieldGrid>
            <ReviewField label="Name" value={user.name} />
            <ReviewField label="Mobile" value={user.phone} />
            <ReviewField label="Email" value={user.email} />
            <ReviewField
              label="Joined"
              value={
                user.created_at
                  ? format(new Date(user.created_at), "dd MMM yyyy, h:mm a")
                  : null
              }
            />
          </ReviewFieldGrid>
        </ReviewSection>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">Appointments</h2>
          </div>
          <span className="text-sm text-slate-500">{user.appointments.length} total</span>
        </div>

        {user.appointments.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No appointments booked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[720px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-700">Boutique</th>
                  <th className="px-3 py-2 font-medium text-slate-700">When</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Type</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {user.appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-slate-200/70 align-middle">
                    <td className="px-3 py-3 text-slate-900">
                      {appointment.boutique_name ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatAppointmentWhen(
                        appointment.date,
                        appointment.time,
                        appointment.starts_at,
                      )}
                    </td>
                    <td className="px-3 py-3 capitalize text-slate-700">
                      {appointment.type ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={appointment.status ?? "upcoming"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">Wishlist</h2>
          </div>
          <span className="text-sm text-slate-500">{user.wishlist.length} saved</span>
        </div>

        {user.wishlist.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No wishlisted products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[640px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-700">Product</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Price</th>
                  <th className="px-3 py-2 font-medium text-slate-700">Saved on</th>
                </tr>
              </thead>
              <tbody>
                {user.wishlist.map((item) => (
                  <tr
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (item.product?.id) {
                        router.push(ROUTES.productDetails(item.product.id));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        (e.key === "Enter" || e.key === " ") &&
                        item.product?.id
                      ) {
                        e.preventDefault();
                        router.push(ROUTES.productDetails(item.product.id));
                      }
                    }}
                    className="cursor-pointer border-b border-slate-200/70 align-middle transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {item.product?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                            <Package className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <span className="font-medium text-slate-900">
                          {item.product?.name ?? "Unknown product"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {item.product ? formatPrice(item.product.price) : "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {item.created_at
                        ? format(new Date(item.created_at), "dd MMM yyyy")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
