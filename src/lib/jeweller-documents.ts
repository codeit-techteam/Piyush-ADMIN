import type { BoutiqueVerificationStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const JEWELLER_DOCUMENTS_BUCKET = "jeweller-documents";

/** Minimum products required before a jeweller can launch (matches Jewellers App). */
export const MIN_PRODUCTS_FOR_LAUNCH = 5;

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

function decodeRepeatedly(value: string, maxPasses = 4): string {
  let current = value;
  for (let i = 0; i < maxPasses; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

/**
 * Extract the storage object key from a full public/signed URL or a raw path.
 * Example key: `{boutiqueId}/gst/1779772081256-Johnson George - SOW.pdf`
 */
export function extractJewellerDocumentStoragePath(
  fileUrl: string | null | undefined,
): string | null {
  if (!fileUrl?.trim()) return null;

  let value = fileUrl.trim().split("?")[0]?.split("#")[0] ?? "";

  const bucketMarkers = [
    `/storage/v1/object/public/${JEWELLER_DOCUMENTS_BUCKET}/`,
    `/storage/v1/object/sign/${JEWELLER_DOCUMENTS_BUCKET}/`,
    `/object/public/${JEWELLER_DOCUMENTS_BUCKET}/`,
    `${JEWELLER_DOCUMENTS_BUCKET}/`,
  ];

  for (const marker of bucketMarkers) {
    const index = value.indexOf(marker);
    if (index >= 0) {
      value = value.slice(index + marker.length);
      break;
    }
  }

  value = decodeRepeatedly(value.replace(/^\/+/, ""));
  return value || null;
}

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(decodeRepeatedly(segment)))
    .join("/");
}

/**
 * Build a public HTTPS URL for a jeweller-documents object.
 * Handles raw storage paths and legacy/double-encoded full URLs.
 */
export function resolveJewellerDocumentUrl(
  fileUrl: string | null | undefined,
  supabaseUrl: string,
): string | null {
  if (!fileUrl?.trim()) return null;

  const trimmed = fileUrl.trim();
  if (!supabaseUrl?.trim()) {
    return trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : null;
  }

  const storagePath = extractJewellerDocumentStoragePath(trimmed);
  if (!storagePath) return null;

  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${JEWELLER_DOCUMENTS_BUCKET}/${encodeStoragePath(storagePath)}`;
}

/** Server-side resolver — uses Supabase getPublicUrl for canonical encoding. */
export function resolveJewellerDocumentUrlWithClient(
  supabase: SupabaseClient,
  fileUrl: string | null | undefined,
  supabaseUrl: string,
): string | null {
  const storagePath = extractJewellerDocumentStoragePath(fileUrl);
  if (!storagePath) return null;

  const { data } = supabase.storage
    .from(JEWELLER_DOCUMENTS_BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = data.publicUrl?.trim();
  if (publicUrl) return publicUrl;

  return resolveJewellerDocumentUrl(fileUrl, supabaseUrl);
}

export function isImageUrl(url: string): boolean {
  const path = extractJewellerDocumentStoragePath(url) ?? url;
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(path);
}

export function isPdfUrl(url: string): boolean {
  const path = extractJewellerDocumentStoragePath(url) ?? url;
  return /\.pdf(\?|$)/i.test(path);
}

export { JEWELLER_DOCUMENTS_BUCKET };
