"use client";

import { Download, FileText } from "lucide-react";
import { getAnalyticsExportUrl } from "@/lib/api/services/analytics";
import type { DashboardLayer, DateRangeQuery } from "@/types/analytics";
import { cn } from "@/lib/utils";

interface ExportToolbarProps {
  layer: DashboardLayer;
  query: DateRangeQuery;
}

export function ExportToolbar({ layer, query }: ExportToolbarProps) {
  const handleExport = (format: "csv" | "pdf") => {
    const url = getAnalyticsExportUrl(layer, format, query);
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_access_token") : null;
    if (token) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" })
        .then((res) => res.blob())
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = `${layer}-analytics.${format}`;
          link.click();
          URL.revokeObjectURL(objectUrl);
        })
        .catch(() => window.open(url, "_blank"));
      return;
    }
    window.open(url, "_blank");
  };

  const btnClass = cn(
    "btn-glass inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700",
    "transition-all duration-200 hover:text-blue-700",
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => handleExport("csv")} className={btnClass}>
        <Download className="h-3.5 w-3.5" />
        Export CSV
      </button>
      <button type="button" onClick={() => handleExport("pdf")} className={btnClass}>
        <FileText className="h-3.5 w-3.5" />
        Export PDF
      </button>
    </div>
  );
}
