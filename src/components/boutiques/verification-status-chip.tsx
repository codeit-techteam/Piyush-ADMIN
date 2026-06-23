import type { BoutiqueVerificationStatus } from "@/types";

export function VerificationStatusChip({ status }: { status?: BoutiqueVerificationStatus }) {
  const value = (status ?? "PENDING").toUpperCase();
  if (value === "APPROVED") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Approved
      </span>
    );
  }
  if (value === "REJECTED") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Pending
    </span>
  );
}
