import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  header: string;
  /** Render status pills for this column when values look like statuses */
  asStatus?: boolean;
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  getRowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  className?: string;
  /** Render table only (no outer Card) — for use inside an existing Card */
  bare?: boolean;
}

const STATUS_KEYS = new Set([
  "status",
  "store_status",
  "storeStatus",
  "deliveryStatus",
]);

export function DataTable<T extends object>({
  columns,
  data,
  getRowKey,
  onRowClick,
  className,
  bare,
}: DataTableProps<T>) {
  const table = (
    <div className={cn("overflow-x-auto", className)}>
      <table className="admin-table min-w-[780px]">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} scope="col">
                  <span className="inline-flex items-center gap-1">
                    {column.header}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={getRowKey ? getRowKey(row, idx) : idx}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => {
                  const raw = row[column.key];
                  const str = String(raw ?? "-");
                  const showStatus =
                    column.asStatus ||
                    STATUS_KEYS.has(String(column.key)) ||
                    (typeof raw === "string" &&
                      /pending|approved|reject|closed|active|open/i.test(str));

                  return (
                    <td key={String(column.key)}>
                      {showStatus && raw && str !== "-" ? (
                        <StatusBadge status={str} />
                      ) : (
                        str
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
      </table>
    </div>
  );

  if (bare) return table;
  return <Card className="overflow-hidden p-0">{table}</Card>;
}
