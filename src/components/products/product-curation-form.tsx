"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProductCuration } from "@/lib/api/services/product-governance";
import type { Product } from "@/types";

interface ProductCurationFormProps {
  product: Product;
  onSaved: () => Promise<void> | void;
}

export function ProductCurationForm({ product, onSaved }: ProductCurationFormProps) {
  const [isTrending, setIsTrending] = useState(Boolean(product.is_trending));
  const [categoryId, setCategoryId] = useState(product.category_id ?? "");
  const [saving, setSaving] = useState(false);

  const isJewellerOwned = Boolean(product.owner_jeweller_id);

  return (
    <div className="space-y-4">
      {isJewellerOwned ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          This product is owned by a verified jeweller. Price, description, title, and images
          cannot be edited here — use Flag, Suspend, or Request Correction.
        </p>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          checked={isTrending}
          onChange={(e) => setIsTrending(e.target.checked)}
          type="checkbox"
        />
        Featured / Trending
      </label>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-600">
          Category ID (platform curation)
        </label>
        <Input
          onChange={(e) => setCategoryId(e.target.value)}
          placeholder="Category UUID"
          value={categoryId}
        />
      </div>

      <Button
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await updateProductCuration(product.id, {
              is_trending: isTrending,
              category_id: categoryId.trim() || null,
            });
            toast.success("Platform curation updated");
            await onSaved();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Update failed");
          } finally {
            setSaving(false);
          }
        }}
      >
        Save Curation Settings
      </Button>
    </div>
  );
}
