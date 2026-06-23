"use client";

import { Card } from "@/components/ui/card";
import type { RankedItem } from "@/types/analytics";

interface RankedListProps {
  title: string;
  items: RankedItem[];
  emptyLabel?: string;
}

export function RankedList({ title, items, emptyLabel = "No data yet" }: RankedListProps) {
  return (
    <Card className="h-full">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50"
            >
              <span className="truncate text-slate-700">
                <span className="mr-2 font-medium text-blue-600">#{index + 1}</span>
                {item.label}
              </span>
              <span className="ml-2 shrink-0 font-semibold tabular-nums text-blue-700">
                {item.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
