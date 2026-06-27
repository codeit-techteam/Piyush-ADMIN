"use client";

import {
  completionTooltip,
  getCompletionStatus,
  MIN_PRODUCTS_FOR_LAUNCH,
  shouldShowCompletion,
  type BoutiqueCompletionMeta,
  type BoutiqueCompletionResult,
} from "@/lib/boutique-completion";
import type { Boutique } from "@/types";

function CompletionChip({
  label,
  done,
  detail,
}: {
  label: string;
  done: boolean;
  detail?: string;
}) {
  return (
    <span
      title={detail}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
        done
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <span aria-hidden>{done ? "✅" : "❌"}</span>
      {label}
    </span>
  );
}

export function BoutiqueCompletionSummary({
  boutique,
  meta,
}: {
  boutique: Boutique;
  meta?: BoutiqueCompletionMeta;
}) {
  if (!shouldShowCompletion(boutique)) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const fallbackMeta: BoutiqueCompletionMeta = {
    gstDocument: false,
    bisDocument: false,
    activeProductCount: boutique.products_count ?? 0,
  };

  const result = getCompletionStatus(boutique, meta ?? fallbackMeta);

  if (result.isComplete) {
    return (
      <span
        title={completionTooltip(result)}
        className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
      >
        Ready to Approve
      </span>
    );
  }

  const productLabel = `Products ${result.activeProductCount}/${MIN_PRODUCTS_FOR_LAUNCH}`;

  return (
    <div
      title={completionTooltip(result)}
      className="flex max-w-[320px] flex-wrap gap-1"
    >
      <CompletionChip label="Info" done={result.checks.businessInfo} />
      <CompletionChip label="Brand" done={result.checks.branding} />
      <CompletionChip label="GST" done={result.checks.gstDocument} />
      <CompletionChip label="BIS" done={result.checks.bisDocument} />
      <CompletionChip
        label={productLabel}
        done={result.checks.minProducts}
        detail={
          result.checks.minProducts
            ? undefined
            : `${Math.max(0, MIN_PRODUCTS_FOR_LAUNCH - result.activeProductCount)} more products needed`
        }
      />
    </div>
  );
}

export function ApprovalStatusBadge({
  boutique,
  completion,
}: {
  boutique: Boutique;
  completion: BoutiqueCompletionResult | null;
}) {
  const storeStatus = (boutique.store_status ?? "pending").toLowerCase();

  if (storeStatus === "review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        ⚡ Awaiting Review
      </span>
    );
  }

  if (storeStatus === "pending" && completion && !completion.isComplete) {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        Incomplete
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
      {storeStatus}
    </span>
  );
}

export function resolveCompletionForBoutique(
  boutique: Boutique,
  metaMap: Record<string, BoutiqueCompletionMeta> | undefined,
): BoutiqueCompletionResult | null {
  if (!shouldShowCompletion(boutique)) {
    return null;
  }

  const meta = metaMap?.[boutique.id] ?? {
    gstDocument: false,
    bisDocument: false,
    activeProductCount: boutique.products_count ?? 0,
  };

  return getCompletionStatus(boutique, meta);
}
