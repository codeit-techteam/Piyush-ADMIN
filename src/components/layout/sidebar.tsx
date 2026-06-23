"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { sidebarNav } from "@/lib/constants/navigation";
import { listBoutiques } from "@/lib/api/services/boutiques";
import { isAwaitingAdminReview } from "@/lib/jeweller-documents";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/logo";

function useJewellerPendingCount() {
  const { data } = useQuery({
    queryKey: ["boutiques", "pending-count"],
    queryFn: listBoutiques,
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 1,
    throwOnError: false,
  });
  if (!data) return 0;
  return data.filter(
    (b) => b.is_self_managed && isAwaitingAdminReview(b.verification_status, b.store_status),
  ).length;
}

export function Sidebar() {
  const pathname = usePathname();
  const pendingCount = useJewellerPendingCount();

  return (
    <aside className="hidden w-[17.5rem] shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col px-4 py-6">
        <div className="mb-10 px-1">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Main navigation">
          {sidebarNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            const badge =
              item.badgeKey === "jeweller_pending" && pendingCount > 0
                ? pendingCount
                : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "sidebar-link-active pl-[calc(0.75rem-3px)] text-blue-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                    active ? "text-blue-600" : "text-slate-600 group-hover:text-blue-600",
                  )}
                />
                <span className="flex-1 leading-snug">{item.title}</span>
                {badge !== null ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 rounded-xl border border-slate-200 bg-blue-50/50 px-3 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Platform</p>
          <p className="mt-0.5 text-xs text-slate-600">Jewellery marketplace admin</p>
        </div>
      </div>
    </aside>
  );
}
