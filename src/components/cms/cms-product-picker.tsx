"use client";

import { useMemo, useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CmsProductPickerProps {
  value: string[];
  onChange: (productIds: string[]) => void;
}

export function CmsProductPicker({ value, onChange }: CmsProductPickerProps) {
  const { data: products = [], isLoading } = useProducts();
  const [filter, setFilter] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const sortedProducts = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const filtered = query
      ? products.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            (item.category_name ?? "").toLowerCase().includes(query),
        )
      : products;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, filter]);

  const selectedList = useMemo(() => {
    const byId = new Map(products.map((item) => [item.id, item]));
    return value
      .map((id) => byId.get(id))
      .filter(
        (
          item,
        ): item is NonNullable<ReturnType<typeof byId.get>> => Boolean(item),
      );
  }, [products, value]);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(value.filter((entry) => entry !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function move(id: string, direction: -1 | 1) {
    const index = value.indexOf(id);
    if (index < 0) return;
    const next = [...value];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Attached Products
        </h4>
        <span className="text-xs text-slate-600">
          {value.length} selected
        </span>
      </div>

      {selectedList.length > 0 ? (
        <ul className="space-y-2">
          {selectedList.map((product, index) => (
            <li
              key={product.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white/40 p-2"
            >
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={product.name}
                  src={product.image}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-slate-100" />
              )}
              <div className="flex-1 truncate">
                <p className="truncate text-sm text-slate-800">{product.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {product.category_name ?? "Uncategorised"} · ₹
                  {Number(product.price ?? 0).toLocaleString("en-IN")}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => move(product.id, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={index === selectedList.length - 1}
                onClick={() => move(product.id, 1)}
              >
                ↓
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => toggle(product.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">
          No products attached. Use the picker below to add some.
        </p>
      )}

      <div className="space-y-2 rounded-md border border-slate-200 bg-white/60 p-3">
        <Input
          placeholder="Search products by name or category"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        {isLoading ? (
          <p className="text-xs text-slate-600">Loading products…</p>
        ) : null}
        <div className="max-h-64 overflow-auto rounded-md border border-slate-200">
          <table className="admin-table">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="w-10 px-2 py-2"></th>
                <th className="px-2 py-2 text-left">Product</th>
                <th className="px-2 py-2 text-left">Category</th>
                <th className="w-24 px-2 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => {
                const checked = selectedSet.has(product.id);
                return (
                  <tr
                    key={product.id}
                    className="border-t border-slate-200/60 hover:bg-slate-50"
                  >
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(product.id)}
                      />
                    </td>
                    <td className="px-2 py-2 text-slate-800">
                      <div className="flex items-center gap-2">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={product.name}
                            src={product.image}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : null}
                        <span className="truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {product.category_name ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-700">
                      ₹{Number(product.price ?? 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
              {sortedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-2 py-6 text-center text-xs text-slate-500"
                  >
                    No products match this search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
