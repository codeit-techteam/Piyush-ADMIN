"use client";

import { memo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnalyticsCard } from "@/components/analytics/analytics-card";

export interface ExpandableTableColumn<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface ExpandableTableProps<T> {
  title: string;
  columns: ExpandableTableColumn<T>[];
  rows: T[];
  initialVisible?: number;
  emptyLabel?: string;
  getRowKey: (row: T, index: number) => string;
}

function ExpandableTableInner<T>({
  title,
  columns,
  rows,
  initialVisible = 5,
  emptyLabel = "No data",
  getRowKey,
}: ExpandableTableProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, initialVisible);
  const hasMore = rows.length > initialVisible;

  return (
    <AnalyticsCard title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  {columns.map((col) => (
                    <th key={col.key} className={`pb-2 pr-3 font-medium ${col.className ?? ""}`}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={getRowKey(row, index)} className="border-b border-slate-50 last:border-0">
                    {columns.map((col) => (
                      <td key={col.key} className={`py-2.5 pr-3 ${col.className ?? ""}`}>
                        {col.render(row, index)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-blue-700 hover:underline"
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  See more ({rows.length - initialVisible}) <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          ) : null}
        </>
      )}
    </AnalyticsCard>
  );
}

export const ExpandableTable = memo(ExpandableTableInner) as typeof ExpandableTableInner;
