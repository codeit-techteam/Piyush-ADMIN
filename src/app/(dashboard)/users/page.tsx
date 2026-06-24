"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowDownAZ, ArrowUpAZ, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { useUsers } from "@/hooks/use-users";
import { ROUTES } from "@/lib/constants/routes";

type JoinSort = "newest" | "oldest";

function UsersTableSkeleton() {
  return (
    <Card className="space-y-4">
      <Skeleton className="h-10 w-48" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </Card>
  );
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export default function UsersPage() {
  const router = useRouter();
  const usersQuery = useUsers();
  const users = usersQuery.data ?? [];
  const [search, setSearch] = useState("");
  const [joinSort, setJoinSort] = useState<JoinSort>("newest");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const phoneQuery = normalizePhone(search);

    let result = users.filter((user) => {
      if (!query) return true;
      const nameMatch = user.name.toLowerCase().includes(query);
      const phoneMatch =
        phoneQuery.length > 0 &&
        user.phone != null &&
        normalizePhone(user.phone).includes(phoneQuery);
      return nameMatch || phoneMatch;
    });

    result = [...result].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return joinSort === "newest" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [users, search, joinSort]);

  if (usersQuery.isLoading) {
    return <UsersTableSkeleton />;
  }

  if (usersQuery.isError) {
    return <ErrorState message={usersQuery.error.message} onRetry={() => usersQuery.refetch()} />;
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Customers Management"
        subtitle={
          users.length > 0
            ? `${users.length} registered customer${users.length === 1 ? "" : "s"}`
            : "Customer profiles from the marketplace app."
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or mobile number…"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setJoinSort((current) => (current === "newest" ? "oldest" : "newest"))}
          className="shrink-0"
        >
          {joinSort === "newest" ? (
            <ArrowDownAZ className="mr-2 h-4 w-4" />
          ) : (
            <ArrowUpAZ className="mr-2 h-4 w-4" />
          )}
          {joinSort === "newest" ? "Newest first" : "Oldest first"}
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="New signups will appear here automatically."
          hint="Refresh to pull the latest profiles"
        />
      ) : filteredUsers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600">No customers match your search.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="admin-table min-w-[720px]">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Profile</th>
                <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 font-medium text-slate-700">Phone</th>
                <th className="px-4 py-3 font-medium text-slate-700">Appointments</th>
                <th className="px-4 py-3 font-medium text-slate-700">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(ROUTES.userDetails(user.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(ROUTES.userDetails(user.id));
                    }
                  }}
                  className="cursor-pointer align-middle transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <td className="px-4 py-3">
                    {user.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profile_image}
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{user.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{user.appointments_count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.created_at
                      ? format(new Date(user.created_at), "dd MMM yyyy, h:mm a")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}
