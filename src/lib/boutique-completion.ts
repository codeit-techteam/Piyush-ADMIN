import { MIN_PRODUCTS_FOR_LAUNCH } from "@/lib/jeweller-documents";
import { isPendingStoreStatus } from "@/lib/boutique-approval";
import type { Boutique, StoreApprovalStatus } from "@/types";

export interface BoutiqueCompletionChecks {
  businessInfo: boolean;
  branding: boolean;
  gstDocument: boolean;
  bisDocument: boolean;
  minProducts: boolean;
}

export interface BoutiqueCompletionMeta {
  gstDocument: boolean;
  bisDocument: boolean;
  activeProductCount: number;
}

export interface BoutiqueCompletionResult {
  checks: BoutiqueCompletionChecks;
  activeProductCount: number;
  missingLabels: string[];
  isComplete: boolean;
  readyToApprove: boolean;
}

export function normalizeDocType(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();
}

export function hasDocumentType(
  docs: Array<{ type: string; file_url?: string | null }>,
  ...types: string[]
): boolean {
  const wanted = types.map((t) => normalizeDocType(t));
  return docs.some((doc) => {
    if (!doc.file_url?.trim()) return false;
    const kind = normalizeDocType(doc.type);
    return wanted.some((t) => kind === t || kind.includes(t));
  });
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function resolvePhone(boutique: Boutique): string | null {
  return boutique.phone_number ?? boutique.contact_number ?? null;
}

function resolveAddress(boutique: Boutique): string | null {
  return boutique.full_address ?? boutique.address ?? boutique.location ?? null;
}

export function getCompletionStatus(
  boutique: Boutique,
  meta: BoutiqueCompletionMeta,
): BoutiqueCompletionResult {
  const checks: BoutiqueCompletionChecks = {
    businessInfo:
      hasText(boutique.name) &&
      hasText(boutique.owner_name) &&
      hasText(resolvePhone(boutique)) &&
      hasText(resolveAddress(boutique)),
    branding: hasText(boutique.logo_url),
    gstDocument: meta.gstDocument,
    bisDocument: meta.bisDocument,
    minProducts: meta.activeProductCount >= MIN_PRODUCTS_FOR_LAUNCH,
  };

  const missingLabels: string[] = [];
  if (!checks.businessInfo) missingLabels.push("Business info");
  if (!checks.branding) missingLabels.push("Store logo");
  if (!checks.gstDocument) missingLabels.push("GST certificate");
  if (!checks.bisDocument) missingLabels.push("BIS certificate");
  if (!checks.minProducts) {
    const remaining = Math.max(0, MIN_PRODUCTS_FOR_LAUNCH - meta.activeProductCount);
    missingLabels.push(
      remaining > 0
        ? `${remaining} more product${remaining === 1 ? "" : "s"} needed`
        : `${MIN_PRODUCTS_FOR_LAUNCH} active products required`,
    );
  }

  const isComplete = Object.values(checks).every(Boolean);
  const storeStatus = (boutique.store_status ?? "pending").toLowerCase() as StoreApprovalStatus;

  return {
    checks,
    activeProductCount: meta.activeProductCount,
    missingLabels,
    isComplete,
    readyToApprove: isComplete && storeStatus === "review",
  };
}

export function completionTooltip(result: BoutiqueCompletionResult): string {
  if (result.isComplete) {
    return "All onboarding requirements complete";
  }
  return `Missing: ${result.missingLabels.join(", ")}`;
}

export function shouldShowCompletion(boutique: Boutique): boolean {
  return boutique.is_self_managed && isPendingStoreStatus(boutique.store_status);
}

export function rowHighlightClass(
  boutique: Boutique,
  completion: BoutiqueCompletionResult | null,
): string {
  const storeStatus = (boutique.store_status ?? "pending").toLowerCase();

  if (storeStatus === "review") {
    return "bg-emerald-50/60 hover:bg-emerald-50 focus:bg-emerald-50";
  }

  if (storeStatus === "pending" && completion && !completion.isComplete) {
    return "bg-amber-50/70 hover:bg-amber-50 focus:bg-amber-50";
  }

  return "hover:bg-slate-50 focus:bg-slate-50";
}

export { MIN_PRODUCTS_FOR_LAUNCH };
