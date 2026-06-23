import { cn } from "@/lib/utils";

export type StatusTone = "approved" | "pending" | "rejected" | "closed" | "default";

const TONE_STYLES: Record<StatusTone, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-blue-200 bg-blue-50 text-blue-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  closed: "border-slate-200 bg-slate-100 text-slate-600",
  default: "border-slate-200 bg-slate-50 text-slate-600",
};

function normalizeStatus(status: string): StatusTone {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s.includes("suspended")) return "rejected";
  if (s.includes("flagged")) return "pending";
  if (s.includes("correction")) return "pending";
  if (
    s.includes("approved") ||
    s.includes("verified") ||
    s.includes("active") ||
    s.includes("completed") ||
    s.includes("resolved") ||
    s.includes("delivered")
  ) {
    return "approved";
  }
  if (
    s.includes("pending") ||
    s.includes("awaiting") ||
    s.includes("open") ||
    s.includes("new") ||
    s.includes("assigned")
  ) {
    return "pending";
  }
  if (s.includes("reject") || s.includes("cancel") || s.includes("failed") || s.includes("blocked")) {
    return "rejected";
  }
  if (s.includes("closed") || s.includes("inactive") || s.includes("archived")) {
    return "closed";
  }
  return "default";
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = normalizeStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        TONE_STYLES[tone],
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
