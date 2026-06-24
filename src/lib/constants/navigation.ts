import {
  Bell,
  CalendarClock,
  Headphones,
  MessageCircle,
  LayoutDashboard,
  Building2,
  Package,
  Sparkles,
  Users,
} from "lucide-react";
import { ROUTES } from "./routes";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  badgeKey?: "jeweller_pending";
};

// Workaround: import React type for NavItem without importing React itself
import type React from "react";

export const sidebarNav: NavItem[] = [
  { title: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
  { title: "Products", href: ROUTES.products, icon: Package },
  { title: "Collections", href: ROUTES.collections, icon: Sparkles },
  { title: "Occasions", href: ROUTES.occasions, icon: CalendarClock },
  {
    title: "Boutiques",
    href: ROUTES.boutiques,
    icon: Building2,
    badgeKey: "jeweller_pending",
  },
  { title: "Customers", href: ROUTES.users, icon: Users },
  { title: "Notification Management", href: ROUTES.notifications, icon: Bell },
  { title: "Appointments", href: ROUTES.appointments, icon: CalendarClock },
  { title: "Support Center", href: ROUTES.supportCenter, icon: MessageCircle },
  {
    title: "Callback Requests",
    href: ROUTES.supportCallbackRequests,
    icon: Headphones,
  },
];
