"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
