"use client";

import { format } from "date-fns";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NotificationCenter } from "@/components/layout/notification-center";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function Navbar() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      clearInterval(tick);
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearAuth();
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  const dateLabel = format(now, "EEE, MMM d, yyyy");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0 flex-1">
          <Breadcrumbs />
        </div>

        <div className="hidden items-center text-xs text-slate-500 xl:flex">
          <span className="tabular-nums text-slate-600">{dateLabel}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
