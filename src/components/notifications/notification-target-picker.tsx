"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { useBoutiques } from "@/hooks/use-boutiques";
import { useCategories } from "@/hooks/use-categories";
import { useCollections } from "@/hooks/use-collections";
import { useProducts } from "@/hooks/use-products";
import type { NotificationTargetType } from "@/lib/api/services/notification-rules";
import { buildDeepLinkPreview, TARGET_TYPE_LABELS, TARGET_TYPES } from "./notification-rule-constants";

interface TargetOption {
  id: string;
  label: string;
  image: string | null;
}

interface NotificationTargetPickerProps {
  targetType: NotificationTargetType;
  targetId: string | null;
  onChange: (next: { targetType: NotificationTargetType; targetId: string | null }) => void;
  /** Fired when a product/collection/boutique is picked, with that entity's own image — used to auto-fill the banner. */
  onAutoImage?: (imageUrl: string) => void;
}

export function NotificationTargetPicker({
  targetType,
  targetId,
  onChange,
  onAutoImage,
}: NotificationTargetPickerProps) {
  const { data: products = [] } = useProducts();
  const { data: collections = [] } = useCollections();
  const { data: boutiques = [] } = useBoutiques();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState("");

  const options: TargetOption[] = useMemo(() => {
    switch (targetType) {
      case "product":
        return products.map((p) => ({ id: p.id, label: p.name, image: p.image ?? null }));
      case "collection":
        return collections.map((c) => ({
          id: c.id,
          label: c.title ?? c.name ?? "Untitled collection",
          image: c.banner_image ?? c.image ?? null,
        }));
      case "boutique":
        return boutiques.map((b) => ({ id: b.id, label: b.name, image: b.image ?? null }));
      case "category":
        return categories.map((c) => ({ id: c.id, label: c.name, image: null }));
      default:
        return [];
    }
  }, [targetType, products, collections, boutiques, categories]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  const selected = options.find((option) => option.id === targetId) ?? null;
  const deepLinkPreview = buildDeepLinkPreview(targetType, targetId);

  function selectTargetType(nextType: NotificationTargetType) {
    setSearch("");
    onChange({ targetType: nextType, targetId: null });
  }

  function pickEntity(id: string) {
    onChange({ targetType, targetId: id });
    const entity = options.find((option) => option.id === id);
    if (entity?.image && onAutoImage) onAutoImage(entity.image);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TARGET_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => selectTargetType(type)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              targetType === type
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {TARGET_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {targetType === "url" ? (
        <Input
          placeholder="https://example.com/offer"
          value={targetId ?? ""}
          onChange={(e) => onChange({ targetType: "url", targetId: e.target.value || null })}
        />
      ) : targetType !== "none" ? (
        <div className="space-y-2 rounded-md border border-slate-200 p-3">
          {selected ? (
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-800">
                {selected.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.image} alt="" className="h-8 w-8 rounded object-cover" />
                ) : null}
                {selected.label}
              </span>
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                onClick={() => onChange({ targetType, targetId: null })}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <Input
                placeholder={`Search ${TARGET_TYPE_LABELS[targetType].toLowerCase()}s…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-44 overflow-y-auto rounded-md border border-slate-100">
                {filtered.length === 0 ? (
                  <p className="p-3 text-sm text-slate-500">No matches.</p>
                ) : (
                  filtered.slice(0, 50).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => pickEntity(option.id)}
                      className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-slate-50"
                    >
                      {option.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={option.image} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <span className="h-8 w-8 shrink-0 rounded bg-slate-100" />
                      )}
                      <span className="text-slate-800">{option.label}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          No target — this notification won&apos;t deep-link anywhere specific when tapped.
        </p>
      )}

      {deepLinkPreview ? (
        <p className="text-xs text-slate-500">
          Deep link (auto-generated):{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{deepLinkPreview}</code>
        </p>
      ) : null}
    </div>
  );
}
