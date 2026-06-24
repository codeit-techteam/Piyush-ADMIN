"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { sidebarNav } from "@/lib/constants/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  categories: "Categories",
  collections: "Collections",
  occasions: "Occasions",
  "featured-sections": "Featured Sections",
  "menu-categories": "Menu Categories",
  offers: "Offers",
  gifts: "Gifts",
  "relationship-sections": "Shop by Relationship",
  boutiques: "Boutiques",
  "jeweller-approvals": "Boutiques",
  users: "Users",
  notifications: "Notifications",
  send: "Send",
  appointments: "Appointments",
  support: "Support",
  chat: "Support Center",
  "callback-requests": "Callback Requests",
  new: "New",
};

function resolveLabel(segment: string, path: string): string {
  const nav = sidebarNav.find(
    (item) => item.href === path || item.href.endsWith(`/${segment}`),
  );
  if (nav) return nav.title;
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ");
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        <span className="font-medium text-blue-700">Dashboard</span>
      </nav>
    );
  }

  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({ href: acc, label: resolveLabel(seg, acc) });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
      <Link
        href={ROUTES.dashboard}
        className="flex shrink-0 items-center text-slate-600 transition-colors duration-200 hover:text-blue-600"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-700" aria-hidden />
            {isLast ? (
              <span className="truncate font-medium text-blue-700">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-slate-500 transition-colors duration-200 hover:text-slate-800"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function BreadcrumbsCompact({ className }: { className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <Breadcrumbs />
    </div>
  );
}
