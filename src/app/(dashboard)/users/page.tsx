"use client";

import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { useUsers } from "@/hooks/use-users";

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

export default function UsersPage() {
  const usersQuery = useUsers();
  const users = usersQuery.data ?? [];

  if (usersQuery.isLoading) {
    return <UsersTableSkeleton />;
  }

  if (usersQuery.isError) {
    return <ErrorState message={usersQuery.error.message} onRetry={() => usersQuery.refetch()} />;
  }

  return (
    <section className="space-y-8">
      <PageHeader title="Users Management" />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="New signups will appear here automatically."
          hint="Refresh to pull the latest profiles"
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="admin-table min-w-[900px]">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Profile</th>
                <th className="px-4 py-3 font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 font-medium text-slate-700">Phone</th>
                <th className="px-4 py-3 font-medium text-slate-700">Joined</th>
                <th className="px-4 py-3 font-medium text-slate-700">Id</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="align-middle">
                  <td>
                    {user.profile_image ? (
                      <img src={user.profile_image} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                        N/A
                      </div>
                    )}
                  </td>
                  <td>{user.name}</td>
                  <td>{user.phone ?? "-"}</td>
                  <td>
                    {user.created_at ? new Date(user.created_at).toLocaleString() : "-"}
                  </td>
                  <td className="font-mono text-xs text-slate-500">{user.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  );
}
