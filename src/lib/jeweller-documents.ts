const JEWELLER_DOCUMENTS_BUCKET = "jeweller-documents";

/** Minimum products required before a jeweller can launch (matches Jewellers App). */
export const MIN_PRODUCTS_FOR_LAUNCH = 5;

import type { BoutiqueVerificationStatus } from "@/types";

/**
 * True when document verification is pending admin review.
 * Supports legacy store_status=review and new verification_status=PENDING.
 */
export function isAwaitingAdminReview(
  verificationStatus: BoutiqueVerificationStatus | string | null | undefined,
  storeStatus?: string | null,
): boolean {
  const verification = (verificationStatus ?? "").toUpperCase();
  if (verification === "PENDING") return true;
  if (verification === "APPROVED" || verification === "REJECTED") return false;
  return (storeStatus ?? "").toLowerCase() === "review";
}

export function verificationStatusLabel(
  status: BoutiqueVerificationStatus | string | null | undefined,
): string {
  const value = (status ?? "PENDING").toUpperCase();
  if (value === "APPROVED") return "Approved";
  if (value === "REJECTED") return "Rejected";
  return "Pending";
}

/** @deprecated Use isAwaitingAdminReview — kept for call-site clarity during migration */
export function isPendingApprovalStatus(
  verificationStatus: string | null | undefined,
  storeStatus?: string | null,
): boolean {
  return isAwaitingAdminReview(verificationStatus, storeStatus);
}

export function resolveJewellerDocumentUrl(
  fileUrl: string | null | undefined,
  supabaseUrl: string,
): string | null {
  if (!fileUrl?.trim()) return null;
  const trimmed = fileUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const base = supabaseUrl.replace(/\/$/, "");
  const path = trimmed.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${JEWELLER_DOCUMENTS_BUCKET}/${path}`;
}

export function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

export { JEWELLER_DOCUMENTS_BUCKET };
