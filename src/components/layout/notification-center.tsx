"use client";

import Link from "next/link";
import { Bell, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAdminNotificationsList } from "@/hooks/use-notifications-admin";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: items = [] } = useAdminNotificationsList(8, 0);
  const unread = items.length;

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 transition-all duration-200",
          "hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600",
          open && "border-blue-400 bg-blue-50 text-blue-600",
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96"
          role="dialog"
          aria-label="Notification center"
        >
          <div className="border-b border-slate-100 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <p className="text-xs text-slate-500">Recent platform broadcasts</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-slate-800">No notifications</p>
                <p className="mt-1 text-xs text-slate-500">Sent campaigns will appear here</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`${ROUTES.notifications}/${n.id}`}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 transition-colors duration-200 hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                      {n.created_at ? (
                        <p className="mt-1 text-[10px] text-slate-600">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-slate-100 p-2">
            <Link
              href={ROUTES.notifications}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50"
            >
              View all
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
