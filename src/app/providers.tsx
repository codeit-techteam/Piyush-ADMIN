"use client";

import { AppProvider } from "@/components/providers/app-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
