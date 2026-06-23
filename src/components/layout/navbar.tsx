"use client";

import { format } from "date-fns";
import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NotificationCenter } from "@/components/layout/notification-center";
import { Button } from "@/components/ui/button";
import { sidebarNav } from "@/lib/constants/navigation";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [now, setNow] = useState(() => new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastSync, setLastSync] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    const syncTick = setInterval(() => setLastSync(new Date()), 30_000);
    return () => {
      clearInterval(tick);
      clearInterval(syncTick);
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearAuth();
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return sidebarNav.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery]);

  const goToNav = useCallback(
    (href: string) => {
      setSearchOpen(false);
      setSearchQuery("");
      router.push(href);
    },
    [router],
  );

  const dateLabel = format(now, "EEE, MMM d, yyyy");
  const syncLabel = format(lastSync, "h:mm a");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0 flex-1">
          <Breadcrumbs />
        </div>

        <div className="hidden items-center gap-4 text-xs text-slate-500 xl:flex">
          <span className="tabular-nums text-slate-600">{dateLabel}</span>
          <span className="h-3 w-px bg-slate-200" aria-hidden />
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Synced {syncLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 transition-all duration-200",
                "hover:border-blue-300 hover:text-slate-700",
                searchOpen && "border-blue-400 bg-blue-50/50",
              )}
              aria-label="Quick search"
              aria-expanded={searchOpen}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Search…</span>
            </button>
            {searchOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-80">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find a page…"
                  className="focus-gold w-full border-b border-slate-100 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                  autoFocus
                />
                <ul className="max-h-48 overflow-y-auto py-1">
                  {searchResults.length === 0 ? (
                    <li className="px-4 py-6 text-center text-xs text-slate-500">
                      {searchQuery ? "No matching pages" : "Type to search navigation"}
                    </li>
                  ) : (
                    searchResults.map((item) => (
                      <li key={item.href}>
                        <button
                          type="button"
                          onClick={() => goToNav(item.href)}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {item.title}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>

          <NotificationCenter />

          <div
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-semibold text-white sm:flex"
            aria-hidden
            title="Admin"
          >
            GH
          </div>

          <Button variant="outline" size="sm" onClick={logout} className="hidden sm:inline-flex">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <Button variant="outline" size="sm" onClick={logout} className="sm:hidden" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
